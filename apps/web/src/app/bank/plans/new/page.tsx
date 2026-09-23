import Link from "next/link";
import shell from "../../panel.module.css";
import styles from "../page.module.css";

const assets = {
  avatar: "/brand/bank-mark.svg",
  logo: "/brand/dashboard-logo.png",
  check: "https://www.figma.com/api/mcp/asset/ea94cb13-ad0f-4828-a2c9-ed5dfb300b3b.svg",
  lock: "https://www.figma.com/api/mcp/asset/43a64c9b-8c57-41c6-9a28-05523704b352.svg",
  home: "https://www.figma.com/api/mcp/asset/032d3c67-43e4-4ba3-a066-8586ff377d36.svg",
  requests: "https://www.figma.com/api/mcp/asset/1459d1dc-e2c3-4758-869d-f2ec562af870.svg",
  plans: "https://www.figma.com/api/mcp/asset/fb3d0072-189f-4cb3-a862-668d0d2da3fd.svg",
  payments: "https://www.figma.com/api/mcp/asset/3e143b96-7d7c-464e-a6f9-0574716c463d.svg",
  settings: "https://www.figma.com/api/mcp/asset/9922acd1-63ca-4602-a59c-ec57a1acbbfb.svg",
  logout: "https://www.figma.com/api/mcp/asset/c3a09eca-c1a7-4373-bf9d-ad9599551453.svg",
} as const;

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

function Field({ label, value, disabled = false }: { label: string; value: string; disabled?: boolean }) {
  return <div className={styles.field}><label>{label}</label><div className={`${styles.inputLike} ${disabled ? styles.inputDisabled : ""}`}>{value}</div></div>;
}

function CheckRow({ children }: { children: string }) {
  return <div className={styles.checkRow}><span className={styles.checkStatus}>تأیید شده</span><span className={styles.checkLabel}>{children}<span className={styles.checkIcon}><img src={assets.check} alt="" /></span></span></div>;
}

export default function BankPlanNewPage() {
  return (
    <main className={shell.page} data-node-id="270:2" data-name="Bank / Plan Detail">
      <section className={shell.mainContent}>
        <header className={shell.header}>
          <div className={shell.userInfo}><div className={shell.userCopy}><strong>شعبه مرکزی تهران</strong><span>تیم چارخونه بانک</span></div><img className={shell.avatar} src={assets.avatar} alt="" width={40} height={40} /></div>
          <div className={styles.detailHeader}><Link href="/bank/plans" className={styles.backLink}>← بازگشت به طرح‌ها</Link><h1>ایجاد طرح تأمین مالی</h1><p>شرایط طرح را مشخص کنید؛ چارخونه پیش از ارسال پرونده، این شرایط را بررسی می‌کند.</p></div>
        </header>

        <section className={styles.card}><h2>اطلاعات طرح</h2><div className={styles.divider} /><div className={styles.fieldGrid2}><Field label="نام طرح" value="طرح مسکن ویژه" /><Field label="نوع طرح" value="عمومی" /></div><div className={styles.fullField}><Field label="سازمان" value="سازمان نمونه" disabled /><span className={styles.helper}>در صورت انتخاب نوع سازمانی نمایش داده می‌شود</span></div></section>

        <section className={styles.card}><h2>شرایط مالی</h2><div className={styles.divider} /><div className={styles.fieldGrid3}><Field label="حداکثر مبلغ تأمین مالی" value="۵۰۰٬۰۰۰٬۰۰۰ تومان" /><Field label="مدت تأمین مالی" value="۱۲ ماه" /><Field label="نرخ سود تسهیلات" value="۲۳٪" /></div><div className={styles.payerBlock}><div className={styles.payerTitle}><span>برای «سازمان» یا «مشترک»، نوع طرح باید سازمانی و سازمان مشخص باشد.</span><strong>پرداخت‌کننده پرداخت ماهانه</strong></div><div className={styles.options}><span className={styles.option}>مشترک</span><span className={styles.option}>سازمان</span><span className={`${styles.option} ${styles.optionActive}`}>مستأجر</span></div></div><span className={styles.helper}>پرداخت ماهانه طبق پرداخت‌کننده انتخاب‌شده انجام می‌شود و سهم بانک به‌صورت ماهانه تسویه می‌شود.</span></section>

        <section className={styles.card}><h2>شرایط پذیرش متقاضی</h2><div className={styles.divider} /><div className={styles.fieldGrid2}><Field label="حداقل رتبه اعتباری" value="A" /><Field label="حداکثر مبلغ قابل تأمین براساس رتبه اعتباری" value="۵۰۰٬۰۰۰٬۰۰۰ تومان" /></div><span className={styles.helper}>چارخونه رتبه اعتباری متقاضی را پیش از نمایش و انتخاب این طرح بررسی می‌کند.</span><h3 className={styles.subheading}>شرایط تکمیلی</h3><CheckRow>سابقه اعتباری مثبت</CheckRow><div className={styles.infoBox}>فقط پرونده‌هایی که شرایط این طرح را با موفقیت گذرانده‌اند برای بانک ارسال می‌شوند.</div></section>

        <section className={styles.card}><h2>پیش‌شرط تأمین وجه</h2><div className={styles.divider} /><div className={styles.lockRow}><img src={assets.lock} alt="" /><span>قاعده ثابت چارخونه - غیرقابل ویرایش</span></div><CheckRow>وجه موردنیاز مستأجر واریز شده باشد.</CheckRow><CheckRow>انتقال وجه مستأجر به حساب کارگزاری همین بانک تأیید شده باشد.</CheckRow><span className={styles.helper}>پس از تأیید این دو مرحله، پرونده برای تصمیم نهایی بانک آماده می‌شود.</span></section>

        <section className={styles.card}><h2>وضعیت طرح</h2><div className={styles.divider} /><div className={styles.statusChips}><span className={`${styles.chip} ${styles.chipActive}`}>فعال</span><span className={styles.chip}>پیش‌نویس</span><span className={styles.chip}>غیرفعال</span></div><span className={styles.helper}>طرح فعال در محاسبات و بررسی واجد شرایط بودن متقاضیان چارخونه استفاده می‌شود.</span></section>

        <div className={styles.actions}><Link href="/bank/plans" className={`${styles.action} ${styles.cancel}`}>انصراف</Link><Link href="/bank/plans" className={`${styles.action} ${styles.draftAction}`}>ذخیره پیش‌نویس</Link><Link href="/bank/plans/1" className={`${styles.action} ${styles.primary}`}>ذخیره و فعال‌سازی</Link></div>
      </section>
      <Sidebar />
    </main>
  );
}
