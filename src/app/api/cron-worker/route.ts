import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";
import cron from "node-cron";

export async function GET() {
  cron.schedule("* * * * *", async () => {
    console.log("Running cron job");
    await prisma.cron_logs.create({
      data: {
        start_time: new Date(),
        message: "Cron job started",
      },
    });
    await prisma.tasks.updateMany({
      data: {
        status: "idle",
      },
    });

    for (
      let i = 0;
      i < parseInt(process.env.NEXT_PUBLIC_MAX_TASKS || "2");
      i++
    ) {
      await fetch("http://localhost:3000/api/cron");
    }
    await fetch("http://localhost:3000/api/purge-articles");
  });
  return NextResponse.json(
    { success: "Cron job scheduled to run every 1 minutes" },
    { status: 200 }
  );
}

process.stdin.resume();
