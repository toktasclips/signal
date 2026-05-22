"use client";

import { useActionState } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { updatePassword } from "@/actions/auth";
import type { ActionState } from "@/types";

const initialState: ActionState = { status: "idle" };

export function UpdatePasswordForm() {
  const [state, formAction, isPending] = useActionState(
    updatePassword,
    initialState
  );

  return (
    <form action={formAction} className="space-y-5">
      {state.status === "error" && (
        <div className="rounded-lg border border-destructive/20 bg-destructive/5 px-4 py-3">
          <p className="text-sm text-destructive">{state.error}</p>
        </div>
      )}
      {state.status === "success" && (
        <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3">
          <p className="text-sm text-green-700">{state.message}</p>
        </div>
      )}

      <div className="space-y-1.5">
        <Label htmlFor="password">New Password</Label>
        <Input
          id="password"
          name="password"
          type="password"
          placeholder="••••••••"
          autoComplete="new-password"
          autoFocus
          disabled={isPending}
        />
        {state.status === "error" && state.fieldErrors?.password && (
          <p className="text-xs text-destructive">
            {state.fieldErrors.password[0]}
          </p>
        )}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="confirmPassword">Confirm New Password</Label>
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
            Updating…
          </>
        ) : (
          "Update password"
        )}
      </Button>
    </form>
  );
}
