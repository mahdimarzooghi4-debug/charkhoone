"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BrandLogo } from "@/components/marketing/BrandLogo";
import { SidebarIcon, type SidebarIconName } from "@/components/organization/OrganizationSidebar";

type AdminNavItem = {
  href: string;
  label: string;
  icon: SidebarIconName;
  exact?: boolean;
};

const navItems: AdminNavItem[] = [
  { href: "/admin", label: "داشبورد", icon: "home", exact: true },
  { href: "/admin/users", label: "کاربران", icon: "personnel" },
  { href: "/admin/cases", label: "پرونده‌ها", icon: "plans" },
  { href: "/admin/payments", label: "پرداخت‌ها", icon: "cases" },
  { href: "/admin/partners", label: "همکاران", icon: "personnel" },
  { href: "/admin/settings", label: "تنظیمات", icon: "settings" },
];

function isActive(pathname: string, item: AdminNavItem) {
  if (item.exact) return pathname === item.href;
  return pathname === item.href || pathname.startsWith(`${item.href}/`);
}

export function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside className="admin-sidebar" aria-label="ناوبری پنل مدیریت">
      <div className="admin-sidebar__brand">
        <BrandLogo className="admin-sidebar__logo" />
        <div className="admin-sidebar__identity">
          <strong>مدیریت چارخونه</strong>
          <span>پنل مدیریت پلتفرم</span>
        </div>
      </div>

      <nav className="admin-sidebar__nav">
        {navItems.map((item) => {
          const active = isActive(pathname, item);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={["admin-sidebar__link", active ? "admin-sidebar__link--active" : ""].filter(Boolean).join(" ")}
              aria-current={active ? "page" : undefined}
            >
              <SidebarIcon name={item.icon} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <Link href="/admin/login" className="admin-sidebar__link admin-sidebar__logout">
        <span>خروج از حساب</span>
        <SidebarIcon name="logout" />
      </Link>
    </aside>
  );
}
