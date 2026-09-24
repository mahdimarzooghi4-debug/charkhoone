import Link from "next/link";
import styles from "./page.module.css";
import { UserPanelSidebar } from "@/components/user/UserPanelSidebar";
import { ReceivePayActivities } from "./ReceivePayActivities";

type Tone = "payment" | "receipt" | "overdue" | "waiting" | "future" | "success";

function Badge({ children, tone }: { children: React.ReactNode; tone: Tone }) {
  return <span className={`${styles.badge} ${styles[`badge_${tone}`]}`}>{children}</span>;
}

export default async function ReceivePayPage({ searchParams }: { searchParams: Promise<{ method?: string; scenario?: string }> }) {
  const params = await searchParams;
  const method = params.method;
  const showTerminationScenario = params.scenario === "termination";
  const fund = method === "fund";
  return (
    <main className={styles.page} data-node-id="150:412" data-name="Web App / Receive & Pay">
      <section className={styles.mainContent} data-node-id="150:413" data-name="Main Content">
        <header className={styles.headerBar} data-node-id="150:414"><div className={styles.headerSpacer} /><div className={styles.headerRight}><h1 data-node-id="150:417">دریافت و پرداخت</h1><p data-node-id="150:418">سلام، علی رضایی</p></div></header>
        <section className={styles.pageHeader} data-node-id="150:419"><h2 data-node-id="150:420">دریافت و پرداخت</h2><p data-node-id="150:421">این صفحه پیش‌نمایش طراحی با تراکنش‌های نمونه است؛ هیچ پرداخت، دریافت یا فسخ واقعی در آن ثبت نمی‌شود. کارمزد نمایش‌داده‌شده ۰٫۵٪ است.</p></section>
        <section className={styles.overviewGrid} data-node-id="150:422"><article className={styles.overviewCard}><div className={styles.overviewTop}><Badge tone="payment">پرداخت</Badge><span>پرداخت بعدی</span></div><strong>۶٬۷۰۸٬۳۳۳ تومان</strong><small>سررسید: ۱۵ آبان ۱۴۰۵</small></article><article className={styles.overviewCard}><div className={styles.overviewTop}><Badge tone="receipt">دریافت</Badge><span>{fund ? "تجمیع بعدی (نمونه)" : "دریافتی بعدی (نمونه)"}</span></div><strong>۳۴٬۸۲۵٬۰۰۰ تومان</strong><small>برآورد خالص مالک سعادت‌آباد بر پایه رهن کامل معادل ۱٬۱۶۶٬۶۶۶٬۶۶۷ تومان و نسبت ۳٪، پس از کارمزد نمونه ۰٫۵٪؛ نه پرداخت سود وام مستأجر · ۱۵ آبان ۱۴۰۵</small></article><article className={styles.overviewCard}><div className={styles.overviewTop}><i aria-hidden="true" /><span>جمع دو پرداخت سود نمونه</span></div><strong>۱۳٬۴۱۶٬۶۶۶ تومان</strong><small>جمع فرضی دو سود ماهانه؛ بدون اصل وام</small></article><article className={styles.overviewCard}><div className={styles.overviewTop}><i aria-hidden="true" /><span>دریافتی نمونه مالک پونک</span></div><strong>۱۴٬۹۲۵٬۰۰۰ تومان</strong><small>یک نمونه تسویه</small></article></section>
        {(method === "monthly" || fund) && <p className={styles.ownerContext}>پیش‌نمایش مالک سعادت‌آباد: روش «{fund ? "تجمیع دریافتی در صندوق" : "دریافت ماهانه"}» انتخاب شده است. ردیف‌های پونک در جدول، نمونه‌هایی مستقل هستند. <Link href={`/user/contracts/123456789012/owner?method=${fund ? "fund" : "monthly"}`}>بازگشت به قرارداد مالک</Link></p>}
        {showTerminationScenario && <section className={styles.terminationCard} data-node-id="150:449"><div className={styles.terminationTop}><span className={styles.terminatedBadge}>سناریوی نمونه فسخ</span><span className={styles.alertIcon}>!</span></div><h3>نمونه وضعیت فسخ قرارداد</h3><p>این فقط یک سناریوی مستقلِ طراحی با سه قسط معوق است؛ قرارداد فعال شما فسخ نشده و مبلغی واقعاً از آورده کسر نشده است.</p><div className={styles.terminationFooter}><Link href="/user/contracts/123456789012/terminated" className={styles.terminatedAction}>مشاهده سناریوی فسخ</Link><span className={styles.overdueCount}>۳ قسط معوق</span></div></section>}
        <ReceivePayActivities method={method === "fund" || method === "monthly" ? method : undefined} />
      </section>
      <UserPanelSidebar nodeId="150:562" />
    </main>
  );
}
