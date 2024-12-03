import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    const logs = await prisma.logs.findMany({
      orderBy: {
        created_at: "desc",
      },
    });
    return NextResponse.json({
      status: 200,
      data: logs,
    });
  } catch (error) {
    return NextResponse.json({
      status: 500,
      error: error,
    });
  }
}
