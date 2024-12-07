import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";
import { XMLParser } from "fast-xml-parser";
import * as cheerio from "cheerio";
import { CheerioAPI } from "cheerio";
import { current_prompt } from "@/lib/prompt";
import path from "path";
import fs from "fs";
import { writeFile } from "fs/promises";

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
  let thumbnail_image: string = "";
  let is_thumbnail_in_content = false;

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

    if (
      typeof parsedFeed.rss.channel.item[i].thumbimage === "string" &&
      parsedFeed.rss.channel.item[i].thumbimage
    ) {
      thumbnail_image = parsedFeed.rss.channel.item[i].thumbimage;
    }
    if (typeof parsedFeed.rss.channel.item[i].description === "string") {
      $ = cheerio.load(parsedFeed.rss.channel.item[i].description);
      if ($("img").length > 0) {
        thumbnail_image = $("img").first().attr("src") || "";
      }
    }
    if (
      typeof parsedFeed.rss.channel.item[i][feed_items.content] === "string"
    ) {
      $ = cheerio.load(parsedFeed.rss.channel.item[i][feed_items.content]);
      if ($("img").length > 0) {
        thumbnail_image = $("img").first().attr("src") || "";
        is_thumbnail_in_content = true;
      }
    }
    let curr_content = parsedFeed.rss.channel.item[i][feed_items.content];
    console.log(curr_content);
    $ = cheerio.load(curr_content);
    $("img").each((_, img) => {
      const src = $(img).attr("src");
      let alt = $(img).attr("alt");
      if (src === thumbnail_image) {
        return;
      }
      if (!alt) {
        alt = parsedFeed.rss.channel.item[i][feed_items.title];
      }
      const changed_image_url = src?.replace(
        src.split("/").pop()!.split(".")[0],
        alt || parsedFeed.rss.channel.item[i][feed_items.title]
      );
      if (src && changed_image_url && src !== thumbnail_image) {
        images_arr.push(changed_image_url);
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

    if (!thumbnail_image) {
      thumbnail_image = feed_config.selected_websites[i].thumb;
    }

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

  const ensureDirectoryExists = (directoryPath: string) => {
    if (!fs.existsSync(directoryPath)) {
      fs.mkdirSync(directoryPath, { recursive: true });
    }
  };
  // Do the same for thumbnail image

  for (let i = 0; i < aritcle_count; i++) {
    // for thumbnail too

    for (let j = 0; j < images_arr.length; j++) {
      const folderPath = path.join(
        process.env.NEXT_PUBLIC_SITE_URL +
          "/uploads/" +
          selected_website[i].slug
      );

      const filePath = path.join(
        folderPath,
        images_arr[j]!.split("/").pop() // Get only the filename
      );
      try {
        // Ensure the directory exists before saving the file
        ensureDirectoryExists(folderPath);

        const file = await fetch(images_arr[j]);
        const buffer = await file.arrayBuffer();

        await writeFile(filePath, Buffer.from(buffer));
      } catch (error) {
        console.log("Error downloading image:", error);
      }
    }

    images_arr = images_arr.map((img_link) => {
      return (
        process.env.NEXT_PUBLIC_SITE_URL +
        "/uploads/" +
        selected_website[i].slug +
        "/" +
        img_link?.split("/").pop()
      );
    });

    const thumbnailFolderPath = path.join(
      process.env.NEXT_PUBLIC_SITE_URL + "/uploads/" + selected_website[i].slug
    );

    const thumbnailFilePath = path.join(
      thumbnailFolderPath,
      thumbnail_image.split("/").pop() // Get only the filename
    );
    try {
      ensureDirectoryExists(thumbnailFolderPath);

      const thumbnailFile = await fetch(thumbnail_image);
      const thumbnailBuffer = await thumbnailFile.arrayBuffer();

      await writeFile(thumbnailFilePath, Buffer.from(thumbnailBuffer));
    } catch (error) {
      console.log("Error downloading thumbnail:", error);
    }

    thumbnail_image = thumbnailFilePath;

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
        content: ` 
          ${completed_content_obj.rewritten_article.content
            .flatMap((section: RewrittenArticle["content"][number]) => [
              `<h2>${section.heading}</h2>`,
              ...section.paragraphs.map(
                (paragraph: string) => `<p>${paragraph}</p></br>`
              ),
            ])
            .join("")}
        `,
        thumb_image: thumbnailFilePath,
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
    } catch (error) {
      await prisma.tasks.update({
        where: { id: task_id },
        data: {
          error_count: {
            increment: 1,
          },
          modified_at: new Date(),
        },
      });
      await prisma.logs.create({
        data: {
          message:
            "Error while processing task " +
            task_id +
            ": " +
            (error as Error).message,
          category: "task-error",
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
