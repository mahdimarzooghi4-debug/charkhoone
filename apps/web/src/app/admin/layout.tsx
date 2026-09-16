import type { Metadata } from "next";
import { AdminShell } from "@/components/admin/AdminShell";
import "./admin.css";
import "./users.css";

export const metadata: Metadata = {
  title: "پنل مدیریت | چارخونه",
  description: "مدیریت کاربران، پرونده‌ها، پرداخت‌ها، همکاران و سرویس‌های چارخونه",
};

export default function AdminLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <AdminShell>{children}</AdminShell>;
}
