import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// get slug from url param
export async function GET(
  _request: Request,
  { params }: { params: { slug: string[] } }
) {
  const { slug } = await params;
  const website_slug = slug[0];
  const category_slug = slug[1];

  const language_codes = {
    Hindi: "hi",
    English: "en",
    Tamil: "ta",
    Telugu: "te",
    Kannada: "kn",
    Malayalam: "ml",
    Marathi: "mr",
    Bengali: "bn",
    Gujarati: "gu",
    Punjabi: "pa",
    Urdu: "ur",
  };

  // Fetch website from database
  const website = await prisma.websites.findUnique({
    where: {
      slug: website_slug,
    },
  });

  if (!website) {
    return new NextResponse("Website not found", {
      status: 404,
    });
  }

  // Fetch articles from database
  const articles = await prisma.generated_articles.findMany({
    where: {
      website_slug: website.slug,
      ...(category_slug && {
        OR: [
          { primary_category_slug: category_slug },
          { secondary_category_slug: category_slug },
        ],
      }),
    },
    select: {
      id: true,
      title: true,
      summary: true,
      content: true,
      created_at: true,
      primary_category: true,
      secondary_category: true,
      thumb_image: true,
      meta_description: true,
      meta_title: true,
      parent_guid: true,
    },
    orderBy: {
      created_at: "desc",
    },
    take: 50,
  });
  let itemsXml = "";
  console.log(articles);
  // Generate RSS items from articles
  if (articles.length > 0) {
    itemsXml = articles
      .map((article) => {
        // console.log(articles.content);
        return `
          <item>
            <title><![CDATA[${article.title}]]></title>
            <guid>${article.parent_guid}</guid>
            <description><![CDATA[${article.summary}]]></description>
            <content><![CDATA[${article.content}]]></content>
            <pubDate>${
              article.created_at
                ? new Date(article.created_at)
                : ""
            }</pubDate>
            <category><![CDATA[${article.secondary_category}, ${
          article.primary_category
        }]]></category> 
            ${website.author ? `<author>${website.author}</author>` : ""}
            <summary><![CDATA[${article.summary}]]></summary>
          <thumbimage>${
            article.thumb_image ? article.thumb_image : ""
          }</thumbimage>

            </item>
        `;
      })
      .join("\n");
  }
  // Create the full RSS feed
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${website.name}</title>
    <link>${website.url}</link>
    <description>${website.description}</description>
    <language>${language_codes[website.languages]}</language>
    ${
      articles.length > 0
        ? `<lastBuildDate>${articles[0].created_at}</lastBuildDate>`
        : ""
    }
    ${itemsXml}
  </channel>
</rss>`;

  // Return response with XML content type
  return new NextResponse(xml, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      // "Cache-Control": "public, max-age=3600", // Cache for 1 hour
    },
  });
}
