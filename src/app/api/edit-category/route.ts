import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function PATCH(req: NextRequest) {
  const { name, slug, id } = await req.json();
  console.log(name, slug, id)
  if(!name || !slug){
    return NextResponse.json({
        status:400,
        error: "Provide all the required fields!"
    })
  }

  const edited_cat = await prisma.categories.update({
    where: {
        id: parseInt(id)
    },
    data: {
        name: name,
        slug: slug,
        modified_at: new Date()
    }
  })

  return NextResponse.json({
    status: 201,
    data: edited_cat
  });
}
