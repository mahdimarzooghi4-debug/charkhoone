"use client";

import { usePathname } from "next/navigation";
import { OrganizationSidebar } from "@/components/organization/OrganizationSidebar";

export function OrganizationShell({ children }: Readonly<{ children: React.ReactNode }>) {
  const pathname = usePathname();
  const isAuthRoute = pathname === "/organization/login" || pathname.startsWith("/organization/login/");

  if (isAuthRoute) {
    return <main className="org-auth-shell">{children}</main>;
  }

  return (
    <div className="org-shell">
      <main className="org-shell__main">{children}</main>
      <OrganizationSidebar />
    </div>
  );
}
