"use client";

import { useFormState, useFormStatus } from "react-dom";
import { handleSignup } from "../actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

const initialState = {
  error: "",
  success: false,
  url: "",
};

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <Button type="submit" className="w-full" disabled={pending}>
      {pending ? "Signing up..." : "Sign up"}
    </Button>
  );
}

export default function SignupForm() {
  const [state, formAction] = useFormState(handleSignup, initialState);
  const router = useRouter();

  useEffect(() => {
    if (state.success && state.url) {
      router.push(state.url);
    }
  }, [state, router]);

  return (
    <form action={formAction} className="space-y-4 w-full max-w-sm">
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input id="email" name="email" type="email" required />
      </div>
      <div className="space-y-2">
        <Label htmlFor="password">Password</Label>
        <Input id="password" name="password" type="password" required />
      </div>
      <div className="space-y-2">
        <Label htmlFor="confirmPassword">Confirm Password</Label>
        <Input
          id="confirmPassword"
          name="confirmPassword"
          type="password"
          required
        />
      </div>
      {state.error && (
        <p className="text-red-500 text-sm mt-2">{state.error}</p>
      )}
      <SubmitButton />
      <p className="text-center text-sm">
        Already have an account?{" "}
        <Link href="/login" className="text-blue-500 hover:underline">
          Log in
        </Link>
      </p>
    </form>
  );
}
