import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function POST(request: Request) {
  const { slug } = await request.json();

  const website = await prisma.websites.findUnique({
    where: {
      slug: slug,
    },
  });

  if (!website) {
    return NextResponse.json({ success: false, message: "Website not found" });
  }

  return NextResponse.json({ success: true, website: website });
}