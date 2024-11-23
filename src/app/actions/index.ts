"use server";

import { signIn, signOut, auth } from "../auth";
import { AuthError } from "next-auth";
import { redirect } from "next/navigation";

export async function handleLogin(prevState: any, formData: FormData) {
  try {
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;

    const result = await signIn("credentials", {
      email,
      password,
      redirect: true,
      redirectTo: "/",
    });

    if (!result?.ok) {
      return { error: "Invalid credentials" };
    }

    // Instead of returning success, redirect directly
    redirect("/");
  } catch (error) {
    if (error instanceof AuthError) {
      switch (error.type) {
        case "CredentialsSignin":
          return { error: "Invalid credentials" };
        default:
          return { error: "Something went wrong" };
      }
    }
    throw error;
  }
}

export async function handleLogout() {
  await signOut({ redirectTo: "/login" });
}

export async function getCurrentUser() {
  const session = await auth();
  return session?.user;
}
