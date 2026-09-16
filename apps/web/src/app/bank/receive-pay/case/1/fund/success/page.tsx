import Link from "next/link";
import BankReceivePayPage from "../../../../page";
import styles from "../result.module.css";

export default function BankFundingSuccessPage() {
  return (
    <div className={styles.wrap} data-node-id="307:2" data-name="Bank / Funding Success">
      <BankReceivePayPage />
      <div className={styles.backdrop} aria-hidden="true" />
      <section className={styles.modal} role="dialog" aria-modal="true" aria-labelledby="success-title">
        <h1 id="success-title">تأمین وجه با موفقیت انجام شد</h1>
        <p className={styles.lead}>اصل تسهیلات به حساب کنترل‌شده چارخونه در کارگزاری همان بانک منتقل شد.</p>
        <div className={styles.divider} />
        <div className={`${styles.resultBox} ${styles.successBox}`}><div className={styles.resultTop}><span className={styles.symbol}>✓</span><strong>تراکنش موفق</strong></div><p>شناسه تراکنش و زمان انجام به‌صورت خودکار ثبت شد.</p></div>
        <strong className={styles.title}>جزئیات عملیات</strong>
        <div className={styles.details}><div className={styles.row}><span><strong>۱۴۰۵-۸۳۲۱ — محمد رضایی</strong></span><label>پرونده</label></div><div className={styles.row}><span><strong>۵۰۰٬۰۰۰٬۰۰۰ تومان</strong></span><label>مبلغ</label></div><div className={styles.row}><span>بانک نمونه ← کارگزاری همان بانک</span><label>مسیر</label></div></div>
        <div className={styles.divider} />
        <div className={styles.footer}><Link href="/bank/receive-pay/transaction/1" className={styles.primary}>مشاهده تراکنش</Link><span className={styles.meta}>شناسه: TXN-۹۸۸۴۲۱ &nbsp;•&nbsp; ۱۴۰۵/۰۶/۰۶ — ۱۱:۰۴</span></div>
      </section>
    </div>
  );
}
