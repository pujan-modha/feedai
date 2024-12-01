import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  const days = parseInt(process.env.DELETE_AFTER_DAYS || "7", 10);
  if (isNaN(days)) {
    return NextResponse.json(
      { error: "Invalid configuration: DELETE_AFTER_DAYS must be a number" },
      { status: 500 }
    );
  }
  await prisma.generated_articles.deleteMany({
    where: {
      created_at: {
        lt: new Date(new Date().setDate(new Date().getDate() - days)),
      },
    },
  });
  return NextResponse.json({ message: "Articles purged successfully" });
}
