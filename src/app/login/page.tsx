"use client";

import { useFormState } from "react-dom";
import { handleLogin } from "../actions/index";
import { Button } from "@/components/ui/button";
import React from "react";

const initialState = {
  error: "",
};

export default function LoginPage() {
  const [state, formAction] = React.useActionState(handleLogin, initialState);

  return (
    <div className="flex min-h-screen items-center justify-center">
      <form action={formAction} className="space-y-4 w-full max-w-md p-8">
        <div>
          <label htmlFor="email" className="block text-sm font-medium">
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            className="mt-1 block w-full rounded-md border p-2"
          />
        </div>

        <div>
          <label htmlFor="password" className="block text-sm font-medium">
            Password
          </label>
          <input
            id="password"
            name="password"
            type="password"
            required
            className="mt-1 block w-full rounded-md border p-2"
          />
        </div>

        {state?.error && (
          <div className="text-red-500 text-sm">{state.error}</div>
        )}

        <Button
          type="submit"
        >
          Sign in
        </Button>
      </form>
    </div>
  );
}
