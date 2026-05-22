"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Flame,
  KanbanSquare,
  Users,
  CalendarDays,
  Settings,
} from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  {
    label: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    label: "Hot List",
    href: "/hot-list",
    icon: Flame,
    soon: true,
  },
  {
    label: "Pipeline",
    href: "/pipeline",
    icon: KanbanSquare,
    soon: true,
  },
  {
    label: "Leads",
    href: "/leads",
    icon: Users,
  },
  {
    label: "Calendar",
    href: "/calendar",
    icon: CalendarDays,
    soon: true,
  },
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
            const isActive =
              item.href === "/dashboard"
                ? pathname === "/dashboard"
                : pathname.startsWith(item.href);

            return (
              <li key={item.href}>
                <Link
                  href={item.soon ? "/dashboard" : item.href}
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

      {/* Bottom */}
      <div className="border-t border-sidebar-border px-3 py-3">
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
