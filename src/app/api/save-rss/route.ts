import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function POST(req: Request): Promise<Response> {
  try {
    // Check if request body is empty
    if (!req.body) {
      return NextResponse.json(
        { error: "Request body is empty" },
        { status: 400 }
      );
    }

    // Safely parse JSON with error handling
    let article_req;
    try {
      article_req = await req.json();
    } catch (parseError) {
      console.error("JSON parsing error:", parseError);
      return NextResponse.json(
        { error: "Invalid JSON in request body" },
        { status: 400 }
      );
    }

    if (!article_req || !article_req.guid || !article_req.title) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const publishedAt = article_req.published_at
      ? new Date(article_req.published_at)
      : new Date();
    const now = new Date();

    console.log(article_req)
    const savedArticle = await prisma.articles.create({
      data: {
        guid: article_req.guid.slice(0,255),
        title: article_req.title.slice(0,255),
        description: article_req.description.slice(0,255) || "",
        url: article_req.link.slice(0,255) || "",
        thumbnail_image: article_req.thumbnail_image || "",
        category: article_req.category.slice(0,255) || "",
        author: article_req.author.slice(0,255) || "",
        published_at: publishedAt,
        summary: article_req.summary || "",
        content_encoded: article_req.content_encoded || "",
        created_at: now,
        modified_at: now,
      },
    });

    console.log("Article saved successfully:", savedArticle.id);

    return NextResponse.json({
      message: "Article saved successfully",
      articleId: savedArticle.id,
    });
  } catch (error) {
    console.log("Error saving article:", error);

    return NextResponse.json(
      { error: "Failed to save article" },
      { status: 500 }
    );
  }
}
