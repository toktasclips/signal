"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  LayoutDashboard,
  PlusCircle,
  TrendingUp,
  BarChart2,
  Settings,
  ChevronLeft,
  ChevronRight,
  X,
  Menu,
  BarChart3,
} from "lucide-react"

interface NavItem {
  label: string
  href: string
  icon: React.ReactNode
}

const navItems: NavItem[] = [
  {
    label: "Dashboard",
    href: "/analytics",
    icon: <LayoutDashboard size={18} />,
  },
  {
    label: "KPI Girişi",
    href: "/kpi-entry",
    icon: <PlusCircle size={18} />,
  },
  {
    label: "Trend Analizi",
    href: "/trends",
    icon: <TrendingUp size={18} />,
  },
  {
    label: "Quarter Review",
    href: "/quarter-review",
    icon: <BarChart2 size={18} />,
  },
  {
    label: "Ayarlar",
    href: "/analytics-settings",
    icon: <Settings size={18} />,
  },
]

export function AnalyticsSidebar() {
  const pathname = usePathname()
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  // Close mobile sidebar on route change
  useEffect(() => {
    setMobileOpen(false)
  }, [pathname])

  // Close on ESC
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMobileOpen(false)
    }
    window.addEventListener("keydown", handleKey)
    return () => window.removeEventListener("keydown", handleKey)
  }, [])

  const isActive = (href: string) => pathname === href

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div
        className={`flex items-center gap-2 border-b border-border px-4 py-5 ${
          collapsed ? "justify-center" : ""
        }`}
      >
        <BarChart3 size={20} className="flex-shrink-0 text-primary" />
        {!collapsed && (
          <span className="text-lg font-semibold tracking-tight text-foreground">
            Trend
          </span>
        )}
      </div>

      {/* Nav Items */}
      <nav className="flex-1 px-2 py-4 space-y-1">
        {navItems.map((item) => {
          const active = isActive(item.href)
          return (
            <Link
              key={item.href}
              href={item.href}
              title={collapsed ? item.label : undefined}
              className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                collapsed ? "justify-center" : ""
              } ${
                active
                  ? "bg-primary/10 text-foreground"
                  : "text-muted-foreground hover:bg-accent hover:text-foreground"
              }`}
            >
              <span className="flex-shrink-0">{item.icon}</span>
              {!collapsed && <span>{item.label}</span>}
            </Link>
          )
        })}
      </nav>

      {/* Collapse Toggle */}
      <div className="border-t border-border p-3">
        <button
          onClick={() => setCollapsed(!collapsed)}
          className={`flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-foreground ${
            collapsed ? "justify-center" : ""
          }`}
          aria-label={collapsed ? "Genişlet" : "Daralt"}
        >
          {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
          {!collapsed && <span>Daralt</span>}
        </button>
      </div>
    </div>
  )

  return (
    <>
      {/* Mobile hamburger button */}
      <button
        onClick={() => setMobileOpen(true)}
        className="fixed left-4 top-4 z-50 flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-card text-muted-foreground transition-colors hover:text-foreground lg:hidden"
        aria-label="Menüyü aç"
      >
        <Menu size={18} />
      </button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/30 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile sidebar */}
      <div
        className={`fixed inset-y-0 left-0 z-50 w-[220px] transform border-r border-border bg-sidebar transition-transform duration-300 lg:hidden ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <button
          onClick={() => setMobileOpen(false)}
          className="absolute right-4 top-4 text-muted-foreground transition-colors hover:text-foreground"
          aria-label="Kapat"
        >
          <X size={18} />
        </button>
        <SidebarContent />
      </div>

      {/* Desktop sidebar */}
      <div
        className={`hidden flex-shrink-0 flex-col border-r border-border bg-sidebar transition-all duration-300 lg:flex ${
          collapsed ? "w-[56px]" : "w-[220px]"
        }`}
        style={{ minHeight: "100vh" }}
      >
        <SidebarContent />
      </div>
    </>
  )
}
