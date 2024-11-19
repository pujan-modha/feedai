import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  const start_task = await prisma.tasks.findFirst();
  if (!start_task) {
    return NextResponse.json({ message: "No task found" }, { status: 404 });
  }

  const start_task_config = {
    task_id: start_task.id,
    feed_url: start_task.feed_url,
    feed_config: start_task.feed_config
      ? JSON.parse(start_task.feed_config)
      : null,
    articles_count: start_task.articles_count,
  };
  
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
  return NextResponse.json(data.total_generated_articles_list, { status: 200 });
}
