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
        className={`flex items-center gap-2 px-4 py-5 border-b border-[#1A1A1A] ${
          collapsed ? "justify-center" : ""
        }`}
      >
        <BarChart3 size={20} className="text-violet-400 flex-shrink-0" />
        {!collapsed && (
          <span className="text-violet-400 font-bold text-lg tracking-tight">
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
                  ? "bg-[#1A1A1A] text-zinc-100"
                  : "text-zinc-500 hover:text-zinc-300 hover:bg-[#161616]"
              }`}
            >
              <span className="flex-shrink-0">{item.icon}</span>
              {!collapsed && <span>{item.label}</span>}
            </Link>
          )
        })}
      </nav>

      {/* Collapse Toggle */}
      <div className="p-3 border-t border-[#1A1A1A]">
        <button
          onClick={() => setCollapsed(!collapsed)}
          className={`flex items-center gap-2 w-full rounded-lg px-3 py-2 text-sm text-zinc-500 hover:text-zinc-300 hover:bg-[#161616] transition-colors ${
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
        className="fixed top-4 left-4 z-50 lg:hidden flex items-center justify-center w-9 h-9 rounded-lg bg-[#161616] border border-[#222222] text-zinc-400 hover:text-zinc-200 transition-colors"
        aria-label="Menüyü aç"
      >
        <Menu size={18} />
      </button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile sidebar */}
      <div
        className={`fixed inset-y-0 left-0 z-50 w-[220px] bg-[#0D0D0D] border-r border-[#1A1A1A] transform transition-transform duration-300 lg:hidden ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <button
          onClick={() => setMobileOpen(false)}
          className="absolute top-4 right-4 text-zinc-500 hover:text-zinc-300 transition-colors"
          aria-label="Kapat"
        >
          <X size={18} />
        </button>
        <SidebarContent />
      </div>

      {/* Desktop sidebar */}
      <div
        className={`hidden lg:flex flex-col flex-shrink-0 bg-[#0D0D0D] border-r border-[#1A1A1A] transition-all duration-300 ${
          collapsed ? "w-[56px]" : "w-[220px]"
        }`}
        style={{ minHeight: "100vh" }}
      >
        <SidebarContent />
      </div>
    </>
  )
}
