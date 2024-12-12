import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(request: Request) {
  await prisma.logs.deleteMany({});

  return NextResponse.json({ success: true });
}
