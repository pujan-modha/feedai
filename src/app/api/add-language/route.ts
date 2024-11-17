import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const { name } = await req.json();
    if (!name)
      return NextResponse.json({ error: "Language is required" }, { status: 400 });
    console.log(name);
    const language = await prisma.languages.create({
      data: {
        name,
      },
    });
    return NextResponse.json({
      message: "Language added successfully",
      languageId: language.id,
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
