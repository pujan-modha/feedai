import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(req: Response) {
  const start_task = await prisma.tasks.findFirst();
  console.log(start_task);
  return NextResponse.json(start_task, { status: 200 });
}
