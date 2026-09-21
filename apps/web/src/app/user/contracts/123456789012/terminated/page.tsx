import Link from "next/link";
import styles from "./page.module.css";
import { UserPanelSidebar } from "@/components/user/UserPanelSidebar";

const process = [
  ["۱", "ثبت ۳ قسط معوق", "تکمیل شده", "done"],
  ["۲", "فسخ خودکار قرارداد", "تکمیل شده", "terminated"],
  ["۳", "محاسبه مبالغ و آورده", "تکمیل شده", "done"],
  ["۴", "تسویه نهایی مالی", "در حال انجام", "active"],
] as const;

const settlement = [
  ["تعداد اقساط معوق", "۳ قسط", "danger"],
  ["جمع سه پرداخت سود معوق (نمونه)", "۲۰٬۱۲۴٬۹۹۹ تومان", "danger"],
  ["آورده مستأجر از رهن کامل معادل (نمونه)", "۸۱۶٬۶۶۶٬۶۶۷ تومان", "default"],
  ["مبلغ کسرشدۀ نهایی از آورده", "در انتظار محاسبه و توافق قانونی", "default"],
] as const;

const contract = [
  ["ملک", "سعادت‌آباد", "default"],
  ["تاریخ شروع", "۱۵ مهر ۱۴۰۵", "default"],
  ["وضعیت جاری در سامانه", "فسخ شده", "terminated"],
  ["کد رهگیری معتبر", "۱۲۳۴۵۶۷۸۹۰۱۲", "default"],
] as const;

type Tone = "default" | "danger" | "terminated";

function Rows({ rows }: { rows: readonly (readonly [string, string, Tone])[] }) {
  return <div className={styles.rows}>{rows.map(([label, value, tone]) => <div key={label} className={styles.row}><strong className={tone === "danger" ? styles.danger : tone === "terminated" ? styles.terminatedText : ""}>{value}</strong><span>{label}</span></div>)}</div>;
}

export default function TerminatedTenantContractPage() {
  return (
    <main className={styles.page} data-node-id="171:379" data-name="Web App / Contract Terminated / Tenant">
      <section className={styles.mainContent} data-node-id="171:380">
        <header className={styles.pageHeader} data-node-id="171:381"><div className={styles.breadcrumb} data-node-id="171:382"><span>قراردادها</span><span>/</span><strong>وضعیت قرارداد</strong></div><div className={styles.titleBlock} data-node-id="171:386"><div className={styles.badges}><span className={styles.terminatedBadge}>فسخ شده</span><span className={styles.tenantBadge}>مستأجر</span></div><div className={styles.titleCopy}><h1 data-node-id="171:393">قرارداد فسخ شده است</h1><p data-node-id="171:394">این سناریوی نمایشیِ فسخ بر اثر سه پرداخت سود معوق است؛ قرارداد واقعی تغییر نکرده است.</p></div></div></header>

        <div className={styles.alertSpacer} data-node-id="171:395" />

        <div className={styles.columns} data-node-id="171:396">
          <aside className={styles.secondaryColumn} data-node-id="171:397"><section className={styles.card} data-node-id="171:398"><h2 data-node-id="171:399">وضعیت فرایند فسخ و تسویه</h2><div className={styles.divider} /><div className={styles.processList} data-node-id="171:401">{process.map(([number, title, status, state]) => <div className={styles.processItem} key={number}><span className={`${styles.statusBadge} ${state === "active" ? styles.statusActive : state === "terminated" ? styles.statusTerminated : styles.statusDone}`}>{status}</span><strong>{title}</strong><span className={`${styles.processDot} ${state === "active" ? styles.dotActive : state === "terminated" ? styles.dotTerminated : styles.dotDone}`}>{number}</span></div>)}</div></section></aside>

          <div className={styles.primaryColumn} data-node-id="171:434">
            <section className={styles.card} data-node-id="171:435"><div className={styles.cardHeader} data-node-id="171:436"><span className={styles.progressBadge}>در حال تکمیل</span><h2 data-node-id="171:439">خلاصه وضعیت تسویه مالی</h2></div><div className={styles.divider} /><Rows rows={settlement} /><div className={styles.divider} /><p className={styles.infoBox} data-node-id="171:456">فقط سه پرداخت سودِ نمونه جمع زده شده است؛ جریمه، تسویه اصل وام یا کسر از آورده هنوز محاسبه و نهایی نشده‌اند. این صفحه سناریوی نمایشی فسخ است.</p></section>

            <section className={styles.card} data-node-id="171:457"><h2 data-node-id="171:458">خلاصه مشخصات قرارداد منقضی</h2><div className={styles.divider} /><Rows rows={contract} /></section>

            <div className={styles.actions} data-node-id="171:473"><Link href="/user/receive-pay?scenario=termination" className={styles.secondaryAction} data-node-id="171:477">مشاهده دریافت و پرداخت</Link></div>
          </div>
        </div>
      </section>

      <UserPanelSidebar nodeId="142:2068" />
    </main>
  );
}
