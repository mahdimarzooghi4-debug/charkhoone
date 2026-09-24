"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import shell from "../../panel.module.css";
import styles from "../page.module.css";

const assets = {
  avatar: "/brand/bank-mark.svg",
  logo: "/brand/dashboard-logo.png",
  check: "",
  lock: "",
  home: "",
  requests: "",
  plans: "",
  payments: "",
  settings: "",
  logout: "",
} as const;

const PLAN_STORAGE_KEY = "charkhoone.bank.preview.plans";

type PlanStatus = "فعال" | "پیش‌نویس" | "غیرفعال";
type Payer = "مستأجر" | "سازمان" | "مشترک";

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

function CheckRow({ children }: { children: string }) {
  return <div className={styles.checkRow}><span className={styles.checkStatus}>تأیید شده</span><span className={styles.checkLabel}>{children}<span className={styles.checkIcon}>✓</span></span></div>;
}

function formatToman(raw: string) {
  const digits = raw.replace(/\D/g, "");
  if (!digits) return "۰ تومان";
  return `${Number(digits).toLocaleString("fa-IR")} تومان`;
}

export default function BankPlanNewPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [type, setType] = useState<"عمومی" | "سازمانی">("عمومی");
  const [organization, setOrganization] = useState("");
  const [maxAmount, setMaxAmount] = useState("500000000");
  const [duration, setDuration] = useState("12");
  const [rate, setRate] = useState("23");
  const [credit, setCredit] = useState("A");
  const [payer, setPayer] = useState<Payer>("مستأجر");
  const [status, setStatus] = useState<PlanStatus>("فعال");

  function savePlan(forcedStatus?: PlanStatus) {
    const finalStatus = forcedStatus ?? status;
    if (!name.trim()) return;

    const row = {
      name: name.trim(),
      org: type === "سازمانی" ? organization.trim() : "",
      type,
      max: formatToman(maxAmount),
      credit: credit.trim().toUpperCase() || "A",
      duration: `${Number(duration || 0).toLocaleString("fa-IR")} ماه`,
      rate: `${Number(rate || 0).toLocaleString("fa-IR")}٪`,
      status: finalStatus,
      tone: finalStatus === "فعال" ? "active" : finalStatus === "پیش‌نویس" ? "draft" : "inactive",
      payer,
    };

    try {
      const raw = window.localStorage.getItem(PLAN_STORAGE_KEY);
      const current = raw ? JSON.parse(raw) : [];
      const next = Array.isArray(current) ? [row, ...current] : [row];
      window.localStorage.setItem(PLAN_STORAGE_KEY, JSON.stringify(next));
    } catch {
      window.localStorage.setItem(PLAN_STORAGE_KEY, JSON.stringify([row]));
    }

    router.push("/bank/plans");
  }

  return (
    <main className={shell.page} data-node-id="270:2" data-name="Bank / Plan Detail">
      <section className={shell.mainContent}>
        <header className={shell.header}>
          <div className={shell.userInfo}><div className={shell.userCopy}><strong>شعبه مرکزی تهران</strong><span>تیم چارخونه بانک</span></div><img className={shell.avatar} src={assets.avatar} alt="" width={40} height={40} /></div>
          <div className={styles.detailHeader}><Link href="/bank/plans" className={styles.backLink}>← بازگشت به طرح‌ها</Link><h1>ایجاد طرح تأمین مالی</h1><p>شرایط طرح را مشخص کنید؛ چارخونه پیش از ارسال پرونده، این شرایط را بررسی می‌کند.</p></div>
        </header>

        <section className={styles.card}><h2>اطلاعات طرح</h2><div className={styles.divider} />
          <div className={styles.fieldGrid2}>
            <label className={styles.field}><span>نام طرح</span><input className={styles.inputLike} value={name} onChange={(e) => setName(e.target.value)} placeholder="نام طرح جدید" /></label>
            <label className={styles.field}><span>نوع طرح</span><select className={styles.inputLike} value={type} onChange={(e) => setType(e.target.value as "عمومی" | "سازمانی")}><option value="عمومی">عمومی</option><option value="سازمانی">سازمانی</option></select></label>
          </div>
          {type === "سازمانی" && <div className={styles.fullField}><label className={styles.field}><span>سازمان</span><input className={styles.inputLike} value={organization} onChange={(e) => setOrganization(e.target.value)} placeholder="نام سازمان" /></label></div>}
        </section>

        <section className={styles.card}><h2>شرایط مالی</h2><div className={styles.divider} />
          <div className={styles.fieldGrid3}>
            <label className={styles.field}><span>حداکثر مبلغ تأمین مالی</span><input className={styles.inputLike} inputMode="numeric" value={maxAmount} onChange={(e) => setMaxAmount(e.target.value)} /></label>
            <label className={styles.field}><span>مدت تأمین مالی (ماه)</span><input className={styles.inputLike} inputMode="numeric" value={duration} onChange={(e) => setDuration(e.target.value)} /></label>
            <label className={styles.field}><span>نرخ سود تسهیلات (%)</span><input className={styles.inputLike} inputMode="decimal" value={rate} onChange={(e) => setRate(e.target.value)} /></label>
          </div>
          <div className={styles.payerBlock}><div className={styles.payerTitle}><span>برای «سازمان» یا «مشترک»، نوع طرح باید سازمانی و سازمان مشخص باشد.</span><strong>پرداخت‌کننده پرداخت ماهانه</strong></div>
            <div className={styles.options}>{(["مشترک","سازمان","مستأجر"] as Payer[]).map((item) => <button key={item} type="button" className={`${styles.option} ${payer === item ? styles.optionActive : ""}`} onClick={() => setPayer(item)}>{item}</button>)}</div>
          </div>
          <span className={styles.helper}>پرداخت ماهانه طبق پرداخت‌کننده انتخاب‌شده انجام می‌شود و سهم بانک به‌صورت ماهانه تسویه می‌شود.</span>
        </section>

        <section className={styles.card}><h2>شرایط پذیرش متقاضی</h2><div className={styles.divider} />
          <div className={styles.fieldGrid2}>
            <label className={styles.field}><span>حداقل رتبه اعتباری</span><select className={styles.inputLike} value={credit} onChange={(e) => setCredit(e.target.value)}><option>A</option><option>B</option><option>C</option></select></label>
            <label className={styles.field}><span>حداکثر مبلغ قابل تأمین براساس رتبه اعتباری</span><input className={styles.inputLike} inputMode="numeric" value={maxAmount} onChange={(e) => setMaxAmount(e.target.value)} /></label>
          </div>
          <span className={styles.helper}>چارخونه رتبه اعتباری متقاضی را پیش از نمایش و انتخاب این طرح بررسی می‌کند.</span><h3 className={styles.subheading}>شرایط تکمیلی</h3><CheckRow>سابقه اعتباری مثبت</CheckRow><div className={styles.infoBox}>فقط پرونده‌هایی که شرایط این طرح را با موفقیت گذرانده‌اند برای بانک ارسال می‌شوند.</div>
        </section>

        <section className={styles.card}><h2>پیش‌شرط تأمین وجه</h2><div className={styles.divider} /><div className={styles.lockRow}><span>🔒</span><span>قاعده ثابت چارخونه - غیرقابل ویرایش</span></div><CheckRow>وجه موردنیاز مستأجر واریز شده باشد.</CheckRow><CheckRow>انتقال وجه مستأجر به حساب کارگزاری همین بانک تأیید شده باشد.</CheckRow><span className={styles.helper}>پس از تأیید این دو مرحله، پرونده برای تصمیم نهایی بانک آماده می‌شود.</span></section>

        <section className={styles.card}><h2>وضعیت طرح</h2><div className={styles.divider} /><div className={styles.statusChips}>{(["فعال","پیش‌نویس","غیرفعال"] as PlanStatus[]).map((item) => <button key={item} type="button" className={`${styles.chip} ${status === item ? styles.chipActive : ""}`} onClick={() => setStatus(item)}>{item}</button>)}</div><span className={styles.helper}>طرح فعال در محاسبات و بررسی واجد شرایط بودن متقاضیان چارخونه استفاده می‌شود.</span></section>

        <div className={styles.actions}>
          <Link href="/bank/plans" className={`${styles.action} ${styles.cancel}`}>انصراف</Link>
          <button type="button" className={`${styles.action} ${styles.draftAction}`} onClick={() => savePlan("پیش‌نویس")} disabled={!name.trim()}>ذخیره پیش‌نویس</button>
          <button type="button" className={`${styles.action} ${styles.primary}`} onClick={() => savePlan("فعال")} disabled={!name.trim()}>ذخیره و فعال‌سازی</button>
        </div>
      </section>
      <Sidebar />
    </main>
  );
}
