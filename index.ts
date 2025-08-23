import express from "express";
import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
import twilio from "twilio";

dotenv.config();

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false })); // for Twilio webhook form data

// connect supabase
const supabase = createClient(
  process.env.SUPABASE_URL ?? "",
  process.env.SUPABASE_KEY ?? ""
);

// connect twilio
const twilioClient = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

// --- Send SMS to a customer ---
app.post("/send-sms", async (req, res) => {
  const { customer_id, message } = req.body;

  try {
    // 1. Get customer details
    const { data: customer, error: custErr } = await supabase
      .from("customers")
      .select("id, phone")
      .eq("id", customer_id)
      .single();

    if (custErr || !customer) {
      return res.status(404).json({ error: "Customer not found" });
    }

    // 2. Send SMS via Twilio
    const sms = await twilioClient.messages.create({
      body: message,
      from: process.env.TWILIO_PHONE_NUMBER, // your Twilio number
      to: customer.phone,
      statusCallback: process.env.TWILIO_STATUS_CALLBACK, // webhook endpoint
    });

    // 3. Store initial record in history with SID + status
    const { data: history, error: histErr } = await supabase
      .from("history")
      .insert([
        {
          customer_id: customer.id,
          message: message,
          twilio_sid: sms.sid,
          status: sms.status,
        },
      ])
      .select();

    if (histErr) throw histErr;

    res.json({
      success: true,
      customer_id: customer.id,
      to: customer.phone,
      twilio_sid: sms.sid,
      twilio_status: sms.status,
      history: history[0],
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// --- Twilio status callback ---
app.post("/twilio/status", async (req, res) => {
  const { MessageSid, MessageStatus, ErrorCode } = req.body;

  console.log("Twilio Status Callback:", req.body);

  const { error } = await supabase
    .from("history")
    .update({
      status: MessageStatus,
      error_code: ErrorCode || null,
    })
    .eq("twilio_sid", MessageSid);

  if (error) {
    console.error("Error updating history:", error);
    return res.status(500).send("DB update failed");
  }

  res.send("Status received");
});

// server
app.listen(3000, () => {
  console.log("Server running at http://localhost:3000");
});
