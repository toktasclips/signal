"use client";

import { useActionState } from "react";
import Link from "next/link";
import { Loader2, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { forgotPassword } from "@/actions/auth";
import type { ActionState } from "@/types";

const initialState: ActionState = { status: "idle" };

export function ForgotPasswordForm() {
  const [state, formAction, isPending] = useActionState(
    forgotPassword,
    initialState
  );

  if (state.status === "success") {
    return (
      <div className="flex flex-col items-center gap-4 py-4 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
          <Mail className="h-6 w-6 text-primary" />
        </div>
        <div className="space-y-1">
          <p className="font-medium text-foreground">Reset link sent</p>
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
        <Label htmlFor="email">Email address</Label>
        <Input
          id="email"
          name="email"
          type="email"
          placeholder="you@example.com"
          autoComplete="email"
          autoFocus
          disabled={isPending}
        />
        {state.status === "error" && state.fieldErrors?.email && (
          <p className="text-xs text-destructive">{state.fieldErrors.email[0]}</p>
        )}
      </div>

      <Button type="submit" className="w-full" disabled={isPending}>
        {isPending ? (
          <>
            <Loader2 className="animate-spin" />
            Sending…
          </>
        ) : (
          "Send reset link"
        )}
      </Button>

      <p className="text-center text-sm text-muted-foreground">
        Remembered your password?{" "}
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
