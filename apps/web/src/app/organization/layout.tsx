import type { Metadata } from "next";
import { OrganizationSidebar } from "@/components/organization/OrganizationSidebar";
import "./organization.css";
import "./personnel.css";
import "./organization-personnel.css";
import "./bank-plans.css";
import "./cases.css";

export const metadata: Metadata = {
  title: "پنل سازمان | چارخونه",
  description: "مدیریت پرسنل، طرح‌های بانکی، پرونده‌ها و پرداخت‌های سازمان در چارخونه",
};

export default function OrganizationLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="org-shell">
      <main className="org-shell__main">{children}</main>
      <OrganizationSidebar />
    </div>
  );
}
