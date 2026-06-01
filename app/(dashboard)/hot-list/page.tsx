import { redirect } from "next/navigation";

export default function HotListPage() {
  redirect("/leads?view=hot-list");
}
