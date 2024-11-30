import { NextResponse } from "next/server";

export async function GET({ params }: { params: { slug: string[] } }) {
  return new NextResponse(`Hello ${params.slug[0]}`, {
    status: 200,
  });
}
