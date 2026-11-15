"use client";

import { useActionState, useState } from "react";
import { authenticate, type AuthState } from "@/lib/auth/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function AuthForm() {
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [state, formAction, pending] = useActionState<AuthState, FormData>(
    authenticate,
    undefined,
  );

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="mode" value={mode} />

      {mode === "signup" && (
        <div className="space-y-2">
          <Label htmlFor="name">Name</Label>
          <Input id="name" name="name" autoComplete="name" maxLength={80} />
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input id="email" name="email" type="email" autoComplete="email" required />
      </div>

      <div className="space-y-2">
        <Label htmlFor="password">Password</Label>
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete={mode === "signin" ? "current-password" : "new-password"}
          required
        />
      </div>

      {state?.error && (
        <p role="alert" className="text-sm text-destructive">
          {state.error}
        </p>
      )}

      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? "Please wait…" : mode === "signin" ? "Sign in" : "Create account"}
      </Button>

      <p className="text-center text-sm text-muted-foreground">
        {mode === "signin" ? "New to Draftly?" : "Already have an account?"}{" "}
        <button
          type="button"
          className="underline underline-offset-4"
          onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
        >
          {mode === "signin" ? "Create an account" : "Sign in"}
        </button>
      </p>
    </form>
  );
}