import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { auth } from "./app/auth";

export async function middleware(request: NextRequest) {
  const session = await auth();
  const publicPaths = ["/login", "/auth/error"];
  const isPublicPath =
    publicPaths.includes(request.nextUrl.pathname) ||
    request.nextUrl.pathname.startsWith("/feeds");

  if (!session && !isPublicPath) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (session && request.nextUrl.pathname === "/login") {
    return NextResponse.redirect(new URL("/", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
