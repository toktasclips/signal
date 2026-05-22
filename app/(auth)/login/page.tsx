import type { Metadata } from "next";
import { LoginForm } from "@/components/auth/login-form";

export const metadata: Metadata = {
  title: "Sign in",
};

export default function LoginPage() {
  return (
    <div className="space-y-6">
      <div className="space-y-1.5">
        <h2 className="text-lg font-semibold text-foreground tracking-tight">
          Welcome back
        </h2>
        <p className="text-sm text-muted-foreground">
          Sign in to your workspace
        </p>
      </div>
      <LoginForm />
    </div>
  );
}
