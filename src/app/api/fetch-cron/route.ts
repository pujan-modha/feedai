import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  const cron_logs = await prisma.cron_logs.findMany(
    { orderBy: { start_time: "desc" } },
  );
  return NextResponse.json(cron_logs);
}
