"use server";

import { signIn, signOut, auth } from "../auth";
import { AuthError } from "next-auth";
import { redirect } from "next/navigation";

export async function handleLogin(prevState: any, formData: FormData) {
  try {
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;

    // Allow direct access to /feeds without authentication
    if (formData.get('redirectTo') === '/feeds') {
      redirect('/feeds');
    }

    if (!email || !password) {
      return { error: "Email and password are required" };
    }

    await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    // If signIn doesn't throw, it was successful
    redirect("/");
  } catch (error) {
    if (error instanceof AuthError) {
      switch (error.type) {
        case "CredentialsSignin":
          return { error: "Invalid credentials" };
        default:
          return { error: "An error occurred during sign in" };
      }
    }
    throw error;
  }
}

export async function handleLogout() {
  await signOut();
  redirect("/login");
}

export async function getCurrentUser() {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }
  return session.user;
}
