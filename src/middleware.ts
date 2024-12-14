import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { auth } from "./app/auth";

export async function middleware(request: NextRequest) {
  const session = await auth();

  // Define public paths
  const publicPaths = ["/login", "/auth/error"];

  // Allow access to all files under `/uploads` and `/feeds`
  const isPublicPath =
    publicPaths.includes(request.nextUrl.pathname) ||
    request.nextUrl.pathname.startsWith("/feeds") ||
    request.nextUrl.pathname.startsWith("/uploads");

  // Redirect unauthenticated users attempting to access private paths
  if (!session && !isPublicPath) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // Redirect authenticated users away from the login page
  if (session && request.nextUrl.pathname === "/login") {
    return NextResponse.redirect(new URL("/", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    // Match all paths except for API routes, Next.js internals, and static files
    "/((?!api|_next/static|_next/image|favicon.ico|uploads/).*)",
  ],
};
