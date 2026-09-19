import Link from "next/link";
import styles from "./page.module.css";

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

const navItems = [
  { label: "خانه", icon: assets.navHome, active: true, nodeId: "144:291", href: "/user/home" },
  { label: "قراردادها", icon: assets.navFile, active: false, nodeId: "144:294", href: "/user/contracts" },
  { label: "دریافت و پرداخت", icon: assets.navCard, active: false, nodeId: "144:297", href: "/user/receive-pay" },
  { label: "حساب من", icon: assets.navUser, active: false, nodeId: "144:300", href: "/user/account" },
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
          <article className={styles.overviewCard} data-node-id="144:167"><div className={styles.cardTopRow}><Badge tone="orange">پرداخت</Badge><p className={styles.cardLabel}>پرداخت بعدی</p></div><strong className={styles.accentValue}>۱۸٬۵۰۰٬۰۰۰ تومان</strong><p className={styles.cardHint}>سررسید: ۱۵ آبان ۱۴۰۵</p></article>
          <article className={styles.overviewCard} data-node-id="144:175"><div className={styles.cardTopRow}><Badge>دریافت</Badge><p className={styles.cardLabel}>دریافتی بعدی</p></div><strong className={styles.primaryValue}>۱۹٬۹۰۰٬۰۰۰ تومان</strong><p className={styles.cardHint}>پس از کسر کارمزد خدمات چارخونه · سررسید: ۱۵ آبان ۱۴۰۵</p></article>
          <article className={styles.overviewCard} data-node-id="144:182"><p className={styles.cardLabel}>نیاز به اقدام</p><strong className={styles.dangerValue}>۱ مورد</strong><p className={styles.cardHint}>یک قرارداد نیاز به بررسی دارد</p></article>
        </section>
        <section className={styles.membershipCard} data-node-id="184:413"><div className={styles.membershipTitle}><Badge>فعال</Badge><strong>عضویت چارخونه</strong></div><div className={styles.membershipInfo}><span className={styles.verticalDivider} /><span className={styles.infoPair}><span>سقف تأمین مالی</span><strong>تا ۵۰۰٬۰۰۰٬۰۰۰ تومان</strong></span><span className={styles.infoPair}><span>دفعات باقی‌مانده</span><strong>۱ بار</strong></span></div></section>
        <section className={styles.actionsSection} data-node-id="144:186"><h2>اقدام‌های موردنیاز</h2><article className={styles.actionCard}><button type="button" className={styles.actionButton}>بررسی قرارداد</button><div className={styles.actionContent}><div className={styles.actionTitleRow}><Badge tone="blue">مالک</Badge><Badge tone="orange">نیاز به اقدام</Badge><strong>تأیید نهایی قرارداد</strong></div><p>قرارداد سعادت‌آباد با نقش مالک آماده تأیید نهایی است.</p></div></article><article className={styles.actionCard}><Link href="/user/contracts" className={styles.actionButton}>مشاهده قراردادها</Link><div className={styles.actionContent}><div className={styles.actionTitleRow}><Badge>مستأجر</Badge><Badge tone="orange">نیاز به اقدام</Badge><strong>فعال‌سازی عضویت چارخونه</strong></div><p>برای ادامه فرایند تأمین مالی این قرارداد، عضویت مناسب خود را انتخاب کنید.</p></div></article></section>
        <section className={styles.contractsSplit} data-node-id="144:201"><div className={styles.quickBlock}><h2>دسترسی سریع</h2><div className={styles.quickList}>{quickAccess.map((item) => <QuickItem key={item.label} {...item} />)}</div></div><div className={styles.recentBlock}><div className={styles.sectionHeader}><Link href="/user/contracts">مشاهده همه قراردادها</Link><h2>قراردادهای اخیر</h2></div><div className={styles.contractList}><article className={styles.contractCard}><div className={styles.contractHeader}><div className={styles.badgeRow}><Badge>مستأجر</Badge><Badge>فعال</Badge></div><strong>سعادت‌آباد</strong></div><div className={styles.divider} /><div className={styles.contractMeta}><strong>پرداخت بعدی: ۱۸٬۵۰۰٬۰۰۰ تومان</strong><span>تا ۱۵ مهر ۱۴۰۶</span></div></article><article className={styles.contractCard}><div className={styles.contractHeader}><div className={styles.badgeRow}><Badge tone="blue">مالک</Badge><Badge>فعال</Badge></div><strong>پونک</strong></div><div className={styles.divider} /><div className={styles.contractMeta}><strong>دریافتی بعدی: ۱۴٬۹۲۵٬۰۰۰ تومان</strong><span>تا ۱ آبان ۱۴۰۶</span></div></article></div></div></section>
        <section className={styles.financialSection} data-node-id="144:252"><div className={styles.sectionHeader}><Link href="/user/receive-pay">مشاهده همه</Link><h2>دریافت و پرداخت</h2></div><div className={styles.activityTable}><div className={styles.tableHeader}><span>وضعیت</span><span>تاریخ</span><span>مبلغ</span><span>قرارداد</span><span>نوع</span></div><div className={styles.tableRow}><span><Badge tone="orange">در انتظار پرداخت</Badge></span><span className={styles.muted}>۱۵ آبان ۱۴۰۵</span><strong>۱۸٬۵۰۰٬۰۰۰ تومان</strong><span>سعادت‌آباد</span><span><Badge tone="red">پرداخت</Badge></span></div><div className={styles.tableRow}><span><Badge tone="gray">آینده</Badge></span><span className={styles.muted}>۱ آذر ۱۴۰۵</span><strong>۱۵٬۰۰۰٬۰۰۰ تومان</strong><span>پونک</span><span><Badge>دریافت</Badge></span></div></div></section>
      </section>
      <aside className={styles.sidebar} data-node-id="144:284"><div className={styles.sidebarTop}><div className={styles.sidebarLogo}><img src={assets.logo} alt="چارخونه" width={127} height={55} /></div><nav className={styles.nav} aria-label="ناوبری حساب کاربری">{navItems.map((item) => item.href ? <Link key={item.label} href={item.href} className={`${styles.navItem} ${item.active ? styles.navItemActive : ""}`} data-node-id={item.nodeId}><span>{item.label}</span><img src={item.icon} alt="" width={20} height={20} /></Link> : <div key={item.label} className={styles.navItem} data-node-id={item.nodeId}><span>{item.label}</span><img src={item.icon} alt="" width={20} height={20} /></div>)}</nav></div><div className={styles.profile}><img className={styles.avatar} src={assets.avatar} alt="" width={40} height={40} /><div className={styles.profileText}><strong>علی رضایی</strong><span>۰۹۱۲•••••۶۷</span></div></div></aside>
    </main>
  );
}
