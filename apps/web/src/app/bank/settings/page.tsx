"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import shell from "../panel.module.css";
import styles from "./page.module.css";

const assets = {
  logo: "/brand/dashboard-logo.png",
  home: "",
  requests: "",
  plans: "",
  payments: "",
  settings: "",
  logout: "",
} as const;

const USER_STORAGE_KEY = "charkhoone.bank.preview.users";
const BANK_INFO_KEY = "charkhoone.bank.preview.info";

type BankUser = {
  name: string;
  role: string;
  mobile: string;
  last: string;
  status: "فعال" | "غیرفعال";
  tone: "active" | "inactive";
};

const baseUsers: BankUser[] = [
  { name:"علی رضایی", role:"مدیر تیم", mobile:"۰۹۱۲•••۱۲۳۴", last:"امروز، ۱۰:۴۵", status:"فعال", tone:"active" },
  { name:"مریم احمدی", role:"کارشناس", mobile:"۰۹۱۲•••۵۶۷۸", last:"دیروز، ۱۶:۲۰", status:"فعال", tone:"active" },
  { name:"حسین کریمی", role:"کارشناس", mobile:"۰۹۱۲•••۹۸۷۶", last:"۵ روز پیش", status:"غیرفعال", tone:"inactive" },
];

const connections = [
  ["خدمات بانکی","اجرای عملیات بانکی سیستمی فعال است.","متصل"],
  ["کارگزاری بانک","ارتباط با کارگزاری همین بانک برقرار است.","متصل"],
  ["دریافت وضعیت تراکنش‌ها","نتیجه و وضعیت تراکنش‌ها به‌صورت سیستمی دریافت می‌شود.","فعال"],
  ["اجرای تراکنش‌های سیستمی","عملیات مالی مجاز از داخل پنل انجام می‌شود.","فعال"],
] as const;

function Sidebar() {
  return <aside className={shell.sidebar}><div className={shell.brand}><img className={shell.logo} src={assets.logo} alt="چارخونه" width={127} height={55} /><div className={shell.bankIdentity}><strong>بانک نمونه</strong><span>تیم مدیریت تسهیلات</span></div></div><nav className={shell.nav}><Link href="/bank" className={shell.navItem}><span>خانه</span><img src={assets.home} alt="" /></Link><Link href="/bank/requests" className={shell.navItem}><span>درخواست‌ها</span><img src={assets.requests} alt="" /></Link><Link href="/bank/plans" className={shell.navItem}><span>طرح‌ها</span><img src={assets.plans} alt="" /></Link><Link href="/bank/receive-pay" className={shell.navItem}><span>دریافت و پرداخت</span><img src={assets.payments} alt="" /></Link><Link href="/bank/settings" className={`${shell.navItem} ${shell.navActive}`}><span>تنظیمات</span><img src={assets.settings} alt="" /></Link><Link href="/bank/login" className={`${shell.navItem} ${shell.logout}`}><span>خروج از حساب</span><img src={assets.logout} alt="" /></Link></nav></aside>;
}

export default function BankSettingsPage() {
  const [savedUsers, setSavedUsers] = useState<BankUser[]>([]);
  const [bankName, setBankName] = useState("بانک نمونه");
  const [teamName, setTeamName] = useState("تیم مدیریت تسهیلات");
  const [unit, setUnit] = useState("مدیریت تسهیلات");
  const [branchName, setBranchName] = useState("شعبه مرکزی تهران");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    try {
      const rawUsers = window.localStorage.getItem(USER_STORAGE_KEY);
      const parsedUsers = rawUsers ? JSON.parse(rawUsers) : [];
      if (Array.isArray(parsedUsers)) setSavedUsers(parsedUsers as BankUser[]);

      const rawInfo = window.localStorage.getItem(BANK_INFO_KEY);
      if (rawInfo) {
        const info = JSON.parse(rawInfo);
        if (info && typeof info === "object") {
          setBankName(String(info.bankName ?? "بانک نمونه"));
          setTeamName(String(info.teamName ?? "تیم مدیریت تسهیلات"));
          setUnit(String(info.unit ?? "مدیریت تسهیلات"));
          setBranchName(String(info.branchName ?? "شعبه مرکزی تهران"));
        }
      }
    } catch {
      setSavedUsers([]);
    }
  }, []);

  const users = useMemo(() => [...savedUsers, ...baseUsers], [savedUsers]);

  function saveBankInfo() {
    window.localStorage.setItem(BANK_INFO_KEY, JSON.stringify({ bankName, teamName, unit, branchName }));
    setSaved(true);
    window.setTimeout(() => setSaved(false), 1800);
  }

  return (
    <main className={shell.page} data-node-id="284:601" data-name="Bank / Settings">
      <section className={styles.main}>
        <header className={styles.header}><h1>تنظیمات</h1><p>مدیریت اطلاعات بانک، کاربران و دسترسی‌های پنل چارخونه</p></header>

        <section className={styles.card}>
          <h2>اطلاعات بانک</h2><div className={styles.divider} />
          <div className={styles.formGrid}>
            <label className={styles.field}><span>واحد مسئول</span><input className={styles.input} value={unit} onChange={(e) => setUnit(e.target.value)} /></label>
            <label className={styles.field}><span>نام بانک</span><input className={styles.input} value={bankName} onChange={(e) => setBankName(e.target.value)} /></label>
            <label className={styles.field}><span>نام تیم</span><input className={styles.input} value={teamName} onChange={(e) => setTeamName(e.target.value)} /></label>
            <label className={styles.field}><span>شعبه / واحد</span><input className={styles.input} value={branchName} onChange={(e) => setBranchName(e.target.value)} /></label>
          </div>
          <button type="button" className={styles.save} onClick={saveBankInfo}>{saved ? "ذخیره شد ✓" : "ذخیره تغییرات"}</button>
        </section>

        <section className={`${styles.card} ${styles.users}`}>
          <div className={styles.usersTop}><Link href="/bank/settings/users/new" className={styles.addButton}>+ افزودن کاربر</Link><div className={styles.usersTitle}><h2>کاربران بانک</h2><span>مدیریت کاربران دارای دسترسی به پنل چارخونه</span></div></div>
          <div className={styles.tableWrap}><div className={styles.table}><div className={styles.tableHeader}><span>اقدام</span><span>وضعیت</span><span>آخرین فعالیت</span><span>شماره موبایل</span><span>نقش</span><span>نام</span></div>{users.map((user,index) => <div className={styles.tableRow} key={`${user.name}-${user.mobile}-${index}`}><Link href="/bank/settings/users/1" className={styles.manage}>مدیریت</Link><span className={user.tone === "active" ? styles.activeBadge : styles.inactiveBadge}>{user.status}</span><span className={styles.muted}>{user.last}</span><span className={styles.muted}>{user.mobile}</span><span className={styles.value}>{user.role}</span><span className={styles.name}>{user.name}</span></div>)}</div></div>
        </section>

        <section className={styles.card}><h2>سطح دسترسی</h2><div className={styles.divider} /><div className={styles.roles}><div className={styles.role}><span className={styles.roleBadge}>کارشناس</span><p>دسترسی عملیاتی به درخواست‌ها و پرونده‌های مالی در محدوده مجاز</p></div><div className={styles.role}><span className={styles.roleBadge}>مدیر تیم</span><p>دسترسی مدیریتی به کاربران، طرح‌ها، درخواست‌ها، عملیات مالی و تنظیمات</p></div></div></section>

        <section className={`${styles.card} ${styles.connections}`}><h2>اتصال‌های سیستمی</h2><p className={styles.connectionLead}>وضعیت سرویس‌های موردنیاز برای عملیات مالی</p><Link href="/bank/settings/api" className={styles.apiButton}>اتصال API</Link><div className={styles.divider} />{connections.map(([title,desc,badge]) => <div className={styles.connectionRow} key={title}><span className={styles.greenBadge}>{badge}</span><div className={styles.connCopy}><strong>{title}</strong><span>{desc}</span></div></div>)}</section>

        <section className={styles.card}><h2>امنیت و ثبت فعالیت</h2><div className={styles.divider} /><div className={styles.connectionRow}><span className={styles.greenBadge}>فعال</span><div className={styles.connCopy}><strong>ثبت فعالیت کاربران</strong><span>اقدامات مهم کاربران بانک همراه با نام کاربر، زمان و نوع عملیات در سیستم ثبت می‌شود.</span></div></div><div className={styles.connectionRow}><span className={styles.greenBadge}>فعال</span><div className={styles.connCopy}><strong>ثبت عملیات مالی</strong><span>اجرای عملیات مالی و نتیجه تراکنش‌ها به‌صورت سیستمی ثبت می‌شود.</span></div></div></section>
      </section>
      <Sidebar />
    </main>
  );
}
