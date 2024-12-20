import { NextResponse } from "next/server";
import { XMLParser } from "fast-xml-parser";
import * as cheerio from "cheerio";
import { current_prompt } from "@/lib/prompt";
import { populateCategories } from "@/lib/populateCategories";
import prisma from "@/lib/prisma";

const parser = new XMLParser({ ignoreAttributes: false });

interface Website {
  name: string;
  url: string;
  categories: Array<string>;
  languages: Array<string>;
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
  let thumbnail_image: string = "";
  let is_thumbnail_in_content = false;
  let $ = cheerio.load("");

  if (
    typeof parsedFeed.rss.channel.item[0].thumbimage === "string" &&
    parsedFeed.rss.channel.item[0].thumbimage
  ) {
    thumbnail_image = parsedFeed.rss.channel.item[0].thumbimage;
  }
  if (typeof parsedFeed.rss.channel.item[0].description === "string") {
    $ = cheerio.load(parsedFeed.rss.channel.item[0].description);
    console.log("A");
    if ($("img").length > 0) {
      console.log("HIT");
      thumbnail_image = $("img").first().attr("src") || "";
    }
  }
  if (typeof parsedFeed.rss.channel.item[0][feed_items.content] === "string") {
    console.log("B");
    $ = cheerio.load(parsedFeed.rss.channel.item[0][feed_items.content]);

    if ($("img").length > 0) {
      console.log("HIT");
      thumbnail_image = $("img").first().attr("src") || "";
      is_thumbnail_in_content = true;
    }
  }

  let curr_content = parsedFeed.rss.channel.item[0][feed_items.content];
  $ = cheerio.load(curr_content);
  $("img").each((_, img) => {
    const src = $(img).attr("src");
    if (src === thumbnail_image) {
      return;
    }
    if (src && src !== thumbnail_image) {
      images_arr.push(src);
    }
  });

  $("iframe").each((_, iframe) => {
    const src = $(iframe).attr("src");
    if (src) links_arr.push(src);
  });

  const blockquoteScriptRegex =
    /<blockquote[^>]*>[\s\S]*?<\/blockquote>(?:\s*<script[^>]*?><\/script>)?/g;

  const matches = curr_content.match(blockquoteScriptRegex);

  if (matches) {
    matches.forEach((match: string) => {
      blockquote_arr.push(match);
    });
  }

  curr_content = curr_content
    .replace(/<img[^>]*>/gi, "[IMAGE]")
    .replace(/<iframe[^>]*>.*?<\/iframe>/gi, "[IFRAME]")
    .replace(blockquoteScriptRegex, "[BLOCKQUOTE]");

  if (images_arr.length === 0 || is_thumbnail_in_content) {
    images_arr.push(thumbnail_image);
    curr_content = curr_content.replace("[IMAGE]", "");
  }

  const category_arr = [];
  for (let i = 0; i < feed_config.selected_websites.length; i++) {
    const populated_category = await populateCategories(
      JSON.parse(feed_config.selected_websites[i].categories)
    );
    category_arr.push(populated_category);
  }
  // console.log(category_arr);
  if (!thumbnail_image) {
    thumbnail_image = feed_config.selected_websites[0].thumb;
  }
  console.log(images_arr);
  const generated_articles_arr = await generate_articles(
    feed_config.num_articles,
    feed_config.selected_languages,
    feed_config.selected_websites,
    feed_config.userprompt,
    category_arr,
    curr_content,
    images_arr,
    links_arr,
    blockquote_arr,
    thumbnail_image
  );
  images_arr.length = 0;
  links_arr.length = 0;
  blockquote_arr.length = 0;
  thumbnail_image = "";

  return NextResponse.json({
    success: true,
    preview_result_articles_arr: generated_articles_arr,
  });
}

async function completion(prompt: string, content: string) {
  const openai_key = process.env.OPENAI_API_KEY;
  try {
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
        temperature: 0.1,
      }),
    });

    if (!response.ok) {
      const errorResponse = await response.json();

      // Check for specific error related to quota exhaustion
      if (
        response.status === 429 ||
        errorResponse.error?.type === "insufficient_quota"
      ) {
        console.log("OpenAI API key is exhausted or quota exceeded.");
        await prisma.logs.create({
          data: {
            message: "OpenAI API key is exhausted or quota exceeded.",
            category: "api-error",
          },
        });
        throw new Error("OpenAI API quota exhausted.");
      }

      // Log other API errors
      console.log("Error from OpenAI API:", errorResponse.error.message);
      throw new Error(`OpenAI API error: ${errorResponse.error.message}`);
    }

    return await response.json();
  } catch (error) {
    console.log("Error during OpenAI API request:", error);
    await prisma.logs.create({
      data: {
        message: `Error during OpenAI API request: ${(error as Error).message}`,
        category: "api-error",
      },
    });
    throw error;
  }
}

async function generate_articles(
  aritcle_count: number,
  selected_language: Array<string>,
  selected_website: Array<Website>,
  prompt: string,
  category_arr: Array<any>,
  content: string,
  images_arr: Array<string>,
  links_arr: Array<string>,
  blockquote_arr: Array<string>,
  thumbnail_image: string
) {
  const articles_arr = [];
  console.log(selected_website);
  const lang = selected_website.map((website) => {
    return website.languages.split(",")[0].trim();
  });
  console.log("hello", category_arr);
  for (let i = 0; i < aritcle_count; i++) {
    try {
      const curr_prompt = current_prompt(
        lang[i],
        category_arr[i],
        prompt,
        images_arr,
        links_arr
      );
      if (images_arr.length === 0) {
        images_arr.push(thumbnail_image);
      }
      console.log(content);
      const completion_response = await completion(curr_prompt, content);
      console.log("Blockquote array", blockquote_arr);
      console.log(completion_response);
      const content_str = completion_response.choices[0].message.content;
      let completed_content_obj;

      try {
        completed_content_obj = JSON.parse(content_str);
      } catch (parseError) {
        console.error("Error parsing JSON:", parseError);
        console.log("Raw content:", content_str);
        continue;
      }

      const replaceBlockquotes = (obj: any): any => {
        let blockquoteIndex = 0;
        const replace = (item: any): any => {
          if (typeof item === "string") {
            return item.replace(/\[BLOCKQUOTE\]/g, () => {
              const replacement =
                blockquote_arr[blockquoteIndex] || "[BLOCKQUOTE]";
              blockquoteIndex = (blockquoteIndex + 1) % blockquote_arr.length;
              return replacement;
            });
          } else if (Array.isArray(item)) {
            return item.map(replace);
          } else if (typeof item === "object" && item !== null) {
            const newObj: { [key: string]: any } = {};
            for (const [key, value] of Object.entries(item)) {
              newObj[key] = replace(value);
            }
            return newObj;
          }
          return item;
        };
        return replace(obj);
      };

      completed_content_obj = replaceBlockquotes(completed_content_obj);
      const usage = completion_response.usage;
      console.log(completed_content_obj);
      console.log(completed_content_obj.rewritten_article);

      const parsed_content = {
        title: completed_content_obj.rewritten_article.title,
        thumbnail_image: thumbnail_image,
        content: completed_content_obj.rewritten_article.content
          .flatMap((section: RewrittenArticle["content"][number]) => [
            `<h2 class="text-lg font-semibold">${section.heading}</h2>`,
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
    } catch (error) {
      console.error("Error:", error);
    }
  }
  return articles_arr;
}
