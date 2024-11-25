import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  const websites = await prisma.websites.findMany();
  return NextResponse.json(websites);
}
