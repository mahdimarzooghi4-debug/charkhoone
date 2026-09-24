"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import shell from "../../../panel.module.css";
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

function Sidebar() {
  return <aside className={shell.sidebar}><div className={shell.brand}><img className={shell.logo} src={assets.logo} alt="چارخونه" width={127} height={55} /><div className={shell.bankIdentity}><strong>بانک نمونه</strong><span>تیم مدیریت تسهیلات</span></div></div><nav className={shell.nav}><Link href="/bank" className={shell.navItem}><span>خانه</span><img src={assets.home} alt="" /></Link><Link href="/bank/requests" className={shell.navItem}><span>درخواست‌ها</span><img src={assets.requests} alt="" /></Link><Link href="/bank/plans" className={shell.navItem}><span>طرح‌ها</span><img src={assets.plans} alt="" /></Link><Link href="/bank/receive-pay" className={shell.navItem}><span>دریافت و پرداخت</span><img src={assets.payments} alt="" /></Link><Link href="/bank/settings" className={`${shell.navItem} ${shell.navActive}`}><span>تنظیمات</span><img src={assets.settings} alt="" /></Link><Link href="/bank/login" className={`${shell.navItem} ${shell.logout}`}><span>خروج از حساب</span><img src={assets.logout} alt="" /></Link></nav></aside>;
}

function maskMobile(value: string) {
  const digits = value.replace(/\D/g, "");
  if (digits.length < 8) return value;
  const fa = digits.replace(/\d/g, (d) => "۰۱۲۳۴۵۶۷۸۹"[Number(d)]);
  return `${fa.slice(0,4)}•••${fa.slice(-4)}`;
}

export default function BankAddUserPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [mobile, setMobile] = useState("");
  const [role, setRole] = useState<"کارشناس" | "مدیر تیم">("مدیر تیم");
  const [error, setError] = useState("");

  const permissions = role === "مدیر تیم"
    ? ["تنظیمات","دریافت و پرداخت","بررسی درخواست‌ها","مدیریت طرح‌ها","مدیریت کاربران"]
    : ["دریافت و پرداخت","بررسی درخواست‌ها","مشاهده طرح‌ها"];

  const canSubmit = name.trim().length >= 3 && mobile.replace(/\D/g,"").length >= 10;

  function submit() {
    if (!canSubmit) {
      setError("نام و شماره موبایل معتبر را وارد کنید.");
      return;
    }
    setError("");
    const user = {
      name: name.trim(),
      role,
      mobile: maskMobile(mobile),
      last: "همین حالا",
      status: "فعال",
      tone: "active",
    };
    try {
      const raw = window.localStorage.getItem(USER_STORAGE_KEY);
      const current = raw ? JSON.parse(raw) : [];
      const next = Array.isArray(current) ? [user, ...current] : [user];
      window.localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(next));
    } catch {
      window.localStorage.setItem(USER_STORAGE_KEY, JSON.stringify([user]));
    }
    router.push("/bank/settings");
  }

  return (
    <main className={shell.page} data-node-id="289:161" data-name="Bank / Settings / Add User">
      <section className={styles.main}>
        <header className={styles.header}><Link href="/bank/settings" className={styles.back}>‹ بازگشت به تنظیمات</Link><h1>افزودن کاربر بانک</h1><p>ایجاد دسترسی جدید برای یکی از کاربران بانک در پنل چارخونه</p></header>
        <section className={styles.card}>
          <h2>مشخصات کاربر جدید</h2><div className={styles.divider} />
          <div className={styles.formGrid}>
            <label className={styles.field}><span>شماره موبایل</span><input className={styles.input} inputMode="tel" value={mobile} onChange={(e) => setMobile(e.target.value)} placeholder="۰۹۱۲۱۲۳۴۵۶۷" /></label>
            <label className={styles.field}><span>نام و نام خانوادگی</span><input className={styles.input} value={name} onChange={(e) => setName(e.target.value)} placeholder="مثلاً علی رضایی" /></label>
          </div>
          <div className={styles.roleGroup}><span className={styles.roleLabel}>نقش کاربری</span>
            <div className={styles.roles}>
              {(["کارشناس","مدیر تیم"] as const).map((item) => (
                <button key={item} type="button" className={`${styles.role} ${role === item ? styles.roleSelected : ""}`} onClick={() => setRole(item)}>
                  <div className={styles.roleCopy}><h3>{item}</h3><p>{item === "مدیر تیم" ? "دسترسی مدیریتی به کاربران، طرح‌ها، درخواست‌ها، عملیات مالی و تنظیمات" : "دسترسی عملیاتی به درخواست‌ها و پرونده‌های مالی در محدوده مجاز"}</p></div>
                  <span className={`${styles.radio} ${role === item ? styles.radioSelected : ""}`} />
                </button>
              ))}
            </div>
            <span className={styles.helper}>سطح دسترسی براساس نقش انتخاب‌شده تعیین می‌شود.</span>
          </div>
          <div className={styles.preview}><h3>دسترسی‌های این نقش</h3><div className={styles.chips}>{permissions.map((permission) => <span className={styles.chip} key={permission}>{permission}</span>)}</div></div>
          {error && <div className={styles.formError} role="alert">{error}</div>}
          <div className={styles.actions}><Link href="/bank/settings" className={styles.cancel}>انصراف</Link><button type="button" className={styles.submit} onClick={submit}>افزودن کاربر</button></div>
        </section>
      </section>
      <Sidebar />
    </main>
  );
}
