import Link from "next/link";
import styles from "./page.module.css";

const assets = {
  logo: "https://www.figma.com/api/mcp/asset/459a75fb-5788-4239-b8c6-954d523291b8.png",
  avatar: "https://www.figma.com/api/mcp/asset/a151dc85-98f0-4232-882d-2e09a9eee090.png",
  home: "https://www.figma.com/api/mcp/asset/32654715-9a3b-4059-b3cd-18a5d3aca38b.svg",
  contracts: "https://www.figma.com/api/mcp/asset/c9647ac1-46ca-4421-8dff-271f5bf8cf90.svg",
  payments: "https://www.figma.com/api/mcp/asset/21aded04-1ee0-47d9-aacb-5e20bde62954.svg",
  account: "https://www.figma.com/api/mcp/asset/7255fb55-c0a2-4dfa-b399-7af7ef07eccf.svg",
} as const;

type Tone = "payment" | "receipt" | "overdue" | "waiting" | "future" | "success";

function Badge({ children, tone }: { children: React.ReactNode; tone: Tone }) {
  return <span className={`${styles.badge} ${styles[`badge_${tone}`]}`}>{children}</span>;
}

type Activity = {
  nodeId: string;
  kind: "پرداخت" | "دریافت";
  kindTone: "payment" | "receipt";
  contract: string;
  role: "مستأجر" | "مالک";
  description: string;
  amount: string;
  date: string;
  status: string;
  statusTone: "overdue" | "waiting" | "future" | "success";
  action: string;
  primaryAction?: boolean;
};

const activities: Activity[] = [
  {
    nodeId: "150:482",
    kind: "پرداخت",
    kindTone: "payment",
    contract: "سعادت‌آباد",
    role: "مستأجر",
    description: "قسط معوق تأمین مالی — ماه ۱ از ۳",
    amount: "۱۸٬۵۰۰٬۰۰۰ تومان",
    date: "۱۵ شهریور ۱۴۰۵",
    status: "معوق",
    statusTone: "overdue",
    action: "پرداخت",
    primaryAction: true,
  },
  {
    nodeId: "150:498",
    kind: "پرداخت",
    kindTone: "payment",
    contract: "سعادت‌آباد",
    role: "مستأجر",
    description: "قسط ماهانه تأمین مالی",
    amount: "۱۸٬۵۰۰٬۰۰۰ تومان",
    date: "۱۵ آبان ۱۴۰۵",
    status: "در انتظار پرداخت",
    statusTone: "waiting",
    action: "پرداخت",
    primaryAction: true,
  },
  {
    nodeId: "150:514",
    kind: "دریافت",
    kindTone: "receipt",
    contract: "پونک",
    role: "مالک",
    description: "تسویه ماهانه قرارداد (خالص)",
    amount: "۱۴٬۹۲۵٬۰۰۰ تومان",
    date: "۱ آذر ۱۴۰۵",
    status: "آینده",
    statusTone: "future",
    action: "مشاهده قرارداد",
  },
  {
    nodeId: "150:530",
    kind: "پرداخت",
    kindTone: "payment",
    contract: "سعادت‌آباد",
    role: "مستأجر",
    description: "قسط مهر ۱۴۰۵",
    amount: "۱۸٬۵۰۰٬۰۰۰ تومان",
    date: "۱۵ مهر ۱۴۰۵",
    status: "پرداخت شده",
    statusTone: "success",
    action: "مشاهده رسید",
  },
  {
    nodeId: "150:546",
    kind: "دریافت",
    kindTone: "receipt",
    contract: "پونک",
    role: "مالک",
    description: "تسویه مهر ۱۴۰۵",
    amount: "۱۴٬۹۲۵٬۰۰۰ تومان",
    date: "۱ آبان ۱۴۰۵",
    status: "تسویه شده",
    statusTone: "success",
    action: "مشاهده رسید",
  },
];

export default function ReceivePayPage() {
  return (
    <main className={styles.page} data-node-id="150:412" data-name="Web App / Receive & Pay">
      <section className={styles.mainContent} data-node-id="150:413" data-name="Main Content">
        <header className={styles.headerBar} data-node-id="150:414" data-name="Header Bar">
          <div className={styles.headerSpacer} data-node-id="150:415" />
          <div className={styles.headerRight} data-node-id="150:416">
            <h1 data-node-id="150:417">دریافت و پرداخت</h1>
            <p data-node-id="150:418">سلام، علی رضایی</p>
          </div>
        </header>

        <section className={styles.pageHeader} data-node-id="150:419" data-name="Page Header Row">
          <h2 data-node-id="150:420">دریافت و پرداخت</h2>
          <p data-node-id="150:421">سوابق پرداخت‌ها و دریافتی‌های قراردادهای شما. کارمزد خدمات چارخونه (۰٫۵٪) از مبلغ ناخالص دریافتی کسر می‌شود.</p>
        </section>

        <section className={styles.overviewGrid} data-node-id="150:422" data-name="Overview Grid">
          <article className={styles.overviewCard} data-node-id="150:423">
            <div className={styles.overviewTop}><Badge tone="payment">پرداخت</Badge><span>پرداخت بعدی</span></div>
            <strong>۱۸٬۵۰۰٬۰۰۰ تومان</strong>
            <small>سررسید: ۱۵ آبان ۱۴۰۵</small>
          </article>
          <article className={styles.overviewCard} data-node-id="150:430">
            <div className={styles.overviewTop}><Badge tone="receipt">دریافت</Badge><span>دریافتی بعدی</span></div>
            <strong>۱۹٬۹۰۰٬۰۰۰ تومان</strong>
            <small>سررسید: ۱۵ آبان ۱۴۰۵</small>
          </article>
          <article className={styles.overviewCard} data-node-id="150:437">
            <div className={styles.overviewTop}><i aria-hidden="true" /><span>پرداخت‌های این ماه</span></div>
            <strong>۳۷٬۰۰۰٬۰۰۰ تومان</strong>
            <small>۲ پرداخت</small>
          </article>
          <article className={styles.overviewCard} data-node-id="150:443">
            <div className={styles.overviewTop}><i aria-hidden="true" /><span>دریافتی‌های این ماه</span></div>
            <strong>۴۰٬۰۰۰٬۰۰۰ تومان</strong>
            <small>۲ تسویه</small>
          </article>
        </section>

        <section className={styles.terminationCard} data-node-id="150:449">
          <div className={styles.terminationTop} data-node-id="150:450">
            <span className={styles.terminatedBadge} data-node-id="150:451">فسخ شده</span>
            <span className={styles.alertIcon} data-node-id="150:453">!</span>
          </div>
          <h3 data-node-id="150:455">قرارداد شما فسخ شده است</h3>
          <p data-node-id="150:456">به‌دلیل سه قسط معوق، قرارداد مطابق شرایط تعیین‌شده فسخ شده است. مبالغ معوق از آورده شما کسر شده و مالک از وضعیت تسویه مطلع شده است.</p>
          <div className={styles.terminationFooter} data-node-id="150:457">
            <button type="button" className={styles.terminatedAction} data-node-id="150:458">مشاهده وضعیت قرارداد</button>
            <span className={styles.overdueCount} data-node-id="150:460">۳ قسط معوق</span>
          </div>
        </section>

        <section className={styles.filters} data-node-id="150:462" data-name="Filter Row">
          <button type="button" className={styles.filterPill} data-node-id="150:463">همه وضعیت‌ها ▾</button>
          <div className={styles.filterGroup} data-node-id="150:465">
            <button type="button" className={styles.filterPill}>دریافتی‌ها</button>
            <button type="button" className={styles.filterPill}>پرداخت‌ها</button>
            <button type="button" className={`${styles.filterPill} ${styles.filterActive}`}>همه</button>
          </div>
        </section>

        <section className={styles.tableWrap} data-node-id="150:472" data-name="Financial Table">
          <div className={styles.tableScroller}>
            <div className={`${styles.tableRow} ${styles.tableHeader}`} data-node-id="150:473">
              <span>عملیات</span><span>وضعیت</span><span>تاریخ</span><span>مبلغ</span><span>شرح</span><span>قرارداد</span><span>نوع</span>
            </div>
            {activities.map((item) => (
              <div className={styles.tableRow} data-node-id={item.nodeId} key={item.nodeId}>
                <span className={styles.actionCell}>
                  <button type="button" className={item.primaryAction ? styles.primaryButton : styles.linkButton}>{item.action}</button>
                </span>
                <span><Badge tone={item.statusTone}>{item.status}</Badge></span>
                <span className={styles.muted}>{item.date}</span>
                <strong>{item.amount}</strong>
                <span>{item.description}</span>
                <span className={styles.contractCell}><strong>{item.contract}</strong><small>{item.role}</small></span>
                <span><Badge tone={item.kindTone}>{item.kind}</Badge></span>
              </div>
            ))}
          </div>
        </section>
      </section>

      <aside className={styles.sidebar} data-node-id="150:562" data-name="Right Sidebar">
        <div className={styles.sidebarTop} data-node-id="150:563">
          <div className={styles.logoWrap} data-node-id="150:564"><img src={assets.logo} alt="چارخونه" width={127} height={55} /></div>
          <nav className={styles.nav} data-node-id="150:565" aria-label="ناوبری حساب کاربری">
            <Link href="/user/home" className={styles.navItem} data-node-id="150:566"><span>خانه</span><img src={assets.home} alt="" width={20} height={20} /></Link>
            <Link href="/user/contracts" className={styles.navItem} data-node-id="150:569"><span className={styles.alertBadge}>۱</span><span>قراردادها</span><img src={assets.contracts} alt="" width={20} height={20} /></Link>
            <Link href="/user/receive-pay" className={`${styles.navItem} ${styles.navActive}`} data-node-id="150:574"><span>دریافت و پرداخت</span><img src={assets.payments} alt="" width={20} height={20} /></Link>
            <div className={styles.navItem} data-node-id="142:2018"><span className={styles.navSpacer} /><span>حساب من</span><img src={assets.account} alt="" width={20} height={20} /></div>
          </nav>
        </div>
        <div className={styles.profile} data-node-id="150:580"><img className={styles.avatar} src={assets.avatar} alt="" width={40} height={40} /><div className={styles.profileText} data-node-id="150:582"><strong data-node-id="150:583">علی رضایی</strong><span data-node-id="150:584">۰۹۱۲•••••۶۷</span></div></div>
      </aside>
    </main>
  );
}
