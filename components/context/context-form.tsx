"use client";

import { useActionState } from "react";
import { Building2, Target, TrendingUp, Users, Lightbulb } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { saveBusinessContext } from "@/actions/context";
import { cn } from "@/lib/utils";
import type { ActionState, BusinessContext } from "@/types";

const SALES_MODELS = [
  "High-ticket 1:1",
  "Group Program",
  "Productized Service",
  "Retainer / Agency",
  "SaaS / Subscription",
  "E-commerce",
  "Consulting",
  "Other",
];

const SALES_CYCLES = [
  "Same day",
  "2–7 days",
  "1–2 weeks",
  "2–4 weeks",
  "1–3 months",
  "3+ months",
];

const PRIMARY_GOALS = [
  "Close more deals",
  "Increase deal value",
  "Shorten sales cycle",
  "Improve lead quality",
  "Scale outreach",
  "Build pipeline",
  "Retain clients",
];

interface SectionProps {
  icon: React.ElementType;
  title: string;
  description: string;
  children: React.ReactNode;
}

function Section({ icon: Icon, title, description, children }: SectionProps) {
  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      <div className="flex items-start gap-3 border-b border-border px-5 py-4">
        <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-primary/8">
          <Icon className="h-4 w-4 text-primary" />
        </div>
        <div>
          <p className="text-sm font-medium text-foreground">{title}</p>
          <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
        </div>
      </div>
      <div className="p-5 grid gap-4 sm:grid-cols-2">{children}</div>
    </div>
  );
}

interface FieldProps {
  label: string;
  name: string;
  defaultValue?: string | number | null;
  placeholder?: string;
  type?: string;
  className?: string;
}

function Field({ label, name, defaultValue, placeholder, type = "text", className }: FieldProps) {
  return (
    <div className={cn("space-y-1.5", className)}>
      <Label htmlFor={name} className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
        {label}
      </Label>
      <Input
        id={name}
        name={name}
        type={type}
        defaultValue={defaultValue ?? ""}
        placeholder={placeholder}
        className="h-9 text-sm"
      />
    </div>
  );
}

interface SelectFieldProps {
  label: string;
  name: string;
  options: string[];
  defaultValue?: string | null;
  placeholder?: string;
  className?: string;
}

function SelectField({ label, name, options, defaultValue, placeholder, className }: SelectFieldProps) {
  return (
    <div className={cn("space-y-1.5", className)}>
      <Label htmlFor={name} className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
        {label}
      </Label>
      <select
        id={name}
        name={name}
        defaultValue={defaultValue ?? ""}
        className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
      >
        <option value="">{placeholder ?? `Select ${label.toLowerCase()}`}</option>
        {options.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
    </div>
  );
}

interface ContextFormProps {
  context: BusinessContext | null;
}

export function ContextForm({ context }: ContextFormProps) {
  const [state, action, isPending] = useActionState<ActionState, FormData>(
    saveBusinessContext,
    { status: "idle" }
  );

  return (
    <form action={action} className="space-y-4">
      {state.status === "success" && (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50/50 px-4 py-3">
          <p className="text-sm text-emerald-700">{state.message}</p>
        </div>
      )}
      {state.status === "error" && !state.fieldErrors && (
        <div className="rounded-lg border border-destructive/20 bg-destructive/5 px-4 py-3">
          <p className="text-sm text-destructive">{state.error}</p>
        </div>
      )}

      <Section
        icon={Building2}
        title="Business Identity"
        description="Who you are and what you sell."
      >
        <Field
          label="Business Name"
          name="business_name"
          defaultValue={context?.business_name}
          placeholder="e.g. Teneffüs"
        />
        <Field
          label="Niche"
          name="niche"
          defaultValue={context?.niche}
          placeholder="e.g. B2B SaaS, Coaching, Agency"
        />
        <Field
          label="Offer Type"
          name="offer_type"
          defaultValue={context?.offer_type}
          placeholder="e.g. 1:1 Coaching, Done-for-you"
          className="sm:col-span-2"
        />
      </Section>

      <Section
        icon={TrendingUp}
        title="Sales Model"
        description="How you structure and close deals."
      >
        <SelectField
          label="Sales Model"
          name="sales_model"
          options={SALES_MODELS}
          defaultValue={context?.sales_model}
        />
        <Field
          label="Average Offer Value ($)"
          name="average_offer_value"
          defaultValue={context?.average_offer_value ?? ""}
          placeholder="e.g. 3000"
          type="number"
        />
        <SelectField
          label="Sales Cycle"
          name="sales_cycle"
          options={SALES_CYCLES}
          defaultValue={context?.sales_cycle}
          placeholder="Typical time to close"
        />
      </Section>

      <Section
        icon={Users}
        title="Market Focus"
        description="Who you serve and how you reach them."
      >
        <Field
          label="Target Audience"
          name="target_audience"
          defaultValue={context?.target_audience}
          placeholder="e.g. Founders, SaaS teams, Coaches"
          className="sm:col-span-2"
        />
        <Field
          label="Primary Acquisition Channel"
          name="acquisition_channel"
          defaultValue={context?.acquisition_channel}
          placeholder="e.g. Instagram, Referrals, Workshop"
          className="sm:col-span-2"
        />
      </Section>

      <Section
        icon={Lightbulb}
        title="Goals & Context"
        description="What Signal should optimize for."
      >
        <SelectField
          label="Primary Goal"
          name="primary_goal"
          options={PRIMARY_GOALS}
          defaultValue={context?.primary_goal}
          className="sm:col-span-2"
        />
        <div className="space-y-1.5 sm:col-span-2">
          <Label htmlFor="notes" className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            Additional Notes
          </Label>
          <Textarea
            id="notes"
            name="notes"
            defaultValue={context?.notes ?? ""}
            placeholder="Anything else Signal should know about your business or sales process..."
            rows={3}
            className="resize-none text-sm"
          />
        </div>
      </Section>

      <div className="flex justify-end">
        <Button type="submit" disabled={isPending} className="min-w-32">
          {isPending ? "Saving..." : "Save Profile"}
        </Button>
      </div>
    </form>
  );
}
