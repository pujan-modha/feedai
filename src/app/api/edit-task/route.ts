import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function PATCH(req: NextRequest) {
  try {
    const { id, userprompt } = await req.json();
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
    return NextResponse.json({ message: "User prompt for task id " + id + " updated successfully" });
  } catch (error) {
    console.error("Error updating task:", error);
    return NextResponse.json(
      {
        error:
          "An error occurred while processing your request. Please try again later.",
      },
      { status: 500 }
    );
  }
}
