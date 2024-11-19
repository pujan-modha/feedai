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
    feed_content: start_task.feed_items ? JSON.parse(start_task.feed_items).content : null,
    feed_config: start_task.feed_config
      ? JSON.parse(start_task.feed_config)
      : null,
    articles_count: start_task.articles_count,
  };

  console.log(start_task_config);
  return NextResponse.json(start_task_config, { status: 200 });
}
