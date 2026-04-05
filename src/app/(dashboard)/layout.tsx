import type { ReactNode } from "react";
import { redirect } from "next/navigation";

import { createSupabaseServerClient } from "@/adapters/supabase/client-server";
import { ensureUserContext } from "@/app/services/auth/ensure-user-context";
import { DashboardShell } from "@/web/components/layout/dashboard-shell";

type DashboardLayoutProps = {
  children: ReactNode;
};

export default async function DashboardLayout({
  children,
}: DashboardLayoutProps) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  await ensureUserContext(user);

  return (
    <DashboardShell userEmail={user.email ?? "Usuario autenticado"}>
      {children}
    </DashboardShell>
  );
}
