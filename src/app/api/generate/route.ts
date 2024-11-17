import { NextRequest, NextResponse } from "next/server";
import { XMLParser } from "fast-xml-parser";

const parser = new XMLParser({ ignoreAttributes: false });
const openai_key = process.env.OPENAI_API_KEY;

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

async function completion(prompt: string, content: string, api_key: string) {
  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json", // Correct content type for the request
      "Authorization": `Bearer ${api_key}`, // Authorization header with the API key
    },
    body: JSON.stringify({
      model: "gpt-4o-mini", // Ensure you're using a valid model
      messages: [
        { role: "system", content: prompt }, // System message for context
        { role: "user", content: content }, // User message with the input content
      ],

      // stream: true,
      // stream_options: {
      //   include_usage: true,
      // },
    }),
  });

  const data = await response.json(); // Parse the JSON response
  console.log(data);
  return data; // Return the response data from the API
}

export async function POST(req: NextRequest) {
  try {
    const {
      feedUrl,
      numArticles,
      language,
      userPrompt,
      temperature,
      website_categories,
    } = await req.json();
    console.log(feedUrl);
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

    if (numArticles <= 0 || numArticles > 3)
      return NextResponse.json(
        { error: "Number of articles should be between 1 and 3" },
        { status: 400 }
      );

    const feedItems = await fetchFeed(feedUrl);
    const article = feedItems[0]; // Assuming there's only one article in the feed

    let langCount = 0;
    console.log(userPrompt);
    const generatedArticles = await Promise.all(
      Array.from({ length: numArticles }, async () => {
        // const title = extractText(article.title);
        const content =
          extractText(article["content:encoded"]) ||
          extractText(article.description);
        console.log(
          language[`website_${langCount + 1}`],
          website_categories[`website_${langCount + 1}`].join(", ")
        );
        const prompt = `
You are tasked with processing and rewriting a news article to make it SEO-friendly, plagiarism-free, and compliant with Google News standards. The input news article must be in ${
          language[`website_${langCount + 1}`]
        }. Follow these steps to generate the output:

Content Transformation:

${userPrompt}

Input Parameters:

The number of versions to generate (e.g., 1, 2, 3).
The website where the article will be published.
A list of pre-defined categories for the website. Make sure that categories must be taken from the list below:
${website_categories[`website_${langCount + 1}`].join(", ")}

Output Format (Do not use backticks anywhere in the json and do not give response in markdown just give plain text):
{
  "rewritten_article": {
    "title": "SEO-Friendly Article Title Here",
    "content": [
      {
        "heading": "Main Heading for Section",
        "paragraphs": [
          "Paragraph 1 of this section goes here.",
          "Paragraph 2 of this section goes here."
        ]
      },
      {
        "heading": "Another Section Heading",
        "paragraphs": [
          "Paragraph 1 of this section goes here.",
          "Paragraph 2 of this section goes here."
        ]
      }
    ]
  },
  "seo_title": "SEO-Friendly Title Here",
  "meta_title": "Meta Title for SEO",
  "meta_description": "Short meta description for SEO. Typically under 160 characters.",
  "meta_keywords": ["keyword1", "keyword2", "keyword3", "etc."],
  "summary": "Short 160-word summary providing an overview of the article and generating curiosity.",
  "categories": {
    "primary_category": "Main Category",
    "secondary_category": "Secondary Category"
  }
}

`;

        try {
          console.log(content);
          langCount++;
          const aiResponse = await completion(prompt, content, openai_key);
          const aiContent = aiResponse.choices[0].message.content;
          const usage = aiResponse.usage;
          console.log(aiContent);
          const seo_data =
            JSON.parse(aiResponse.choices[0].message.content) || {};
          const parsedAiContent = JSON.parse(aiContent);

          const parsedContent = {
            title: parsedAiContent.rewritten_article.title,
            content: parsedAiContent.rewritten_article.content
              .flatMap((section) => [
                `<h2 class="text-lg font-semibold">${section.heading}</h2>`, // Add the heading as an <h2> tag
                ...section.paragraphs.map(
                  (paragraph) => `<p>${paragraph}</p></br>`
                ), // Add each paragraph as a <p> tag
              ])
              .join(""),
            seoTitle: seo_data.seo_title,
            metaTitle: seo_data.meta_title,
            metaDescription: seo_data.meta_description,
            metaKeywords: seo_data.meta_keywords,
            summary: seo_data.summary,
            primaryCategory: seo_data.categories.primary_category,
            secondaryCategory: seo_data.categories.secondary_category,
            prompt_tokens: usage.prompt_tokens,
            completion_tokens: usage.completion_tokens,
            total_tokens: usage.total_tokens,
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
    console.log(generatedArticles);
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
