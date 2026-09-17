import Link from "next/link";
import BankRequestDetailPage from "../page";
import styles from "./page.module.css";

export default function BankRequestRejectPage() {
  return (
    <div className={styles.modalPage} data-node-id="310:2" data-name="Bank / Request Rejection">
      <BankRequestDetailPage />
      <div className={styles.backdrop} data-node-id="310:189" aria-hidden="true" />
      <section className={styles.modal} data-node-id="310:190" data-name="request-rejection-modal" role="dialog" aria-modal="true" aria-labelledby="reject-title">
        <header className={styles.header}>
          <h1 id="reject-title" data-node-id="310:191">رد درخواست تأمین مالی</h1>
          <p data-node-id="310:192">دلیل رد درخواست را ثبت کنید. این تصمیم در سابقه پرونده نگهداری می‌شود.</p>
          <Link href="/bank/requests/1" className={styles.close} aria-label="بستن" data-node-id="310:193">×</Link>
        </header>
        <div className={styles.divider} />
        <div className={styles.summary} data-node-id="310:195">
          <div className={styles.summaryRow}><strong>۱۴۰۵-۸۳۲۱ — محمد رضایی</strong><span>پرونده</span></div>
          <div className={styles.summaryRow}><strong>۵۰۰٬۰۰۰٬۰۰۰ تومان</strong><span>مبلغ درخواست</span></div>
        </div>
        <div className={styles.field}>
          <p className={styles.fieldLabel} data-node-id="310:200">دلیل رد درخواست</p>
          <div className={styles.textarea} data-node-id="310:201">دلیل رد را وارد کنید…</div>
          <p className={styles.helper} data-node-id="310:203">این توضیح برای پیگیری و مشاهده بعدی پرونده ثبت می‌شود.</p>
        </div>
        <div className={styles.divider} />
        <div className={styles.actions}>
          <Link href="/bank/requests/1" className={styles.cancel} data-node-id="310:205">انصراف</Link>
          <Link href="/bank/requests/1/rejected" className={styles.confirm} data-node-id="310:207">تأیید رد درخواست</Link>
        </div>
      </section>
    </div>
  );
}
