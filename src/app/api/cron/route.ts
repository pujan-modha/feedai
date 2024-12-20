import fetch from "node-fetch";
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

const MAX_TASKS = 2;

export async function GET() {

  const ongoing_task = await prisma.tasks.findFirst({
    where: {
      status: "in-progress",
    },
  });

  const ongoing_tasks_count = await prisma.tasks.count({
    where: {
      status: "in-progress",
    },
  });

  if (ongoing_task !== null && ongoing_tasks_count > MAX_TASKS) {
    return NextResponse.json(
      { message: "Max tasks limit reached" },
      { status: 404 }
    );
  }

  const start_task = await prisma.tasks.findFirst({
    where: {
      status: "idle",
    },
    orderBy: {
      modified_at: "asc",
    },
  });

  console.log(start_task);
  if (!start_task) {
    return NextResponse.json(
      { message: "All tasks are in progress!" },
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
      modified_at: start_task.modified_at,
    };

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
        status: "idle",
        end_time: new Date(),
        modified_at: new Date(),
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
        modified_at: new Date(),
      },
    });
    return NextResponse.json(
      { error: "An error occurred while processing your request" },
      { status: 500 }
    );
  }
}
