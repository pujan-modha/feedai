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

    const given_website = await prisma.websites.findFirst({
      where: {
        id: parseInt(website_id),
      },
    });

    if (!given_website)
      return NextResponse.json({ error: "Website not found" }, { status: 400 });

    const website_categories = JSON.parse(given_website.categories || "[]");

    for (let i = 0; i < website_categories.length; i++) {
      const existingCategory = await prisma.categories.findUnique({
        where: {
          id: website_categories[i],
        },
      });
      console.log(existingCategory);
      if (existingCategory && existingCategory.slug === slug) {
        console.log("Ok");
        return NextResponse.json(
          { error: "Category with this slug already exists" },
          { status: 400 }
        );
      }
    }

    const category = await prisma.categories.create({
      data: {
        name: name,
        slug: slug,
        is_parent: is_parent,
        parent_id: !is_parent ? parseInt(parent_category_id) : null,
        website_id: parseInt(website_id),
        website_name: given_website.name,
        website_slug: given_website.slug,
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
    await prisma.logs.create({
      data: {
        message: "Category added successfully",
        category: "add-category",
      },
    });
    return NextResponse.json({
      message: "Category added successfully",
      categoryId: category.id,
    });
  } catch (error) {
    await prisma.logs.create({
      data: {
        message: (error instanceof Error) ? error.message : 'Unknown error',
        category: "add-category",
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
