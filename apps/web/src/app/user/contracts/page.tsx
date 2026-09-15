import Link from "next/link";
import styles from "./page.module.css";

const assets = {
  logo: "https://www.figma.com/api/mcp/asset/ecbf0b2d-90c4-4e6b-8d2f-010d28b2fbc2.png",
  avatar: "https://www.figma.com/api/mcp/asset/c5bc1706-ecc4-41f6-837a-1260615b02f6.png",
  home: "https://www.figma.com/api/mcp/asset/90ad22c1-5030-4fb0-9ac4-88ba341cd671.svg",
  contracts: "https://www.figma.com/api/mcp/asset/becc09b2-8a80-48d4-8ce4-06b01893266b.svg",
  payments: "https://www.figma.com/api/mcp/asset/302144e6-7d88-4fa8-94b4-01f0e91b32b2.svg",
  account: "https://www.figma.com/api/mcp/asset/c08d6587-07b1-48c2-98c8-883d4bcc3c6d.svg",
} as const;

type Tone = "tenant" | "owner" | "active" | "attention" | "ended";

function Badge({ children, tone }: { children: React.ReactNode; tone: Tone }) {
  return <span className={`${styles.badge} ${styles[`badge_${tone}`]}`}>{children}</span>;
}

const contracts = [
  { nodeId: "149:195", address: "تهران، سعادت‌آباد", role: "مستأجر", roleTone: "tenant" as const, status: "فعال", statusTone: "active" as const, detail: "پرداخت بعدی: ۱۸٬۵۰۰٬۰۰۰ تومان — ۱۵ آبان ۱۴۰۵", period: "۱۵ مهر ۱۴۰۵ تا ۱۵ مهر ۱۴۰۶", action: "مشاهده قرارداد", href: "/user/contracts/123456789012" },
  { nodeId: "149:209", address: "تهران، پونک", role: "مالک", roleTone: "owner" as const, status: "فعال", statusTone: "active" as const, detail: "دریافتی بعدی: ۱۴٬۹۲۵٬۰۰۰ تومان — ۱ آذر ۱۴۰۵", period: "۱ آبان ۱۴۰۵ تا ۱ آبان ۱۴۰۶", action: "مشاهده قرارداد", href: null },
  { nodeId: "149:223", address: "تهران، ونک", role: "مالک", roleTone: "owner" as const, status: "نیاز به اقدام", statusTone: "attention" as const, detail: "در انتظار تأیید نهایی شما", period: "۲۰ مهر ۱۴۰۵ تا ۲۰ مهر ۱۴۰۶", action: "بررسی و تأیید", href: null },
  { nodeId: "149:238", address: "تهران، جردن", role: "مستأجر", roleTone: "tenant" as const, status: "پایان‌یافته", statusTone: "ended" as const, detail: "قرارداد به پایان رسیده است", period: "۱ فروردین ۱۴۰۴ تا ۱ فروردین ۱۴۰۵", action: "مشاهده قرارداد", href: null },
];

export default function ContractsPage() {
  return (
    <main className={styles.page} data-node-id="149:150" data-name="Web App / Contracts">
      <section className={styles.mainContent} data-node-id="149:151" data-name="Main Content">
        <header className={styles.headerBar} data-node-id="149:152" data-name="Header Bar"><div className={styles.headerText} data-node-id="149:153"><h1 data-node-id="149:154">قراردادها</h1><p data-node-id="149:155">سلام، علی رضایی</p></div></header>
        <section className={styles.pageHeader} data-node-id="149:156"><button type="button" className={styles.trackingButton} data-node-id="149:157"><span data-node-id="149:158">ثبت کد رهگیری</span></button><div className={styles.pageTitle} data-node-id="149:159"><h2 data-node-id="149:160">قراردادها</h2><p data-node-id="149:161">قراردادهای متصل به حساب شما</p></div></section>
        <section className={styles.summaryGrid} data-node-id="149:162"><article className={styles.summaryCard} data-node-id="149:171"><p>قراردادهای فعال</p><strong className={styles.primaryValue}>۲ قرارداد</strong><small>۱ قرارداد به عنوان مستأجر، ۱ قرارداد به عنوان مالک</small></article><article className={styles.summaryCard} data-node-id="149:167"><p>نیاز به اقدام</p><strong className={styles.dangerValue}>۱ مورد</strong><small>یک قرارداد نیاز به تایید دارد</small></article><article className={styles.summaryCard} data-node-id="149:163"><p>قراردادهای پایان‌یافته</p><strong>۱ قرارداد</strong><small>قراردادهای منقضی شده شما</small></article></section>
        <section className={styles.filterRow} data-node-id="149:175"><div className={styles.filterGroup} data-node-id="149:176"><button type="button" className={styles.filterPill}>مالک</button><button type="button" className={styles.filterPill}>مستأجر</button><button type="button" className={`${styles.filterPill} ${styles.filterPillActive}`}>همه نقش‌ها</button></div><div className={styles.filterGroup} data-node-id="149:183"><button type="button" className={styles.filterPill}>فسخ‌شده</button><button type="button" className={styles.filterPill}>پایان‌یافته</button><button type="button" className={styles.filterPill}>نیاز به اقدام</button><button type="button" className={styles.filterPill}>فعال</button><button type="button" className={`${styles.filterPill} ${styles.filterPillActive}`}>همه</button></div></section>
        <section className={styles.contractList} data-node-id="149:194">
          {contracts.map((contract) => <article key={contract.nodeId} className={styles.contractCard} data-node-id={contract.nodeId}><div className={styles.contractHeader}><strong>{contract.address}</strong><div className={styles.badgeRow}><Badge tone={contract.roleTone}>{contract.role}</Badge><Badge tone={contract.statusTone}>{contract.status}</Badge></div></div><div className={styles.divider} /><div className={styles.contractBottom}><div className={styles.contractActionRow}>{contract.href ? <Link href={contract.href} className={styles.detailButton}>{contract.action}</Link> : <button type="button" className={contract.statusTone === "attention" ? styles.reviewButton : styles.detailButton}>{contract.action}</button>}<span className={styles.contractDetail}>{contract.detail}</span></div><span className={styles.period}>{contract.period}</span></div></article>)}
        </section>
      </section>
      <aside className={styles.sidebar} data-node-id="142:1983"><div className={styles.sidebarTop} data-node-id="142:1984"><div className={styles.logoWrap} data-node-id="142:1985"><img src={assets.logo} alt="چارخونه" width={127} height={55} /></div><nav className={styles.nav} data-node-id="142:1986" aria-label="ناوبری حساب کاربری"><Link href="/user/home" className={styles.navItem} data-node-id="142:1987"><span className={styles.navSpacer} /><span>خانه</span><img src={assets.home} alt="" width={20} height={20} /></Link><Link href="/user/contracts" className={`${styles.navItem} ${styles.navActive}`} data-node-id="142:1993"><span className={styles.alertBadge}>۱</span><span>قراردادها</span><img src={assets.contracts} alt="" width={20} height={20} /></Link><Link href="/user/receive-pay" className={styles.navItem} data-node-id="142:2000"><span className={styles.navSpacer} /><span>دریافت و پرداخت</span><img src={assets.payments} alt="" width={20} height={20} /></Link><div className={styles.navItem} data-node-id="142:2006"><span className={styles.navSpacer} /><span>حساب من</span><img src={assets.account} alt="" width={20} height={20} /></div></nav></div><div className={styles.profile} data-node-id="142:2012"><img className={styles.avatar} src={assets.avatar} alt="" width={40} height={40} /><div className={styles.profileText} data-node-id="142:2014"><strong data-node-id="142:2015">علی رضایی</strong><span data-node-id="142:2016">۰۹۱۲•••••۶۷</span></div></div></aside>
    </main>
  );
}
