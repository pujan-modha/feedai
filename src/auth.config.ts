import { NextAuthConfig } from "next-auth";

export const authConfig = {
  pages: {
    signIn: "/login",
    error: "/auth/error",
  },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const isOnDashboard = nextUrl.pathname.startsWith("/");
      const isOnPublicPage =
        ["/login", "/auth/error"].includes(nextUrl.pathname) ||
        nextUrl.pathname.startsWith("/feeds");

      if (isOnPublicPage) return true;
      if (isOnDashboard) return isLoggedIn;
      return true;
    },
  },
  providers: [],
} satisfies NextAuthConfig;
