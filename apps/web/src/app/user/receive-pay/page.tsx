import Link from "next/link";
import styles from "./page.module.css";
import { UserPanelSidebar } from "@/components/user/UserPanelSidebar";

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
  href?: string;
};

const activities: Activity[] = [
  { nodeId: "150:482", kind: "پرداخت", kindTone: "payment", contract: "سعادت‌آباد", role: "مستأجر", description: "قسط معوق تأمین مالی — ماه ۱ از ۳", amount: "۱۸٬۵۰۰٬۰۰۰ تومان", date: "۱۵ شهریور ۱۴۰۵", status: "معوق", statusTone: "overdue", action: "پرداخت", primaryAction: true },
  { nodeId: "150:498", kind: "پرداخت", kindTone: "payment", contract: "سعادت‌آباد", role: "مستأجر", description: "قسط ماهانه تأمین مالی", amount: "۱۸٬۵۰۰٬۰۰۰ تومان", date: "۱۵ آبان ۱۴۰۵", status: "در انتظار پرداخت", statusTone: "waiting", action: "پرداخت", primaryAction: true, href: "/user/receive-pay/result" },
  { nodeId: "150:514", kind: "دریافت", kindTone: "receipt", contract: "پونک", role: "مالک", description: "تسویه ماهانه قرارداد (خالص)", amount: "۱۴٬۹۲۵٬۰۰۰ تومان", date: "۱ آذر ۱۴۰۵", status: "آینده", statusTone: "future", action: "مشاهده قرارداد" },
  { nodeId: "150:530", kind: "پرداخت", kindTone: "payment", contract: "سعادت‌آباد", role: "مستأجر", description: "قسط مهر ۱۴۰۵", amount: "۱۸٬۵۰۰٬۰۰۰ تومان", date: "۱۵ مهر ۱۴۰۵", status: "پرداخت شده", statusTone: "success", action: "مشاهده رسید", href: "/user/receive-pay/receipt" },
  { nodeId: "150:546", kind: "دریافت", kindTone: "receipt", contract: "پونک", role: "مالک", description: "تسویه مهر ۱۴۰۵", amount: "۱۴٬۹۲۵٬۰۰۰ تومان", date: "۱ آبان ۱۴۰۵", status: "تسویه شده", statusTone: "success", action: "مشاهده رسید" },
];

export default function ReceivePayPage() {
  return (
    <main className={styles.page} data-node-id="150:412" data-name="Web App / Receive & Pay">
      <section className={styles.mainContent} data-node-id="150:413" data-name="Main Content">
        <header className={styles.headerBar} data-node-id="150:414"><div className={styles.headerSpacer} /><div className={styles.headerRight}><h1 data-node-id="150:417">دریافت و پرداخت</h1><p data-node-id="150:418">سلام، علی رضایی</p></div></header>
        <section className={styles.pageHeader} data-node-id="150:419"><h2 data-node-id="150:420">دریافت و پرداخت</h2><p data-node-id="150:421">سوابق پرداخت‌ها و دریافتی‌های قراردادهای شما. کارمزد خدمات چارخونه (۰٫۵٪) از مبلغ ناخالص دریافتی کسر می‌شود.</p></section>
        <section className={styles.overviewGrid} data-node-id="150:422"><article className={styles.overviewCard}><div className={styles.overviewTop}><Badge tone="payment">پرداخت</Badge><span>پرداخت بعدی</span></div><strong>۱۸٬۵۰۰٬۰۰۰ تومان</strong><small>سررسید: ۱۵ آبان ۱۴۰۵</small></article><article className={styles.overviewCard}><div className={styles.overviewTop}><Badge tone="receipt">دریافت</Badge><span>دریافتی بعدی</span></div><strong>۱۹٬۹۰۰٬۰۰۰ تومان</strong><small>سررسید: ۱۵ آبان ۱۴۰۵</small></article><article className={styles.overviewCard}><div className={styles.overviewTop}><i aria-hidden="true" /><span>پرداخت‌های این ماه</span></div><strong>۳۷٬۰۰۰٬۰۰۰ تومان</strong><small>۲ پرداخت</small></article><article className={styles.overviewCard}><div className={styles.overviewTop}><i aria-hidden="true" /><span>دریافتی‌های این ماه</span></div><strong>۴۰٬۰۰۰٬۰۰۰ تومان</strong><small>۲ تسویه</small></article></section>
        <section className={styles.terminationCard} data-node-id="150:449"><div className={styles.terminationTop}><span className={styles.terminatedBadge}>فسخ شده</span><span className={styles.alertIcon}>!</span></div><h3>قرارداد شما فسخ شده است</h3><p>به‌دلیل سه قسط معوق، قرارداد مطابق شرایط تعیین‌شده فسخ شده است. مبالغ معوق از آورده شما کسر شده و مالک از وضعیت تسویه مطلع شده است.</p><div className={styles.terminationFooter}><button type="button" className={styles.terminatedAction}>مشاهده وضعیت قرارداد</button><span className={styles.overdueCount}>۳ قسط معوق</span></div></section>
        <section className={styles.filters} data-node-id="150:462"><button type="button" className={styles.filterPill}>همه وضعیت‌ها ▾</button><div className={styles.filterGroup}><button type="button" className={styles.filterPill}>دریافتی‌ها</button><button type="button" className={styles.filterPill}>پرداخت‌ها</button><button type="button" className={`${styles.filterPill} ${styles.filterActive}`}>همه</button></div></section>
        <section className={styles.tableWrap} data-node-id="150:472"><div className={styles.tableScroller}><div className={`${styles.tableRow} ${styles.tableHeader}`}><span>عملیات</span><span>وضعیت</span><span>تاریخ</span><span>مبلغ</span><span>شرح</span><span>قرارداد</span><span>نوع</span></div>{activities.map((item) => <div className={styles.tableRow} data-node-id={item.nodeId} key={item.nodeId}><span className={styles.actionCell}>{item.href ? <Link href={item.href} className={item.primaryAction ? styles.primaryButton : styles.linkButton}>{item.action}</Link> : <button type="button" className={item.primaryAction ? styles.primaryButton : styles.linkButton}>{item.action}</button>}</span><span><Badge tone={item.statusTone}>{item.status}</Badge></span><span className={styles.muted}>{item.date}</span><strong>{item.amount}</strong><span>{item.description}</span><span className={styles.contractCell}><strong>{item.contract}</strong><small>{item.role}</small></span><span><Badge tone={item.kindTone}>{item.kind}</Badge></span></div>)}</div></section>
      </section>
      <UserPanelSidebar nodeId="150:562" />
    </main>
  );
}
