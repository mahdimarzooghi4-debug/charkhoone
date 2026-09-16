import type { Metadata } from "next";
import { BrokerageShell } from "@/components/brokerage/BrokerageShell";
import "./brokerage.css";
import "./login.css";

export const metadata: Metadata = {
  title: "پنل کارگزاری | چارخونه",
  description: "مدیریت پرونده‌ها، منابع، سود و انتقالات کارگزاری در چارخونه",
};

export default function BrokerageLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <BrokerageShell>{children}</BrokerageShell>;
}
