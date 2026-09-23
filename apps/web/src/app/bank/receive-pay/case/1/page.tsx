import Link from "next/link";
import shell from "../../../panel.module.css";
import styles from "./page.module.css";

const assets = {
  logo: "/brand/dashboard-logo.png",
  home: "https://www.figma.com/api/mcp/asset/21a5d668-cb1b-41f8-a6c6-030c1623955c.svg",
  requests: "https://www.figma.com/api/mcp/asset/efe0afa7-b6fa-4a4c-ba72-6db194b9bc68.svg",
  plans: "https://www.figma.com/api/mcp/asset/4465354a-d1b5-4bab-a0c3-eccbd9e34267.svg",
  payments: "https://www.figma.com/api/mcp/asset/7c3ec90e-be13-46fe-bfe5-db3ba25268b5.svg",
  settings: "https://www.figma.com/api/mcp/asset/019ec4c9-c17a-4f7a-b6a3-35f9054fb53b.svg",
  logout: "https://www.figma.com/api/mcp/asset/4ed4d413-ae3b-459b-b5be-16b8405735c0.svg",
} as const;

const txRows = [
  ["مشاهده","انجام‌شده","TXN-۹۸۳۲۴۰","۱۴۰۵/۰۲/۲۵ — ۱۱:۴۰","۱۵۰٬۰۰۰٬۰۰۰","انتقال وجه مستأجر به کارگزاری"],
  ["مشاهده","انجام‌شده","TXN-۹۸۴۵۱۲","۱۴۰۵/۰۳/۰۱ — ۰۹:۱۵","۵۰۰٬۰۰۰٬۰۰۰","تأمین اصل تسهیلات"],
  ["مشاهده","دریافت‌شده","TXN-۹۸۵۲۲۰","۱۴۰۵/۰۴/۰۱ — ۲۳:۵۹","۲۵٬۰۰۰٬۰۰۰","سود ماهانه — دوره ۱"],
  ["مشاهده","دریافت‌شده","TXN-۹۸۶۱۱۵","۱۴۰۵/۰۵/۰۱ — ۲۳:۵۹","۲۵٬۰۰۰٬۰۰۰","سود ماهانه — دوره ۲"],
  ["مشاهده","دریافت‌شده","TXN-۹۸۷۰۰۸","۱۴۰۵/۰۶/۰۱ — ۲۳:۵۹","۲۵٬۰۰۰٬۰۰۰","سود ماهانه — دوره ۳"],
] as const;

const events = [
  ["TXN-۹۸۳۱۰۱","۱۴۰۵/۰۲/۲۵","۱۵۰٬۰۰۰٬۰۰۰ تومان","واریز وجه مستأجر",true],
  ["TXN-۹۸۳۲۴۰","۱۴۰۵/۰۲/۲۵","۱۵۰٬۰۰۰٬۰۰۰ تومان","انتقال وجه مستأجر به کارگزاری همین بانک",true],
  ["TXN-۹۸۳۱۰۱","۱۴۰۵/۰۲/۲۵","۱۵۰٬۰۰۰٬۰۰۰ تومان","تأیید وجه در کارگزاری همین بانک",true],
  ["TXN-۹۸۴۵۱۲","۱۴۰۵/۰۳/۰۱","۵۰۰٬۰۰۰٬۰۰۰ تومان","تأمین اصل تسهیلات توسط بانک",true],
  ["TXN-۹۸۵۲۲۰","۱۴۰۵/۰۴/۰۱","۲۵٬۰۰۰٬۰۰۰ تومان","دریافت سود دوره اول",true],
  ["TXN-۹۸۶۱۱۵","۱۴۰۵/۰۵/۰۱","۲۵٬۰۰۰٬۰۰۰ تومان","دریافت سود دوره دوم",true],
  ["TXN-۹۸۷۰۰۸","۱۴۰۵/۰۶/۰۱","۲۵٬۰۰۰٬۰۰۰ تومان","دریافت سود دوره سوم",true],
  ["","۱۴۰۵/۰۷/۰۱","۲۵٬۰۰۰٬۰۰۰ تومان","دریافت سود دوره چهارم",false],
  ["","۱۴۰۶/۰۳/۰۱","۵۰۰٬۰۰۰٬۰۰۰ تومان","تسویه اصل تسهیلات در پایان قرارداد",false],
] as const;

function Sidebar() {
  return <aside className={shell.sidebar}><div className={shell.brand}><img className={shell.logo} src={assets.logo} alt="چارخونه" width={127} height={55} /><div className={shell.bankIdentity}><strong>بانک نمونه</strong><span>تیم مدیریت تسهیلات</span></div></div><nav className={shell.nav}><Link href="/bank" className={shell.navItem}><span>خانه</span><img src={assets.home} alt="" /></Link><Link href="/bank/requests" className={shell.navItem}><span>درخواست‌ها</span><img src={assets.requests} alt="" /></Link><Link href="/bank/plans" className={shell.navItem}><span>طرح‌ها</span><img src={assets.plans} alt="" /></Link><Link href="/bank/receive-pay" className={`${shell.navItem} ${shell.navActive}`}><span>دریافت و پرداخت</span><img src={assets.payments} alt="" /></Link><Link href="/bank/settings" className={shell.navItem}><span>تنظیمات</span><img src={assets.settings} alt="" /></Link><Link href="/bank/login" className={`${shell.navItem} ${shell.logout}`}><span>خروج از حساب</span><img src={assets.logout} alt="" /></Link></nav></aside>;
}

function StatusCard({ title, amount, badge, tone, note }: { title:string; amount?:string; badge:string; tone:"green"|"blue"|"warn"; note:string }) {
  const badgeClass = tone === "green" ? styles.badgeGreen : tone === "blue" ? styles.badgeBlue : styles.badgeWarn;
  return <div className={styles.statusCard}><h3>{title}</h3>{amount ? <strong>{amount}</strong> : null}<span className={badgeClass}>{badge}</span><p>{note}</p></div>;
}

function SummaryField({ label, value }: { label:string; value:string }) { return <div className={styles.summaryField}><span>{label}</span><strong>{value}</strong></div>; }

export default function BankFinancialCasePage() {
  return (
    <main className={shell.page} data-node-id="284:2" data-name="Bank / Financial Case Detail">
      <section className={styles.main}>
        <header className={styles.header}><Link className={styles.back} href="/bank/receive-pay">بازگشت به دریافت و پرداخت</Link><div className={styles.titleRow}><span className={styles.activeBadge}>فعال</span><h1>جزئیات مالی پرونده</h1></div><p>پرونده ۱۴۰۵-۸۳۲۱</p></header>
        <div className={styles.topGrid}>
          <section className={styles.panel}><h2>وضعیت مالی پرونده</h2><div className={styles.divider} /><div className={styles.statusGrid}><StatusCard title="وجه تضمین مستأجر" amount="۱۵۰٬۰۰۰٬۰۰۰ تومان" badge="تأییدشده در کارگزاری" tone="green" note="وجه مستأجر در کارگزاری همین بانک تأیید شده است." /><StatusCard title="اصل تسهیلات" amount="۵۰۰٬۰۰۰٬۰۰۰ تومان" badge="تأمین‌شده" tone="green" note="شناسه تراکنش: TXN-۹۸۴۵۱۲" /><StatusCard title="سود دریافتی بانک" amount="۷۵٬۰۰۰٬۰۰۰ تومان" badge="دریافت‌شده تا امروز" tone="blue" note="۳ از ۱۲ دوره دریافت شده" /><StatusCard title="تسویه اصل تسهیلات" badge="در انتظار پایان قرارداد" tone="warn" note="تسویه در تاریخ ۱۴۰۶/۰۳/۰۱" /></div></section>
          <section className={styles.panel}><h2>خلاصه پرونده</h2><div className={styles.divider} /><div className={styles.summaryRows}><div className={styles.summaryRow}><SummaryField label="طرح" value="طرح مسکن ویژه" /><SummaryField label="متقاضی" value="محمد رضایی" /></div><div className={styles.summaryRow}><SummaryField label="مدت" value="۱۲ ماه" /><SummaryField label="اصل تسهیلات" value="۵۰۰٬۰۰۰٬۰۰۰ تومان" /></div><div className={styles.summaryRow}><SummaryField label="تاریخ شروع" value="۱۴۰۵/۰۳/۰۱" /><SummaryField label="کد قرارداد" value="CTR-۱۴۰۵۰۸۳۲۱" /></div><div className={styles.summaryRow}><SummaryField label="تاریخ پایان" value="۱۴۰۶/۰۳/۰۱" /><span /></div></div></section>
        </div>
        <div className={styles.bottomGrid}>
          <div className={styles.stack}>
            <section className={`${styles.panel} ${styles.transactions}`}><h2>تراکنش‌های پرونده</h2><div className={styles.smallTable}><div className={styles.table}><div className={styles.tableHeader}><span>نوع عملیات</span><span>مبلغ</span><span>تاریخ و زمان</span><span>شناسه تراکنش</span><span>وضعیت</span><span>اقدام</span></div>{txRows.map((row) => <div className={styles.tableRow} key={row[2]}><span className={styles.txValue}>{row[5]}</span><span className={styles.txValue}>{row[4]}</span><span className={styles.txMuted}>{row[3]}</span><span className={styles.txMuted}>{row[2]}</span><span className={styles.txBadge}>{row[1]}</span><Link className={styles.txLink} href="/bank/receive-pay/transaction/1">{row[0]}</Link></div>)}</div></div></section>
            <section className={`${styles.panel} ${styles.current}`}><h2>وضعیت فعلی</h2><div className={styles.divider} /><div className={styles.currentTop}><span className={styles.activeBadge}>فعال</span><div className={styles.currentCopy}><strong>اصل تسهیلات تأمین شده</strong><span>پرونده ۱۴۰۵-۸۳۲۱ — ۵۰۰٬۰۰۰٬۰۰۰ تومان — TXN-۹۸۴۵۱۲</span></div></div><div className={styles.currentChecks}><span>✓ اصل تسهیلات در کارگزاری تأمین شده</span><span>✓ ۳ دوره سود دریافت شده</span><span className={styles.pending}>○ دوره بعدی سود: ۱۴۰۵/۰۷/۰۱</span></div><Link href="/bank/receive-pay/transaction/1" className={styles.txButton}>مشاهده تراکنش</Link></section>
          </div>
          <section className={`${styles.panel} ${styles.timeline}`}><h2>گردش مالی پرونده</h2><div className={styles.divider} />{events.map(([id,date,amount,label,done], i) => <div className={styles.event} key={`${date}-${label}`}><div className={styles.eventDetails}>{id ? <span>{id}</span> : null}<span>{date}</span><strong>{amount}</strong></div><div className={`${styles.eventLabel} ${done ? "" : styles.eventPending}`}><b aria-hidden="true">{done ? "✓" : "○"}</b><span>{label}</span></div></div>)}</section>
        </div>
      </section>
      <Sidebar />
    </main>
  );
}
