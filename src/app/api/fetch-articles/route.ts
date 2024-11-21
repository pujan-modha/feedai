import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  // invert the order of the generated_articles table
  const tasks = await prisma.generated_articles.findMany(
    { orderBy: { id: "desc" } },
  );
  return NextResponse.json(tasks);
}
