import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  await prisma.generated_articles.deleteMany();
  return new NextResponse("Deleted all articles!!", { status: 200 });
}
