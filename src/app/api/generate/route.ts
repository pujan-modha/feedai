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
    const { feedUrl, numArticles, language, temperature } = await req.json();
    if (!feedUrl)
      return NextResponse.json(
        { error: "Feed URL is required" },
        { status: 400 }
      );

    if (!language)
      return NextResponse.json(
        { error: "Language is required" },
        { status: 400 }
      );

    if (temperature < 0 || temperature > 1)
      return NextResponse.json(
        { error: "Temperature should be between 0 and 1" },
        { status: 400 }
      );

    if (numArticles <= 0 || numArticles > 10)
      return NextResponse.json(
        { error: "Number of articles should be between 1 and 10" },
        { status: 400 }
      );

    const feedItems = await fetchFeed(feedUrl);
    const article = feedItems[0]; // Assuming there's only one article in the feed

    const generatedArticles = await Promise.all(
      Array.from({ length: numArticles }, async () => {
        const title = extractText(article.title);
        const content =
          extractText(article["content:encoded"]) ||
          extractText(article.description);

        const prompt = `
You are tasked with processing and rewriting a news article to make it SEO-friendly, plagiarism-free, and compliant with Google News standards. The input news article must be in ${language}. Follow these steps to generate the output:
1.	Content Transformation:
o	Rewrite the input article while retaining all factual information. Do not alter any facts.
o	The output article should appear as if written by a human, not a machine.
o	The length of the rewritten article should be between 400 and 1500 words.
o	Add proper heading and subheadings with H1, H2, and H3 tags according to Google News standards.
2.	SEO Optimization:
o	Create an SEO-friendly title for the article that is catchy and includes appropriate keywords. For Hindi articles, you can incorporate English keywords into the title.
o	Remove any mentions of media houses or agencies (e.g., IANS, ANI, PTI, Hindusthan Samachar). Replace any specific agency or news website names inside the content with a generic term.
o	Generate an SEO-optimized meta title, meta description, and meta keywords.
3.	Summary Creation:
o	Write a 160-word summary that provides a general overview and generates curiosity to encourage readers to view the full article.
4.	Output Variations:
o	If an input parameter specifies multiple versions (e.g., 3 versions), generate that many unique, plagiarism-free versions of the rewritten article. Each version should differ from the others in terms of wording, while still meeting all other requirements.
5.	Category Assignment:
o	Assign categories to the article based on the specified website where it will be published. A list of pre-defined categories will be provided as input.
o	Highlight the primary and secondary categories according to the content.
6.	Content Clean-up:
o	Remove any scripts, duplicate media, or irrelevant content from the input article.
Additional Guidelines:
•	Ensure all output articles are SEO-friendly and adhere to Google News and search guidelines.
Input Parameters:
1.	The news article (text) in English or Hindi.
2.	The number of versions to generate (e.g., 1, 2, 3).
3.	The website where the article will be published.
4.	A list of pre-defined categories for the website.
Output Format:
1.	Rewritten article with headings and subheadings (400-1500 words).
2.	SEO-friendly title.
3.	Meta title, meta description, and meta keywords.
4.	160-word summary.
5.	Primary and secondary categories from the provided list.
6.	Multiple unique versions if specified.
7.  The article content and the Metadata should be seperated by a special string "ARTICLE METADATA" to easily seperate out the article content and metadata.

The format for meta should be in JSON format. The JSON object should contain the following keys:
{
  "metadata": {
    "seo_title": "SEO-Friendly Title Here",
    "meta_title": "Optimized Meta Title Here",
    "meta_description": "SEO-friendly meta description summarizing the article in an engaging way to improve click-through rates.",
    "meta_keywords": ["primary_keyword", "secondary_keyword", "related_keyword1", "related_keyword2"],
    "summary": "A concise 160-word summary of the article that captures key points and encourages readers to engage with the content.",
    "categories": {
      "primary_category": "Primary Category Here",
      "secondary_category": "Secondary Category Here"
    }
  }
}
Given Article Content:
${content}
`;

        try {
          const completion = await openai.chat.completions.create({
            model: "gpt-4",
            temperature: temperature,
            messages: [{ role: "user", content: prompt }],
          });
          const aiContent = completion.choices[0].message?.content || "";
          
          const seo_data = JSON.parse(aiContent.split("ARTICLE METADATA")[1]);
          const parsedContent = {
            title: title || "Untitled Article",
            content: aiContent,
            seoTitle: "SEO Title",
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
