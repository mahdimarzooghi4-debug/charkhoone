import Link from "next/link";
import styles from "../panel.module.css";

const assets = {
  avatar: "https://www.figma.com/api/mcp/asset/c59fd359-0b0d-4259-81de-18a712641ca0.png",
  logo: "https://www.figma.com/api/mcp/asset/2b13ea63-9ace-44fe-a45f-2d0ebae0da35.png",
  chevron: "https://www.figma.com/api/mcp/asset/43f84162-f1d6-4130-9cd0-187ddc70d979.svg",
  search: "https://www.figma.com/api/mcp/asset/ffacea3d-2b80-4000-93f9-26bc8aaec75e.svg",
  home: "https://www.figma.com/api/mcp/asset/829b1b9f-6254-47c3-8c0f-c48fd86859b8.svg",
  requests: "https://www.figma.com/api/mcp/asset/98683132-cb26-4a95-bd6b-1baac7d7feea.svg",
  plans: "https://www.figma.com/api/mcp/asset/e12ab1cf-5179-45ea-a524-737f4e773c30.svg",
  payments: "https://www.figma.com/api/mcp/asset/3bdc0143-d4f6-4bca-8edb-4e987b2fe9d2.svg",
  settings: "https://www.figma.com/api/mcp/asset/9f7cbf00-667e-496e-b7a6-8f5b2ae34d73.svg",
  logout: "https://www.figma.com/api/mcp/asset/8e427c97-c1d9-4f49-bed7-a845854d4c3f.svg",
} as const;

type Status = "ready" | "review" | "approved" | "rejected";

type RequestRow = {
  applicant: string;
  contract: string;
  plan: string;
  amount: string;
  time: string;
  status: Status;
};

const requests: RequestRow[] = [
  { applicant: "محمد رضایی", contract: "۱۴۰۵-۸۳۲۱", plan: "طرح مسکن ویژه", amount: "۵۰۰٬۰۰۰٬۰۰۰ تومان", time: "امروز، ۱۰:۴۵", status: "ready" },
  { applicant: "فاطمه احمدی", contract: "۱۴۰۵-۷۵۴۲", plan: "طرح مسکن ویژه", amount: "۳۵۰٬۰۰۰٬۰۰۰ تومان", time: "دیروز، ۱۴:۳۰", status: "review" },
  { applicant: "علی محمدی", contract: "۱۴۰۵-۶۱۰۳", plan: "طرح مسکن جوانان", amount: "۲۸۰٬۰۰۰٬۰۰۰ تومان", time: "۱۴۰۴/۰۶/۱۵", status: "approved" },
  { applicant: "سارا کریمی", contract: "۱۴۰۵-۵۹۸۷", plan: "طرح مسکن ویژه", amount: "۴۲۰٬۰۰۰٬۰۰۰ تومان", time: "۱۴۰۴/۰۶/۱۴", status: "rejected" },
  { applicant: "رضا حسینی", contract: "۱۴۰۵-۵۴۳۲", plan: "طرح عمومی بانک", amount: "۶۰۰٬۰۰۰٬۰۰۰ تومان", time: "۱۴۰۴/۰۶/۱۳", status: "approved" },
  { applicant: "مریم نوری", contract: "۱۴۰۵-۵۱۰۰", plan: "طرح مسکن جوانان", amount: "۳۱۰٬۰۰۰٬۰۰۰ تومان", time: "۱۴۰۴/۰۶/۱۲", status: "ready" },
];

const statusMeta: Record<Status, { label: string; className: string; action: string; href: string }> = {
  ready: { label: "آماده بررسی بانک", className: styles.statusReady, action: "بررسی", href: "/bank/requests/1" },
  review: { label: "در حال بررسی", className: styles.statusReview, action: "بررسی", href: "/bank/requests/1" },
  approved: { label: "تأییدشده", className: styles.statusApproved, action: "مشاهده", href: "/bank/requests/1/approved" },
  rejected: { label: "ردشده", className: styles.statusRejected, action: "مشاهده", href: "/bank/requests/1/rejected" },
};

export default function BankRequestsPage() {
  return (
    <main className={styles.page} data-node-id="264:160" data-name="Bank / Requests">
      <section className={styles.mainContent} data-node-id="264:161">
        <header className={styles.header} data-node-id="264:162">
          <div className={styles.userInfo} data-node-id="264:163">
            <div className={styles.userCopy}><strong data-node-id="264:165">شعبه مرکزی تهران</strong><span data-node-id="264:166">تیم چارخونه بانک</span></div>
            <img className={styles.avatar} src={assets.avatar} alt="" width={40} height={40} data-node-id="264:167" />
          </div>
          <div className={styles.headerCopy} data-node-id="264:168"><h1 data-node-id="264:169">درخواست‌های تأمین مالی</h1><p data-node-id="264:170">بررسی و مدیریت درخواست‌های ارسال‌شده به بانک</p></div>
        </header>

        <div className={styles.filterTabs} data-node-id="264:171" data-name="status-filters">
          <span className={styles.filterTab}><span className={styles.tabCount}>۱۴</span>ردشده</span>
          <span className={styles.filterTab}><span className={styles.tabCount}>۹۴</span>تأییدشده</span>
          <span className={styles.filterTab}><span className={styles.tabCount}>۸</span>در حال بررسی</span>
          <span className={styles.filterTab}><span className={styles.tabCount}>۱۲</span>آماده بررسی بانک</span>
          <span className={`${styles.filterTab} ${styles.filterTabActive}`}><span className={styles.tabCount}>۱۲۸</span>همه</span>
        </div>

        <div className={styles.toolbar} data-node-id="264:192">
          <div className={styles.toolbarFilters} data-node-id="264:193">
            <span className={styles.dropdownFilter} data-node-id="264:194"><img src={assets.chevron} alt="" width={10} height={6} /><span>کارشناس</span></span>
            <span className={styles.dropdownFilter} data-node-id="264:197"><img src={assets.chevron} alt="" width={10} height={6} /><span>طرح</span></span>
          </div>
          <div className={styles.searchBox} data-node-id="264:200"><span data-node-id="264:201">جستجو نام، کد قرارداد یا کد درخواست</span><img src={assets.search} alt="" width={16} height={16} /></div>
        </div>

        <div className={styles.tableWrap} data-node-id="264:203">
          <div className={styles.requestsTable}>
            <div className={styles.requestsHeader} data-node-id="264:204"><span>اقدام</span><span>وضعیت</span><span>زمان ثبت</span><span>مبلغ درخواست</span><span>طرح</span><span>کد قرارداد</span><span>متقاضی</span></div>
            {requests.map((request) => {
              const meta = statusMeta[request.status];
              return (
                <div className={styles.requestsRow} key={request.contract}>
                  <Link href={meta.href} className={styles.requestAction}>{meta.action}</Link>
                  <span className={`${styles.requestStatus} ${meta.className}`}>{meta.label}</span>
                  <span className={styles.requestTime}>{request.time}</span>
                  <span className={styles.amountCell}>{request.amount}</span>
                  <span>{request.plan}</span>
                  <span className={styles.contractCode}>{request.contract}</span>
                  <span className={styles.applicant}>{request.applicant}</span>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <aside className={styles.sidebar} data-node-id="264:284">
        <div className={styles.brand}><img className={styles.logo} src={assets.logo} alt="چارخونه" width={127} height={55} /><div className={styles.bankIdentity}><strong>بانک نمونه</strong><span>تیم مدیریت تسهیلات</span></div></div>
        <nav className={styles.nav} data-node-id="264:290">
          <Link href="/bank" className={styles.navItem}><span>خانه</span><img src={assets.home} alt="" width={18} height={18} /></Link>
          <Link href="/bank/requests" className={`${styles.navItem} ${styles.navActive}`}><span>درخواست‌ها</span><img src={assets.requests} alt="" width={18} height={18} /></Link>
          <Link href="/bank/plans" className={styles.navItem}><span>طرح‌ها</span><img src={assets.plans} alt="" width={18} height={18} /></Link>
          <Link href="/bank/receive-pay" className={styles.navItem}><span>دریافت و پرداخت</span><img src={assets.payments} alt="" width={18} height={18} /></Link>
          <Link href="/bank/settings" className={styles.navItem}><span>تنظیمات</span><img src={assets.settings} alt="" width={18} height={18} /></Link>
          <Link href="/bank/login" className={`${styles.navItem} ${styles.logout}`}><span>خروج از حساب</span><img src={assets.logout} alt="" width={18} height={18} /></Link>
        </nav>
      </aside>
    </main>
  );
}
