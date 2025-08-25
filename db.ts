import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config();

const supabase = createClient(
  process.env.SUPABASE_URL ?? "",
  process.env.SUPABASE_KEY ?? ""
);

// --- Get customer by ID ---
export async function getCustomerById(customer_id) {
  const { data, error } = await supabase
    .from("customers")
    .select("id, name, email, phone")
    .eq("id", customer_id)
    .single();

  if (error) throw new Error(error.message);
  return data;
}

// --- Get all customers ---
export async function getAllCustomers() {
  const { data, error } = await supabase
    .from("customers")
    .select("id, name, email, phone, created_at")
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);
  return data;
}


// --- Save history entry ---
export async function saveHistory({ customer_id, message, twilio_sid, status }) {
  const { data, error } = await supabase
    .from("history")
    .insert([{ customer_id, message, twilio_sid, status }])
    .select();

  if (error) throw new Error(error.message);
  return data[0];
}

// --- Update message status from Twilio ---
export async function updateHistoryStatus({ sid, status, error_code }) {
  const { error } = await supabase
    .from("history")
    .update({ status, error_code })
    .eq("twilio_sid", sid);

  if (error) throw new Error(error.message);
  return true;
}
