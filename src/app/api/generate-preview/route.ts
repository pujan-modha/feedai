import { NextResponse } from "next/server";
import { XMLParser } from "fast-xml-parser";
import * as cheerio from "cheerio";
import { current_prompt } from "@/lib/prompt";

const parser = new XMLParser({ ignoreAttributes: false });

interface Website {
  name: string;
  url: string;
  categories: Array<string>;
}

interface RewrittenArticle {
  title: string;
  content: Array<{
    heading: string;
    paragraphs: Array<string>;
  }>;
}

export async function POST(req: Request) {
  const preview_start_task_config = await req.json();
  if (!preview_start_task_config) {
    return NextResponse.json(
      { error: "Invalid input: Missing or incorrect task fields" },
      { status: 400 }
    );
  }

  const { feed_config, feed_url, feed_items } = preview_start_task_config;
  console.log(feed_url);
  const feed = await fetch(feed_url);
  const feedContent = await feed.text();
  const parsedFeed = parser.parse(feedContent);

  const images_arr: Array<string> = [];
  const links_arr: Array<string> = [];
  const blockquote_arr: Array<string> = [];

  let curr_content = parsedFeed.rss.channel.item[0][feed_items.content];
  console.log(curr_content);
  const $ = cheerio.load(curr_content);
  $("img").each((_, img) => {
    const src = $(img).attr("src");
    if (src) {
      images_arr.push(src);
    }
  });

  $("iframe").each((_, iframe) => {
    const src = $(iframe).attr("src");
    if (src) links_arr.push(src);
  });

  $("blockquote").each((_, blockquote) => {
    const blockquoteString = $.html(blockquote);
    blockquote_arr.push(blockquoteString);
  });
  curr_content = curr_content
    .replace(/<img[^>]*>/gi, "[IMAGE]")
    .replace(/<iframe[^>]*>.*?<\/iframe>/gi, "[IFRAME]")
    .replace(/<blockquote[^>]*>.*?<\/blockquote>/gi, "[BLOCKQUOTE]");
  console.log(curr_content);
  const generated_articles_arr = await generate_articles(
    feed_config.num_articles,
    feed_config.selected_languages,
    feed_config.selected_websites,
    feed_config.userprompt,
    curr_content,
    images_arr,
    links_arr,
    blockquote_arr
  );
  images_arr.length = 0;
  links_arr.length = 0;
  blockquote_arr.length = 0;

  console.log(generated_articles_arr);

  return NextResponse.json({
    success: true,
    preview_result_articles_arr: generated_articles_arr,
  });
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
      model: "gpt-4o",
      messages: [
        { role: "system", content: prompt },
        { role: "user", content: content },
      ],
      temperature: 0.1,
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
  images_arr: Array<string>,
  links_arr: Array<string>,
  blockquote_arr: Array<string>
) {
  const articles_arr = [];
  const categories_arr = selected_website.map((website) => {
    return website.categories;
  });
  console.log(categories_arr);

  for (let i = 0; i < aritcle_count; i++) {
    try {
      const curr_prompt = current_prompt(
        selected_language[i],
        categories_arr[i],
        prompt,
        images_arr,
        links_arr,
        blockquote_arr
      );
      console.log(images_arr);
      const completion_response = await completion(curr_prompt, content);
      const completed_content_obj = JSON.parse(
        completion_response.choices[0].message.content
      );
      const usage = completion_response.usage;

      console.log(completed_content_obj);

      const parsed_content = {
        title: completed_content_obj.rewritten_article.title,
        content: completed_content_obj.rewritten_article.content
          .flatMap((section: RewrittenArticle["content"][number]) => [
            `<h2 class="text-lg font-semibold">${section.heading}</h2>`, // Add the heading as an <h2> tag
            ...section.paragraphs.map(
              (paragraph: string) => `<p>${paragraph}</p></br>`
            ),
          ])
          .join(""),
        seo_title: completed_content_obj.seo_title,
        meta_title: completed_content_obj.meta_title,
        meta_description: completed_content_obj.meta_description,
        meta_keywords: completed_content_obj.meta_keywords,
        summary: completed_content_obj.summary,
        primary_category: completed_content_obj.categories.primary_category,
        secondary_category: completed_content_obj.categories.secondary_category,
        prompt_tokens: usage.prompt_tokens,
        completion_tokens: usage.completion_tokens,
        total_tokens: usage.total_tokens,
      };
      articles_arr.push(parsed_content);
    } catch {
      continue;
    }
  }
  return articles_arr;
}
