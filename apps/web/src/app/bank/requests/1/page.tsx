import Link from "next/link";
import shell from "../../panel.module.css";
import styles from "./page.module.css";

const assets = {
  avatar: "https://www.figma.com/api/mcp/asset/b97dd84c-6cf8-41c6-b97c-cf289fbb3ba2.png",
  logo: "https://www.figma.com/api/mcp/asset/36c86a63-2bba-462a-8afb-2df32bf07eb1.png",
  dot: "https://www.figma.com/api/mcp/asset/55eb3629-5b32-40b0-b543-fd42247f7531.svg",
  check: "https://www.figma.com/api/mcp/asset/62514dd8-b7ce-4fc4-b639-ecedee701ba3.svg",
  home: "https://www.figma.com/api/mcp/asset/097e947a-09d7-4ad3-88ee-da8230794fc3.svg",
  requests: "https://www.figma.com/api/mcp/asset/76013cde-ad2f-462c-8ace-55488306af27.svg",
  plans: "https://www.figma.com/api/mcp/asset/53d7ecf0-feef-400b-bedb-c8a63ebeaa01.svg",
  payments: "https://www.figma.com/api/mcp/asset/3ae6c32f-4f76-4630-b208-6f6cfbd09b6c.svg",
  settings: "https://www.figma.com/api/mcp/asset/fd8cefbe-7c83-4934-a285-f6bab805b89e.svg",
  logout: "https://www.figma.com/api/mcp/asset/a959f9d0-a4cb-4df1-a052-d2742f8e6c8f.svg",
} as const;

const summary = [
  ["زمان ثبت", "۱۴۰۵/۰۶/۰۸ — ۱۰:۴۵"],
  ["مدت تأمین مالی", "۱۲ ماه"],
  ["طرح انتخاب‌شده", "طرح مسکن ویژه"],
  ["مبلغ درخواست", "۵۰۰٬۰۰۰٬۰۰۰ تومان"],
  ["متقاضی", "محمد رضایی"],
] as const;

const tenantRows = [
  ["نام و نام خانوادگی", "محمد رضایی"],
  ["کد ملی", "۰۰۱***۴۵۶۷"],
  ["شماره موبایل", "۰۹۱۲***۴۵۶۷"],
] as const;

const contractRows = [
  ["کد قرارداد", "۱۴۰۵-۸۳۲۱", false],
  ["کد رهگیری خودنویس", "۱۲۳۴۵۶۷۸۹۰", false],
  ["ودیعه قرارداد", "۸۰۰٬۰۰۰٬۰۰۰ تومان", false],
  ["اجاره ماهانه", "۲۰٬۰۰۰٬۰۰۰ تومان", false],
  ["مدت قرارداد", "۱۲ ماه", false],
  ["وضعیت", "معتبر", true],
] as const;

const financing = [
  ["تاریخ پایان قرارداد", "۱۵ مهر ۱۴۰۶"],
  ["سود ماهانه بانک", "۱۲٬۵۰۰٬۰۰۰ تومان"],
  ["وجه تضمین مستأجر", "۳۰۰٬۰۰۰٬۰۰۰ تومان"],
  ["اصل تسهیلات درخواستی", "۵۰۰٬۰۰۰٬۰۰۰ تومان"],
] as const;

const checks = [
  ["رتبه اعتباری", "A"],
  ["سقف قابل تأمین براساس اعتبار", "۵۰۰٬۰۰۰٬۰۰۰ تومان"],
  ["تطابق با شرایط طرح", ""],
  ["اعتبار قرارداد خودنویس", ""],
  ["هویت و تطابق متقاضی", ""],
  ["وجه مستأجر در کارگزاری", ""],
] as const;

function Sidebar() {
  return (
    <aside className={shell.sidebar} data-node-id="259:196">
      <div className={shell.brand}><img className={shell.logo} src={assets.logo} alt="چارخونه" width={127} height={55} /><div className={shell.bankIdentity}><strong>بانک نمونه</strong><span>تیم مدیریت تسهیلات</span></div></div>
      <nav className={shell.nav}>
        <Link href="/bank" className={shell.navItem}><span>خانه</span><img src={assets.home} alt="" /></Link>
        <Link href="/bank/requests" className={`${shell.navItem} ${shell.navActive}`}><span>درخواست‌ها</span><img src={assets.requests} alt="" /></Link>
        <Link href="/bank/plans" className={shell.navItem}><span>طرح‌ها</span><img src={assets.plans} alt="" /></Link>
        <Link href="/bank/receive-pay" className={shell.navItem}><span>دریافت و پرداخت</span><img src={assets.payments} alt="" /></Link>
        <Link href="/bank/settings" className={shell.navItem}><span>تنظیمات</span><img src={assets.settings} alt="" /></Link>
        <Link href="/bank/login" className={`${shell.navItem} ${shell.logout}`}><span>خروج از حساب</span><img src={assets.logout} alt="" /></Link>
      </nav>
    </aside>
  );
}

export default function BankRequestDetailPage() {
  return (
    <main className={shell.page} data-node-id="268:160" data-name="Bank / Request Detail">
      <section className={shell.mainContent} data-node-id="268:161">
        <header className={shell.header} data-node-id="268:162">
          <div className={shell.userInfo}><div className={shell.userCopy}><strong>شعبه مرکزی تهران</strong><span>تیم چارخونه بانک</span></div><img className={shell.avatar} src={assets.avatar} alt="" width={40} height={40} /></div>
          <div className={styles.detailHeader} data-node-id="268:168"><Link href="/bank/requests" className={styles.backLink} data-node-id="268:169">بازگشت به درخواست‌ها</Link><div className={styles.titleRow}><span className={styles.readyBadge} data-node-id="268:171">آماده بررسی بانک</span><h1 data-node-id="268:173">بررسی درخواست تأمین مالی</h1></div><p className={styles.requestCode} data-node-id="268:174">درخواست ۱۴۰۵-۸۳۲۱</p></div>
        </header>

        <section className={styles.summaryCard} data-node-id="268:175">{summary.map(([label, value]) => <div className={styles.summaryItem} key={label}><span>{label}</span><strong>{value}</strong></div>)}</section>

        <div className={styles.twoCards} data-node-id="268:191">
          <section className={styles.card} data-node-id="268:192"><h2 className={styles.cardTitle}>اطلاعات متقاضی</h2><div className={styles.divider} /><div className={styles.rows}>{tenantRows.map(([label, value]) => <div className={styles.row} key={label}><strong>{value}</strong><span>{label}</span></div>)}</div><div className={styles.verified}><span>احراز هویت شده</span><img src={assets.dot} alt="" /></div></section>
          <section className={styles.card} data-node-id="268:208"><h2 className={styles.cardTitle}>اطلاعات قرارداد</h2><div className={styles.divider} /><div className={styles.contractGrid}>{contractRows.map(([label, value, valid]) => <div className={styles.row} key={label}><strong className={valid ? styles.valid : ""}>{value}</strong><span>{label}</span></div>)}</div><p className={styles.contractNote}>اطلاعات قرارداد از سامانه خودنویس دریافت شده است.</p></section>
        </div>

        <section className={styles.card} data-node-id="268:231"><h2 className={styles.cardTitle}>ساختار تأمین مالی</h2><div className={styles.divider} /><div className={styles.financeGrid}>{financing.map(([label, value]) => <div className={styles.summaryItem} key={label}><span>{label}</span><strong>{value}</strong></div>)}</div><div className={styles.infoBox} data-node-id="268:247"><p>۱. اصل تسهیلات پس از تأیید، به حساب کنترل‌شده چارخونه در کارگزاری همین بانک منتقل می‌شود.</p><p>۲. اصل تسهیلات در طول قرارداد در ساختار کارگزاری باقی می‌ماند و سود تسهیلات طبق شرایط طرح به‌صورت ماهانه به بانک پرداخت می‌شود.</p></div></section>

        <section className={styles.card} data-node-id="268:250"><h2 className={styles.cardTitle}>خلاصه اعتبارسنجی و آمادگی پرونده</h2><div className={styles.divider} /><div className={styles.checks}>{checks.map(([label, value]) => <div className={styles.checkRow} key={label}><span className={styles.checkStatus}>تأیید شده</span><span className={styles.checkValue}>{value}</span><span className={styles.checkLabel}>{label}<span className={styles.checkIcon}><img src={assets.check} alt="" /></span></span></div>)}</div><div className={styles.divider} /><div className={styles.finalStatus}><span className={styles.finalBadge}>آماده بررسی بانک</span><span>وضعیت پرونده</span></div></section>

        <section className={styles.ruleBox} data-node-id="269:177"><strong>قاعده تأمین مالی</strong><p>تأمین اصل تسهیلات پس از تأیید واریز وجه مستأجر به حساب کارگزاری همین بانک انجام می‌شود.</p></section>

        <section className={`${styles.card} ${styles.decisionCard}`} data-node-id="268:278"><h2 className={styles.cardTitle}>تصمیم بانک</h2><div className={styles.divider} /><div className={styles.decisionInput}><label>مبلغ نهایی مورد تأیید</label><div className={styles.inputLike}>۵۰۰٬۰۰۰٬۰۰۰ تومان</div><span className={styles.helper}>در صورت نیاز، مبلغ نهایی تأمین مالی را مطابق شرایط طرح اصلاح کنید.</span></div><div className={styles.actions}><Link href="/bank/requests/1/reject" className={styles.reject}>رد درخواست</Link><Link href="/bank/requests/1/approved" className={styles.approve}>تأیید درخواست</Link></div></section>
      </section>
      <Sidebar />
    </main>
  );
}
