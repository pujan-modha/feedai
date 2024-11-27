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
      typeof task_obj.article_count !== "number"
    ) {
      return NextResponse.json(
        { error: "Invalid input: Missing or incorrect task fields" },
        { status: 400 }
      );
    }
    console.log(task_obj);

    const existingTask = await prisma.tasks.findFirst({
      where: {
        feed_url: task_obj.feed_url,
        status: {
          not: "completed",
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
      articles_count: task_obj.article_count,
      status: "incomplete",
      created_at: new Date(),
      modified_at: new Date(0),
    };

    // Insert the new task into the database
    const createdTask = await prisma.tasks.create({
      data: newTaskData,
    });

    return NextResponse.json({ task: createdTask }, { status: 201 });
  } catch (error) {
    console.error("Error creating task:", error);

    if (error instanceof PrismaClientKnownRequestError) {
      // Handle specific Prisma errors if necessary
      return NextResponse.json(
        { error: "Database error occurred while creating task" },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { error: "An error occurred while processing your request" },
      { status: 500 }
    );
  }
}
