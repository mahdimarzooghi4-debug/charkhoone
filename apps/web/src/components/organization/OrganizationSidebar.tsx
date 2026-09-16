"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BrandLogo } from "@/components/marketing/BrandLogo";

type IconName = "home" | "personnel" | "plans" | "cases" | "payments" | "settings" | "logout";

type NavItem = {
  href: string;
  label: string;
  icon: IconName;
  exact?: boolean;
};

const navItems: NavItem[] = [
  { href: "/organization", label: "خانه", icon: "home", exact: true },
  { href: "/organization/personnel", label: "پرسنل", icon: "personnel" },
  { href: "/organization/bank-plans", label: "طرح‌های بانکی", icon: "plans" },
  { href: "/organization/cases", label: "پرونده‌ها", icon: "cases" },
  { href: "/organization/payments", label: "پرداخت‌ها", icon: "payments" },
  { href: "/organization/settings", label: "تنظیمات", icon: "settings" },
];

function SidebarIcon({ name }: { name: IconName }) {
  const common = {
    width: 18,
    height: 18,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.8,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": true,
  };

  if (name === "home") {
    return (
      <svg {...common}>
        <path d="m3 11 9-8 9 8" />
        <path d="M5 10v10h14V10" />
        <path d="M9 20v-6h6v6" />
      </svg>
    );
  }

  if (name === "personnel" || name === "payments") {
    return (
      <svg {...common}>
        <path d="M6 3h9l3 3v15H6z" />
        <path d="M14 3v4h4" />
        <path d="M9 12h6M9 16h6" />
      </svg>
    );
  }

  if (name === "plans") {
    return (
      <svg {...common}>
        <path d="m12 3 8 4-8 4-8-4 8-4Z" />
        <path d="m4 12 8 4 8-4" />
        <path d="m4 17 8 4 8-4" />
      </svg>
    );
  }

  if (name === "cases") {
    return (
      <svg {...common}>
        <rect x="3" y="6" width="18" height="12" rx="2" />
        <path d="M3 10h18" />
      </svg>
    );
  }

  if (name === "settings") {
    return (
      <svg {...common}>
        <circle cx="12" cy="12" r="3" />
        <path d="M19.4 15a1.7 1.7 0 0 0 .34 1.88l.06.06-2.83 2.83-.06-.06A1.7 1.7 0 0 0 15 19.4a1.7 1.7 0 0 0-1 .6 1.7 1.7 0 0 0-.4 1.1V21H9.6v-.09A1.7 1.7 0 0 0 8.5 19.4a1.7 1.7 0 0 0-1.88.34l-.06.06-2.83-2.83.06-.06A1.7 1.7 0 0 0 4.6 15a1.7 1.7 0 0 0-.6-1 1.7 1.7 0 0 0-1.1-.4H3V9.6h.09A1.7 1.7 0 0 0 4.6 8.5a1.7 1.7 0 0 0-.34-1.88L4.2 6.56l2.83-2.83.06.06A1.7 1.7 0 0 0 9 4.6a1.7 1.7 0 0 0 1-.6 1.7 1.7 0 0 0 .4-1.1V3h4v.09A1.7 1.7 0 0 0 15.5 4.6a1.7 1.7 0 0 0 1.88-.34l.06-.06 2.83 2.83-.06.06A1.7 1.7 0 0 0 19.4 9c.14.38.36.72.66 1 .3.28.68.42 1.1.4H21v4h-.09A1.7 1.7 0 0 0 19.4 15Z" />
      </svg>
    );
  }

  return (
    <svg {...common}>
      <path d="M10 5H5v14h5" />
      <path d="m14 8 4 4-4 4" />
      <path d="M18 12H9" />
    </svg>
  );
}

function isActive(pathname: string, item: NavItem) {
  if (item.exact) return pathname === item.href;
  return pathname === item.href || pathname.startsWith(`${item.href}/`);
}

export function OrganizationSidebar() {
  const pathname = usePathname();

  return (
    <aside className="org-sidebar" aria-label="ناوبری پنل سازمان">
      <div className="org-sidebar__brand">
        <BrandLogo className="org-sidebar__logo" />
        <div className="org-sidebar__identity">
          <strong>سازمان نمونه</strong>
          <span>پنل سازمانی چارخونه</span>
        </div>
      </div>

      <nav className="org-sidebar__nav">
        {navItems.map((item) => {
          const active = isActive(pathname, item);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={["org-sidebar__link", active ? "org-sidebar__link--active" : ""].filter(Boolean).join(" ")}
              aria-current={active ? "page" : undefined}
            >
              <span>{item.label}</span>
              <SidebarIcon name={item.icon} />
            </Link>
          );
        })}
      </nav>

      <Link href="/login" className="org-sidebar__link org-sidebar__logout">
        <span>خروج از حساب</span>
        <SidebarIcon name="logout" />
      </Link>
    </aside>
  );
}
