"use client";

import { forwardRef } from "react";
import { cn } from "@/lib/utils/cn";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  leftAddon?: React.ReactNode;
  rightAddon?: React.ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, hint, leftAddon, rightAddon, className, id, ...props }, ref) => {
    const inputId = id ?? label?.toLowerCase().replace(/\s+/g, "-");
    return (
      <div className="w-full">
        {label && (
          <label htmlFor={inputId} className="block text-sm font-medium text-gray-700 mb-1.5">
            {label}
            {props.required && <span className="text-red-500 ml-0.5">*</span>}
          </label>
        )}
        <div className="relative flex items-center">
          {leftAddon && (
            <span className="absolute left-3 text-gray-400 text-sm pointer-events-none">{leftAddon}</span>
          )}
          <input
            ref={ref}
            id={inputId}
            className={cn(
              "w-full rounded-lg border bg-white text-gray-900 text-sm transition-colors",
              "placeholder:text-gray-400",
              "focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent",
              "disabled:bg-gray-50 disabled:text-gray-400 disabled:cursor-not-allowed",
              error ? "border-red-400 focus:ring-red-400" : "border-gray-300",
              leftAddon ? "pl-9" : "pl-3.5",
              rightAddon ? "pr-9" : "pr-3.5",
              "py-2.5",
              className
            )}
            {...props}
          />
          {rightAddon && (
            <span className="absolute right-3 text-gray-400 text-sm">{rightAddon}</span>
          )}
        </div>
        {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
        {hint && !error && <p className="mt-1 text-xs text-gray-400">{hint}</p>}
      </div>
    );
  }
);
Input.displayName = "Input";
