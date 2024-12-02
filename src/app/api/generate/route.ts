import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";
import { XMLParser } from "fast-xml-parser";
import * as cheerio from "cheerio";
import { CheerioAPI } from "cheerio";
import { current_prompt } from "@/lib/prompt";

const parser = new XMLParser({ ignoreAttributes: false });

interface Website {
  name: string;
  url: string;
  slug: string;
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
  const start_task_config = await req.json();
  if (!start_task_config) {
    return NextResponse.json(
      { error: "Invalid input: Missing or incorrect task fields" },
      { status: 400 }
    );
  }

  const { feed_config, task_id, feed_url, feed_items, articles_count } =
    start_task_config;

  const feed = await fetch(feed_url);
  const feedContent = await feed.text();
  const parsedFeed = parser.parse(feedContent);
  let $: CheerioAPI;
  const total_generated_articles_list = [];
  const images_arr: Array<string> = [];
  const links_arr: Array<string> = [];
  const blockquote_arr: Array<string> = [];
  let thumbnail_image: string = "https://ui.shadcn.com/placeholder.svg";

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
    }
  }

  if (!thumbnail_image) {
    thumbnail_image = "https://ui.shadcn.com/placeholder.svg";
  }

  console.log(articles_count);
  console.log(feed_items.content);
  for (let i = 0; i < articles_count; i++) {
    if (typeof parsedFeed.rss.channel.item[i].guid === "string") {
      parsedFeed.rss.channel.item[i].guid = parsedFeed.rss.channel.item[i].guid;
    } else {
      parsedFeed.rss.channel.item[i].guid =
        parsedFeed.rss.channel.item[i].guid["#text"];
    }
    const doesExist = await prisma.generated_articles.findFirst({
      where: {
        parent_guid: parsedFeed.rss.channel.item[i][feed_items.guid],
      },
    });
    if (doesExist) {
      console.log("article already exists");
      break;
    }
    let curr_content = parsedFeed.rss.channel.item[i][feed_items.content];
    console.log(curr_content);
    $ = cheerio.load(curr_content);
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

    // $("blockquote").each((_, blockquote) => {
    //   const blockquoteString = $.html(blockquote);
    //   blockquote_arr.push(blockquoteString);
    // });

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

    console.log(curr_content);
    const generated_articles_arr = await generate_articles(
      feed_config.num_articles,
      feed_config.selected_languages,
      feed_config.selected_websites,
      feed_config.userprompt,
      curr_content,
      task_id,
      images_arr,
      links_arr,
      blockquote_arr,
      thumbnail_image,
      parsedFeed.rss.channel.item[i][feed_items.guid]
    );

    await prisma.generated_articles.createMany({
      data: generated_articles_arr,
    });

    images_arr.length = 0;
    links_arr.length = 0;
    blockquote_arr.length = 0;

    total_generated_articles_list.push(...generated_articles_arr);
  }

  return NextResponse.json({
    success: true,
    total_generated_articles_list: total_generated_articles_list,
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
      temperature: 0,
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
  task_id: number,
  images_arr: Array<string>,
  links_arr: Array<string>,
  blockquote_arr: Array<string>,
  thumbnail_image: string,
  parent_guid: string
) {
  const articles_arr = [];
  const categories_arr = selected_website.map((website) => {
    return website.categories;
  });
  console.log(categories_arr);
  console.log("Blockquote array", blockquote_arr);

  for (let i = 0; i < aritcle_count; i++) {
    images_arr = images_arr.map((img_link) => {
      return selected_website[i].url + "/uploads/" + img_link.split("/").pop();
    });
    try {
      const curr_prompt = current_prompt(
        selected_language[i],
        categories_arr[i],
        prompt,
        images_arr,
        links_arr
      );
      console.log(images_arr);
      const completion_response = await completion(curr_prompt, content);
      let completed_content_obj = JSON.parse(
        completion_response.choices[0].message.content
      );

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

      console.log(completed_content_obj);
      const parsed_content = {
        task_id: task_id,
        title: completed_content_obj.rewritten_article.title,
        content:` 
          ${completed_content_obj.rewritten_article.content
            .flatMap((section: RewrittenArticle["content"][number]) => [
              `<h2 class="text-lg font-semibold">${section.heading}</h2>`,
              ...section.paragraphs.map(
                (paragraph: string) => `<p>${paragraph}</p></br>`
              ),
            ])
            .join("")}
        `,
        thumb_image: thumbnail_image,
        seo_title: completed_content_obj.seo_title,
        meta_title: completed_content_obj.meta_title,
        meta_description: completed_content_obj.meta_description,
        meta_keywords: JSON.stringify(completed_content_obj.meta_keywords),
        summary: completed_content_obj.summary,
        primary_category: completed_content_obj.categories.primary_category,
        secondary_category: completed_content_obj.categories.secondary_category,
        website_slug: selected_website[i].slug,
        primary_category_slug: completed_content_obj.primary_category_slug,
        secondary_category_slug: completed_content_obj.secondary_category_slug,
        parent_guid: parent_guid,
      };
      articles_arr.push(parsed_content);
    } catch {
      await prisma.tasks.update({
        where: { id: task_id },
        data: {
          error_count: {
            increment: 1,
          },
          modified_at: new Date(),
        },
      });
      continue;
    }
    await prisma.tasks.update({
      where: { id: task_id },
      data: {
        sucess_count: {
          increment: 1,
        },
        modified_at: new Date(),
      },
    });
  }
  return articles_arr;
}
