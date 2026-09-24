import Link from "next/link";
import styles from "./page.module.css";
import { UserPanelSidebar } from "@/components/user/UserPanelSidebar";

const assets = {
  logo: "/brand/dashboard-logo.png",
  avatar: "/brand/dashboard-avatar.png",
  calculator: "/brand/dashboard-calculator.svg",
  quickFile: "/brand/dashboard-quick-file.svg",
  quickHome: "/brand/dashboard-quick-home.svg",
  navHome: "/brand/dashboard-nav-home.svg",
  navFile: "/brand/dashboard-nav-file.svg",
  navCard: "/brand/dashboard-nav-card.svg",
  navUser: "/brand/dashboard-nav-user.svg",
} as const;

const quickAccess = [
  { label: "ماشین‌حساب", icon: assets.calculator, nodeId: "144:205", href: "/user/calculator" },
  { label: "ثبت کد رهگیری", icon: assets.quickFile, nodeId: "144:211", href: "/user/contracts/register" },
  { label: "املاک من", icon: assets.quickHome, nodeId: "144:217", href: "/user/properties" },
];

function Badge({ children, tone = "green" }: { children: React.ReactNode; tone?: "green" | "orange" | "blue" | "red" | "gray" }) {
  return <span className={`${styles.badge} ${styles[`badge_${tone}`]}`}>{children}</span>;
}

function QuickItem({ label, icon, nodeId, href }: { label: string; icon: string; nodeId: string; href: string | null }) {
  const content = <><span className={styles.chevron}>‹</span><span className={styles.quickLabel}><span>{label}</span><span className={styles.quickIcon}><img src={icon} alt="" width={16} height={16} /></span></span></>;
  return href ? <Link href={href} className={styles.quickItem} data-node-id={nodeId}>{content}</Link> : <div className={styles.quickItem} data-node-id={nodeId}>{content}</div>;
}

export default function UserHomePage() {
  return (
    <main className={styles.page} data-node-id="144:154" data-name="Web App / Home">
      <section className={styles.mainContent} data-node-id="144:155" data-name="Main Content">
        <header className={styles.headerBar} data-node-id="144:156"><div className={styles.headerText} data-node-id="144:159"><h1 data-node-id="144:160">خانه</h1><p data-node-id="144:161">سلام، علی رضایی</p></div></header>
        <section className={styles.overviewGrid} data-node-id="144:162">
          <article className={styles.overviewCard} data-node-id="144:163"><p className={styles.cardLabel}>قراردادهای فعال</p><strong className={styles.primaryValue}>۲ قرارداد</strong><p className={styles.cardHint}>۱ قرارداد به‌عنوان مستأجر، ۱ قرارداد به‌عنوان مالک</p></article>
          <article className={styles.overviewCard} data-node-id="144:167"><div className={styles.cardTopRow}><Badge tone="orange">پرداخت</Badge><p className={styles.cardLabel}>پرداخت بعدی</p></div><strong className={styles.accentValue}>۶٬۷۰۸٬۳۳۳ تومان</strong><p className={styles.cardHint}>سررسید: ۱۵ آبان ۱۴۰۵</p></article>
          <article className={styles.overviewCard} data-node-id="144:175"><div className={styles.cardTopRow}><Badge>دریافت</Badge><p className={styles.cardLabel}>دریافتی بعدی</p></div><strong className={styles.primaryValue}>۳۴٬۸۲۵٬۰۰۰ تومان</strong><p className={styles.cardHint}>برآورد خالص دریافتی مالک بر پایه رهن کامل معادل ۱٬۱۶۶٬۶۶۶٬۶۶۷ تومان، پس از کارمزد نمونه ۰٫۵٪ · ۱۵ آبان ۱۴۰۵</p></article>
          <article className={styles.overviewCard} data-node-id="144:182"><p className={styles.cardLabel}>نیاز به اقدام</p><strong className={styles.dangerValue}>۱ مورد</strong><p className={styles.cardHint}>یک قرارداد نیاز به بررسی دارد</p></article>
        </section>
        <section className={styles.membershipCard} data-node-id="184:413"><div className={styles.membershipTitle}><Badge>نمونه</Badge><strong>عضویت چارخونه — سناریوی داشبورد</strong></div><div className={styles.membershipInfo}><span className={styles.verticalDivider} /><span className={styles.infoPair}><span>سقف تأمین مالی</span><strong>تا ۵۰۰٬۰۰۰٬۰۰۰ تومان</strong></span><span className={`${styles.infoPair} ${styles.remainingInfo}`}><span>دفعات باقی‌مانده</span><strong>۱ بار</strong></span></div></section>
        <section className={styles.actionsSection} data-node-id="144:186"><h2>اقدام‌های موردنیاز</h2><article className={styles.actionCard}><Link href="/user/contracts/123456789012/owner/settlement-preference" className={styles.actionButton}>بررسی قرارداد</Link><div className={styles.actionContent}><div className={styles.actionTitleRow}><Badge tone="blue">مالک</Badge><Badge tone="orange">نیاز به اقدام</Badge><strong>انتخاب روش دریافت و تأیید قرارداد</strong></div><p>برای ادامه پیش‌نمایش مالک، ابتدا روش دریافت قرارداد سعادت‌آباد را انتخاب کنید.</p></div></article><article className={styles.actionCard}><Link href="/user/contracts/register/plans/membership?plan=staff" className={styles.actionButton}>پیش‌نمایش عضویت</Link><div className={styles.actionContent}><div className={styles.actionTitleRow}><Badge>مستأجر</Badge><Badge tone="blue">مسیر نمایشی جایگزین</Badge><strong>انتخاب عضویت چارخونه</strong></div><p>عضویت فعال بالا یک داده نمونه داشبورد است؛ در این مسیر جداگانه می‌توانید انتخاب یا استفاده از عضویت نمونه را ببینید. وضعیت واقعی حساب تغییر نمی‌کند.</p></div></article></section>
        <section className={styles.contractsSplit} data-node-id="144:201"><div className={styles.quickBlock}><h2>دسترسی سریع</h2><div className={styles.quickList}>{quickAccess.map((item) => <QuickItem key={item.label} {...item} />)}</div></div><div className={styles.recentBlock}><div className={styles.sectionHeader}><Link href="/user/contracts">مشاهده همه قراردادها</Link><h2>قراردادهای اخیر</h2></div><div className={styles.contractList}><article className={styles.contractCard}><div className={styles.contractHeader}><div className={styles.badgeRow}><Badge>مستأجر</Badge><Badge>فعال</Badge></div><strong>سعادت‌آباد</strong></div><div className={styles.divider} /><div className={styles.contractMeta}><strong>پرداخت بعدی: ۶٬۷۰۸٬۳۳۳ تومان</strong><span>تا ۱۵ مهر ۱۴۰۶</span></div></article><article className={styles.contractCard}><div className={styles.contractHeader}><div className={styles.badgeRow}><Badge tone="blue">مالک</Badge><Badge>فعال</Badge></div><strong>پونک</strong></div><div className={styles.divider} /><div className={styles.contractMeta}><strong>دریافتی بعدی: ۱۴٬۹۲۵٬۰۰۰ تومان</strong><span>تا ۱ آبان ۱۴۰۶</span></div></article></div></div></section>
        <section className={styles.financialSection} data-node-id="144:252"><div className={styles.sectionHeader}><Link href="/user/receive-pay">مشاهده همه</Link><h2>دریافت و پرداخت</h2></div><div className={styles.activityTable}><div className={styles.tableHeader}><span>وضعیت</span><span>تاریخ</span><span>مبلغ</span><span>قرارداد</span><span>نوع</span></div><div className={styles.tableRow}><span><Badge tone="orange">در انتظار پرداخت</Badge></span><span className={styles.muted}>۱۵ آبان ۱۴۰۵</span><strong>۶٬۷۰۸٬۳۳۳ تومان</strong><span>سعادت‌آباد</span><span><Badge tone="red">پرداخت</Badge></span></div><div className={styles.tableRow}><span><Badge tone="gray">آینده</Badge></span><span className={styles.muted}>۱ آذر ۱۴۰۵</span><strong>۱۴٬۹۲۵٬۰۰۰ تومان</strong><span>پونک</span><span><Badge>دریافت</Badge></span></div></div></section>
      </section>
      <UserPanelSidebar nodeId="144:284" />
    </main>
  );
}
