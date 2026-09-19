import Link from "next/link";
import styles from "./page.module.css";
import { UserPanelSidebar } from "@/components/user/UserPanelSidebar";

const requestRows = [
  ["طرح انتخاب‌شده", "طرح ویژه کارکنان", false],
  ["بانک", "بانک نمونه", false],
  ["مبلغ درخواست", "۴۵۰٬۰۰۰٬۰۰۰ تومان", true],
  ["آورده موردنیاز", "۵۰٬۰۰۰٬۰۰۰ تومان", false],
  ["پرداخت ماهانه تأمین مالی", "۱۸٬۵۰۰٬۰۰۰ تومان", true],
  ["تاریخ نمونهٔ درخواست", "۱۰ آبان ۱۴۰۵", false],
] as const;

const contractRows = [
  ["موقعیت ملک", "سعادت‌آباد"],
  ["مبلغ رهن قرارداد", "۵۰۰٬۰۰۰٬۰۰۰ تومان"],
  ["اجاره ماهانه قرارداد", "۲۰٬۰۰۰٬۰۰۰ تومان"],
  ["کد رهگیری", "۱۲۳۴۵۶۷۸۹۰۱۲"],
] as const;

function DataCard({ title, rows }: { title: string; rows: readonly (readonly [string, string, boolean?])[] }) {
  return (
    <section className={styles.card}>
      <h2>{title}</h2>
      <div className={styles.dataRows}>
        {rows.map(([label, value, emphasized], index) => (
          <div key={label} className={`${styles.dataRow} ${index === rows.length - 1 ? styles.lastRow : ""}`}>
            <strong className={emphasized ? styles.emphasized : ""}>{value}</strong>
            <span>{label}</span>
          </div>
        ))}
      </div>
    </section>
  );
}

export default function FinancingUnderReviewPage() {
  return (
    <main className={styles.page} data-node-id="150:1198" data-name="Web App / Financing Under Review">
      <section className={styles.mainContent} data-node-id="150:1199">
        <header className={styles.pageHeader} data-node-id="150:1200">
          <p data-node-id="150:1201">قراردادها / وضعیت درخواست</p>
          <div className={styles.titleRow} data-node-id="150:1202"><h1 data-node-id="150:1203">درخواست تأمین مالی در حال بررسی است</h1><span className={styles.statusBadge}>در حال بررسی</span></div>
          <p data-node-id="150:1207">این صفحه نمونهٔ مسیر بررسی است؛ درخواست واقعی به بانک ارسال نشده است.</p>
        </header>

        <div className={styles.centeredColumn} data-node-id="150:1208">
          <div className={styles.contentStack} data-node-id="150:1209">
            <section className={styles.heroStatus} data-node-id="150:1210">
              <div className={styles.heroCopy}><h2 data-node-id="150:1215">پیش‌نمایش بررسی بانک</h2><p data-node-id="150:1216">این مرحله نمایشی است و نتیجه‌ای از بانک دریافت نمی‌شود.</p></div>
              <span className={styles.clockWrap} aria-hidden="true">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" />
                </svg>
              </span>
            </section>

            <section className={styles.card} data-node-id="150:1217">
              <h2 data-node-id="150:1218">وضعیت فرایند</h2>
              <div className={styles.timeline} data-node-id="150:1219">
                <div className={styles.timelineStep}>
                  <span className={`${styles.timelineIcon} ${styles.pendingIcon}`} aria-hidden="true">
                    <svg viewBox="0 0 28 28" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                      <circle cx="14" cy="14" r="11" /><path d="M9 14h.01M14 14h.01M19 14h.01" strokeWidth="2.8" />
                    </svg>
                  </span>
                  <strong className={styles.muted}>اعلام نتیجه</strong><span className={styles.mutedSmall}>در انتظار (نمونه)</span>
                </div>
                <div className={`${styles.connector} ${styles.connectorMuted}`} />
                <div className={styles.timelineStep}>
                  <span className={`${styles.timelineIcon} ${styles.activeIcon}`} aria-hidden="true">
                    <svg viewBox="0 0 28 28" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="14" cy="14" r="11" /><path d="M14 8v6l4 2" />
                    </svg>
                  </span>
                  <strong>بررسی بانک (نمونه)</strong><span>نمایش مرحله</span>
                </div>
                <div className={styles.connector} />
                <div className={styles.timelineStep}>
                  <span className={styles.completedIcon} aria-hidden="true">
                    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="m4 10 4 4 8-8" />
                    </svg>
                  </span>
                  <strong>ثبت درخواست (نمونه)</strong><span className={styles.success}>تکمیل نمونه</span>
                </div>
              </div>
            </section>

            <DataCard title="خلاصه درخواست" rows={requestRows} />
            <DataCard title="مشخصات قرارداد مرتبط" rows={contractRows} />

            <div className={styles.actions} data-node-id="150:1277">
              <Link href="/user/contracts/123456789012" className={styles.primaryAction} data-node-id="150:1278">مشاهده قرارداد</Link>
              <Link href="/user/contracts" className={styles.secondaryAction} data-node-id="150:1281">بازگشت به قراردادها</Link>
            </div>
          </div>
        </div>
      </section>

      <UserPanelSidebar nodeId="142:1738" />
    </main>
  );
}
