"use client";

import { useActionState } from "react";
import Link from "next/link";
import { Loader2, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { register } from "@/actions/auth";
import type { ActionState } from "@/types";

const initialState: ActionState = { status: "idle" };

export function RegisterForm() {
  const [state, formAction, isPending] = useActionState(register, initialState);

  if (state.status === "success") {
    return (
      <div className="flex flex-col items-center gap-4 py-4 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
          <CheckCircle2 className="h-6 w-6 text-primary" />
        </div>
        <div className="space-y-1">
          <p className="font-medium text-foreground">Check your email</p>
          <p className="text-sm text-muted-foreground">{state.message}</p>
        </div>
        <Link
          href="/login"
          className="text-sm font-medium text-foreground hover:text-primary transition-colors"
        >
          Back to sign in
        </Link>
      </div>
    );
  }

  return (
    <form action={formAction} className="space-y-5">
      {state.status === "error" && !state.fieldErrors && (
        <div className="rounded-lg border border-destructive/20 bg-destructive/5 px-4 py-3">
          <p className="text-sm text-destructive">{state.error}</p>
        </div>
      )}

      <div className="space-y-1.5">
        <Label htmlFor="fullName">Full name</Label>
        <Input
          id="fullName"
          name="fullName"
          type="text"
          placeholder="Jane Smith"
          autoComplete="name"
          autoFocus
          disabled={isPending}
        />
        {state.status === "error" && state.fieldErrors?.fullName && (
          <p className="text-xs text-destructive">
            {state.fieldErrors.fullName[0]}
          </p>
        )}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          name="email"
          type="email"
          placeholder="you@example.com"
          autoComplete="email"
          disabled={isPending}
        />
        {state.status === "error" && state.fieldErrors?.email && (
          <p className="text-xs text-destructive">{state.fieldErrors.email[0]}</p>
        )}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="password">Password</Label>
        <Input
          id="password"
          name="password"
          type="password"
          placeholder="Min. 8 characters"
          autoComplete="new-password"
          disabled={isPending}
        />
        {state.status === "error" && state.fieldErrors?.password && (
          <p className="text-xs text-destructive">
            {state.fieldErrors.password[0]}
          </p>
        )}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="confirmPassword">Confirm password</Label>
        <Input
          id="confirmPassword"
          name="confirmPassword"
          type="password"
          placeholder="••••••••"
          autoComplete="new-password"
          disabled={isPending}
        />
        {state.status === "error" && state.fieldErrors?.confirmPassword && (
          <p className="text-xs text-destructive">
            {state.fieldErrors.confirmPassword[0]}
          </p>
        )}
      </div>

      <Button type="submit" className="w-full" disabled={isPending}>
        {isPending ? (
          <>
            <Loader2 className="animate-spin" />
            Creating account…
          </>
        ) : (
          "Create account"
        )}
      </Button>

      <p className="text-center text-sm text-muted-foreground">
        Already have an account?{" "}
        <Link
          href="/login"
          className="font-medium text-foreground hover:text-primary transition-colors"
        >
          Sign in
        </Link>
      </p>
    </form>
  );
}
