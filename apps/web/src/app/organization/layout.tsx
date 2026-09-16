import type { Metadata } from "next";
import { OrganizationShell } from "@/components/organization/OrganizationShell";
import "./organization.css";
import "./personnel.css";
import "./organization-personnel.css";
import "./bank-plans.css";
import "./cases.css";
import "./payments.css";
import "./settings.css";
import "./users.css";
import "./login.css";

export const metadata: Metadata = {
  title: "پنل سازمان | چارخونه",
  description: "مدیریت پرسنل، طرح‌های بانکی، پرونده‌ها و پرداخت‌های سازمان در چارخونه",
};

export default function OrganizationLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <OrganizationShell>{children}</OrganizationShell>;
}
