import { NextRequest, NextResponse } from "next/server";
import path from "path";
import fs from "fs/promises";
import { existsSync } from "fs";

export async function GET(
  req: NextRequest,
  { params }: { params: { file: string[] } }
) {
  const param = await params;
  const filePath = path.join(process.cwd(), "uploads", ...param.file);

  if (existsSync(filePath)) {
    const fileExtension = path.extname(filePath).toLowerCase();
    const mimeTypeMap: { [key: string]: string } = {
      ".jpg": "image/jpeg",
      ".jpeg": "image/jpeg",
      ".png": "image/png",
      ".webp": "image/webp",
      ".svg": "image/svg+xml",
    };
    const mimeType = mimeTypeMap[fileExtension] || "application/octet-stream";

    const file = await fs.readFile(filePath);

    return new NextResponse(file, {
      headers: {
        "Content-Type": mimeType,
      },
    });
  } else {
    return NextResponse.json({ error: "File not found" }, { status: 404 });
  }
}
