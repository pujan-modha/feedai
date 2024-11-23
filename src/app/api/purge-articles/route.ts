import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const { days } = await req.json();
  if (!days) {
    return NextResponse.json(
      { error: "Invalid input: Missing or incorrect task fields" },
      { status: 400 }
    );
  }
  await prisma.generated_articles.deleteMany({
    where: {
      created_at: {
        lt: new Date(new Date().setDate(new Date().getDate() - days)),
      },
    },
  });
}
