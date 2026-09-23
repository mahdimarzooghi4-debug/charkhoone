"use client";

import { usePathname } from "next/navigation";
import { AdminSidebar } from "@/components/admin/AdminSidebar";

export function AdminShell({ children }: Readonly<{ children: React.ReactNode }>) {
  const pathname = usePathname();
  const isAuthRoute = pathname === "/admin/login" || pathname.startsWith("/admin/login/");

  if (isAuthRoute) {
    return <main className="admin-auth-shell">{children}</main>;
  }

  return (
    <div className="admin-shell">
      <main className="admin-shell__main" lang="fa" dir="rtl">{children}</main>
      <AdminSidebar />
    </div>
  );
}
