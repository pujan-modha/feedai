import { NextResponse } from "next/server";
import db from "@/lib/db";
import { CronJob } from "cron";

const createTable = `
  CREATE TABLE IF NOT EXISTS logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    message VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )
`;

try {
  await db.query(createTable);
  console.log("Table is ready");
} catch (err) {
  console.error("Error creating table:", err);
}

let job: CronJob | null = null;

if (!job) {
  job = new CronJob(
    "*/1 * * * *", 
    async function() {
      const message = `Cron job executed at ${new Date().toISOString()}`;
      try {
        await db.query("INSERT INTO logs (message) VALUES (?)", [message]);
        console.log("Stored log:", message);
      } catch (err) {
        console.error("Error storing log:", err);
      }
    },
    null, // onComplete
    true, // start immediately
    "Asia/Kolkata" // timezone
  );

  console.log('Cron job initialized and started');
}

export async function GET() {
  try {
    const [results] = await db.query(
      "SELECT * FROM logs ORDER BY created_at DESC"
    );
    return NextResponse.json(results);
  } catch (err) {
    console.error("Error fetching logs:", err);
    return NextResponse.json(
      { error: "Failed to fetch logs" },
      { status: 500 }
    );
  }
}
