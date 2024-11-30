"use client";

import React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { signOut } from "next-auth/react";

export const Navbar = () => {
  return (
    <div
      id="navbar"
      className="flex bg-gray-100 z-50 h-16 items-center w-full px-8"
    >
      <Link href="/" className="text-3xl font-black">
        FeedAI
      </Link>
      <div className="ml-auto space-x-4">
        <Link href="/">Home</Link>
        <Link href="/add-website">Websites</Link>
        <Link href="/add-category">Categories</Link>
        <Link href="/fetch-articles">Articles</Link>
        <Link href="/fetch-tasks">Tasks</Link>
        <Button variant="outline" onClick={() => signOut()}>Logout</Button>
      </div>
    </div>
  );
};
