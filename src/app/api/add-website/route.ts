import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { writeFile } from "fs/promises";
import path from "path";
import { mkdir } from "fs/promises";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const name: string = (formData.get("name") as string | null) ?? "";
    const url: string = (formData.get("url") as string | null) ?? "";
    const languages: string =
      (formData.get("languages") as string | null) ?? "";
    const slug: string = (formData.get("slug") as string | null) ?? "";
    const description: string =
      (formData.get("description") as string | null) ?? "";
    const author: string = (formData.get("author") as string | null) ?? "";
    const thumb: File =
      (formData.get("thumb") as File | null) ?? new File([], "");
    if (!name || !url || !languages || !slug || !author || !thumb)
      return NextResponse.json(
        {
          error: "Name, URL, Slug, Author, Thumbnail and Language are required",
        },
        { status: 400 }
      );
    console.log(name, url, languages, slug, description, author, thumb);
    let thumbPath = "";
    if (thumb) {
      const bytes = await thumb.arrayBuffer();
      const buffer = Buffer.from(bytes);
      const filename = `${thumb.name}`;
      thumbPath = `${process.env.NEXT_PUBLIC_SITE_URL}/uploads/${slug}/${filename}`;
      const filePath = path.join(
        process.cwd(),
        "public",
        "uploads",
        slug,
        filename
      );
      try {
        const slugDir = path.join(process.cwd(), "public", "uploads", slug);
        await mkdir(slugDir, { recursive: true });
        await writeFile(filePath, buffer);
      } catch (error) {
        console.log(error);
      }
    }
    const website = await prisma.websites.create({
      data: {
        name: name,
        url: url,
        slug: slug,
        languages: languages,
        author: author,
        description: description,
        thumb: thumbPath,
      },
    });
    const slugDir = path.join(process.cwd(), "public", "uploads", slug);
    try {
      await mkdir(slugDir, { recursive: true });
    } catch (error) {
      console.log("Error creating directory:", error);
    }
    await prisma.logs.create({
      data: {
        message: "Website added successfully",
        category: "add-website",
      },
    });
    return NextResponse.json({
      message: "Website added successfully",
      websiteId: website.id,
    });
  } catch (error) {
    await prisma.logs.create({
      data: {
        message: (error as Error).message,
        category: "add-website",
      },
    });
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
