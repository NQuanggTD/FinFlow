import { format, parseISO, isValid } from "date-fns";
import { vi } from "date-fns/locale";

/** Format number as Vietnamese currency */
export function formatCurrency(amount: number, currency = "VND"): string {
  return new Intl.NumberFormat("vi-VN", {
    style:               "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(amount);
}

/** Format a compact number e.g. 1_500_000 → "1.5M" */
export function formatCompact(amount: number): string {
  if (amount >= 1_000_000_000) return `${(amount / 1_000_000_000).toFixed(1)}B`;
  if (amount >= 1_000_000)     return `${(amount / 1_000_000).toFixed(1)}M`;
  if (amount >= 1_000)         return `${(amount / 1_000).toFixed(0)}K`;
  return String(amount);
}

/** Format ISO date string with a given date-fns format string */
export function formatDate(dateStr: string, fmt = "dd/MM/yyyy"): string {
  try {
    const date = parseISO(dateStr);
    if (!isValid(date)) return dateStr;
    return format(date, fmt, { locale: vi });
  } catch {
    return dateStr;
  }
}

/** Return "Hôm nay", "Hôm qua", or formatted date */
export function formatRelative(dateStr: string): string {
  try {
    const date = parseISO(dateStr);
    const now  = new Date();
    const diff = Math.floor((now.getTime() - date.getTime()) / 86400000);
    if (diff === 0) return "Hôm nay";
    if (diff === 1) return "Hôm qua";
    if (diff === 2) return "Hôm kia";
    if (diff < 7)   return `${diff} ngày trước`;
    return formatDate(dateStr);
  } catch {
    return dateStr;
  }
}

/** Returns current month (1-based) and year */
export function getCurrentMonthYear() {
  const now = new Date();
  return { month: now.getMonth() + 1, year: now.getFullYear() };
}

/** Get array of past N months as { month, year } */
export function getPastMonths(n: number): Array<{ month: number; year: number; label: string }> {
  const result = [];
  const now    = new Date();
  for (let i = 0; i < n; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    result.push({
      month: d.getMonth() + 1,
      year:  d.getFullYear(),
      label: format(d, "MM/yyyy"),
    });
  }
  return result;
}

/** Truncate a string with ellipsis */
export function truncate(str: string, max: number): string {
  return str.length > max ? str.slice(0, max) + "…" : str;
}
