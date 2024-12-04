"use server";

import { signIn, signOut, auth } from "../auth";
import { hash } from "bcryptjs";
import { AuthError } from "next-auth";
import { getSession } from "next-auth/react";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";

export async function handleLogin(prevState: any, formData: FormData) {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  if (!email || !password) {
    return { error: "Email and password are required" };
  }

  try {
    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });
    if (result?.error) {
      return { error: "Invalid credentials" };
    }

    if (result?.url) {
      return { success: true, url: result.url };
    }
    return { success: true, url: "/" };
  } catch (error) {
    console.error("Login error:", error);
    if (error instanceof AuthError) {
      switch (error.type) {
        case "CredentialsSignin":
          return { error: "Invalid credentials" };
        default:
          return { error: "An error occurred during sign in" };
      }
    }
    return { error: "An unexpected error occurred" };
  }
}

export async function handleLogout() {
  await signOut();
  redirect("/login");
}

export async function getCurrentUser() {
  const session = await auth();
  console.log(session);
  if (!session?.user) {
    return null;
  }

  return session.user;
}

export async function handleSignup(prevState: any, formData: FormData) {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const confirmPassword = formData.get("confirmPassword") as string;

  if (!email || !password || !confirmPassword) {
    return { error: "All fields are required" };
  }

  if (password !== confirmPassword) {
    return { error: "Passwords do not match" };
  }

  try {
    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return { error: "User with this email already exists" };
    }

    // Hash the password
    const hashedPassword = await hash(password, 10);

    // Create new user
    const newUser = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
      },
    });

    if (!newUser) {
      return { error: "Error creating user" };
    }

    // Sign in the new user
    // const result = await signIn("credentials", {
    //   email,
    //   password,
    //   redirect: false,
    // });

    // if (result?.error) {
    //   return { error: "Error signing in after account creation" };
    // }

    return { success: true, url: "" };
  } catch (error) {
    console.error("Signup error:", error);
    return { error: "An error occurred during sign up" };
  }
}

export async function isAuthenticated() {
  const session = await auth();
  return !!session?.user;
}
