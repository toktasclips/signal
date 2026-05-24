export interface KpiPeriod {
  periodStart: string;
  periodEnd: string;
  month: number;
  year: number;
}

const KPI_TIME_ZONE = "Europe/Istanbul";

function getIstanbulParts(date: Date): { year: number; month: number; day: number } {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: KPI_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);

  return {
    year: Number(parts.find((part) => part.type === "year")?.value),
    month: Number(parts.find((part) => part.type === "month")?.value),
    day: Number(parts.find((part) => part.type === "day")?.value),
  };
}

function addMonths(date: Date, months: number): Date {
  const next = new Date(date);
  next.setMonth(next.getMonth() + months);
  return next;
}

function ymd(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function getCurrentKpiPeriod(now = new Date()): KpiPeriod {
  const current = getIstanbulParts(now);
  const base = new Date(current.year, current.month - 1, current.day);
  const periodEnd =
    base.getDate() >= 25
      ? new Date(base.getFullYear(), base.getMonth() + 1, 25)
      : new Date(base.getFullYear(), base.getMonth(), 25);
  const periodStart = addMonths(periodEnd, -1);

  return {
    periodStart: ymd(periodStart),
    periodEnd: ymd(periodEnd),
    month: periodEnd.getMonth() + 1,
    year: periodEnd.getFullYear(),
  };
}
