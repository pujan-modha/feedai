import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function PATCH(req: NextRequest) {
  const { desc, author, id } = await req.json();
  console.log(desc, author, id);
  if (!desc || !author) {
    return NextResponse.json({
      status: 400,
      error: "Provide all the required fields!",
    });
  }

  const edited_website = await prisma.websites.update({
    where: {
      id: parseInt(id),
    },
    data: {
      description: desc, 
      author: author,
      modified_at: new Date(),
    },
  });

  return NextResponse.json({
    status: 201,
    data: edited_website,
  });
}
