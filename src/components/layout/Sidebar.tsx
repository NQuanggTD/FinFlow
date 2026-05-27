"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { cn } from "@/lib/utils/cn";

const NAV_ITEMS = [
  { href: "/dashboard", icon: "📊", label: "Dashboard", exact: true },
  { href: "/transactions", icon: "💳", label: "Giao dịch", exact: false },
  { href: "/budgets", icon: "🎯", label: "Ngân sách", exact: false },
  { href: "/goals", icon: "⭐", label: "Mục tiêu", exact: false },
  { href: "/calendar", icon: "📅", label: "Lịch", exact: true },
  { href: "/reports", icon: "📈", label: "Báo cáo", exact: true },
  { href: "/ai-insight", icon: "🤖", label: "AI Tư vấn", exact: true },
  { href: "/settings", icon: "⚙️", label: "Cài đặt", exact: true },
];

function isActive(pathname: string, href: string, exact: boolean) {
  return exact
    ? pathname === href
    : pathname === href || pathname.startsWith(href + "/");
}

function NavLinks({ onClose }: { onClose?: () => void }) {
  const pathname = usePathname();
  return (
    <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
      {NAV_ITEMS.map((item) => {
        const active = isActive(pathname, item.href, item.exact);
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onClose}
            className={cn(
              "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150",
              active
                ? "bg-white/15 text-white shadow-sm"
                : "text-indigo-300 hover:bg-white/8 hover:text-white",
            )}
          >
            <span className="text-base w-5 text-center shrink-0">
              {item.icon}
            </span>
            <span>{item.label}</span>
            {active && (
              <span className="ml-auto w-1.5 h-1.5 rounded-full bg-white/80" />
            )}
          </Link>
        );
      })}
    </nav>
  );
}

function SidebarContent({ onClose }: { onClose?: () => void }) {
  return (
    <>
      {/* Logo */}
      <div className="p-5 border-b border-indigo-800/60 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-white/10 rounded-lg flex items-center justify-center text-lg">
            <span>💰</span>
          </div>
          <div>
            <h1 className="text-base font-bold leading-none">FinFlow</h1>
            <p className="text-indigo-400 text-[11px] mt-0.5">
              Tài chính thông minh
            </p>
          </div>
        </div>
        {/* Close button on mobile */}
        {onClose && (
          <button
            onClick={onClose}
            className="md:hidden p-1.5 text-indigo-300 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        )}
      </div>
      <NavLinks onClose={onClose} />
      <div className="p-4 border-t border-indigo-800/60">
        <p className="text-indigo-500 text-[11px] text-center">
          FinFlow v1.0.0 · CTK46-PM
        </p>
      </div>
    </>
  );
}

export function Sidebar() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden md:flex w-60 bg-indigo-900 text-white flex-col shrink-0">
        <SidebarContent />
      </aside>

      {/* Mobile hamburger button */}
      <button
        className="md:hidden fixed top-3 left-3 z-50 p-2 bg-indigo-900 text-white rounded-lg shadow-lg"
        onClick={() => setMobileOpen(true)}
        aria-label="Mở menu"
      >
        <svg
          className="w-5 h-5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M4 6h16M4 12h16M4 18h16"
          />
        </svg>
      </button>

      {/* Mobile drawer overlay */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-40 flex">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
          />
          {/* Drawer */}
          <aside className="relative w-64 bg-indigo-900 text-white flex flex-col h-full shadow-2xl">
            <SidebarContent onClose={() => setMobileOpen(false)} />
          </aside>
        </div>
      )}
    </>
  );
}
