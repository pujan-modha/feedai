import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function PATCH(req: NextRequest) {
  const { id, userprompt } = await req.json();
  try {
    if (!id)
      return NextResponse.json(
        { error: "Task ID is required" },
        { status: 400 }
      );
    const task = await prisma.tasks.findUnique({
      where: {
        id: parseInt(id),
      },
    });
    if (!task)
      return NextResponse.json({ error: "Task not found" }, { status: 404 });

    const feed_config = JSON.parse(task.feed_config!);
    feed_config["userprompt"] = userprompt;

    await prisma.tasks.update({
      where: {
        id: parseInt(id),
      },
      data: {
        feed_config: JSON.stringify(feed_config),
      },
    });
    await prisma.logs.create({
      data: {
        message: "User prompt for task id " + id + " updated successfully",
        category: "edit-task",
        entity_id: id,
      },
    });
    return NextResponse.json({
      message: "User prompt for task id " + id + " updated successfully",
    });
  } catch (error) {
    await prisma.logs.create({
      data: {
        message:
          error instanceof Error ? error.message : "An unknown error occurred",
        category: "edit-task-error",
        entity_id: id,
      },
    });
    return NextResponse.json(
      {
        error:
          "An error occurred while processing your request. Please try again later.",
      },
      { status: 500 }
    );
  }
}
