import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";
import { XMLParser } from "fast-xml-parser";
import * as cheerio from "cheerio";
import { CheerioAPI } from "cheerio";

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
  let $: CheerioAPI;
  const total_generated_articles_list = [];
  const images_arr: Array<string> = [];
  const links_arr: Array<string> = [];
  const blockquote_arr: Array<string> = [];

  // console.log(images_arr);
  // console.log(links_arr);

  for (let i = 0; i < 1; i++) {
    // we haveto replace hard coded number with article count
    let curr_content = parsedFeed.rss.channel.item[i]["content:encoded"];
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
      task_id,
      images_arr,
      links_arr,
      blockquote_arr
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
  task_id: number,
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
    images_arr = images_arr.map((img_link) => {
      return selected_website[i].url + "/uploads/" + img_link.split("/").pop();
    });
    const current_prompt = currentPrompt(
      selected_language[i],
      categories_arr[i],
      prompt,
      images_arr,
      links_arr,
      blockquote_arr
    );
    console.log(images_arr);
    const completion_response = await completion(current_prompt, content);
    const completed_content_obj = JSON.parse(
      completion_response.choices[0].message.content
    );

    console.log(completed_content_obj);
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
  user_prompt: string,
  images_arr: Array<string>,
  links_arr: Array<string>,
  blockquote_arr: Array<string>
) => {
  return `
    
    You are tasked with processing and rewriting a news article to make it SEO-friendly, plagiarism-free, and compliant with Google News standards. The output must be in ${curr_lang}. Follow these steps to generate the output:

Content Transformation:

${user_prompt}

Input Parameters:

A list of pre-defined categories for the website. Make sure that categories must be taken from the list below:
${curr_categories}

Instruction for Handling Images and Embeds:

    The input contains placeholders for images and embeds such as [IMAGE], [IFRAME] and [BLOCKQUOTE]. Ensure that:

    You must replace placeholders like [IMAGE] and [IFRAME], and [BLOCKQUOTE] with html tags with src ${images_arr.join(
      " ,"
    )}, ${links_arr.join(" ,")} and ${blockquote_arr.join(" ,")} respectively.
    The count of Images and Embeds in the output matches exactly the count of [IMAGE], [IFRAME] and [BLOCKQUOTE] in the input.
    No extra images or embeds are added or removed.
    Images and Embeds are placed in appropriate paragraphs to maintain logical flow, but the overall count remains consistent with the input.

Output Format (Do not use backticks anywhere in the json and do not give response in markdown just give plain text):
{
  "rewritten_article": {
    "title": "SEO-Friendly Article Title Here",
    "content": [
      {
        "heading": "Main Heading for Section",
        "paragraphs": [
          "Paragraph 1 of this section goes here including if any image tags and/or embed tags (${images_arr.join(
            " ,"
          )}, ${links_arr.join(" ,")} and ${blockquote_arr.join(" ,")})",
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
