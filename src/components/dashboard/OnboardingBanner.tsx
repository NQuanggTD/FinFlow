"use client";

import Link from "next/link";

interface Props {
  hasAccounts: boolean;
  hasTransactions: boolean;
}

export function OnboardingBanner({ hasAccounts, hasTransactions }: Props) {
  if (hasAccounts && hasTransactions) return null;

  const steps = [
    {
      done: hasAccounts,
      label: "Tạo tài khoản ngân hàng / tiền mặt",
      href: "/settings",
      icon: "🏦",
    },
    {
      done: hasTransactions,
      label: "Ghi giao dịch đầu tiên",
      href: "/transactions/new",
      icon: "💳",
    },
  ];

  const done = steps.filter((s) => s.done).length;
  const total = steps.length;

  return (
    <div
      className="bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-200 rounded-xl p-5 mb-2"
      suppressHydrationWarning
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <h3 className="font-semibold text-indigo-900">
            🎉 Chào mừng đến với FinFlow!
          </h3>
          <p
            className="text-sm text-indigo-600 mt-0.5"
            suppressHydrationWarning
          >
            Hoàn thành {done}/{total} bước để bắt đầu
          </p>
        </div>
        <span
          className="text-xl font-bold text-indigo-400 ml-4"
          suppressHydrationWarning
        >
          {done}/{total}
        </span>
      </div>

      {/* Progress */}
      <div className="w-full bg-indigo-100 rounded-full h-2 mb-4">
        <div
          className="bg-indigo-500 h-2 rounded-full transition-all duration-500"
          style={{ width: `${(done / total) * 100}%` }}
        />
      </div>

      {/* Steps */}
      <div className="space-y-2">
        {steps.map((step, i) => (
          <div
            key={i}
            className={`flex items-center gap-3 p-3 rounded-lg ${
              step.done ? "bg-green-50" : "bg-white border border-indigo-100"
            }`}
          >
            <span
              className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                step.done
                  ? "bg-green-500 text-white"
                  : "bg-indigo-100 text-indigo-600"
              }`}
            >
              {step.done ? "✓" : i + 1}
            </span>
            <span
              className={`text-sm flex-1 ${step.done ? "line-through text-gray-400" : "text-gray-700"}`}
            >
              {step.icon} {step.label}
            </span>
            {!step.done && (
              <Link
                href={step.href}
                className="text-xs px-3 py-1 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium flex-shrink-0"
              >
                Làm ngay →
              </Link>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
