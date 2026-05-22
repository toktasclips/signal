import type { Metadata } from "next";
import { RegisterForm } from "@/components/auth/register-form";

export const metadata: Metadata = {
  title: "Create account",
};

export default function RegisterPage() {
  return (
    <div className="space-y-6">
      <div className="space-y-1.5">
        <h2 className="text-lg font-semibold text-foreground tracking-tight">
          Create your account
        </h2>
        <p className="text-sm text-muted-foreground">
          Start managing your sales pipeline
        </p>
      </div>
      <RegisterForm />
    </div>
  );
}
