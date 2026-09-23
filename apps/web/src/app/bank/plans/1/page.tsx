import Link from "next/link";
import shell from "../../panel.module.css";
import styles from "../page.module.css";
import local from "./page.module.css";

const assets = {
  avatar: "/brand/bank-mark.svg",
  logo: "/brand/dashboard-logo.png",
  check: "https://www.figma.com/api/mcp/asset/007bdf5b-d44c-46d7-a090-e0b316523822.svg",
  lock: "https://www.figma.com/api/mcp/asset/4619370a-f0d4-4a00-b41f-de77c937af1c.svg",
  home: "https://www.figma.com/api/mcp/asset/9228b566-1a67-45af-904e-ce860a8d97a9.svg",
  requests: "https://www.figma.com/api/mcp/asset/e3372d67-bd8c-4d97-bb6b-3995b1906e67.svg",
  plans: "https://www.figma.com/api/mcp/asset/ac92929d-5e3c-4c1c-b50a-415304d364fb.svg",
  payments: "https://www.figma.com/api/mcp/asset/d56b9a84-0e48-46f5-b21d-24553324cdfc.svg",
  settings: "https://www.figma.com/api/mcp/asset/63717a03-e88f-4869-8cd9-6b77f4276c03.svg",
  logout: "https://www.figma.com/api/mcp/asset/80358d53-5e1f-4a35-87a5-b2206aa30dcf.svg",
} as const;

function Sidebar() {
  return <aside className={shell.sidebar}><div className={shell.brand}><img className={shell.logo} src={assets.logo} alt="چارخونه" width={127} height={55} /><div className={shell.bankIdentity}><strong>بانک نمونه</strong><span>تیم مدیریت تسهیلات</span></div></div><nav className={shell.nav}><Link href="/bank" className={shell.navItem}><span>خانه</span><img src={assets.home} alt="" /></Link><Link href="/bank/requests" className={shell.navItem}><span>درخواست‌ها</span><img src={assets.requests} alt="" /></Link><Link href="/bank/plans" className={`${shell.navItem} ${shell.navActive}`}><span>طرح‌ها</span><img src={assets.plans} alt="" /></Link><Link href="/bank/receive-pay" className={shell.navItem}><span>دریافت و پرداخت</span><img src={assets.payments} alt="" /></Link><Link href="/bank/settings" className={shell.navItem}><span>تنظیمات</span><img src={assets.settings} alt="" /></Link><Link href="/bank/login" className={`${shell.navItem} ${shell.logout}`}><span>خروج از حساب</span><img src={assets.logout} alt="" /></Link></nav></aside>;
}

function Field({ label, value, disabled = false }: { label: string; value: string; disabled?: boolean }) {
  return <div className={styles.field}><label>{label}</label><div className={`${styles.inputLike} ${disabled ? styles.inputDisabled : ""}`}>{value}</div></div>;
}

function CheckRow({ children }: { children: string }) {
  return <div className={styles.checkRow}><span className={styles.checkStatus}>تأیید شده</span><span className={styles.checkLabel}>{children}<span className={styles.checkIcon}><img src={assets.check} alt="" /></span></span></div>;
}

export default function BankExistingPlanPage() {
  return (
    <main className={shell.page} data-node-id="315:2" data-name="Bank / Plan Detail / Existing">
      <section className={shell.mainContent}>
        <header className={shell.header}>
          <div className={shell.userInfo}><div className={shell.userCopy}><strong>شعبه مرکزی تهران</strong><span>تیم چارخونه بانک</span></div><img className={shell.avatar} src={assets.avatar} alt="" width={40} height={40} /></div>
          <div className={styles.detailHeader}><Link href="/bank/plans" className={styles.backLink}>← بازگشت به طرح‌ها</Link><div className={styles.options}><span className={local.activeBadge}>فعال</span><h1>جزئیات طرح تأمین مالی</h1></div><p>مشاهده و ویرایش شرایط طرح فعال بانک در چارخونه</p></div>
        </header>

        <section className={styles.card}><h2>اطلاعات طرح</h2><div className={styles.divider} /><div className={styles.fieldGrid2}><Field label="نام طرح" value="طرح مسکن ویژه" /><Field label="نوع طرح" value="عمومی" /></div><div className={styles.fullField}><Field label="سازمان" value="سازمان نمونه" disabled /><span className={styles.helper}>در صورت انتخاب نوع سازمانی نمایش داده می‌شود</span></div></section>

        <section className={styles.card}><h2>شرایط مالی</h2><div className={styles.divider} /><div className={styles.fieldGrid3}><Field label="حداکثر مبلغ تأمین مالی" value="۵۰۰٬۰۰۰٬۰۰۰ تومان" /><Field label="مدت تأمین مالی" value="۱۲ ماه" /><Field label="نرخ سود تسهیلات" value="۲۳٪" /></div><div className={styles.payerBlock}><div className={styles.payerTitle}><span>برای «سازمان» یا «مشترک»، نوع طرح باید سازمانی و سازمان مشخص باشد.</span><strong>پرداخت‌کننده پرداخت ماهانه</strong></div><div className={styles.options}><span className={styles.option}>مشترک</span><span className={styles.option}>سازمان</span><span className={`${styles.option} ${styles.optionActive}`}>مستأجر</span></div></div><span className={styles.helper}>پرداخت ماهانه طبق پرداخت‌کننده انتخاب‌شده انجام می‌شود و سهم بانک به‌صورت ماهانه تسویه می‌شود.</span></section>

        <section className={styles.card}><h2>شرایط پذیرش متقاضی</h2><div className={styles.divider} /><div className={styles.fieldGrid2}><Field label="حداقل رتبه اعتباری" value="A" /><Field label="حداکثر مبلغ قابل تأمین براساس رتبه اعتباری" value="۵۰۰٬۰۰۰٬۰۰۰ تومان" /></div><span className={styles.helper}>چارخونه رتبه اعتباری متقاضی را پیش از نمایش و انتخاب این طرح بررسی می‌کند.</span><h3 className={styles.subheading}>شرایط تکمیلی</h3><CheckRow>سابقه اعتباری مثبت</CheckRow><div className={styles.infoBox}>فقط پرونده‌هایی که شرایط این طرح را با موفقیت گذرانده‌اند برای بانک ارسال می‌شوند.</div></section>

        <section className={styles.card}><h2>پیش‌شرط تأمین وجه</h2><div className={styles.divider} /><div className={styles.lockRow}><img src={assets.lock} alt="" /><span>قاعده ثابت چارخونه - غیرقابل ویرایش</span></div><CheckRow>وجه موردنیاز مستأجر واریز شده باشد.</CheckRow><CheckRow>انتقال وجه مستأجر به حساب کارگزاری همین بانک تأیید شده باشد.</CheckRow><span className={styles.helper}>پس از تأیید این دو مرحله، پرونده برای تصمیم نهایی بانک آماده می‌شود.</span></section>

        <section className={styles.card}><h2>وضعیت طرح</h2><div className={styles.divider} /><div className={styles.statusChips}><span className={`${styles.chip} ${styles.chipActive}`}>فعال</span><span className={styles.chip}>پیش‌نویس</span><span className={styles.chip}>غیرفعال</span></div><span className={styles.helper}>این طرح فعال است. تغییرات فقط برای پرونده‌های جدید اعمال می‌شود و شرایط قراردادهای فعال بدون تغییر باقی می‌ماند.</span></section>

        <div className={styles.actions}><Link href="/bank/plans" className={`${styles.action} ${styles.cancel}`}>بازگشت</Link><Link href="/bank/plans/1/deactivate" className={`${styles.action} ${local.danger}`}>غیرفعال کردن طرح</Link><Link href="/bank/plans/1" className={`${styles.action} ${styles.primary}`}>ذخیره تغییرات</Link></div>
      </section>
      <Sidebar />
    </main>
  );
}
