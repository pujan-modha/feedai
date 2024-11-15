import { NextResponse } from "next/server";
// import prisma from "@/lib/prisma";
import { XMLParser } from "fast-xml-parser";

const parser = new XMLParser({ ignoreAttributes: false });

export async function POST(req: Request) {
  const { rss_article_link } = await req.json();
  try {
    if(!rss_article_link) {
        return NextResponse.json({ error: "No rss article link provided" }, { status: 400 }); 
    }

    const response = await fetch(rss_article_link);
    const feed = await response.text();
    const parsedFeed = parser.parse(feed);
    return NextResponse.json(parsedFeed.rss.channel.item[0]);
  } catch (err) {
    console.error("Error creating article:", err);
    return NextResponse.json({ error: "Failed to create article" }, { status: 500 });
  }
}