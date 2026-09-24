"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import shell from "../panel.module.css";
import styles from "./page.module.css";

const assets = {
  avatar: "/brand/bank-mark.svg",
  logo: "/brand/dashboard-logo.png",
  home: "",
  requests: "",
  plans: "",
  payments: "",
  settings: "",
  logout: "",
} as const;

const PLAN_STORAGE_KEY = "charkhoone.bank.preview.plans";
const PLAN_OVERRIDE_KEY = "charkhoone.bank.preview.plan1";

type PlanRow = {
  name: string;
  org: string;
  type: string;
  max: string;
  credit: string;
  duration: string;
  rate: string;
  status: "فعال" | "پیش‌نویس" | "غیرفعال";
  tone: "active" | "draft" | "inactive";
};

const baseRows: PlanRow[] = [
  { name: "طرح مسکن ویژه", org: "", type: "عمومی", max: "۵۰۰٬۰۰۰٬۰۰۰ تومان", credit: "A", duration: "۱۲ ماه", rate: "۲۳٪", status: "فعال", tone: "active" },
  { name: "طرح اجاره به شرط تملیک", org: "سازمان نمونه", type: "سازمانی", max: "۳۵۰٬۰۰۰٬۰۰۰ تومان", credit: "B", duration: "۱۲ ماه", rate: "۲۱٪", status: "فعال", tone: "active" },
  { name: "طرح مسکن جوانان", org: "", type: "عمومی", max: "۲۸۰٬۰۰۰٬۰۰۰ تومان", credit: "A", duration: "۱۲ ماه", rate: "۲۰٪", status: "فعال", tone: "active" },
  { name: "طرح حمایت کارمندان", org: "بانک مرکزی", type: "سازمانی", max: "۶۰۰٬۰۰۰٬۰۰۰ تومان", credit: "B", duration: "۱۲ ماه", rate: "۱۸٪", status: "پیش‌نویس", tone: "draft" },
  { name: "طرح ویژه بازنشستگان", org: "صندوق بازنشستگی", type: "سازمانی", max: "۴۰۰٬۰۰۰٬۰۰۰ تومان", credit: "C", duration: "۱۲ ماه", rate: "۲۲٪", status: "غیرفعال", tone: "inactive" },
];

function Sidebar() {
  return (
    <aside className={shell.sidebar}>
      <div className={shell.brand}><img className={shell.logo} src={assets.logo} alt="چارخونه" width={127} height={55} /><div className={shell.bankIdentity}><strong>بانک نمونه</strong><span>تیم مدیریت تسهیلات</span></div></div>
      <nav className={shell.nav}>
        <Link href="/bank" className={shell.navItem}><span>خانه</span><img src={assets.home} alt="" /></Link>
        <Link href="/bank/requests" className={shell.navItem}><span>درخواست‌ها</span><img src={assets.requests} alt="" /></Link>
        <Link href="/bank/plans" className={`${shell.navItem} ${shell.navActive}`}><span>طرح‌ها</span><img src={assets.plans} alt="" /></Link>
        <Link href="/bank/receive-pay" className={shell.navItem}><span>دریافت و پرداخت</span><img src={assets.payments} alt="" /></Link>
        <Link href="/bank/settings" className={shell.navItem}><span>تنظیمات</span><img src={assets.settings} alt="" /></Link>
        <Link href="/bank/login" className={`${shell.navItem} ${shell.logout}`}><span>خروج از حساب</span><img src={assets.logout} alt="" /></Link>
      </nav>
    </aside>
  );
}

export default function BankPlansPage() {
  const [savedRows, setSavedRows] = useState<PlanRow[]>([]);
  const [baseOverride, setBaseOverride] = useState<PlanRow | null>(null);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<"همه" | PlanRow["status"]>("همه");

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(PLAN_STORAGE_KEY);
      const parsed = raw ? JSON.parse(raw) : [];
      if (Array.isArray(parsed)) setSavedRows(parsed as PlanRow[]);
      const overrideRaw = window.localStorage.getItem(PLAN_OVERRIDE_KEY);
      if (overrideRaw) {
        const override = JSON.parse(overrideRaw);
        if (override && typeof override === "object") setBaseOverride(override as PlanRow);
      }
    } catch {
      setSavedRows([]);
    }
  }, []);

  const rows = useMemo(() => [...savedRows, baseOverride ?? baseRows[0], ...baseRows.slice(1)], [savedRows, baseOverride]);
  const visibleRows = useMemo(() => rows.filter((row) => {
    const matchesQuery = !query.trim() || row.name.includes(query.trim()) || row.org.includes(query.trim());
    const matchesFilter = filter === "همه" || row.status === filter;
    return matchesQuery && matchesFilter;
  }), [rows, query, filter]);

  const counts = {
    همه: rows.length,
    فعال: rows.filter((row) => row.status === "فعال").length,
    "پیش‌نویس": rows.filter((row) => row.status === "پیش‌نویس").length,
    غیرفعال: rows.filter((row) => row.status === "غیرفعال").length,
  };

  return (
    <main className={shell.page} data-node-id="274:2" data-name="Bank / Plans">
      <section className={shell.mainContent}>
        <header className={shell.header}>
          <div className={styles.headerLeft}>
            <Link href="/bank/plans/new" className={styles.createButton}>ایجاد طرح جدید</Link>
            <div className={shell.userInfo}><div className={shell.userCopy}><strong>شعبه مرکزی تهران</strong><span>تیم چارخونه بانک</span></div><img className={shell.avatar} src={assets.avatar} alt="" width={40} height={40} /></div>
          </div>
          <div className={shell.headerCopy}><h1>طرح‌ها</h1><p>مدیریت طرح‌های تأمین مالی بانک در چارخونه</p></div>
        </header>

        <section className={styles.kpis}>
          <div className={styles.kpi}><span>طرح‌های سازمانی</span><strong>{rows.filter((row) => row.type === "سازمانی").length.toLocaleString("fa-IR")} طرح</strong></div>
          <div className={styles.kpi}><span>طرح عمومی</span><strong>{rows.filter((row) => row.type === "عمومی").length.toLocaleString("fa-IR")} طرح</strong></div>
          <div className={styles.kpi}><span>طرح‌های فعال</span><strong>{counts["فعال"].toLocaleString("fa-IR")} طرح</strong></div>
        </section>

        <div className={styles.toolbar}>
          <label className={styles.search}>
            <input
              className={styles.searchInput}
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="جستجوی نام طرح یا سازمان"
              aria-label="جستجوی نام طرح یا سازمان"
            />
            <span aria-hidden="true">⌕</span>
          </label>
          <div className={styles.filters} aria-label="فیلتر وضعیت طرح‌ها">
            {(["همه", "فعال", "پیش‌نویس", "غیرفعال"] as const).map((item) => (
              <button
                key={item}
                type="button"
                className={`${styles.filter} ${filter === item ? styles.filterActive : ""}`}
                onClick={() => setFilter(item)}
                aria-pressed={filter === item}
              >
                <span className={styles.filterBadge}>{item}</span>{counts[item].toLocaleString("fa-IR")}
              </button>
            ))}
          </div>
        </div>

        <section className={styles.tableWrap}>
          <div className={styles.table}>
            <div className={styles.tableHeader}><span>اقدام</span><span>وضعیت</span><span>نرخ سود</span><span>مدت</span><span>حداقل رتبه اعتباری</span><span>سقف تأمین مالی</span><span>نوع</span><span>نام طرح</span></div>
            {visibleRows.map((row) => (
              <div className={styles.tableRow} key={`${row.name}-${row.org}-${row.rate}`}>
                <Link href="/bank/plans/1" className={styles.viewButton}>مشاهده</Link>
                <span className={`${styles.status} ${styles[row.tone]}`}>{row.status}</span>
                <span>{row.rate}</span><span>{row.duration}</span><span>{row.credit}</span><span>{row.max}</span><span>{row.type}</span>
                <span className={styles.nameCell}><strong>{row.name}</strong>{row.org ? <small>{row.org}</small> : null}</span>
              </div>
            ))}
            {visibleRows.length === 0 && <div className={styles.emptyState}>طرحی با این فیلتر پیدا نشد.</div>}
          </div>
        </section>
      </section>
      <Sidebar />
    </main>
  );
}
