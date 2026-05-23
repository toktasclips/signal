import { createAdminClient } from "@/lib/supabase/admin";
import { syncStripeCurrentPeriod } from "@/lib/stripe/sync";
import { NextResponse } from "next/server";
import { createHmac, timingSafeEqual } from "node:crypto";

export const runtime = "nodejs";

const SUPPORTED_EVENTS = new Set([
  "charge.succeeded",
  "charge.refunded",
  "charge.updated",
  "refund.created",
  "refund.updated",
  "invoice.paid",
  "invoice.payment_succeeded",
  "payment_intent.succeeded",
]);

interface StripeEvent {
  id: string;
  type: string;
}

function verifyStripeSignature(payload: string, signature: string | null): boolean {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret || !signature) return false;

  const parts = Object.fromEntries(
    signature.split(",").map((part) => {
      const [key, value] = part.split("=");
      return [key, value];
    })
  );
  const timestamp = parts.t;
  const expected = parts.v1;
  if (!timestamp || !expected) return false;

  const signedPayload = `${timestamp}.${payload}`;
  const computed = createHmac("sha256", webhookSecret)
    .update(signedPayload)
    .digest("hex");

  const expectedBuffer = Buffer.from(expected, "hex");
  const computedBuffer = Buffer.from(computed, "hex");
  if (expectedBuffer.length !== computedBuffer.length) return false;
  return timingSafeEqual(expectedBuffer, computedBuffer);
}

async function getWebhookUserId(): Promise<string> {
  const email = process.env.STRIPE_SYNC_USER_EMAIL;
  if (!email) throw new Error("STRIPE_SYNC_USER_EMAIL is not configured.");

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("id")
    .eq("email", email)
    .single();

  if (error || !data?.id) {
    throw new Error("Stripe sync user was not found.");
  }

  return data.id as string;
}

export async function POST(request: Request) {
  const payload = await request.text();
  const signature = request.headers.get("stripe-signature");

  if (!verifyStripeSignature(payload, signature)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  const event = JSON.parse(payload) as StripeEvent;
  if (!SUPPORTED_EVENTS.has(event.type)) {
    return NextResponse.json({ received: true, ignored: true });
  }

  try {
    const userId = await getWebhookUserId();
    const supabase = createAdminClient();
    await syncStripeCurrentPeriod(userId, supabase);
    return NextResponse.json({ received: true });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Stripe webhook failed.",
      },
      { status: 500 }
    );
  }
}
