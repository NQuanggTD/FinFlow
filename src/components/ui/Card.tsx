import { cn } from "@/lib/utils/cn";
import type { CSSProperties } from "react";

interface CardProps {
  children:  React.ReactNode;
  className?: string;
  style?:     CSSProperties;
  padding?:   "none" | "sm" | "md" | "lg";
  hover?:     boolean;
}

const paddingMap = { none: "", sm: "p-4", md: "p-6", lg: "p-8" };

export function Card({ children, className, style, padding = "md", hover = false }: CardProps) {
  return (
    <div
      className={cn(
        "bg-white rounded-xl shadow-sm border border-gray-100",
        paddingMap[padding],
        hover && "hover:shadow-md hover:border-indigo-100 transition-all duration-200 cursor-pointer",
        className
      )}
      style={style}
    >
      {children}
    </div>
  );
}

export function CardHeader({
  title, subtitle, action,
}: {
  title:     string;
  subtitle?: string;
  action?:   React.ReactNode;
}) {
  return (
    <div className="flex items-start justify-between mb-5">
      <div>
        <h3 className="font-semibold text-gray-900">{title}</h3>
        {subtitle && <p className="text-xs text-gray-400 mt-0.5">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}
