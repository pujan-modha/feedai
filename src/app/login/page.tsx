"use client";

import { useFormState } from "react-dom";
import { handleLogin } from "../actions/index";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useRouter } from "next/navigation";
import { useEffect, useActionState } from "react";

const initialState = {
  error: "",
  success: undefined,
  url: undefined,
};

export default function LoginForm() {
  const [state, formAction] = useActionState(handleLogin, initialState);
  const router = useRouter();

  useEffect(() => {
    if (state.success && state.url) {
      router.push(state.url);
      window.location.reload();
    }
  }, [state, router]);

  return (
    <div className="flex flex-col items-center justify-center h-screen">
      <form action={formAction} className="space-y-4 w-full max-w-sm">
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input id="email" name="email" type="email" required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <Input id="password" name="password" type="password" required />
        </div>
        {state.error && (
          <p className="text-red-500 text-sm mt-2">{state.error}</p>
        )}
        <Button type="submit" className="w-full">
          Log in
        </Button>
      </form>
    </div>
  );
}
