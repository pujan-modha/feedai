import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const { name, url, languages, slug, description, author, thumb } = await req.json();
    if (!name || !url || !languages || !slug || !author || !thumb)
      return NextResponse.json(
        { error: "Name, URL, Slug, Author, Thumbnail and Language are required" },
        { status: 400 }
      );
      console.log(name, url, languages, slug, description, author, thumb);
    const website = await prisma.websites.create({
      data: {
        name: name,
        url: url,
        slug: slug,
        languages: languages,
        author: author,
        description: description,
        thumb: thumb,
      },
    });
    return NextResponse.json({
      message: "Website added successfully",
      websiteId: website.id,
    });
  } catch (error) {
    console.error("Bro, Error:", error);
    return NextResponse.json(
      {
        error:
          "An error occurred while processing your request. Please check the URL and try again.",
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const websites = await prisma.websites.findMany();
    return NextResponse.json(websites);
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