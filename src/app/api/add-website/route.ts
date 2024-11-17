import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const { name, url, languages, categories } = await req.json();
    if (!name || !url || !languages || !categories)
      return NextResponse.json(
        { error: "Name, URL, Languages, and Categories are required" },
        { status: 400 }
      );
      console.log(name, url, languages, categories);
    const website = await prisma.websites.create({
      data: {
        name,
        url,
        languages: languages,
        categories: categories,
      },
    });
    return NextResponse.json({
      message: "Website added successfully",
      websiteId: website.id,
    });
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json(
      {
        error:
          "An error occurred while processing your request. Please check the URL and try again.",
      },
      { status: 500 }
    );
  }
}
