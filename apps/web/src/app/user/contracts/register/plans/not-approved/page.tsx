import Link from "next/link";
import styles from "./page.module.css";
import { UserPanelSidebar } from "@/components/user/UserPanelSidebar";

const resultRows = [
  ["طرح انتخاب‌شده", "طرح ویژه کارکنان", "default"],
  ["بانک صادرکننده", "بانک نمونه", "default"],
  ["مبلغ درخواست", "۴۵۰٬۰۰۰٬۰۰۰ تومان", "primary"],
] as const;

const contractRows = [
  ["موقعیت ملک", "سعادت‌آباد"],
  ["مبلغ رهن قرارداد", "۵۰۰٬۰۰۰٬۰۰۰ تومان"],
  ["اجاره ماهانه قرارداد", "۲۰٬۰۰۰٬۰۰۰ تومان"],
  ["کد رهگیری", "۱۲۳۴۵۶۷۸۹۰۱۲"],
] as const;

type Tone = "default" | "primary";

function Rows({ rows }: { rows: readonly (readonly [string, string, Tone?])[] }) {
  return <div className={styles.rows}>{rows.map(([label, value, tone = "default"], index) => <div key={label} className={`${styles.row} ${index === rows.length - 1 ? styles.lastRow : ""}`}><strong className={tone === "primary" ? styles.primaryValue : ""}>{value}</strong><span>{label}</span></div>)}</div>;
}

export default function FinancingNotApprovedPage() {
  return (
    <main className={styles.page} data-node-id="161:334" data-name="Web App / Financing Not Approved">
      <section className={styles.mainContent} data-node-id="161:335">
        <header className={styles.pageHeader} data-node-id="161:336"><p data-node-id="161:337">قراردادها / نتیجه بررسی تأمین مالی</p><div className={styles.titleRow} data-node-id="161:338"><span className={styles.rejectedBadge} data-node-id="161:339">تأیید نشد</span><h1 data-node-id="161:341">درخواست تأمین مالی تأیید نشد</h1></div><p data-node-id="161:342">نتیجه بررسی بانک برای این درخواست اعلام شده است.</p></header>

        <div className={styles.centeredColumn} data-node-id="161:343"><div className={styles.contentStack} data-node-id="161:344">
          <section className={styles.card} data-node-id="161:345"><div className={styles.resultHeader} data-node-id="161:346"><h2 data-node-id="161:349">نتیجه بررسی درخواست</h2><span className={styles.alertIcon} data-node-id="161:347">!</span></div><div className={styles.divider} /><Rows rows={resultRows} /><div className={styles.statusRow} data-node-id="161:363"><span className={styles.rejectedBadge}>تأیید نشد</span><span>وضعیت نهایی</span></div></section>

          <section className={styles.card} data-node-id="161:367"><h2 data-node-id="161:368">مشخصات قرارداد مرتبط</h2><Rows rows={contractRows} /></section>

          <section className={styles.alternatives} data-node-id="161:384"><div><h2 data-node-id="161:386">طرح‌های دیگری برای شما قابل بررسی است</h2><p data-node-id="161:387">می‌توانید از میان طرح‌های واجد شرایط دیگر در سامانه چارخونه، گزینه دیگری را بررسی و انتخاب کنید.</p></div><Link href="/user/contracts/register/plans" className={styles.primaryAction} data-node-id="161:389">مشاهده سایر طرح‌ها</Link></section>

          <div className={styles.footerActions} data-node-id="161:392"><p data-node-id="161:393">این درخواست و نتیجه بررسی آن در سوابق قرارداد شما باقی می‌ماند.</p><Link href="/user/contracts" data-node-id="161:394">بازگشت به قراردادها</Link></div>
        </div></div>
      </section>

      <UserPanelSidebar nodeId="142:1598" />
    </main>
  );
}
