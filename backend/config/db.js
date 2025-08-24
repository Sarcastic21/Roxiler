// db.js
import pkg from "pg";
import dotenv from "dotenv";
dotenv.config(); // Load environment variables from .env

const { Pool } = pkg;

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false, // Required for Supabase SSL
  },
});

// Test connection
try {
  const client = await pool.connect();
  console.log("✅ Connected to PostgreSQL (Supabase)");
  client.release();
} catch (err) {
  console.error("❌ PostgreSQL connection error:", err.stack);
}