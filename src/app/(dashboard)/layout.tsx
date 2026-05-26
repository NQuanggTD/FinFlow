import { createClient } from "@/lib/supabase/server";
import { redirect }     from "next/navigation";
import { Sidebar }      from "@/components/layout/Sidebar";
import { TopBar }       from "@/components/layout/TopBar";
import type { ProfileRow } from "@/types/database";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: profileData } = await (supabase.from("profiles") as any)
    .select("full_name, avatar_url")
    .eq("id", user.id)
    .single();

  const profile = profileData as Pick<ProfileRow, "full_name" | "avatar_url"> | null;

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <TopBar
          email={user.email ?? ""}
          fullName={profile?.full_name ?? null}
          avatarUrl={profile?.avatar_url ?? null}
        />
        <main className="flex-1 overflow-y-auto">
          <div className="p-6 max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
