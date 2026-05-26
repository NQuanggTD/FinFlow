import { cn } from "@/lib/utils/cn";

interface ProgressBarProps {
  value: number;       // 0-100
  max?: number;
  label?: string;
  sublabel?: string;
  showPercent?: boolean;
  size?: "sm" | "md";
  color?: "auto" | "indigo" | "green" | "amber" | "red";
}

function autoColor(value: number) {
  if (value >= 100) return "bg-red-500";
  if (value >= 80)  return "bg-amber-400";
  return "bg-indigo-500";
}

export function ProgressBar({ value, label, sublabel, showPercent = true, size = "md", color = "auto" }: ProgressBarProps) {
  const pct = Math.min(Math.max(value, 0), 100);
  const barColor = color === "auto" ? autoColor(pct) : {
    indigo: "bg-indigo-500", green: "bg-green-500", amber: "bg-amber-400", red: "bg-red-500",
  }[color];

  return (
    <div className="w-full">
      {(label || showPercent) && (
        <div className="flex justify-between items-center mb-1.5">
          {label && <span className="text-sm font-medium text-gray-700">{label}</span>}
          {sublabel && <span className="text-xs text-gray-400">{sublabel}</span>}
          {showPercent && (
            <span className={cn("text-xs font-semibold ml-auto", pct >= 100 ? "text-red-600" : pct >= 80 ? "text-amber-600" : "text-indigo-600")}>
              {pct.toFixed(0)}%
            </span>
          )}
        </div>
      )}
      <div className={cn("w-full bg-gray-100 rounded-full overflow-hidden", size === "sm" ? "h-1.5" : "h-2.5")}>
        <div
          className={cn("h-full rounded-full transition-all duration-500", barColor)}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
