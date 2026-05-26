import { cn } from "@/lib/utils/cn";

type BadgeColor = "indigo" | "green" | "red" | "amber" | "gray";

const colorMap: Record<BadgeColor, string> = {
  indigo: "bg-indigo-100 text-indigo-700",
  green:  "bg-green-100 text-green-700",
  red:    "bg-red-100 text-red-700",
  amber:  "bg-amber-100 text-amber-700",
  gray:   "bg-gray-100 text-gray-600",
};

interface BadgeProps {
  label: string;
  color?: BadgeColor;
  dot?: boolean;
  className?: string;
}

export function Badge({ label, color = "gray", dot = false, className }: BadgeProps) {
  return (
    <span className={cn("inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium", colorMap[color], className)}>
      {dot && <span className={cn("w-1.5 h-1.5 rounded-full", color === "green" ? "bg-green-500" : color === "red" ? "bg-red-500" : color === "amber" ? "bg-amber-500" : "bg-gray-400")} />}
      {label}
    </span>
  );
}
