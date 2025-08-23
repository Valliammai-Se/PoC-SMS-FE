import express from "express";
import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config();

const app = express();
app.use(express.json());

// connect supabase
const supabase = createClient(process.env.SUPABASE_URL ?? "", process.env.SUPABASE_KEY ?? "");

// --- 1. Create tables (only run once, then comment out) ---
app.get("/init-db", async (req, res) => {
  try {
    const { error } = await supabase.rpc("exec_sql", {
      sql: `
        create table if not exists customers (
          id uuid default gen_random_uuid() primary key,
          name text not null,
          email text unique not null,
          phone text,
          created_at timestamp with time zone default now()
        );

        create table if not exists history (
          id bigint generated always as identity primary key,
          customer_id uuid references customers(id) on delete cascade,
          message text not null,
          created_at timestamp with time zone default now()
        );
      `
    });

    if (error) throw error;
    res.send("Tables created successfully");
  } catch (err) {
    res.status(500).send(err.message);
  }
});

// --- 4. Get customer with history ---
app.get("/customers/:id/history", async (req, res) => {
  const { id } = req.params;
  const { data, error } = await supabase
    .from("history")
    .select("id, message, created_at")
    .eq("customer_id", id)
    .order("created_at", { ascending: false });

  if (error) return res.status(400).json({ error: error.message });
  res.json(data);
});

// server
app.listen(3000, () => {
  console.log("Server running at http://localhost:3000");
});
