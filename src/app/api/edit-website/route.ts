import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function PATCH(req: NextRequest) {
  let edited_website;
  try {
    const { desc, author, languages, thumb, url, id } = await req.json();
    console.log(desc, author, id);
    if (!id) {
      return NextResponse.json({
        status: 400,
        error: "Id is required!",
      });
    }

    const dataToUpdate = {
      description: desc,
      author: author,
      languages: languages,
      url: url,
      modified_at: new Date(),
    };

    if (thumb !== null) {
      dataToUpdate.thumb = thumb;
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
      status: 201,
      data: edited_website,
    });
  } catch (error) {
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
