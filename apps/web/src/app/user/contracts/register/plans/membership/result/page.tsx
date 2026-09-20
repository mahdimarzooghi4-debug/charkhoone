import Link from "next/link";
import styles from "./page.module.css";
import { UserPanelSidebar } from "@/components/user/UserPanelSidebar";

const membershipChoices = {
  once: { amount: "۲٬۵۰۰٬۰۰۰ تومان", cap: "تا ۵۰۰٬۰۰۰٬۰۰۰ تومان", uses: "۱ بار استفاده" },
  twice: { amount: "۴٬۰۰۰٬۰۰۰ تومان", cap: "تا ۵۰۰٬۰۰۰٬۰۰۰ تومان", uses: "۲ بار استفاده" },
  "twice-high": { amount: "۶٬۵۰۰٬۰۰۰ تومان", cap: "تا ۱٬۰۰۰٬۰۰۰٬۰۰۰ تومان", uses: "۲ بار استفاده" },
} as const;

export default async function MembershipPaymentPreviewPage({
  searchParams,
}: {
  searchParams: Promise<{ plan?: string }>;
}) {
  // Display the selected fixture only; this is not a payment result from a provider.
  const { plan } = await searchParams;
  const chosenId = plan === "twice" || plan === "twice-high" ? plan : "once";
  const choice = membershipChoices[chosenId];
  const rows = [
    ["مبلغ نمونه", choice.amount, true],
    ["بابت", "حق عضویت چارخونه (نمونه)", false],
    ["تاریخ نمونه", "۱۵ آبان ۱۴۰۵", false],
    ["ساعت نمونه", "۱۴:۳۵", false],
    ["شناسه نمونه", "۱۲۳۴۵۶۷۸۹", false],
    ["سقف تأمین مالی", choice.cap, false],
    ["وضعیت عضویت", "پیش‌نمایش فعال‌سازی", false],
  ] as const;

  return (
    <main className={styles.page} data-node-id="175:754" data-name="Web App / Payment Return / Membership Success">
      <section className={styles.mainContent} data-node-id="175:755">
        <header className={styles.headerBlock} data-node-id="175:756">
          <Link href="/user/contracts/register/plans/membership" className={styles.backLink} data-node-id="175:757">بازگشت به انتخاب عضویت <span>›</span></Link>
          <div className={styles.headerRight} data-node-id="175:761"><div className={styles.breadcrumb}><span>عضویت چارخونه</span><span>/</span><strong>نتیجه نمونه</strong></div><h1 data-node-id="175:766">نتیجهٔ نمونهٔ عضویت</h1><p data-node-id="175:767">پیش‌نمایش طرح انتخاب‌شده، بدون پرداخت واقعی</p></div>
        </header>

        <div className={styles.resultWrapper} data-node-id="175:768">
          <section className={styles.resultCard} data-node-id="175:769">
            <div className={styles.receiptBrand} data-node-id="175:770"><strong data-node-id="175:771">چارخونه</strong><div className={styles.divider} /></div>
            <div className={styles.statusSection} data-node-id="175:773">
              <span className={styles.checkCircle}><img src="/brand/financing-review-check.svg" alt="" width={14} height={14} /></span>
              <h2 data-node-id="175:778">طرح عضویت انتخاب شد (نمونه)</h2>
              <strong className={styles.amount} data-node-id="175:779">{choice.amount}</strong>
              <span className={styles.successBadge} data-node-id="175:781">پیش‌نمایش</span>
              <p className={styles.previewNote}>هیچ پرداخت یا فعال‌سازی واقعی عضویت انجام نشده است.</p>
            </div>
            <div className={styles.divider} />
            <div className={styles.details} data-node-id="175:784">
              {rows.map(([label, value, strong], index) => <div key={label} className={`${styles.detailRow} ${index === rows.length - 1 ? styles.lastRow : ""}`}>{strong ? <strong>{value}</strong> : <span>{value}</span>}<small>{label}</small></div>)}
            </div>
            <div className={styles.membershipContext} data-node-id="175:819"><Link href="/user/account" className={styles.membershipLink} data-node-id="175:820">مشاهده جزئیات عضویت</Link><div><span className={styles.tenantBadge}>مستأجر</span><strong data-node-id="175:824">سهمیه انتخابی: {choice.uses}</strong></div></div>
          </section>

          <div className={styles.actions} data-node-id="175:825"><Link href="/user/contracts/123456789012" className={styles.secondaryAction} data-node-id="175:826">بازگشت به قرارداد</Link><Link href="/user/contracts/register/plans/contribution" className={styles.primaryAction} data-node-id="175:828">ادامه به مرحلهٔ آورده (نمونه)</Link></div>
        </div>
      </section>

      <UserPanelSidebar nodeId="175:830" />
    </main>
  );
}
