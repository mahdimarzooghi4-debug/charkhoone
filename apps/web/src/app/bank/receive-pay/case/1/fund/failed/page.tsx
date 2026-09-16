import Link from "next/link";
import BankReceivePayPage from "../../../../page";
import styles from "../result.module.css";

export default function BankFundingFailedPage() {
  return (
    <div className={styles.wrap} data-node-id="307:249" data-name="Bank / Funding Failed">
      <BankReceivePayPage />
      <div className={styles.backdrop} aria-hidden="true" />
      <section className={styles.modal} role="dialog" aria-modal="true" aria-labelledby="failed-title">
        <h1 id="failed-title">تأمین وجه انجام نشد</h1>
        <p className={styles.lead}>سرویس بانکی نتیجه موفق برای این عملیات ثبت نکرد.</p>
        <div className={styles.divider} />
        <div className={`${styles.resultBox} ${styles.failedBox}`}><div className={styles.resultTop}><span className={styles.symbol}>!</span><strong>تراکنش ناموفق</strong></div><p>تراکنش نهایی نشد و وضعیت به‌صورت سیستمی ناموفق ثبت شده است.</p></div>
        <strong className={styles.title}>جزئیات عملیات</strong>
        <div className={styles.details}><div className={styles.row}><span><strong>۱۴۰۵-۸۳۲۱ — محمد رضایی</strong></span><label>پرونده</label></div><div className={styles.row}><span><strong>۵۰۰٬۰۰۰٬۰۰۰ تومان</strong></span><label>مبلغ</label></div><div className={styles.row}><span>بانک نمونه ← کارگزاری همان بانک</span><label>مسیر</label></div></div>
        <div className={styles.divider} />
        <div className={styles.footer}><Link href="/bank/receive-pay/case/1/fund" className={styles.primary}>تلاش مجدد</Link><span className={`${styles.meta} ${styles.errorMeta}`}>علت: عدم دریافت پاسخ نهایی از سرویس بانکی</span><Link href="/bank/receive-pay" className={styles.secondary}>بستن</Link></div>
      </section>
    </div>
  );
}
