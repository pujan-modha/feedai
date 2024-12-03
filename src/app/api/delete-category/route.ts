import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function DELETE(req: NextRequest) {
  try {
    const { category_id } = await req.json();
    if (!category_id) {
      return NextResponse.json(
        { error: "Category ID is required" },
        { status: 400 }
      );
    }

    const delete_category = await prisma.categories.delete({
      where: { id: category_id },
    });

    if (delete_category.is_parent) {
      const child_categories = await prisma.categories.findMany({
        where: {
          parent_id: category_id,
        },
      });
      await Promise.all(
        child_categories.map(async (child_category) => {
          await prisma.categories.delete({
            where: { id: child_category.id },
          });
        })
      );
    }

    const website_id = delete_category.website_id!;

    const website_category = await prisma.websites.findUnique({
      where: {
        id: website_id,
      },
      select: {
        categories: true,
      },
    });

    if (!website_category) {
      return NextResponse.json({ error: "Website not found" }, { status: 404 });
    }

    if(website_category.categories) {
      const website_categories = JSON.parse(website_category.categories);
      const updated_website_categories = website_categories.filter(
        (category:number) => category !== category_id
      );
      await prisma.websites.update({
        where: {
          id: website_id,
        },
        data: {
          categories: JSON.stringify(updated_website_categories),
        },
      });
    }

    return NextResponse.json({ deleted_category: delete_category });
  } catch (error) {
    console.log(error);
    return NextResponse.json(
      {
        error:
          "An error occurred while processing your request. Please try again later.",
      },
      { status: 500 }
    );
  }
}
