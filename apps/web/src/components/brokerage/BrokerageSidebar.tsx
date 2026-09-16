"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BrandLogo } from "@/components/marketing/BrandLogo";
import { SidebarIcon, type SidebarIconName } from "@/components/organization/OrganizationSidebar";

type BrokerageNavItem = {
  href: string;
  label: string;
  icon: SidebarIconName;
  exact?: boolean;
};

const navItems: BrokerageNavItem[] = [
  { href: "/brokerage", label: "خانه", icon: "home", exact: true },
  { href: "/brokerage/cases", label: "پرونده‌ها", icon: "personnel" },
  { href: "/brokerage/resources-profit", label: "منابع و سود", icon: "plans" },
  { href: "/brokerage/receive-transfer", label: "دریافت و انتقال", icon: "cases" },
  { href: "/brokerage/settings", label: "تنظیمات", icon: "settings" },
];

function isActive(pathname: string, item: BrokerageNavItem) {
  if (item.exact) return pathname === item.href;
  return pathname === item.href || pathname.startsWith(`${item.href}/`);
}

export function BrokerageSidebar() {
  const pathname = usePathname();

  return (
    <aside className="brokerage-sidebar" aria-label="ناوبری پنل کارگزاری">
      <div className="brokerage-sidebar__brand">
        <BrandLogo className="brokerage-sidebar__logo" />
        <div className="brokerage-sidebar__identity">
          <strong>کارگزاری نمونه</strong>
          <span>تیم مدیریت منابع چارخونه</span>
        </div>
      </div>

      <nav className="brokerage-sidebar__nav">
        {navItems.map((item) => {
          const active = isActive(pathname, item);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={[
                "brokerage-sidebar__link",
                active ? "brokerage-sidebar__link--active" : "",
              ]
                .filter(Boolean)
                .join(" ")}
              aria-current={active ? "page" : undefined}
            >
              <span>{item.label}</span>
              <SidebarIcon name={item.icon} />
            </Link>
          );
        })}
      </nav>

      <Link href="/brokerage/login" className="brokerage-sidebar__link brokerage-sidebar__logout">
        <span>خروج از حساب</span>
        <SidebarIcon name="logout" />
      </Link>
    </aside>
  );
}
