"use client";

import { logoutAction } from "@/actions/auth";
import Link             from "next/link";
import { usePathname }  from "next/navigation";
import { ThemeToggle }  from "@/components/ui/ThemeToggle";

const PAGE_TITLES: Record<string, string> = {
  "/dashboard":    "Dashboard",
  "/transactions": "Giao dịch",
  "/budgets":      "Ngân sách",
  "/goals":        "Mục tiêu tiết kiệm",
  "/calendar":     "Lịch giao dịch",
  "/ai-insight":   "AI Tư vấn",
  "/settings":     "Cài đặt",
};

function getTitle(pathname: string): string {
  const exact = PAGE_TITLES[pathname];
  if (exact) return exact;
  const parent = Object.keys(PAGE_TITLES).find(
    (k) => k !== "/dashboard" && pathname.startsWith(k)
  );
  return parent ? PAGE_TITLES[parent] : "FinFlow";
}

interface Props {
  email:     string;
  fullName:  string | null;
  avatarUrl: string | null;
}

export function TopBar({ email, fullName, avatarUrl }: Props) {
  const pathname    = usePathname();
  const displayName = fullName ?? email.split("@")[0];
  const initials    = displayName
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <header className="bg-white dark:bg-slate-800 border-b border-gray-100 dark:border-slate-700 px-6 h-14 flex items-center justify-between flex-shrink-0 z-10">
      {/* Page title */}
      <h2 className="text-base font-semibold text-gray-800 dark:text-slate-100">
        {getTitle(pathname)}
      </h2>

      {/* Right actions */}
      <div className="flex items-center gap-2">
        {/* Theme toggle */}
        <ThemeToggle />

        {/* Quick add button */}
        <Link
          href="/transactions/new"
          className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 text-white rounded-lg text-xs font-semibold hover:bg-indigo-700 transition-colors"
        >
          ＋ Giao dịch
        </Link>

        {/* User menu */}
        <div className="flex items-center gap-2.5 pl-3 border-l border-gray-100 dark:border-slate-700">
          {/* Avatar */}
          {avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={avatarUrl}
              alt={displayName}
              className="w-8 h-8 rounded-full object-cover border border-gray-200"
            />
          ) : (
            <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-xs font-bold flex-shrink-0">
              {initials}
            </div>
          )}

          {/* Name + email */}
          <div className="hidden md:block text-left">
            <p className="text-xs font-semibold text-gray-900 leading-none">{displayName}</p>
            <p className="text-[11px] text-gray-400 mt-0.5 leading-none">{email}</p>
          </div>

          {/* Logout */}
          <form action={logoutAction} className="ml-1">
            <button
              type="submit"
              title="Đăng xuất"
              className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
            >
              {/* Logout icon */}
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </button>
          </form>
        </div>
      </div>
    </header>
  );
}
