import twilio from "twilio";
import { getCustomerById, saveHistory, updateHistoryStatus } from "./db";

const twilioClient = twilio(
  process.env.TWILIO_ACCOUNT_SID!,
  process.env.TWILIO_AUTH_TOKEN!
);

export async function sendSMS(customerId: string, message: string) {
  const customer = await getCustomerById(customerId);

  const sms = await twilioClient.messages.create({
    body: message,
    from: process.env.TWILIO_PHONE_NUMBER,
    to: customer.phone,
    statusCallback: process.env.TWILIO_STATUS_CALLBACK,
  });

  const history = await saveHistory({
    customer_id: customer.id,
    message,
    twilio_sid: sms.sid,
    status: sms.status,
  });

  return { customer, sms, history };
}
export async function handleInbound(req, res) {
  const { From, To, Body } = req.body;
  console.log(`📩 Incoming SMS from ${From}: ${Body}`);

  try {
    let replyMessage = "We received your reply, thank you!";

    if (Body.trim().toUpperCase() === "YES") {
      replyMessage = "Thanks for confirming! ✅";
    } else if (Body.trim().toUpperCase() === "NO") {
      replyMessage = "Sorry to hear that. We’ll follow up shortly.";
    }

    await twilioClient.messages.create({
      body: replyMessage,
      from: To, // Twilio number
      to: From, // Customer number
    });

    res.send("<Response></Response>");
  } catch (err) {
    console.error("❌ Inbound handling failed:", err);
    res.status(500).send("Inbound handling failed");
  }
}

