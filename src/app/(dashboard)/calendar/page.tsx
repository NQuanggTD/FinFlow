// src/app/(dashboard)/calendar/page.tsx
import type { Metadata } from "next";
import { redirect }      from "next/navigation";
import { createClient }  from "@/lib/supabase/server";
import { CalendarView }  from "@/components/calendar/CalendarView";

export const metadata: Metadata = { title: "Lịch giao dịch – FinFlow" };

/**
 * Server component: only responsible for auth-gating and passing
 * the authenticated userId down to the fully-client CalendarView.
 *
 * All data fetching (and Supabase Realtime) now lives client-side so
 * that month navigation triggers fresh React-Query fetches automatically.
 */
export default async function CalendarPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const now = new Date();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Lịch giao dịch</h1>
        <p className="text-gray-500 text-sm mt-0.5">
          Xem và theo dõi chi tiêu theo từng ngày
        </p>
      </div>

      {/*
        CalendarView is a "use client" component.
        It owns month/year state, React-Query fetching, and Realtime subscriptions.
      */}
      <CalendarView
        userId={user.id}
        initialMonth={now.getMonth() + 1}
        initialYear={now.getFullYear()}
      />
    </div>
  );
}
