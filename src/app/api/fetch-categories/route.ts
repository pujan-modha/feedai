import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  const categories = await prisma.categories.findMany({
    orderBy: { created_at: "desc" },
  });
  return NextResponse.json(categories);
}
