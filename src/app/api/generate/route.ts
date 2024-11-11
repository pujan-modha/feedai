import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { XMLParser } from "fast-xml-parser";

const parser = new XMLParser({ ignoreAttributes: false });
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

interface RSSItem {
  "title"?: { __cdata: string } | string;
  "content:encoded"?: { __cdata: string } | string;
  "description"?: { __cdata: string } | string;
}

async function fetchFeed(url: string): Promise<RSSItem[]> {
  try {
    const response = await fetch(url);
    if (!response.ok)
      throw new Error(`Failed to fetch the feed: ${response.statusText}`);

    const xmlData = await response.text();
    const result = parser.parse(xmlData);

    if (!result.rss || !result.rss.channel || !result.rss.channel.item) {
      throw new Error("Invalid RSS feed structure");
    }

    return result.rss.channel.item;
  } catch (error) {
    console.error("Error fetching feed:", error);
    throw new Error("Failed to fetch or parse the RSS feed");
  }
}

function extractText(
  content: { __cdata: string } | string | undefined
): string {
  if (!content) return "";
  return typeof content === "string" ? content : content.__cdata;
}

export async function POST(req: NextRequest) {
  try {
    const { feedUrl, numArticles } = await req.json();
    if (!feedUrl)
      return NextResponse.json(
        { error: "Feed URL is required" },
        { status: 400 }
      );

    const feedItems = await fetchFeed(feedUrl);
    const articles = feedItems.slice(0, Math.min(numArticles, 10));

    const generatedArticles = await Promise.all(
      articles.map(async (article) => {
        const title = extractText(article.title);
        const content =
          extractText(article["content:encoded"]) ||
          extractText(article.description);

        const prompt = `
You are tasked with processing and rewriting a news article to make it SEO-friendly and plagiarism-free. The article is in Hindi. Follow these guidelines:
1. Create an <h1> title and <h2> subheadings in Hindi.
2. Rewrite the content professionally and ensure it is unique.
3. Provide SEO meta information (title, description, and keywords) and a summary in Hindi.

Here's the original article content:
Title: ${title}
Content: ${content}
`;

        try {
          const completion = await openai.chat.completions.create({
            model: "gpt-4",
            messages: [{ role: "user", content: prompt }],
          });
          const aiContent = completion.choices[0].message?.content || "";

          const parsedContent = {
            title: title || "Untitled Article",
            content: aiContent,
            seoTitle: "SEO-Friendly Title Example",
            metaTitle: "Meta Title Example",
            metaDescription: "Meta description for SEO purposes.",
            metaKeywords: ["Keyword1", "Keyword2", "Keyword3"],
            summary: "This is a summary of the article.",
            primaryCategory: "Technology",
            secondaryCategory: "Environment",
          };

          console.log("Generated Article Content:", parsedContent); // Log to verify content structure
          return parsedContent;
        } catch (error) {
          console.error("OpenAI API Error:", error);
          return {
            title: "Failed to generate article",
            content: "An error occurred while generating this article.",
            seoTitle: "",
            metaTitle: "",
            metaDescription: "",
            metaKeywords: [],
            summary: "",
            primaryCategory: "Error",
            secondaryCategory: "",
          };
        }
      })
    );

    return NextResponse.json({ articles: generatedArticles });
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
