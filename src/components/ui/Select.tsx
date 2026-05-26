"use client";

import { forwardRef } from "react";
import { cn } from "@/lib/utils/cn";

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?:       string;
  error?:       string;
  hint?:        string;
  options:      { value: string | number; label: string }[];
  placeholder?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, hint, options, placeholder, className, id, required, ...props }, ref) => {
    const selectId = id ?? label?.toLowerCase().replace(/\s+/g, "-");
    return (
      <div className="w-full">
        {label && (
          <label htmlFor={selectId} className="block text-sm font-medium text-gray-700 mb-1.5">
            {label}
            {required && <span className="text-red-500 ml-0.5">*</span>}
          </label>
        )}
        <select
          ref={ref}
          id={selectId}
          required={required}
          className={cn(
            "w-full rounded-lg border bg-white text-gray-900 text-sm py-2.5 px-3.5 appearance-none",
            "focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent",
            "disabled:bg-gray-50 disabled:text-gray-400 disabled:cursor-not-allowed",
            "bg-[url(\"data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3E%3Cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='m6 8 4 4 4-4'/%3E%3C/svg%3E\")] bg-[position:right_0.75rem_center] bg-[size:1.25em] pr-10",
            error ? "border-red-400" : "border-gray-300",
            className
          )}
          {...props}
        >
          {placeholder && (
            <option value="" disabled>
              {placeholder}
            </option>
          )}
          {options.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
        {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
        {hint && !error && <p className="mt-1 text-xs text-gray-400">{hint}</p>}
      </div>
    );
  }
);
Select.displayName = "Select";
