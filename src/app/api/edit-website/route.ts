import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

export async function PATCH(req: NextRequest) {
  let edited_website;
  try {
    const formData = await req.formData();
    const id = formData.get("id") as string;
    const desc = formData.get("desc") as string;
    const author = formData.get("author") as string;
    const languages = formData.get("languages") as string;
    const url = formData.get("url") as string;
    const thumb = formData.get("thumb") as File | null;
    if (!id) {
      return NextResponse.json({
        status: 400,
        error: "Id is required!",
      });
    }

    const website = await prisma.websites.findUnique({
      where: { id: parseInt(id) },
    });

    if (!website) {
      return NextResponse.json({
        status: 404,
        error: "Website not found",
      });
    }

    const dataToUpdate: any = {
      description: desc,
      author: author,
      languages: languages,
      url: url,
      modified_at: new Date(),
    };

    if (thumb) {
      try {
        console.log(thumb)
        const bytes = await thumb.arrayBuffer();
        const buffer = Buffer.from(bytes);
        const filename = `${Date.now()}-${thumb.name}`;
        const thumbPath = `/uploads/${website.slug}/${filename}`;
        const uploadDir = path.join(process.cwd(), "uploads", website.slug);
        const filePath = path.join(uploadDir, filename);

        await mkdir(uploadDir, { recursive: true });
        await writeFile(filePath, buffer);

        dataToUpdate.thumb = `${process.env.NEXT_PUBLIC_SITE_URL}${thumbPath}`;
      } catch (error) {
        console.error("Error saving thumbnail:", error);
        return NextResponse.json({
          status: 500,
          error: "Failed to save thumbnail. Please try again.",
        });
      }
    }

    edited_website = await prisma.websites.update({
      where: {
        id: parseInt(id),
      },
      data: dataToUpdate,
    });

    await prisma.logs.create({
      data: {
        message: "Website edited successfully",
        category: "edit-website",
        entity_id: edited_website.id,
      },
    });

    return NextResponse.json({
      status: 200,
      data: edited_website,
    });
  } catch (error) {
    console.error("Error updating website:", error);
    await prisma.logs.create({
      data: {
        message:
          error instanceof Error ? error.message : "An unknown error occurred",
        category: "edit-website-error",
        entity_id: edited_website?.id,
      },
    });
    return NextResponse.json({
      status: 500,
      error:
        "An error occurred while processing your request. Please try again later.",
    });
  }
}

export async function GET() {
  try {
    const websites = await prisma.websites.findMany();
    return NextResponse.json(websites);
  } catch (error) {
    console.error("Error fetching websites:", error);
    return NextResponse.json(
      {
        error:
          "An error occurred while fetching websites. Please try again later.",
      },
      { status: 500 }
    );
  }
}
