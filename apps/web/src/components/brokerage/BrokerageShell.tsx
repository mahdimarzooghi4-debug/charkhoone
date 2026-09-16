"use client";

import { usePathname } from "next/navigation";
import { BrokerageSidebar } from "@/components/brokerage/BrokerageSidebar";

export function BrokerageShell({ children }: Readonly<{ children: React.ReactNode }>) {
  const pathname = usePathname();
  const isAuthRoute = pathname === "/brokerage/login" || pathname.startsWith("/brokerage/login/");

  if (isAuthRoute) {
    return <main className="brokerage-auth-shell">{children}</main>;
  }

  return (
    <div className="brokerage-shell">
      <main className="brokerage-shell__main">{children}</main>
      <BrokerageSidebar />
    </div>
  );
}
