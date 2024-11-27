import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";
import cron from "node-cron";
// Schedule the task to run every 1 minutes
export async function GET() {
  cron.schedule("* * * * *", async () => {
    console.log("Running cron job");
    await prisma.cron_logs.create({
      data: {
        start_time: new Date(),
        message: "Cron job started",
      },
    });
    await fetch("http://localhost:3000/api/cron");
  });
  return NextResponse.json(
    { success: "Cron job scheduled to run every 1 minutes" },
    { status: 200 }
  );
}

process.stdin.resume();
