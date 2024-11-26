import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  const categories = await prisma.categories.findMany({
    orderBy: { created_at: "desc" },
    where: {
      is_parent: true,
    },
  });
  return NextResponse.json(categories);
}
