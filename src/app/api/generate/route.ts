import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";
import { XMLParser } from "fast-xml-parser";

const parser = new XMLParser({ ignoreAttributes: false });

interface Website {
  name: string;
  url: string;
  categories: Array<string>;
}

export async function POST(req: Request) {
  const start_task_config = await req.json();
  if (!start_task_config) {
    return NextResponse.json(
      { error: "Invalid input: Missing or incorrect task fields" },
      { status: 400 }
    );
  }

  const { feed_config, task_id, feed_url } = start_task_config;

  const feed = await fetch(feed_url);
  const feedContent = await feed.text();
  const parsedFeed = parser.parse(feedContent);
  const total_generated_articles_list = [];

  for (let i = 0; i < 1; i++) {
    // we haveto replace hard coded number with article count
    const generated_articles_arr = await generate_articles(
      feed_config.num_articles,
      feed_config.selected_languages,
      feed_config.selected_websites,
      feed_config.userprompt,
      parsedFeed.rss.channel.item[i]["content:encoded"],
      task_id
    );
    await prisma.generated_articles.createMany({
      data: generated_articles_arr,
    });

    total_generated_articles_list.push(...generated_articles_arr);
  }

  return NextResponse.json({ success: true, total_generated_articles_list });
}

async function completion(prompt: string, content: string) {
  const openai_key = process.env.OPENAI_API_KEY;
  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${openai_key}`,
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: prompt },
        { role: "user", content: content },
      ],
    }),
  });
  return response.json();
}

async function generate_articles(
  aritcle_count: number,
  selected_language: Array<string>,
  selected_website: Array<Website>,
  prompt: string,
  content: string,
  task_id: number
) {
  const articles_arr = [];
  const categories_arr = selected_website.map((website) => {
    return website.categories;
  });
  console.log(categories_arr);

  for (let i = 0; i < aritcle_count; i++) {
    const current_prompt = currentPrompt(
      selected_language[i],
      categories_arr[i],
      prompt
    );
    const completion_response = await completion(current_prompt, content);
    const completed_content_obj = JSON.parse(
      completion_response.choices[0].message.content
    );
    const parsed_content = {
      task_id: task_id,
      title: completed_content_obj.rewritten_article.title,
      content: JSON.stringify(completed_content_obj.rewritten_article.content),
      seo_title: completed_content_obj.seo_title,
      meta_title: completed_content_obj.meta_title,
      meta_description: completed_content_obj.meta_description,
      meta_keywords: JSON.stringify(completed_content_obj.meta_keywords),
      summary: completed_content_obj.summary,
      primary_category: completed_content_obj.categories.primary_category,
      secondary_category: completed_content_obj.categories.secondary_category,
    };
    articles_arr.push(parsed_content);
  }

  return articles_arr;
}

const currentPrompt = (
  curr_lang: string,
  curr_categories: Array<string>,
  user_prompt: string
) => {
  return `
    
    You are tasked with processing and rewriting a news article to make it SEO-friendly, plagiarism-free, and compliant with Google News standards. The output must be in ${curr_lang}. Follow these steps to generate the output:

Content Transformation:

${user_prompt}

Input Parameters:

A list of pre-defined categories for the website. Make sure that categories must be taken from the list below:
${curr_categories}

Output Format (Do not use backticks anywhere in the json and do not give response in markdown just give plain text, keep any embeds like images, social media liks, etc. as it is and include it appropriately in the response):
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
};
