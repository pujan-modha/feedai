import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  const tasks = await prisma.tasks.findMany({
    orderBy: { modified_at: "desc" },
  });
  return NextResponse.json(tasks);
}
