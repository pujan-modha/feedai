"use client";

import { useFormState, useFormStatus } from "react-dom";
import { handleSignup } from "../actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useActionState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";

const initialState = {
  error: "",
  success: undefined,
  url: undefined,
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
  const [state, formAction] = useActionState(handleSignup, initialState);
  const { toast } = useToast();

  useEffect(() => {
    if (state.success) {
      toast({
        title: "Success!",
        description: "Created account successfully!",
      });
    }
  }, [state]);

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
      </form>
    </div>
  );
}
