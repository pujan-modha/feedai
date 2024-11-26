import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import Link from "next/link";
import { Button } from "@/components/ui/button";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

export const metadata: Metadata = {
  title: "Create Next App",
  description: "Generated by create next app",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <div
          id="navbar"
          className="flex bg-gray-100 z-50 h-16 items-center w-full px-8"
        >
          <Link href="/" className="text-3xl font-black">FeedAI</Link>
          <div className="ml-auto space-x-4">
            <Link href="/">Home</Link>
            <Link href="/add-website">Websites</Link>
            <Link href="/add-category">Categories</Link>
            <Link href="/fetch-articles">Articles</Link>
            <Link href="/fetch-tasks">Tasks</Link>
            <Button variant="outline">Logout</Button>
          </div>
        </div>
        {children}
        <Toaster />
      </body>
    </html>
  );
}
