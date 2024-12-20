import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  const websites = await prisma.websites.findMany({
    orderBy: { created_at: "desc" },
  });
  return NextResponse.json(websites);
}
