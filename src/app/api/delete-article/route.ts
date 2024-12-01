import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function DELETE(req: NextRequest) {
  try {
    const { id } = await req.json();
    if (!id)
      return NextResponse.json(
        { error: "Article ID is required" },
        { status: 400 }
      );
    const article = await prisma.generated_articles.findUnique({
      where: {
        id: parseInt(id),
      },
    });
    if (!article)
      return NextResponse.json({ error: "Article not found" }, { status: 404 });
    await prisma.generated_articles.delete({
      where: {
        id: parseInt(id),
      },
    });
    return NextResponse.json({ message: "Article deleted successfully" });
  } catch (error) {
    console.error("Error deleting article:", error);
    return NextResponse.json(
      {
        error:
          "An error occurred while processing your request. Please try again later.",
      },
      { status: 500 }
    );
  }
}