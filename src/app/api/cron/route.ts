import fetch from "node-fetch";
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  const start_task = await prisma.tasks.findFirst({
    where: {
      status: "incomplete",
    },
  });
  if (!start_task) {
    return NextResponse.json(
      { message: "No incomplete tasks found" },
      { status: 404 }
    );
  }

  try {
    const start_task_config = {
      task_id: start_task.id,
      feed_url: start_task.feed_url,
      feed_config: start_task.feed_config
        ? JSON.parse(start_task.feed_config)
        : null,
      feed_items: start_task.feed_items
        ? JSON.parse(start_task.feed_items)
        : null,
      articles_count: start_task.articles_count,
    };
    console.log(start_task_config.articles_count);

    await prisma.tasks.update({
      where: {
        id: start_task.id,
      },
      data: {
        status: "in-progress",
        start_time: new Date(),
        modified_at: new Date(),  
      },
    });

    const generated_articles = await fetch(
      `http://localhost:3000/api/generate`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(start_task_config),
      }
    );
    const data = await generated_articles.json();
    console.log(data.total_generated_articles_list);
    await prisma.tasks.update({
      where: {
        id: start_task.id,
      },
      data: {
        status: "completed",
        end_time: new Date(),
      },
    });
    return NextResponse.json(data.total_generated_articles_list, {
      status: 200,
    });
  } catch (error) {
    console.error("Error creating task:", error);
    await prisma.tasks.update({
      where: {
        id: start_task.id,
      },
      data: {
        status: `error: ${error}`,
        end_time: new Date(),
      },
    });
    return NextResponse.json(
      { error: "An error occurred while processing your request" },
      { status: 500 }
    );
  }
}
