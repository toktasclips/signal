import type { Metadata } from "next";
import { UpdatePasswordForm } from "@/components/auth/update-password-form";

export const metadata: Metadata = {
  title: "Update password",
};

export default function UpdatePasswordPage() {
  return (
    <div className="space-y-6">
      <div className="space-y-1.5">
        <h2 className="text-lg font-semibold text-foreground tracking-tight">
          Set new password
        </h2>
        <p className="text-sm text-muted-foreground">
          Enter a new password for your account
        </p>
      </div>
      <UpdatePasswordForm />
    </div>
  );
}
