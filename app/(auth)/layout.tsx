import type { Metadata } from "next";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      {/* Subtle grid background */}
      <div
        className="fixed inset-0 opacity-[0.025] pointer-events-none"
        style={{
          backgroundImage:
            "linear-gradient(#111111 1px, transparent 1px), linear-gradient(to right, #111111 1px, transparent 1px)",
          backgroundSize: "64px 64px",
        }}
        aria-hidden="true"
      />

      <div className="relative w-full max-w-[380px] space-y-8">
        {/* Brand mark */}
        <div className="text-center space-y-3">
          <div className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-primary shadow-sm mx-auto">
            <span className="text-lg font-bold text-primary-foreground tracking-tight">
              T
            </span>
          </div>
          <div>
            <h1 className="text-xl font-semibold text-foreground tracking-tight">
              Teneffüs
            </h1>
          </div>
        </div>

        {/* Card */}
        <div className="rounded-2xl border border-border bg-card shadow-card p-8">
          {children}
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-muted-foreground">
          &copy; {new Date().getFullYear()} Teneffüs. All rights reserved.
        </p>
      </div>
    </div>
  );
}
