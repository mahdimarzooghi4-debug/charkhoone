import Link from "next/link";
import styles from "./page.module.css";
import { UserPanelSidebar } from "@/components/user/UserPanelSidebar";

const conditions = [
  ["مبلغ رهن", "۵۰۰٬۰۰۰٬۰۰۰ تومان"],
  ["اجاره ماهانه قرارداد", "۲۰٬۰۰۰٬۰۰۰ تومان"],
  ["تاریخ شروع", "۱۵ مهر ۱۴۰۵"],
  ["تاریخ پایان", "۱۵ مهر ۱۴۰۶"],
  ["مدت قرارداد", "۱۲ ماه"],
] as const;

export default function OwnerContractActivePage() {
  return (
    <main className={styles.page} data-node-id="161:163" data-name="Web App / Contract Active">
      <section className={styles.mainContent} data-node-id="161:164">
        <header className={styles.pageHeader} data-node-id="161:165">
          <div className={styles.breadcrumb} data-node-id="161:166"><span>قراردادها</span><span>/</span><span>جزئیات قرارداد</span></div>
          <div className={styles.titleBlock} data-node-id="161:170"><div className={styles.badges}><span className={styles.activeBadge}>فعال</span><span className={styles.ownerBadge}>مالک</span></div><div className={styles.titleCopy}><h1 data-node-id="161:177">قرارداد سعادت‌آباد</h1><p data-node-id="161:178">کد رهگیری: ۱۲۳۴۵۶۷۸۹۰۱۲</p></div></div>
        </header>

        <div className={styles.columns} data-node-id="161:179">
          <aside className={styles.secondaryColumn} data-node-id="161:180">
            <section className={styles.card} data-node-id="161:181"><div className={styles.cardHeader}><span className={styles.mutedBadge}>مستأجر</span><h2 data-node-id="161:185">مستأجر</h2></div><div className={styles.divider} /><div className={styles.inlineDetails} data-node-id="161:187"><span data-node-id="161:188">کد ملی: ۰۰۱•••••۷۸۹</span><strong data-node-id="161:189">علی رضایی</strong></div></section>

            <section className={styles.card} data-node-id="161:190"><h2 data-node-id="161:191">اطلاعات ملک</h2><div className={styles.divider} /><div className={styles.propertyInfo}><div><span data-node-id="161:195">آدرس ملک</span><strong data-node-id="161:196">تهران، سعادت‌آباد، خیابان نمونه، پلاک ۲۴، واحد ۳</strong></div><div><span data-node-id="161:198">کدپستی</span><strong data-node-id="161:199">۱۹۹۸۷۶۵۴۳۲</strong></div></div></section>

            <section className={styles.card} data-node-id="161:200"><h2 data-node-id="161:201">وضعیت تسویه</h2><div className={styles.divider} /><div className={styles.settlementRows}><div><strong>انجام شده</strong><span>آخرین تسویه</span></div><div><strong>۱۵ مهر ۱۴۰۵</strong><span>تاریخ آخرین تسویه</span></div><div><strong className={styles.accent}>۱۵ آبان ۱۴۰۵</strong><span>تسویه بعدی</span></div></div><div className={styles.divider} /><Link href="/user/receive-pay" className={styles.smallButton} data-node-id="161:215">مشاهده سوابق</Link></section>

            <section className={styles.card} data-node-id="161:217"><h2 data-node-id="161:218">دسترسی سریع</h2><div className={styles.divider} /><div className={styles.quickActions}><Link href="/user/receive-pay">‹ <span>مشاهده دریافت و پرداخت</span></Link><div>‹ <span>مشاهده اطلاعات ملک</span></div></div></section>
          </aside>

          <div className={styles.primaryColumn} data-node-id="161:227">
            <section className={styles.activeStatus} data-node-id="161:228"><div className={styles.activeTop}><span className={styles.currentBadge}>قرارداد جاری</span><h2 data-node-id="161:233">قرارداد فعال است</h2></div><div className={styles.divider} /><p data-node-id="161:235">فرایند تأیید و تأمین مالی تکمیل شده و قرارداد در چارخونه فعال است.</p><strong data-node-id="161:236">فعال از ۱۵ مهر ۱۴۰۵</strong></section>

            <section className={styles.card} data-node-id="161:237"><div className={styles.cardHeader}><span className={styles.waitBadge}>در انتظار تسویه</span><h2 data-node-id="161:241">دریافتی بعدی</h2></div><div className={styles.divider} /><div className={styles.nextSettlement} data-node-id="161:243"><div><span data-node-id="161:245">تاریخ سررسید</span><strong data-node-id="161:246">۱۵ آبان ۱۴۰۵</strong></div><div><span data-node-id="161:248">مبلغ خالص قابل تسویه</span><strong className={styles.bigAmount} data-node-id="161:249">۱۹٬۹۰۰٬۰۰۰ تومان</strong></div></div><p className={styles.infoBox} data-node-id="161:251">مبلغ خالص قابل تسویه براساس شرایط این قرارداد محاسبه و تسویه سیستمی می‌شود. کارمزد خدمات چارخونه (۰٫۵٪) از مبلغ ناخالص دریافتی کسر می‌گردد.</p><Link href="/user/receive-pay" className={styles.smallButton} data-node-id="161:253">مشاهده در دریافت و پرداخت</Link></section>

            <section className={styles.card} data-node-id="161:255"><h2 data-node-id="161:256">روش دریافت</h2><div className={styles.divider} /><div className={styles.payoutMethod} data-node-id="161:258"><span className={styles.systemBadge}>تسویه سیستمی</span><div><strong data-node-id="161:262">دریافت ماهانه</strong><p data-node-id="161:263">دریافتی‌های این قرارداد طبق برنامه تسویه می‌شوند.</p></div></div></section>

            <section className={styles.card} data-node-id="161:264"><h2 data-node-id="161:265">شرایط قرارداد</h2><div className={styles.divider} /><div className={styles.grid} data-node-id="161:267">{conditions.map(([label, value]) => <div key={label}><strong>{value}</strong><span>{label}</span></div>)}</div></section>

            <section className={styles.card} data-node-id="161:283"><div className={styles.cardHeader}><span className={styles.completeBadge}>تکمیل شده</span><h2 data-node-id="161:287">وضعیت تأمین مالی</h2></div><div className={styles.divider} /><div className={styles.financingGrid} data-node-id="161:289"><div><strong data-node-id="161:291">۴۵۰٬۰۰۰٬۰۰۰ تومان</strong><span data-node-id="161:292">مبلغ تأمین‌شده</span></div><div><strong data-node-id="161:294">بانک نمونه</strong><span data-node-id="161:295">بانک ارائه دهنده</span></div></div><p className={styles.successInfo} data-node-id="161:297">فرایند تأمین مالی این قرارداد تکمیل شده است.</p></section>
          </div>
        </div>
      </section>

      <UserPanelSidebar nodeId="142:1563" />
    </main>
  );
}
