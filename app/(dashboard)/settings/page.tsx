import { getCurrentStripePeriod } from "@/lib/stripe/sync";
import { StripeSyncCard } from "@/components/settings/stripe-sync-card";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Settings" };

export default function SettingsPage() {
  const period = getCurrentStripePeriod();

  return (
    <div className="mx-auto max-w-4xl space-y-6 px-6 py-8 lg:px-10">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          Settings
        </h1>
        <p className="text-sm text-muted-foreground">
          Manage integrations and data sync for the operating dashboard.
        </p>
      </div>

      <StripeSyncCard periodLabel={`${period.periodStart} - ${period.periodEnd}`} />

      <section className="rounded-xl border border-border bg-card p-5 shadow-card">
        <h2 className="text-sm font-semibold text-foreground">
          Stripe Environment
        </h2>
        <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
          Vercel environment variables must include{" "}
          <span className="font-medium text-foreground">STRIPE_SECRET_KEY</span>.
          Webhook automation also needs{" "}
          <span className="font-medium text-foreground">STRIPE_WEBHOOK_SECRET</span>,{" "}
          <span className="font-medium text-foreground">STRIPE_SYNC_USER_EMAIL</span>, and{" "}
          <span className="font-medium text-foreground">SUPABASE_SERVICE_ROLE_KEY</span>.
          The webhook URL is{" "}
          <span className="font-medium text-foreground">/api/stripe/webhook</span>.
        </p>
      </section>
    </div>
  );
}
