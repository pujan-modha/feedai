import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function PATCH(req: NextRequest) {
  try {
    const { name, slug, id } = await req.json();
    console.log(name, slug, id);
    if (!name || !slug) {
      return NextResponse.json({
        status: 400,
        error: "Provide all the required fields!",
      });
    }

    const edited_cat = await prisma.categories.update({
      where: {
        id: parseInt(id),
      },
      data: {
        name: name,
        slug: slug,
        modified_at: new Date(),
      },
    });
    await prisma.logs.create({
      data: {
        message: "Category edited successfully",
        category: "edit-category",
      },
    });
    return NextResponse.json({
      status: 201,
      data: edited_cat,
    });
  } catch (error) {
    await prisma.logs.create({
      data: {
        message: error instanceof Error ? error.message : "An unknown error occurred",
        category: "edit-category",
      },
    });
    return NextResponse.json({ status: 500, error: "Error editing category" });
  }
}
