import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { PrismaClientKnownRequestError } from "@prisma/client/runtime/library";

export async function POST(req: Request) {
  try {
    const { task_obj } = await req.json();

    if (
      !task_obj ||
      !task_obj.feed_url ||
      !task_obj.feed_items ||
      !task_obj.feed_config ||
      !task_obj.input_feed_language ||
      typeof task_obj.article_count !== "number"
    ) {
      return NextResponse.json(
        { error: "Invalid input: Missing or incorrect task fields" },
        { status: 400 }
      );
    }
    console.log(task_obj);

    const same_feed_url_tasks = await prisma.tasks.findMany({
      where: {
        feed_url: task_obj.feed_url,
      },
    });

    const selected_input_websites =
      task_obj.feed_config.selected_websites || [];

    for (const task of same_feed_url_tasks) {
      const selected_websites =
        JSON.parse(task.feed_config || "{}").selected_websites || [];

      const matchingWebsite = selected_input_websites.find(
        (inputWebsite: { url: string; name: string }) =>
          selected_websites.some(
            (existingWebsite: { url: string; name: string }) =>
              existingWebsite.url === inputWebsite.url
          )
      );

      if (matchingWebsite) {
        return NextResponse.json(
          {
            error: `Task already exists for ${matchingWebsite.name} (${task_obj.feed_url})`,
          },
          { status: 400 }
        );
      }
    }

    const existingTask = await prisma.tasks.findFirst({
      where: {
        feed_url: task_obj.feed_url,
        status: {
          not: "idle",
        },
      },
    });

    if (existingTask) {
      return NextResponse.json(
        { error: "Task already exists for this feed URL" },
        { status: 400 }
      );
    }

    const newTaskData = {
      feed_url: task_obj.feed_url,
      feed_items: JSON.stringify(task_obj.feed_items),
      feed_config: JSON.stringify(task_obj.feed_config),
      input_feed_language: task_obj.input_feed_language,
      articles_count: task_obj.article_count,
      status: "idle",
      created_at: new Date(),
      modified_at: new Date(0),
    };

    // Insert the new task into the database
    const createdTask = await prisma.tasks.create({
      data: newTaskData,
    });
    await prisma.logs.create({
      data: {
        message: "Task created successfully",
        category: "save-task",
      },
    });
    return NextResponse.json({ task: createdTask }, { status: 201 });
  } catch (error) {
    if (error instanceof PrismaClientKnownRequestError) {
      // Handle specific Prisma errors if necessary
      const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
      await prisma.logs.create({
          data: {
              message: errorMessage,
              category: "save-task",
          },
      });
      return NextResponse.json(
        { error: "Database error occurred while creating task" },
        { status: 500 }
      );
    }
    await prisma.logs.create({
      data: {
        message: error instanceof Error ? error.message : "An unknown error occurred",
        category: "save-task",
      },
    });
    return NextResponse.json(
      { error: "An error occurred while processing your request" },
      { status: 500 }
    );
  }
}
