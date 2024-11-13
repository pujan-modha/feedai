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

    if (numArticles <= 0 || numArticles > 3)
      return NextResponse.json(
        { error: "Number of articles should be between 1 and 3" },
        { status: 400 }
      );

    const feedItems = await fetchFeed(feedUrl);
    const article = feedItems[0]; // Assuming there's only one article in the feed

    let langCount = 0;

    const generatedArticles = await Promise.all(
      Array.from({ length: numArticles }, async () => {
        // const title = extractText(article.title);
        const content =
          extractText(article["content:encoded"]) ||
          extractText(article.description);

        const prompt = `
You are tasked with processing and rewriting a news article to make it SEO-friendly, plagiarism-free, and compliant with Google News standards. The input news article must be in ${
          language[langCount++]
        }. Follow these steps to generate the output:

Content Transformation:

Rewrite the input article while retaining all factual information. Do not alter any facts.
The output article should appear as if written by a human, not a machine.
The length of the rewritten article should be between 400 and 1500 words.
Add proper headings and subheadings with H1, H2, and H3 tags according to Google News standards.
SEO Optimization:

Create an SEO-friendly title for the article that is catchy and includes appropriate keywords. For Hindi articles, you can incorporate English keywords into the title.
Remove any mentions of media houses or agencies (e.g., IANS, ANI, PTI, Hindusthan Samachar). Replace any specific agency or news website names inside the content with a generic term.
Generate an SEO-optimized meta title, meta description, and meta keywords.
Summary Creation:

Write a 160-word summary that provides a general overview and generates curiosity to encourage readers to view the full article.
Output Variations:

If an input parameter specifies multiple versions (e.g., 3 versions), generate that many unique, plagiarism-free versions of the rewritten article. Each version should differ from the others in terms of wording, while still meeting all other requirements.
Category Assignment:

Assign categories to the article based on the specified website where it will be published. A list of pre-defined categories will be provided as input.
Highlight the primary and secondary categories according to the content.
Content Clean-up:

Remove any scripts, duplicate media, or irrelevant content from the input article.
Additional Guidelines:

Ensure all output articles are SEO-friendly and adhere to Google News and search guidelines.
Input Parameters:

The news article (text) in English or Hindi.
The number of versions to generate (e.g., 1, 2, 3).
The website where the article will be published.
A list of pre-defined categories for the website.
Output Format(Do not use backticks anywhere in the json and do not give response in markdown just give plain text):
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
          // Await the completion to get the AI-generated content
          console.log(content);
          const aiResponse = await completion(prompt, content, openai_key);
          // const aiResponse = {
          //   id: "chatcmpl-ASodyVo9OuiidSYtGF5jbzCOQAKgi",
          //   object: "chat.completion",
          //   created: 1731431222,
          //   model: "gpt-4o-mini-2024-07-18",
          //   choices: [
          //     {
          //       index: 0,
          //       message: {
          //         role: "assistant",
          //         content:
          //           '{\n  "rewritten_article": {\n    "title": "Bihar Land Registry Faces Challenges Amid New Rules",\n    "content": [\n      {\n        "heading": "New Land Registration Rules in Bihar",\n        "paragraphs": [\n          "In Bihar, the implementation of new land registration rules has led to significant challenges for ordinary citizens attempting to register their land. Many individuals are finding themselves grappling with numerous obstacles in navigating the registration process.",\n          "Consequently, government revenue from land registration has drastically diminished, with daily registrations dropping from approximately 100 to a mere 5 to 10 per day across various registration offices."\n        ]\n      },\n      {\n        "heading": "Government\'s Efforts to Raise Awareness",\n        "paragraphs": [\n          "In response to this decline in registrations, the revenue department has initiated awareness campaigns to educate the public. Employees have been tasked with traveling to villages to ensure that land records are accurately updated online, and that the land ownership records are transferred to the rightful claimants.",\n          "Despite these efforts, the revenue from land registration continues to fall, resulting in substantial losses for the prohibition and registration department."\n        ]\n      },\n      {\n        "heading": "Speculations on Possible Changes to Registration Rules",\n        "paragraphs": [\n          "There have been ongoing speculations about potential amendments to the new land registration rules by the government. However, no official announcements have been made regarding this issue. It is anticipated that any adjustments might be considered after the upcoming Lok Sabha elections."\n        ]\n      }\n    ]\n  },\n  "seo_title": "Challenges in Land Registration in Bihar: Revenue Decline and New Rules",\n  "meta_title": "Bihar Land Registration: New Rules and Challenges",\n  "meta_description": "Explore the difficulties faced by citizens in Bihar due to new land registration rules and the resulting decline in government revenue.",\n  "meta_keywords": ["Bihar land registration", "new rules", "government revenue", "land ownership", "Lok Sabha elections"],\n  "summary": "The introduction of new land registration rules in Bihar has triggered challenges for citizens, leading to a sharp decline in daily registrations—from about 100 to just 5-10. In response, the revenue department is raising awareness and updating records, yet the downward trend continues, causing significant revenue losses. Amid speculations of potential rule changes after the upcoming Lok Sabha elections, the government has not yet indicated any official adjustments. Read on to understand the implications of these changes on citizens and the administration.",\n  "categories": {\n    "primary_category": "Government",\n    "secondary_category": "Legal Affairs"\n  }\n}',
          //         refusal: null,
          //       },
          //       logprobs: null,
          //       finish_reason: "stop",
          //     },
          //   ],
          //   usage: {
          //     prompt_tokens: 1128,
          //     completion_tokens: 534,
          //     total_tokens: 1662,
          //     prompt_tokens_details: {
          //       cached_tokens: 0,
          //       audio_tokens: 0,
          //     },
          //     completion_tokens_details: {
          //       reasoning_tokens: 0,
          //       audio_tokens: 0,
          //       accepted_prediction_tokens: 0,
          //       rejected_prediction_tokens: 0,
          //     },
          //   },
          //   system_fingerprint: "fp_0ba0d124f1",
          // };
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
