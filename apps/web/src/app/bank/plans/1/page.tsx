"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import shell from "../../panel.module.css";
import styles from "../page.module.css";
import local from "./page.module.css";

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

const PLAN_OVERRIDE_KEY = "charkhoone.bank.preview.plan1";

type PlanStatus = "فعال" | "پیش‌نویس" | "غیرفعال";
type Payer = "مستأجر" | "سازمان" | "مشترک";

function Sidebar() {
  return <aside className={shell.sidebar}><div className={shell.brand}><img className={shell.logo} src={assets.logo} alt="چارخونه" width={127} height={55} /><div className={shell.bankIdentity}><strong>بانک نمونه</strong><span>تیم مدیریت تسهیلات</span></div></div><nav className={shell.nav}><Link href="/bank" className={shell.navItem}><span>خانه</span><img src={assets.home} alt="" /></Link><Link href="/bank/requests" className={shell.navItem}><span>درخواست‌ها</span><img src={assets.requests} alt="" /></Link><Link href="/bank/plans" className={`${shell.navItem} ${shell.navActive}`}><span>طرح‌ها</span><img src={assets.plans} alt="" /></Link><Link href="/bank/receive-pay" className={shell.navItem}><span>دریافت و پرداخت</span><img src={assets.payments} alt="" /></Link><Link href="/bank/settings" className={shell.navItem}><span>تنظیمات</span><img src={assets.settings} alt="" /></Link><Link href="/bank/login" className={`${shell.navItem} ${shell.logout}`}><span>خروج از حساب</span><img src={assets.logout} alt="" /></Link></nav></aside>;
}

function CheckRow({ children }: { children: string }) {
  return <div className={styles.checkRow}><span className={styles.checkStatus}>تأیید شده</span><span className={styles.checkLabel}>{children}<span className={styles.checkIcon} /></span></div>;
}

function toLatinDigits(value: string) {
  return value
    .replace(/[۰-۹]/g, (digit) => String("۰۱۲۳۴۵۶۷۸۹".indexOf(digit)))
    .replace(/[٠-٩]/g, (digit) => String("٠١٢٣٤٥٦٧٨٩".indexOf(digit)));
}

function numberOnly(value: string) {
  return toLatinDigits(value).replace(/\D/g, "");
}

function formatToman(value: string) {
  const numeric = numberOnly(value);
  return `${Number(numeric || 0).toLocaleString("fa-IR")} تومان`;
}

export default function BankExistingPlanPage() {
  const router = useRouter();
  const [name, setName] = useState("طرح مسکن ویژه");
  const [type, setType] = useState<"عمومی" | "سازمانی">("عمومی");
  const [organization, setOrganization] = useState("");
  const [maxAmount, setMaxAmount] = useState("500000000");
  const [duration, setDuration] = useState("12");
  const [rate, setRate] = useState("23");
  const [credit, setCredit] = useState("A");
  const [payer, setPayer] = useState<Payer>("مستأجر");
  const [status, setStatus] = useState<PlanStatus>("فعال");
  const [error, setError] = useState("");

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(PLAN_OVERRIDE_KEY);
      if (!raw) return;
      const saved = JSON.parse(raw);
      if (!saved || typeof saved !== "object") return;
      setName(String(saved.name ?? "طرح مسکن ویژه"));
      setType(saved.type === "سازمانی" ? "سازمانی" : "عمومی");
      setOrganization(String(saved.org ?? ""));
      setCredit(String(saved.credit ?? "A"));
      setStatus(saved.status === "پیش‌نویس" || saved.status === "غیرفعال" ? saved.status : "فعال");
      const max = String(saved.max ?? "").replace(/[^۰-۹0-9]/g, "");
      const dur = String(saved.duration ?? "").replace(/[^۰-۹0-9]/g, "");
      const rt = String(saved.rate ?? "").replace(/[^۰-۹0-9]/g, "");
      if (max) setMaxAmount(toLatinDigits(max));
      if (dur) setDuration(toLatinDigits(dur));
      if (rt) setRate(toLatinDigits(rt));
    } catch {
      // Keep approved fixture defaults if the preview override is unreadable.
    }
  }, []);

  function save() {
    if (!name.trim()) {
      setError("نام طرح را وارد کنید.");
      return;
    }
    if (type === "سازمانی" && !organization.trim()) {
      setError("برای طرح سازمانی، نام سازمان را وارد کنید.");
      return;
    }
    setError("");
    const row = {
      name: name.trim(),
      org: type === "سازمانی" ? organization.trim() : "",
      type,
      max: formatToman(maxAmount),
      credit,
      duration: `${Number(numberOnly(duration) || 0).toLocaleString("fa-IR")} ماه`,
      rate: `${Number(numberOnly(rate) || 0).toLocaleString("fa-IR")}٪`,
      status,
      tone: status === "فعال" ? "active" : status === "پیش‌نویس" ? "draft" : "inactive",
      payer,
    };
    window.localStorage.setItem(PLAN_OVERRIDE_KEY, JSON.stringify(row));
    router.push("/bank/plans");
  }

  return (
    <main className={shell.page} data-node-id="315:2" data-name="Bank / Plan Detail / Existing">
      <section className={shell.mainContent}>
        <header className={shell.header}>
          <div className={shell.userInfo}><div className={shell.userCopy}><strong>شعبه مرکزی تهران</strong><span>تیم چارخونه بانک</span></div><img className={shell.avatar} src={assets.avatar} alt="" width={40} height={40} /></div>
          <div className={styles.detailHeader}><Link href="/bank/plans" className={styles.backLink}>← بازگشت به طرح‌ها</Link><div className={styles.options}><span className={local.activeBadge}>{status}</span><h1>جزئیات طرح تأمین مالی</h1></div><p>مشاهده و ویرایش شرایط طرح بانک در چارخونه</p></div>
        </header>

        <section className={styles.card}><h2>اطلاعات طرح</h2><div className={styles.divider} /><div className={styles.fieldGrid2}>
          <label className={styles.field}><span>نام طرح</span><input className={styles.inputLike} value={name} onChange={(e) => setName(e.target.value)} /></label>
          <label className={styles.field}><span>نوع طرح</span><select className={styles.inputLike} value={type} onChange={(e) => setType(e.target.value as "عمومی" | "سازمانی")}><option value="عمومی">عمومی</option><option value="سازمانی">سازمانی</option></select></label>
        </div>{type === "سازمانی" && <div className={styles.fullField}><label className={styles.field}><span>سازمان</span><input className={styles.inputLike} value={organization} onChange={(e) => setOrganization(e.target.value)} /></label></div>}</section>

        <section className={styles.card}><h2>شرایط مالی</h2><div className={styles.divider} /><div className={styles.fieldGrid3}>
          <label className={styles.field}><span>حداکثر مبلغ تأمین مالی</span><input className={styles.inputLike} inputMode="numeric" value={maxAmount} onChange={(e) => setMaxAmount(e.target.value)} /></label>
          <label className={styles.field}><span>مدت تأمین مالی (ماه)</span><input className={styles.inputLike} inputMode="numeric" value={duration} onChange={(e) => setDuration(e.target.value)} /></label>
          <label className={styles.field}><span>نرخ سود تسهیلات (%)</span><input className={styles.inputLike} inputMode="decimal" value={rate} onChange={(e) => setRate(e.target.value)} /></label>
        </div><div className={styles.payerBlock}><div className={styles.payerTitle}><span>برای «سازمان» یا «مشترک»، نوع طرح باید سازمانی و سازمان مشخص باشد.</span><strong>پرداخت‌کننده پرداخت ماهانه</strong></div><div className={styles.options}>{(["مشترک","سازمان","مستأجر"] as Payer[]).map((item) => <button key={item} type="button" className={`${styles.option} ${payer === item ? styles.optionActive : ""}`} onClick={() => setPayer(item)}>{item}</button>)}</div></div><span className={styles.helper}>پرداخت ماهانه طبق پرداخت‌کننده انتخاب‌شده انجام می‌شود و سهم بانک به‌صورت ماهانه تسویه می‌شود.</span></section>

        <section className={styles.card}><h2>شرایط پذیرش متقاضی</h2><div className={styles.divider} /><div className={styles.fieldGrid2}><label className={styles.field}><span>حداقل رتبه اعتباری</span><select className={styles.inputLike} value={credit} onChange={(e) => setCredit(e.target.value)}><option>A</option><option>B</option><option>C</option></select></label><label className={styles.field}><span>حداکثر مبلغ قابل تأمین براساس رتبه اعتباری</span><input className={styles.inputLike} inputMode="numeric" value={maxAmount} onChange={(e) => setMaxAmount(e.target.value)} /></label></div><span className={styles.helper}>چارخونه رتبه اعتباری متقاضی را پیش از نمایش و انتخاب این طرح بررسی می‌کند.</span><h3 className={styles.subheading}>شرایط تکمیلی</h3><CheckRow>سابقه اعتباری مثبت</CheckRow><div className={styles.infoBox}>فقط پرونده‌هایی که شرایط این طرح را با موفقیت گذرانده‌اند برای بانک ارسال می‌شوند.</div></section>

        <section className={styles.card}><h2>پیش‌شرط تأمین وجه</h2><div className={styles.divider} /><div className={styles.lockRow}><span>🔒</span><span>قاعده ثابت چارخونه - غیرقابل ویرایش</span></div><CheckRow>وجه موردنیاز مستأجر واریز شده باشد.</CheckRow><CheckRow>انتقال وجه مستأجر به حساب کارگزاری همین بانک تأیید شده باشد.</CheckRow><span className={styles.helper}>پس از تأیید این دو مرحله، پرونده برای تصمیم نهایی بانک آماده می‌شود.</span></section>

        <section className={styles.card}><h2>وضعیت طرح</h2><div className={styles.divider} /><div className={styles.statusChips}>{(["فعال","پیش‌نویس","غیرفعال"] as PlanStatus[]).map((item) => <button key={item} type="button" className={`${styles.chip} ${status === item ? styles.chipActive : ""}`} onClick={() => setStatus(item)}>{item}</button>)}</div><span className={styles.helper}>تغییرات فقط برای پرونده‌های جدید اعمال می‌شود و شرایط قراردادهای فعال بدون تغییر باقی می‌ماند.</span></section>

        {error && <div className={styles.formError} role="alert">{error}</div>}
        <div className={styles.actions}><Link href="/bank/plans" className={`${styles.action} ${styles.cancel}`}>بازگشت</Link><Link href="/bank/plans/1/deactivate" className={`${styles.action} ${local.danger}`}>غیرفعال کردن طرح</Link><button type="button" className={`${styles.action} ${styles.primary}`} onClick={save}>ذخیره تغییرات</button></div>
      </section>
      <Sidebar />
    </main>
  );
}
