"use client";

import { useState } from "react";
import { Sidebar } from "@/components/dashboard/sidebar";
import { Topbar } from "@/components/dashboard/topbar";
import { MobileNav } from "@/components/dashboard/mobile-nav";
import type { AuthUser } from "@/types";

interface DashboardShellProps {
  user: AuthUser;
  children: React.ReactNode;
}

export function DashboardShell({ user, children }: DashboardShellProps) {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex lg:w-60 lg:flex-col lg:shrink-0 border-r border-border">
        <Sidebar />
      </aside>

      {/* Mobile navigation drawer */}
      <MobileNav
        isOpen={mobileNavOpen}
        onClose={() => setMobileNavOpen(false)}
      />

      {/* Main content */}
      <div className="flex flex-1 flex-col min-w-0 overflow-hidden">
        <Topbar
          user={user}
          onMenuClick={() => setMobileNavOpen(true)}
        />
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
