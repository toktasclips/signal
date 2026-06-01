import type { Metadata } from "next";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Lansman Planları",
};

export default function CampaignCalendarPage() {
  redirect("/launch-plans");
}
