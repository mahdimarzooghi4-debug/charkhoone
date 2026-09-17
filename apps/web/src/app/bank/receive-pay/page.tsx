import Link from "next/link";
import shell from "../panel.module.css";
import styles from "./page.module.css";

const assets = {
  avatar: "https://www.figma.com/api/mcp/asset/8e3f549b-f7c8-4436-9937-b0cb9529b9dd.png",
  logo: "https://www.figma.com/api/mcp/asset/454e63bc-5f88-4568-a48c-91ef356ba432.png",
  home: "https://www.figma.com/api/mcp/asset/9be3427a-afb5-4767-95d7-fc6d37e57a0f.svg",
  requests: "https://www.figma.com/api/mcp/asset/f09d802f-8728-4145-a045-e03fd7b8ad19.svg",
  plans: "https://www.figma.com/api/mcp/asset/a6ebd73f-9292-4ecb-8541-38a71ca17e02.svg",
  payments: "https://www.figma.com/api/mcp/asset/d4338c01-495c-4bad-aca5-941d1047377b.svg",
  settings: "https://www.figma.com/api/mcp/asset/22b62919-c589-45e1-ae51-102b100f07bb.svg",
  logout: "https://www.figma.com/api/mcp/asset/21e31f9b-726d-442a-b97c-04e7b8c46c0a.svg",
} as const;

const transactions = [
  { action: "مشاهده", status: "انجام‌شده", tone: "done", id: "TXN-۹۸۳۲۴۰", date: "۱۴۰۵/۰۲/۲۵ — ۱۱:۴۰", amount: "۱۵۰٬۰۰۰٬۰۰۰", caseName: "۱۴۰۵-۸۳۲۱ — محمد رضایی", type: "انتقال وجه مستأجر به کارگزاری" },
  { action: "مشاهده", status: "موفق", tone: "done", id: "TXN-۹۸۴۵۱۲", date: "۱۴۰۵/۰۶/۰۵ — ۱۰:۳۲", amount: "۸۵۰٬۰۰۰٬۰۰۰", caseName: "۱۴۰۵-۶۰۱۲ — علی رضایی", type: "تأمین اصل تسهیلات" },
  { action: "مشاهده", status: "دریافت‌شده", tone: "done", id: "TXN-۹۷۸۳۲۰", date: "۱۴۰۵/۰۳/۳۱ — ۲۳:۵۹", amount: "۳٬۸۵۰٬۰۰۰٬۰۰۰", caseName: "خرداد ۱۴۰۵ — انبوه", type: "واریز سود ماهانه" },
  { action: "پیگیری", status: "در حال پردازش", tone: "processing", id: "TXN-۹۸۳۸۸۱", date: "۱۴۰۵/۰۵/۲۸ — ۱۴:۱۵", amount: "۵۰۰٬۰۰۰٬۰۰۰", caseName: "۱۴۰۵-۵۹۸۷ — سارا کریمی", type: "تأمین اصل تسهیلات" },
  { action: "مشاهده", status: "تسویه‌شده", tone: "done", id: "TXN-۹۸۱۲۰۵", date: "۱۴۰۵/۰۵/۱۵ — ۰۹:۴۸", amount: "۶۲۰٬۰۰۰٬۰۰۰", caseName: "۱۴۰۵-۵۸۴۰ — مهدی نوری", type: "تسویه اصل تسهیلات" },
  { action: "تلاش مجدد", status: "ناموفق", tone: "failed", id: "TXN-۹۷۹۸۴۳", date: "۱۴۰۵/۰۵/۰۲ — ۱۱:۲۰", amount: "۷۲۰٬۰۰۰٬۰۰۰", caseName: "۱۴۰۵-۵۷۹۲ — رضا احمدی", type: "تأمین اصل تسهیلات" },
] as const;

function Sidebar() {
  return <aside className={shell.sidebar}><div className={shell.brand}><img className={shell.logo} src={assets.logo} alt="چارخونه" width={127} height={55} /><div className={shell.bankIdentity}><strong>بانک نمونه</strong><span>تیم مدیریت تسهیلات</span></div></div><nav className={shell.nav}><Link href="/bank" className={shell.navItem}><span>خانه</span><img src={assets.home} alt="" /></Link><Link href="/bank/requests" className={shell.navItem}><span>درخواست‌ها</span><img src={assets.requests} alt="" /></Link><Link href="/bank/plans" className={shell.navItem}><span>طرح‌ها</span><img src={assets.plans} alt="" /></Link><Link href="/bank/receive-pay" className={`${shell.navItem} ${shell.navActive}`}><span>دریافت و پرداخت</span><img src={assets.payments} alt="" /></Link><Link href="/bank/settings" className={shell.navItem}><span>تنظیمات</span><img src={assets.settings} alt="" /></Link><Link href="/bank/login" className={`${shell.navItem} ${shell.logout}`}><span>خروج از حساب</span><img src={assets.logout} alt="" /></Link></nav></aside>;
}

function FundingAction({ request, name, amount, href }: { request:string; name:string; amount:string; href:string }) {
  return <div className={styles.actionRow}><div className={styles.actionTop}><Link href={href} className={styles.primaryButton}>تأمین وجه</Link><span className={styles.readyBadge}>آماده تأمین</span><span className={styles.actionAmount}>{amount}</span><span className={styles.caseInfo}><strong>{request}</strong><small>{name}</small></span><span className={styles.actionType}>تأمین اصل تسهیلات</span></div><div className={styles.checks}><span className={styles.check}>وجه در کارگزاری همین بانک تأیید شده <b>✓</b></span><span className={styles.check}>درخواست بانک تأیید شده <b>✓</b></span><span className={styles.check}>وجه مستأجر واریز شده <b>✓</b></span></div></div>;
}

export default function BankReceivePayPage() {
  return (
    <main className={shell.page} data-node-id="278:2" data-name="Bank / Receive & Pay">
      <section className={shell.mainContent}>
        <header className={shell.header}><div className={shell.userInfo}><div className={shell.userCopy}><strong>شعبه مرکزی تهران</strong><span>تیم چارخونه بانک</span></div><img className={shell.avatar} src={assets.avatar} alt="" width={40} height={40} /></div><div className={shell.headerCopy}><h1>دریافت و پرداخت</h1><p>مدیریت و اجرای جریان‌های مالی بانک در چارخونه</p></div></header>

        <section className={styles.kpis}><div className={styles.kpi}><span>اصل تسهیلات تأمین‌شده</span><strong>۱۲۵٬۰۰۰٬۰۰۰٬۰۰۰ تومان</strong></div><div className={styles.kpi}><span>سود دریافتی این ماه</span><strong>۳٬۸۵۰٬۰۰۰٬۰۰۰ تومان</strong></div><div className={styles.kpi}><span>اصل تسهیلات تسویه‌شده</span><strong>۴۲٬۰۰۰٬۰۰۰٬۰۰۰ تومان</strong></div></section>

        <section className={styles.card}><h2>نیازمند اقدام</h2><div className={styles.divider} /><FundingAction request="درخواست ۱۴۰۵-۸۳۲۱" name="محمد رضایی" amount="۵۰۰٬۰۰۰٬۰۰۰ تومان" href="/bank/receive-pay/case/1/fund" /><FundingAction request="درخواست ۱۴۰۵-۷۵۴۲" name="فاطمه احمدی" amount="۳۵۰٬۰۰۰٬۰۰۰ تومان" href="/bank/receive-pay/case/1/fund" /></section>

        <section className={styles.card}><h2>عملیات سیستمی جاری</h2><div className={styles.divider} /><div className={styles.operation}><div className={styles.opLeft}><Link href="/bank/receive-pay/transaction/1" className={styles.opLink}>مشاهده</Link><span className={styles.badgeSuccess}>دریافت‌شده</span></div><div className={styles.opRight}><strong>واریز سود ماهانه به بانک</strong><span>خرداد ۱۴۰۵ — ۳٬۸۵۰٬۰۰۰٬۰۰۰ تومان</span></div></div><div className={styles.operation}><div className={styles.opLeft}><Link href="/bank/receive-pay/transaction/1" className={styles.opLink}>مشاهده</Link><span className={styles.badgeProcessing}>در حال پردازش</span></div><div className={styles.opRight}><strong>تسویه اصل تسهیلات</strong><span>درخواست ۱۴۰۵-۵۹۸۷ — سارا کریمی — ۵۰۰٬۰۰۰٬۰۰۰ تومان</span></div></div></section>

        <section className={`${styles.card} ${styles.revenueCard}`}><h2>تسویه سهم بانک از پرداخت مستأجر</h2><p className={styles.revenueLead}>با هر پرداخت مستأجر، چارخونه سهم ۲٪ خود را کسر می‌کند و خالص مبلغ قابل پرداخت را به بانک تسویه می‌کند.</p><div className={styles.divider} /><div className={styles.revenueGrid}><div className={styles.revenueItem}><span>پرداخت‌های مشمول این دوره</span><strong>۳٬۸۵۰٬۰۰۰٬۰۰۰ تومان</strong></div><div className={styles.revenueItem}><span>سهم چارخونه — ۲٪</span><strong>۷۷٬۰۰۰٬۰۰۰ تومان</strong></div><div className={styles.revenueItem}><span>خالص قابل تسویه به بانک</span><strong>۳٬۷۷۳٬۰۰۰٬۰۰۰ تومان</strong></div></div><div className={styles.revenueNote}>سهم چارخونه هنگام دریافت وجه از مستأجر کسر می‌شود؛ بانک خالص سهم خود را دریافت می‌کند و تسویه جداگانه‌ای از طرف بانک به چارخونه وجود ندارد.</div></section>

        <h2 className={styles.historyTitle}>تاریخچه تراکنش‌ها</h2>
        <div className={styles.historyToolbar}><div className={styles.searchField}>جستجوی کد درخواست یا قرارداد <span aria-hidden="true">🔍</span></div><div className={styles.filters}><span className={styles.filterActive}>همه <small>۲۵</small></span><span className={styles.filter}>تأمین اصل تسهیلات <small>۸</small></span><span className={styles.filter}>سود ماهانه <small>۱۲</small></span><span className={styles.filter}>تسویه اصل تسهیلات <small>۴</small></span></div></div>
        <section className={styles.tableWrap}><div className={styles.table}><div className={styles.tableHeader}><span>اقدام</span><span>وضعیت</span><span>شناسه تراکنش</span><span>تاریخ و زمان</span><span>مبلغ</span><span>پرونده</span><span>نوع عملیات</span></div>{transactions.map((row) => <div className={styles.tableRow} key={row.id}><Link href="/bank/receive-pay/transaction/1" className={styles.rowAction}>{row.action}</Link><span className={`${styles.status} ${styles[row.tone]}`}>{row.status}</span><span className={styles.muted}>{row.id}</span><span className={styles.muted}>{row.date}</span><span className={styles.value}>{row.amount}</span><span className={styles.muted}>{row.caseName}</span><span className={styles.value}>{row.type}</span></div>)}</div></section>
      </section>
      <Sidebar />
    </main>
  );
}
