import dotenv from "dotenv";
dotenv.config();

import { Pool } from "pg";

if (!process.env.DATABASE_URL) {
  console.error("❌ DATABASE_URL not found in .env");
  process.exit(1);
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// Test koneksi
export async function checkDB() {
  try {
    await pool.query("SELECT NOW()");
    console.log("✅ Database connected");
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    console.error("❌ Database connection failed:", errorMessage);
    process.exit(1);
  }
}

export default {
  query: (text: string, params?: any[]) => pool.query(text, params),
};
