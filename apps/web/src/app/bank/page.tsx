import Link from "next/link";
import styles from "./panel.module.css";

const assets = {
  avatar: "https://www.figma.com/api/mcp/asset/c6820de6-1f42-482f-b29a-c04fc5cbd573.png",
  logo: "https://www.figma.com/api/mcp/asset/fa635f7e-7da9-46c3-812b-5a0455d278d4.png",
  home: "https://www.figma.com/api/mcp/asset/e2a910a2-55fd-4d2f-9759-bdc6f37b5a88.svg",
  requests: "https://www.figma.com/api/mcp/asset/85bdcd86-8c4f-4037-8a5d-b45638546300.svg",
  plans: "https://www.figma.com/api/mcp/asset/c7f204cc-53f0-463f-bef7-6b114924fb44.svg",
  payments: "https://www.figma.com/api/mcp/asset/246dafdf-a77c-479a-a171-49ca01fe188b.svg",
  settings: "https://www.figma.com/api/mcp/asset/6e0446b7-eab2-4824-bdb1-72cdd9913e93.svg",
  logout: "https://www.figma.com/api/mcp/asset/d71706f3-57a1-4777-bc5c-369f32b5c7ff.svg",
} as const;

const requests = [
  ["محمد رضایی", "طرح مسکن ویژه", "۵۰۰٬۰۰۰٬۰۰۰ تومان", "۱۴۰۵/۰۶/۰۸"],
  ["فاطمه احمدی", "طرح اجاره به شرط تملیک", "۳۲۰٬۰۰۰٬۰۰۰ تومان", "۱۴۰۵/۰۶/۰۷"],
  ["علی محمدی", "طرح مسکن جوانان", "۲۸۰٬۰۰۰٬۰۰۰ تومان", "۱۴۰۵/۰۶/۰۷"],
  ["سارا کریمی", "طرح مسکن ویژه", "۴۵۰٬۰۰۰٬۰۰۰ تومان", "۱۴۰۵/۰۶/۰۶"],
] as const;

function Sidebar() {
  return (
    <aside className={styles.sidebar} data-node-id="260:319" data-name="sidebar-container">
      <div className={styles.brand}><img className={styles.logo} src={assets.logo} alt="چارخونه" width={127} height={55} /><div className={styles.bankIdentity}><strong>بانک نمونه</strong><span>تیم مدیریت تسهیلات</span></div></div>
      <nav className={styles.nav} data-node-id="260:328">
        <Link href="/bank" className={`${styles.navItem} ${styles.navActive}`}><span>خانه</span><img src={assets.home} alt="" width={18} height={18} /></Link>
        <Link href="/bank/requests" className={styles.navItem}><span>درخواست‌ها</span><img src={assets.requests} alt="" width={18} height={18} /></Link>
        <Link href="/bank/plans" className={styles.navItem}><span>طرح‌ها</span><img src={assets.plans} alt="" width={18} height={18} /></Link>
        <Link href="/bank/receive-pay" className={styles.navItem}><span>دریافت و پرداخت</span><img src={assets.payments} alt="" width={18} height={18} /></Link>
        <Link href="/bank/settings" className={styles.navItem}><span>تنظیمات</span><img src={assets.settings} alt="" width={18} height={18} /></Link>
        <Link href="/bank/login" className={`${styles.navItem} ${styles.logout}`}><span>خروج از حساب</span><img src={assets.logout} alt="" width={18} height={18} /></Link>
      </nav>
    </aside>
  );
}

export default function BankDashboardPage() {
  return (
    <main className={styles.page} data-node-id="260:218" data-name="Bank / Dashboard">
      <section className={styles.mainContent} data-node-id="260:219">
        <header className={styles.header} data-node-id="260:220">
          <div className={styles.userInfo} data-node-id="260:221"><div className={styles.userCopy}><strong data-node-id="260:223">شعبه مرکزی تهران</strong><span data-node-id="260:224">تیم چارخونه بانک</span></div><img className={styles.avatar} src={assets.avatar} alt="" width={40} height={40} /></div>
          <div className={styles.headerCopy} data-node-id="260:226"><h1 data-node-id="260:227">خانه</h1><p data-node-id="260:228">نمای کلی فعالیت بانک در چارخونه</p></div>
        </header>

        <section className={styles.kpis} data-node-id="260:229">
          <div className={styles.kpi} data-node-id="260:230"><div className={styles.kpiTop}><span className={styles.kpiBadge}>قراردادهای جاری</span><span className={styles.kpiLabel}>تسهیلات فعال</span></div><strong data-node-id="260:235">۲۴۶ قرارداد</strong></div>
          <div className={styles.kpi} data-node-id="260:236"><div className={styles.kpiTop}><span className={styles.kpiBadge}>موفق</span><span className={styles.kpiLabel}>تأییدشده امروز</span></div><strong data-node-id="260:241">۸ درخواست</strong></div>
          <div className={styles.kpi} data-node-id="260:242"><div className={styles.kpiTop}><span className={styles.warningBadge}>نیازمند اقدام</span><span className={styles.kpiLabel}>آماده بررسی بانک</span></div><strong data-node-id="260:247">۱۲ درخواست</strong></div>
        </section>

        <section className={styles.section} data-node-id="260:248">
          <h2 className={styles.sectionTitle} data-node-id="260:249">نیازمند اقدام</h2>
          <div className={styles.tableWrap} data-node-id="260:250"><div className={styles.table}>
            <div className={styles.tableHeader} data-node-id="260:251"><span>اقدام</span><span>وضعیت</span><span>زمان ثبت</span><span>مبلغ درخواست</span><span>طرح</span><span>متقاضی</span></div>
            {requests.map(([applicant, plan, amount, date], index) => <div className={styles.tableRow} key={`${applicant}-${date}`} data-node-id={`260:${258 + index * 11}`}><Link href="/bank/requests/1" className={styles.reviewLink}>بررسی درخواست</Link><span className={styles.statusReady}>آماده بررسی بانک</span><span className={styles.date}>{date}</span><span className={styles.amountCell}>{amount}</span><span>{plan}</span><span className={styles.applicant}>{applicant}</span></div>)}
          </div></div>
          <Link href="/bank/requests" className={styles.viewAll} data-node-id="260:302">مشاهده همه درخواست‌ها ‹</Link>
        </section>

        <section className={styles.section} data-node-id="260:304"><h2 className={styles.sectionTitle} data-node-id="260:305">خلاصه مالی</h2><div className={styles.financialCards} data-node-id="260:306"><div className={styles.financialCard} data-node-id="260:307"><span>اصل تسهیلات تسویه‌شده</span><strong>۴۲٬۰۰۰٬۰۰۰٬۰۰۰ تومان</strong><small>اصل تسهیلات وصول‌شده در پایان قرارداد</small></div><div className={styles.financialCard} data-node-id="260:311"><span>سود دریافتی این ماه</span><strong>۳٬۸۵۰٬۰۰۰٬۰۰۰ تومان</strong><small>سود ماهانه دریافت‌شده از قراردادها</small></div><div className={styles.financialCard} data-node-id="260:315"><span>اصل تسهیلات تأمین‌شده</span><strong>۱۲۵٬۰۰۰٬۰۰۰٬۰۰۰ تومان</strong><small>مبلغ تأمین‌شده برای تسهیلات فعال</small></div></div></section>
      </section>
      <Sidebar />
    </main>
  );
}
