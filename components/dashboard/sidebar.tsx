"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Users,
  CalendarDays,
  Megaphone,
  CheckSquare,
  Settings,
  Building2,
  BarChart2,
  TrendingUp,
  PlusCircle,
  Trophy,
  Database,
  Rocket,
} from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  {
    label: "Sales",
    href: "/leads",
    icon: Users,
  },
  {
    label: "Campaigns",
    href: "/campaigns",
    icon: Megaphone,
  },
  {
    label: "Lansman Planları",
    href: "/launch-plans",
    icon: Rocket,
  },
  {
    label: "Tasks",
    href: "/tasks",
    icon: CheckSquare,
  },
  {
    label: "Calendar",
    href: "/calendar",
    icon: CalendarDays,
    soon: true,
  },
];

const analyticsNavItems = [
  { label: "Dashboard", href: "/trend-dashboard", icon: BarChart2 },
  { label: "KPI Girişi", href: "/kpi-entry", icon: PlusCircle },
  { label: "Trend Analizi", href: "/trends", icon: TrendingUp },
  { label: "Kaynak Verileri", href: "/source-data", icon: Database },
  { label: "Quarter Review", href: "/quarter-review", icon: Trophy },
];

interface SidebarProps {
  onNavClick?: () => void;
}

export function Sidebar({ onNavClick }: SidebarProps) {
  const pathname = usePathname();

  return (
    <div className="flex h-full w-full flex-col bg-sidebar">
      {/* Logo */}
      <div className="flex h-14 items-center border-b border-sidebar-border px-5">
        <div className="flex items-center gap-2.5">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary">
            <span className="text-xs font-bold text-primary-foreground">T</span>
          </div>
          <span className="font-semibold text-foreground tracking-tight">
            Teneffüs
          </span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-4">
        <ul className="space-y-0.5">
          {navItems.map((item) => {
            const isActive = pathname.startsWith(item.href);

            return (
              <li key={item.href}>
                <Link
                  href={item.soon ? "#" : item.href}
                  onClick={onNavClick}
                  className={cn(
                    "group flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-all duration-150",
                    isActive
                      ? "bg-primary/8 text-foreground font-medium"
                      : "text-muted-foreground hover:bg-accent hover:text-foreground"
                  )}
                >
                  <item.icon
                    className={cn(
                      "h-4 w-4 shrink-0 transition-colors",
                      isActive ? "text-primary" : "text-muted-foreground group-hover:text-foreground"
                    )}
                  />
                  <span className="flex-1">{item.label}</span>
                  {item.soon && (
                    <span className="rounded px-1.5 py-0.5 text-[10px] font-medium bg-muted text-muted-foreground">
                      Soon
                    </span>
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Analytics Section */}
      <div className="px-3 py-3 border-t border-sidebar-border">
        <p className="px-3 mb-1.5 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/50">
          Trend Analytics
        </p>
        <ul className="space-y-0.5">
          {analyticsNavItems.map((item) => {
            const isActive = pathname.startsWith(item.href);
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  onClick={onNavClick}
                  className={cn(
                    "group flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-all duration-150",
                    isActive
                      ? "bg-primary/8 text-foreground font-medium"
                      : "text-muted-foreground hover:bg-accent hover:text-foreground"
                  )}
                >
                  <item.icon className={cn("h-4 w-4 shrink-0 transition-colors", isActive ? "text-primary" : "text-muted-foreground group-hover:text-foreground")} />
                  <span className="flex-1">{item.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </div>

      {/* Bottom */}
      <div className="border-t border-sidebar-border px-3 py-3 space-y-0.5">
        <Link
          href="/context"
          onClick={onNavClick}
          className={cn(
            "flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-all duration-150",
            pathname.startsWith("/context")
              ? "bg-primary/8 text-foreground font-medium"
              : "text-muted-foreground hover:bg-accent hover:text-foreground"
          )}
        >
          <Building2 className={cn("h-4 w-4 shrink-0", pathname.startsWith("/context") ? "text-primary" : "text-muted-foreground")} />
          <span>Business Context</span>
        </Link>
        <Link
          href="/settings"
          onClick={onNavClick}
          className={cn(
            "flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-all duration-150",
            pathname.startsWith("/settings")
              ? "bg-primary/8 text-foreground font-medium"
              : "text-muted-foreground hover:bg-accent hover:text-foreground"
          )}
        >
          <Settings className="h-4 w-4 shrink-0" />
          <span>Settings</span>
        </Link>
      </div>
    </div>
  );
}
