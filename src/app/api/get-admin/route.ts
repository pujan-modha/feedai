import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function POST(req: Request) {
  const { id } = await req.json();
  if (!id) {
    return NextResponse.json(
      { error: "Invalid request: Missing or incorrect ID" },
      { status: 400 }
    );
  }
  try {
    const admin = await prisma.user.findFirst({
      where: {
        id: parseInt(id)
      },
    });
    if (!admin) {
      return NextResponse.json({ error: "No admin found" }, { status: 404 });
    }
    return NextResponse.json(admin.is_admin);
  } catch (error) {
    return NextResponse.json(
      { error: "An error occurred while processing your request" },
      { status: 500 }
    );
  }
}
