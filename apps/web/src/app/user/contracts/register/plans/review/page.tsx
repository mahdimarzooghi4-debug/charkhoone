import Link from "next/link";
import styles from "./page.module.css";
import { UserPanelSidebar } from "@/components/user/UserPanelSidebar";

const staffRequestRows = [
  ["طرح انتخاب‌شده", "طرح ویژه کارکنان", false],
  ["بانک", "بانک نمونه", false],
  ["مبلغ درخواست", "۳۵۰٬۰۰۰٬۰۰۰ تومان", true],
  ["آورده مستأجر از رهن کامل معادل", "۸۱۶٬۶۶۶٬۶۶۷ تومان", false],
  ["پرداختی ماهانه مستأجر (فقط سود وام)", "۶٬۷۰۸٬۳۳۳ تومان", true],
  ["تاریخ نمونهٔ درخواست", "۱۰ آبان ۱۴۰۵", false],
] as const;

const generalRequestRows = [
  ["طرح انتخاب‌شده", "طرح عمومی", false],
  ["بانک", "بانک نمونه", false],
  ["مبلغ درخواست", "۳۵۰٬۰۰۰٬۰۰۰ تومان", true],
  ["آورده مستأجر از رهن کامل معادل", "۸۱۶٬۶۶۶٬۶۶۷ تومان", false],
  ["پرداختی ماهانه مستأجر (فقط سود وام)", "۶٬۷۰۸٬۳۳۳ تومان", true],
  ["تاریخ نمونهٔ درخواست", "۱۰ آبان ۱۴۰۵", false],
] as const;

const contractRows = [
  ["موقعیت ملک", "سعادت‌آباد"],
  ["رهن نقدی قرارداد", "۵۰۰٬۰۰۰٬۰۰۰ تومان"],
  ["اجاره ماهانه قرارداد", "۲۰٬۰۰۰٬۰۰۰ تومان"],
  ["رهن کامل معادل", "۱٬۱۶۶٬۶۶۶٬۶۶۷ تومان"],
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

export default async function FinancingUnderReviewPage({ searchParams }: { searchParams: Promise<{ plan?: string }> }) {
  const plan = (await searchParams).plan === "general" ? "general" : "staff";
  const requestRows = plan === "general" ? generalRequestRows : staffRequestRows;
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
                <img src="/brand/financing-review-clock.svg" alt="" width={24} height={24} />
              </span>
            </section>

            <section className={styles.card} data-node-id="150:1217">
              <h2 data-node-id="150:1218">وضعیت فرایند</h2>
              <div className={styles.timeline} data-node-id="150:1219">
                <div className={styles.timelineStep}>
                  <span className={styles.timelineIcon} aria-hidden="true">
                    <img src="/brand/financing-review-pending.svg" alt="" width={28} height={28} />
                  </span>
                  <strong className={styles.muted}>اعلام نتیجه</strong><span className={styles.mutedSmall}>در انتظار (نمونه)</span>
                </div>
                <div className={`${styles.connector} ${styles.connectorMuted}`} />
                <div className={styles.timelineStep}>
                  <span className={styles.timelineIcon} aria-hidden="true">
                    <img src="/brand/financing-review-active.svg" alt="" width={28} height={28} />
                  </span>
                  <strong>بررسی بانک (نمونه)</strong><span>نمایش مرحله</span>
                </div>
                <div className={styles.connector} />
                <div className={styles.timelineStep}>
                  <span className={styles.completedIcon} aria-hidden="true">
                    <img src="/brand/financing-review-check.svg" alt="" width={14} height={14} />
                  </span>
                  <strong>ثبت درخواست (نمونه)</strong><span className={styles.success}>تکمیل نمونه</span>
                </div>
              </div>
            </section>

            <DataCard title="خلاصه درخواست" rows={requestRows} />
            <DataCard title="مشخصات قرارداد مرتبط" rows={contractRows} />

            <div className={styles.actions} data-node-id="150:1277">
              <Link href={`/user/contracts/register/plans/approved?plan=${plan}`} className={styles.primaryAction} data-node-id="150:1278">پیش‌نمایش نتیجه: تأیید درخواست</Link>
              <Link href={`/user/contracts/register/plans/not-approved?plan=${plan}`} className={styles.secondaryAction}>پیش‌نمایش نتیجه: رد درخواست</Link>
              <Link href="/user/contracts" className={styles.secondaryAction} data-node-id="150:1281">بازگشت به قراردادها</Link>
            </div>
          </div>
        </div>
      </section>

      <UserPanelSidebar nodeId="142:1738" />
    </main>
  );
}
