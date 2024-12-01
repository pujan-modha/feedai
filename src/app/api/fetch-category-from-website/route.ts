import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function POST(request: Request) {
  const { website_id } = await request.json();

  const website = await prisma.websites.findUnique({
    where: {
      id: parseInt(website_id),
    },
  });

  if (!website) {
    return NextResponse.json({ success: false, message: "Website not found" });
  }

  if (!website.categories) {
    return NextResponse.json({ success: false, website_categories: [] });
  }


  const website_categories = JSON.parse(website.categories!)

  if ( website_categories.length === 0 ) {
    return NextResponse.json({ success: false, website_categories: [] });
  }

  const categories = await prisma.categories.findMany({
    where: {
      id: {
        in: website_categories,
      },
    },
    select: {
      id: true,
      name: true,
      slug: true,
      website_name: true,
      website_slug: true,
      created_at: true,
    },
  });

  return NextResponse.json({ success: true, "website_categories":categories });
}
