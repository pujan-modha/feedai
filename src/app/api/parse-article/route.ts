import { NextResponse } from "next/server";
import { XMLParser } from "fast-xml-parser";

const parser = new XMLParser({ ignoreAttributes: false });

export async function POST(req: Request) {
  const { rss_article_link } = await req.json();
  try {
    if (!rss_article_link) {
      return NextResponse.json(
        { error: "No rss article link provided" },
        { status: 400 }
      );
    }
    const response = await fetch(rss_article_link);
    const feed = await response.text();
    const parsedFeed = parser.parse(feed);

    console.log(typeof parsedFeed.rss.channel.item[0].guid);
    if (typeof parsedFeed.rss.channel.item[0].guid === "string") {
      parsedFeed.rss.channel.item[0].guid = parsedFeed.rss.channel.item[0].guid;
    } else {
      parsedFeed.rss.channel.item[0].guid =
        parsedFeed.rss.channel.item[0].guid["#text"];
    }

    return NextResponse.json(
      {
        article_feed: parsedFeed.rss.channel.item[0],
        feed_length: parsedFeed.rss.channel.item.length,
      },
      { status: 200 }
    );
  } catch (err) {
    console.error("Error creating article:", err);
    return NextResponse.json(
      { error: "Failed to create article" },
      { status: 500 }
    );
  }
}
