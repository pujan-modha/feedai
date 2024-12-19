"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { signOut } from "next-auth/react";
import { Menu, X } from "lucide-react";
import { getCurrentUser } from "./actions";

interface User {
  id: number;
  email: string;
  isAdmin: boolean;
}

export const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const getUser = async () => {
      try {
        try {
          const fetchedUser = await getCurrentUser();
          console.log(fetchedUser);
          if (!fetchedUser) {
            return;
          }
          const res = await fetch("/api/get-admin", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              id: fetchedUser.id,
            }),
          });
          if (!res.ok) {
            throw new Error("Failed to fetch admin status");
          }
          const isAdmin = await res.json();
          (fetchedUser as unknown as User).isAdmin = isAdmin;
          setUser(fetchedUser as unknown as User);
        } catch (error) {}
      } catch (error) {
        console.error("Failed to fetch user:", error);
      }
    };
    getUser();
  }, []);

  return (
    <nav className="bg-gray-100 z-50 relative">
      <div className="mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="text-3xl font-black">
            FeedAI
          </Link>
          <div className="md:hidden">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="inline-flex items-center justify-center p-2 rounded-md hover:bg-gray-200 focus:outline-none"
            >
              {isOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </button>
          </div>
          <div
            className={`hidden md:${
              user ? "flex" : "hidden"
            } md:items-center md:space-x-6`}
          >
            <Link href="/" className="hover:text-gray-600 transition-colors">
              Home
            </Link>
            <Link
              href="/add-website"
              className="hover:text-gray-600 transition-colors"
            >
              Websites
            </Link>
            <Link
              href="/add-category"
              className="hover:text-gray-600 transition-colors"
            >
              Categories
            </Link>
            <Link
              href="/fetch-articles"
              className="hover:text-gray-600 transition-colors"
            >
              Articles
            </Link>
            <Link
              href="/fetch-tasks"
              className="hover:text-gray-600 transition-colors"
            >
              Tasks
            </Link>
            <Link
              href="/logs"
              className="hover:text-gray-600 transition-colors"
            >
              Logs
            </Link>
            {user?.isAdmin && (
              <Link
                href="/fetch-users"
                className="hover:text-gray-600 transition-colors"
              >
                Users
              </Link>
            )}

            <Button variant="outline" onClick={() => signOut()}>
              Logout
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      <div className={`${isOpen ? "block" : "hidden"} md:hidden`}>
        <div className="px-2 pt-2 pb-3 space-y-1 bg-gray-100 shadow-lg">
          <Link
            href="/"
            className="block px-3 py-2 rounded-md hover:bg-gray-200"
          >
            Home
          </Link>
          <Link
            href="/add-website"
            className="block px-3 py-2 rounded-md hover:bg-gray-200"
          >
            Websites
          </Link>
          <Link
            href="/add-category"
            className="block px-3 py-2 rounded-md hover:bg-gray-200"
          >
            Categories
          </Link>
          <Link
            href="/fetch-articles"
            className="block px-3 py-2 rounded-md hover:bg-gray-200"
          >
            Articles
          </Link>
          <Link
            href="/fetch-tasks"
            className="block px-3 py-2 rounded-md hover:bg-gray-200"
          >
            Tasks
          </Link>
          <Link
            href="/logs"
            className="block px-3 py-2 rounded-md hover:bg-gray-200"
          >
            Logs
          </Link>
          {user?.isAdmin && (
            <Link
              href="/fetch-users"
              className="block px-3 py-2 rounded-md hover:bg-gray-200"
            >
              Users
            </Link>
          )}
          <div className="px-3 py-2">
            <Button
              variant="outline"
              onClick={() => signOut()}
              className="w-full"
            >
              Logout
            </Button>
          </div>
        </div>
      </div>
    </nav>
  );
};
