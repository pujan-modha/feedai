import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const { name, slug, value } = await req.json();
    if (!name || !slug || !value)
      return NextResponse.json(
        { error: "Name, Value and Slug are required" },
        { status: 400 }
      );
    console.log(name, slug);
    const category = await prisma.categories.create({
      data: {
        name,
        slug,
        value,
      },
    });
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