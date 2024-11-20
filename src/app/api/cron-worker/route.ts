import { NextResponse } from "next/server";
import cron from "node-cron";
// Schedule the task to run every 1 minutes
export function GET() {
  cron.schedule("* * * * *", async () => {
    console.log("Running cron job");
    await fetch("http://localhost:3000/api/cron");
  });
  return NextResponse.json(
    { success: "Cron job scheduled to run every 1 minutes" },
    { status: 200 }
  );
}
// Keep the script running
process.stdin.resume();
