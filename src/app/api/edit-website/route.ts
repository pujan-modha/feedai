import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function PATCH(req: NextRequest) {
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

  const edited_website = await prisma.websites.update({
    where: {
      id: parseInt(id),
    },
    data: dataToUpdate,
  });

  return NextResponse.json({
    status: 201,
    data: edited_website,
  });
}
