import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// get slug from url param
export async function GET(
  request: Request,
  { params }: { params: { slug: string } }
) {
  const website_slug = params.slug[0];
  const category_slug = params.slug[1];

  console.log(website_slug);
  console.log(category_slug);

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

  // const category = await prisma.categories.findFirst({
  //   where: {
  //     slug: category_slug,
  //     website_id: website.id,
  //   },
  // });

  // if (!category) {
  //   return new NextResponse("Category not found", {
  //     status: 404,
  //   });
  // }

  // Fetch articles from database
  const articles = await prisma.generated_articles.findMany({
    where: {
      website_slug: website_slug,
    },
    orderBy: {
      created_at: "desc",
    },
    take: 50,
  });

  // Generate RSS items from articles
  const itemsXml = articles
    .map((article) => {
      const content = JSON.parse(article.content)
        .map((section: { paragraphs: string[] }) =>
          section.paragraphs.join("\n")
        )
        .join("\n");
      console.log(content);
      return `
    <item>
      <title><![CDATA[${article.title}]]></title>
      <description><![CDATA[${article.summary}]]></description>
      <content><![CDATA[${content}]]></content>
      <pubDate>${
        article.created_at ? new Date(article.created_at).toUTCString() : ""
      }</pubDate>
      ${
        article.primary_category
          ? `<category>${article.primary_category}</category>`
          : ""
      }
      ${
        article.secondary_category
          ? `<category>${article.secondary_category}</category>`
          : ""
      }
      ${website.author ? `<author>${website.author}</author>` : ""}
    </item>
  `;
    })
    .join("\n");

  // Create the full RSS feed
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>Feed AI RSS</title>
    <link>${process.env.NEXT_PUBLIC_BASE_URL}</link>
    <description>Latest articles from Feed AI</description>
    <language>en</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <atom:link href="${
      process.env.NEXT_PUBLIC_BASE_URL
    }/api/feed" rel="self" type="application/rss+xml" />
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
