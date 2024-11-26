import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const { name, slug, parent_category_id, is_parent, website_id } =
      await req.json();
    if (!name || !slug)
      return NextResponse.json(
        { error: "Name, Slug, and Website are required" },
        { status: 400 }
      );
    console.log(
      typeof name,
      typeof slug,
      typeof parent_category_id,
      typeof is_parent,
      typeof website_id
    );
    const category = await prisma.categories.create({
      data: {
        name: name,
        slug: slug,
        is_parent: is_parent,
        parent_id: !is_parent ? parseInt(parent_category_id) : null,
      },
    });

    if (is_parent) {
      const website = await prisma.websites.findUnique({
        where: {
          id: parseInt(website_id),
        },
      });
      const category_arr = JSON.parse(website?.categories || "[]");
      category_arr.push(category.id);
      await prisma.websites.update({
        where: {
          id: parseInt(website_id),
        },
        data: {
          categories: JSON.stringify(category_arr),
        },
      });
    }

    return NextResponse.json({
      message: "Category added successfully",
      categoryId: category.id,
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

export async function GET(req: NextRequest) {
  try {
    const categories = await prisma.categories.findMany();
    return NextResponse.json(categories);
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
