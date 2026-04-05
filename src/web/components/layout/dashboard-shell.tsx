import type { ReactNode } from "react";

import { DashboardSidebar } from "@/web/components/layout/dashboard-sidebar";
import { DashboardTopbar } from "@/web/components/layout/dashboard-topbar";

type DashboardShellProps = {
  children: ReactNode;
  userEmail: string;
};

export function DashboardShell({ children, userEmail }: DashboardShellProps) {
  return (
    <div className="min-h-screen bg-transparent p-4 text-foreground sm:p-6">
      <div className="mx-auto flex min-h-[calc(100vh-2rem)] max-w-[1680px] gap-4 lg:min-h-[calc(100vh-3rem)] lg:gap-6">
        <div className="hidden shrink-0 lg:block">
          <DashboardSidebar />
        </div>
        <div className="flex min-w-0 flex-1 flex-col gap-4 lg:gap-6">
          <DashboardTopbar userEmail={userEmail} />
          <main className="flex-1">{children}</main>
        </div>
      </div>
    </div>
  );
}
