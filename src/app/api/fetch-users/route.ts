import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    const users = await prisma.user.findMany({
        orderBy: {
            created_at: "desc",
        },
    });
    return NextResponse.json(users);
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json(
      {
        error:
          "An error occurred while processing your request. Please check the URL and try again.",
      },
      { status: 500 }
    );
  }
}

export async function DELETE(req: Request) {
  const { id } = await req.json();
  if (!id) {
    return NextResponse.json(
      { error: "Invalid request: Missing or incorrect ID" },
      { status: 400 }
    );
  }
  try {
    const user = await prisma.user.findUnique({
      where: {
        id: parseInt(id),
      },
    });
    if (!user) {
      return NextResponse.json({ error: "No user found" }, { status: 404 });
    }
    await prisma.user.delete({
      where: {
        id: parseInt(id),
      },
    });
    await prisma.logs.create({
      data: {
        message: "User deleted successfully",
        category: "delete-user",
      },
    });
    return NextResponse.json({ message: "User deleted successfully" });
  } catch (error) {
    await prisma.logs.create({
      data: {
        message: (error as Error).message,
        category: "delete-user-error",
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

