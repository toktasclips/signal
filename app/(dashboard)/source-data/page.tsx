import { CreditCard, Megaphone } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = { title: "Kaynak Verileri" };

interface StripeRunRow {
  id: string;
  period_start: string;
  period_end: string;
  gross_revenue: number | string;
  net_revenue: number | string;
  fees: number | string;
  refunds: number | string;
  charge_count: number | string;
  created_at: string;
}

interface MetaRunRow {
  id: string;
  period_start: string;
  period_end: string;
  spend: number | string;
  reach: number | string;
  impressions: number | string;
  cpm: number | string;
  clicks: number | string;
  ctr: number | string;
  created_at: string;
}

interface MetaCampaignRow {
  id: string;
  period_start: string;
  period_end: string;
  campaign_id: string;
  campaign_name: string;
  spend: number | string;
  reach: number | string;
  impressions: number | string;
  cpm: number | string;
  clicks: number | string;
  ctr: number | string;
  result_type: string | null;
  results: number | string;
  cost_per_result: number | string;
}

function num(value: number | string | null | undefined): number {
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
}

function usd(value: number | string): string {
  return num(value).toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  });
}

function tryMoney(value: number | string): string {
  return num(value).toLocaleString("tr-TR", {
    style: "currency",
    currency: "TRY",
    maximumFractionDigits: 2,
  });
}

function number(value: number | string): string {
  return num(value).toLocaleString("tr-TR", { maximumFractionDigits: 2 });
}

function period(row: { period_start: string; period_end: string }): string {
  return `${row.period_start} - ${row.period_end}`;
}

function resultLabel(value: string | null): string {
  const labels: Record<string, string> = {
    "offsite_conversion.fb_pixel_complete_registration": "Kayıt",
    complete_registration: "Kayıt",
    omni_complete_registration: "Kayıt",
    "onsite_conversion.messaging_conversation_started_7d": "Mesajlaşma",
    messaging_conversation_started_7d: "Mesajlaşma",
    onsite_conversion_lead_grouped: "Lead",
    "onsite_conversion.lead_grouped": "Lead",
    lead: "Lead",
    profile_visit: "Profil ziyareti",
    landing_page_view: "Landing page view",
    link_click: "Bağlantı tıklaması",
    post_engagement: "Etkileşim",
  };

  if (!value) return "—";
  return labels[value] ?? value.replaceAll("_", " ");
}

export default async function SourceDataPage() {
  const supabase = await createClient();

  const [stripeResult, metaResult, campaignResult] = await Promise.all([
    supabase
      .from("stripe_sync_runs")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(12),
    supabase
      .from("meta_ads_sync_runs")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(12),
    supabase
      .from("meta_ads_campaign_insights")
      .select("*")
      .order("period_start", { ascending: false })
      .order("spend", { ascending: false })
      .limit(200),
  ]);

  const stripeRuns = (stripeResult.data as StripeRunRow[] | null) ?? [];
  const metaRuns = (metaResult.data as MetaRunRow[] | null) ?? [];
  const campaignRows = (campaignResult.data as MetaCampaignRow[] | null) ?? [];
  const latestMetaPeriod = metaRuns[0]
    ? {
        start: metaRuns[0].period_start,
        end: metaRuns[0].period_end,
      }
    : null;
  const latestCampaigns = latestMetaPeriod
    ? campaignRows.filter(
        (row) =>
          row.period_start === latestMetaPeriod.start &&
          row.period_end === latestMetaPeriod.end
      )
    : campaignRows;

  const totalCampaignSpend = latestCampaigns.reduce(
    (sum, row) => sum + num(row.spend),
    0
  );

  return (
    <div className="mx-auto max-w-7xl space-y-8 px-6 py-8 lg:px-10">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          Kaynak Verileri
        </h1>
        <p className="max-w-3xl text-sm leading-relaxed text-muted-foreground">
          Stripe ve Meta Ads kaynaklarından gelen ham senkronizasyon kayıtları.
          Bu ekran manuel KPI dashboardlarını değiştirmeden dış kaynakları kontrol
          etmek için ayrıldı.
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="rounded-xl border border-border bg-card p-5 shadow-card">
          <Header
            icon={<CreditCard className="h-4 w-4" />}
            title="Stripe Sync Runs"
            description="Ödeme kaynağından gelen dönem bazlı özetler."
          />
          <div className="mt-4 space-y-3">
            {stripeRuns.length === 0 ? (
              <Empty label="Henüz Stripe sync kaydı yok." />
            ) : (
              stripeRuns.map((run) => (
                <div
                  key={run.id}
                  className="rounded-lg border border-border bg-background px-3 py-3"
                >
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <p className="text-sm font-semibold text-foreground">
                      {period(run)}
                    </p>
                    <span className="text-xs text-muted-foreground">
                      {new Date(run.created_at).toLocaleString("tr-TR")}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 md:grid-cols-5">
                    <Stat label="Gross" value={usd(run.gross_revenue)} />
                    <Stat label="Net" value={usd(run.net_revenue)} />
                    <Stat label="Fee" value={usd(run.fees)} />
                    <Stat label="Refund" value={usd(run.refunds)} />
                    <Stat label="Charge" value={number(run.charge_count)} />
                  </div>
                </div>
              ))
            )}
          </div>
        </section>

        <section className="rounded-xl border border-border bg-card p-5 shadow-card">
          <Header
            icon={<Megaphone className="h-4 w-4" />}
            title="Meta Ads Sync Runs"
            description="Hesap genelindeki Facebook/Instagram reklam özeti."
          />
          <div className="mt-4 space-y-3">
            {metaRuns.length === 0 ? (
              <Empty label="Henüz Meta Ads sync kaydı yok." />
            ) : (
              metaRuns.map((run) => (
                <div
                  key={run.id}
                  className="rounded-lg border border-border bg-background px-3 py-3"
                >
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <p className="text-sm font-semibold text-foreground">
                      {period(run)}
                    </p>
                    <span className="text-xs text-muted-foreground">
                      {new Date(run.created_at).toLocaleString("tr-TR")}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 md:grid-cols-6">
                    <Stat label="Spend" value={tryMoney(run.spend)} />
                    <Stat label="Reach" value={number(run.reach)} />
                    <Stat label="Impr." value={number(run.impressions)} />
                    <Stat label="CPM" value={tryMoney(run.cpm)} />
                    <Stat label="Clicks" value={number(run.clicks)} />
                    <Stat label="CTR" value={`${number(run.ctr)}%`} />
                  </div>
                </div>
              ))
            )}
          </div>
        </section>
      </div>

      <section className="rounded-xl border border-border bg-card p-5 shadow-card">
        <Header
          icon={<Megaphone className="h-4 w-4" />}
          title="Meta Campaign Breakdown"
          description={
            latestMetaPeriod
              ? `${latestMetaPeriod.start} - ${latestMetaPeriod.end} dönemindeki kampanya kırılımı. Toplam spend: ${tryMoney(totalCampaignSpend)}`
              : "Kampanya bazlı spend, reach, impression, click, CPM ve CTR."
          }
        />

        <div className="mt-4 overflow-hidden rounded-xl border border-border">
          {latestCampaigns.length === 0 ? (
            <Empty label="Henüz kampanya kırılımı yok. Meta Ads sync çalıştırınca burada listelenecek." />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/35">
                    <Th>Kampanya</Th>
                    <Th>Dönem</Th>
                    <Th align="right">Spend</Th>
                    <Th align="right">Reach</Th>
                    <Th align="right">Impressions</Th>
                    <Th align="right">CPM</Th>
                    <Th align="right">Sonuçlar</Th>
                    <Th align="right">Sonuç Başına</Th>
                    <Th align="right">Clicks</Th>
                    <Th align="right">CTR</Th>
                  </tr>
                </thead>
                <tbody>
                  {latestCampaigns.map((row) => (
                    <tr key={row.id} className="border-b border-border last:border-0">
                      <td className="min-w-72 px-4 py-3">
                        <p className="font-medium text-foreground">
                          {row.campaign_name}
                        </p>
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          {row.campaign_id}
                        </p>
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-muted-foreground">
                        {period(row)}
                      </td>
                      <Td>{tryMoney(row.spend)}</Td>
                      <Td>{number(row.reach)}</Td>
                      <Td>{number(row.impressions)}</Td>
                      <Td>{tryMoney(row.cpm)}</Td>
                      <Td>
                        <div>
                          <p>{number(row.results)}</p>
                          <p className="mt-0.5 text-[11px] font-normal text-muted-foreground">
                            {resultLabel(row.result_type)}
                          </p>
                        </div>
                      </Td>
                      <Td>{num(row.cost_per_result) > 0 ? tryMoney(row.cost_per_result) : "—"}</Td>
                      <Td>{number(row.clicks)}</Td>
                      <Td>{number(row.ctr)}%</Td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

function Header({
  icon,
  title,
  description,
}: {
  icon: ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="flex gap-3">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/8 text-primary">
        {icon}
      </div>
      <div>
        <h2 className="text-sm font-semibold text-foreground">{title}</h2>
        <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
          {description}
        </p>
      </div>
    </div>
  );
}

function Empty({ label }: { label: string }) {
  return (
    <div className="rounded-lg border border-dashed border-border bg-background px-4 py-8 text-center text-sm text-muted-foreground">
      {label}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md bg-muted/45 px-2.5 py-2">
      <p className="text-[11px] font-medium text-muted-foreground">{label}</p>
      <p className="mt-1 font-semibold text-foreground tabular-nums">{value}</p>
    </div>
  );
}

function Th({
  children,
  align = "left",
}: {
  children: ReactNode;
  align?: "left" | "right";
}) {
  return (
    <th
      className={`px-4 py-3 text-xs font-medium uppercase tracking-wide text-muted-foreground ${
        align === "right" ? "text-right" : "text-left"
      }`}
    >
      {children}
    </th>
  );
}

function Td({ children }: { children: ReactNode }) {
  return (
    <td className="whitespace-nowrap px-4 py-3 text-right font-medium text-foreground tabular-nums">
      {children}
    </td>
  );
}
