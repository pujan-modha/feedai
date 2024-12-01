import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function DELETE(req: NextRequest) {
  try {
    const { id } = await req.json();
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
    await prisma.tasks.delete({
      where: {
        id: parseInt(id),
      },
    });
    return NextResponse.json({ message: "Task deleted successfully" });
  } catch (error) {
    console.error("Error deleting task:", error);
    return NextResponse.json(
      {
        error:
          "An error occurred while processing your request. Please try again later.",
      },
      { status: 500 }
    );
  }
}
