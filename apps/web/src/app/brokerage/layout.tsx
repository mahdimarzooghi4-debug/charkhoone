import type { Metadata } from "next";
import { BrokerageSidebar } from "@/components/brokerage/BrokerageSidebar";
import "./brokerage.css";

export const metadata: Metadata = {
  title: "پنل کارگزاری | چارخونه",
  description: "مدیریت پرونده‌ها، منابع، سود و انتقالات کارگزاری در چارخونه",
};

export default function BrokerageLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="brokerage-shell">
      <main className="brokerage-shell__main">{children}</main>
      <BrokerageSidebar />
    </div>
  );
}
