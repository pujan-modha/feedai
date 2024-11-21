import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  const cron_logs = await prisma.cron_logs.findMany();
  return NextResponse.json(cron_logs);
}
