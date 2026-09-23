import Link from "next/link";
import shell from "../panel.module.css";
import styles from "./page.module.css";

const assets = {
  avatar: "/brand/bank-mark.svg",
  logo: "/brand/dashboard-logo.png",
  search: "https://www.figma.com/api/mcp/asset/6bf8fee2-be79-4844-b80e-6ef9dae90861.svg",
  home: "https://www.figma.com/api/mcp/asset/5ed128bf-94ea-4e44-887f-c8375148f0a8.svg",
  requests: "https://www.figma.com/api/mcp/asset/9e949382-e1df-42b2-92a6-b0efd96cbe97.svg",
  plans: "https://www.figma.com/api/mcp/asset/fa65a64a-8d4e-4366-8f6a-af62fb8a58af.svg",
  payments: "https://www.figma.com/api/mcp/asset/0aa3dc97-b2e9-47e0-bd98-687012010c5c.svg",
  settings: "https://www.figma.com/api/mcp/asset/5273575a-de26-441a-9e2f-ce7316a91bbc.svg",
  logout: "https://www.figma.com/api/mcp/asset/8673b6db-a368-4ebf-b6f1-3500f33bb10c.svg",
} as const;

const rows = [
  { name: "طرح مسکن ویژه", org: "", type: "عمومی", max: "۵۰۰٬۰۰۰٬۰۰۰ تومان", credit: "A", duration: "۱۲ ماه", rate: "۲۳٪", status: "فعال", tone: "active" },
  { name: "طرح اجاره به شرط تملیک", org: "سازمان نمونه", type: "سازمانی", max: "۳۵۰٬۰۰۰٬۰۰۰ تومان", credit: "B", duration: "۱۲ ماه", rate: "۲۱٪", status: "فعال", tone: "active" },
  { name: "طرح مسکن جوانان", org: "", type: "عمومی", max: "۲۸۰٬۰۰۰٬۰۰۰ تومان", credit: "A", duration: "۱۲ ماه", rate: "۲۰٪", status: "فعال", tone: "active" },
  { name: "طرح حمایت کارمندان", org: "بانک مرکزی", type: "سازمانی", max: "۶۰۰٬۰۰۰٬۰۰۰ تومان", credit: "B", duration: "۱۲ ماه", rate: "۱۸٪", status: "پیش‌نویس", tone: "draft" },
  { name: "طرح ویژه بازنشستگان", org: "صندوق بازنشستگی", type: "سازمانی", max: "۴۰۰٬۰۰۰٬۰۰۰ تومان", credit: "C", duration: "۱۲ ماه", rate: "۲۲٪", status: "غیرفعال", tone: "inactive" },
] as const;

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
          <div className={styles.kpi}><span>طرح‌های سازمانی</span><strong>۴ طرح</strong></div>
          <div className={styles.kpi}><span>طرح عمومی</span><strong>۱ طرح</strong></div>
          <div className={styles.kpi}><span>طرح‌های فعال</span><strong>۵ طرح</strong></div>
        </section>

        <div className={styles.toolbar}>
          <div className={styles.search}><span>جستجوی نام طرح</span><img src={assets.search} alt="" /></div>
          <div className={styles.filters}>
            <span className={styles.filter}><span className={styles.filterBadge}>همه</span>۵</span>
            <span className={styles.filter}><span className={styles.filterBadge}>فعال</span>۳</span>
            <span className={styles.filter}><span className={styles.filterBadge}>پیش‌نویس</span>۱</span>
            <span className={styles.filter}><span className={styles.filterBadge}>غیرفعال</span>۱</span>
          </div>
        </div>

        <section className={styles.tableWrap}>
          <div className={styles.table}>
            <div className={styles.tableHeader}><span>اقدام</span><span>وضعیت</span><span>نرخ سود</span><span>مدت</span><span>حداقل رتبه اعتباری</span><span>سقف تأمین مالی</span><span>نوع</span><span>نام طرح</span></div>
            {rows.map((row, index) => (
              <div className={styles.tableRow} key={row.name}>
                <Link href={index === 0 ? "/bank/plans/1" : "/bank/plans/1"} className={styles.viewButton}>مشاهده</Link>
                <span className={`${styles.status} ${styles[row.tone]}`}>{row.status}</span>
                <span>{row.rate}</span><span>{row.duration}</span><span>{row.credit}</span><span>{row.max}</span><span>{row.type}</span>
                <span className={styles.nameCell}><strong>{row.name}</strong>{row.org ? <small>{row.org}</small> : null}</span>
              </div>
            ))}
          </div>
        </section>
      </section>
      <Sidebar />
    </main>
  );
}
