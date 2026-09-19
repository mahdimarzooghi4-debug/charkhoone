"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { UserPanelExit } from "./UserPanelExit";
import styles from "./UserPanelSidebar.module.css";

type Section = "home" | "contracts" | "payments" | "account";

const navItems: readonly { key: Section; label: string; href: string; icon: string }[] = [
  { key: "home", label: "خانه", href: "/user/home", icon: "/brand/dashboard-nav-home.svg" },
  { key: "contracts", label: "قراردادها", href: "/user/contracts", icon: "/brand/dashboard-nav-file.svg" },
  { key: "payments", label: "دریافت و پرداخت", href: "/user/receive-pay", icon: "/brand/dashboard-nav-card.svg" },
  { key: "account", label: "حساب من", href: "/user/account", icon: "/brand/dashboard-nav-user.svg" },
];

function sectionFor(path: string): Section {
  if (path === "/user/contracts" || path.startsWith("/user/contracts/")) return "contracts";
  if (path === "/user/receive-pay" || path.startsWith("/user/receive-pay/")) return "payments";
  if (path === "/user/account" || path.startsWith("/user/account/")) return "account";
  return "home"; // /user/home, /user/properties and /user/calculator
}

/** Single visual sidebar for all owner/tenant web preview pages and account dialogs. */
export function UserPanelSidebar({
  nodeId,
  name,
  hideOnMobile = false,
}: {
  nodeId?: string;
  name?: string;
  hideOnMobile?: boolean;
}) {
  const activeSection = sectionFor(usePathname() ?? "/user/home");

  return (
    <aside
      className={`${styles.sidebar} ${hideOnMobile ? styles.hideOnMobile : ""}`}
      data-node-id={nodeId}
      data-name={name}
    >
      <div className={styles.sidebarTop}>
        <div className={styles.logoWrap}>
          <img src="/brand/dashboard-logo.png" alt="چارخونه" width={200} height={86} />
        </div>
        <nav className={styles.nav} aria-label="ناوبری حساب کاربری">
          {navItems.map(({ key, href, label, icon }) => {
            const selected = activeSection === key;
            return (
              <Link
                key={key}
                href={href}
                aria-current={selected ? "page" : undefined}
                className={`${styles.navItem} ${selected ? styles.navItemActive : ""}`}
              >
                <span className={styles.navSpacer} aria-hidden="true" />
                <span className={styles.navText}>{label}</span>
                <img src={icon} alt="" width={20} height={20} />
              </Link>
            );
          })}
        </nav>
      </div>
      <UserPanelExit />
    </aside>
  );
}
