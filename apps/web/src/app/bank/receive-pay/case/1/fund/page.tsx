import Link from "next/link";
import BankReceivePayPage from "../../../page";
import styles from "./page.module.css";

export default function BankFundingConfirmationPage() {
  return (
    <div className={styles.wrap} data-node-id="298:2" data-name="Bank / Funding Confirmation">
      <BankReceivePayPage />
      <div className={styles.backdrop} aria-hidden="true" />
      <section className={styles.modal} role="dialog" aria-modal="true" aria-labelledby="fund-title">
        <div className={styles.header}><Link href="/bank/receive-pay" className={styles.close} aria-label="بستن">×</Link><h1 id="fund-title">تأیید تأمین وجه</h1></div>
        <p className={styles.lead}>پیش از اجرای تراکنش، اطلاعات انتقال را بررسی کنید.</p>
        <div className={styles.divider} />
        <div className={styles.summary}><strong>تأمین اصل تسهیلات</strong><div className={styles.infoRow}><span>۱۴۰۵-۸۳۲۱ — محمد رضایی</span><label>پرونده</label></div><div className={styles.infoRow}><span>۵۰۰٬۰۰۰٬۰۰۰ تومان</span><label>مبلغ</label></div></div>
        <strong className={styles.sectionTitle}>مسیر انتقال</strong>
        <div className={styles.route}><div className={styles.infoRow}><span>بانک نمونه</span><label>مبدأ</label></div><div className={styles.arrow}>↓</div><div className={styles.infoRow}><span>حساب کنترل‌شده چارخونه در کارگزاری بانک نمونه</span><label>مقصد</label></div></div>
        <strong className={styles.sectionTitle}>پیش‌شرط‌های تأمین</strong>
        <div className={styles.prereqs}><span>✓ وجه مستأجر واریز شده</span><span>✓ وجه در کارگزاری همین بانک تأیید شده</span><span>✓ درخواست بانک تأیید شده</span></div>
        <p className={styles.note}>با تأیید این عملیات، دستور انتقال وجه به‌صورت سیستمی به بانک/کارگزاری ارسال می‌شود. وضعیت و شناسه تراکنش به‌صورت خودکار ثبت خواهد شد.</p>
        <div className={styles.divider} />
        <div className={styles.actions}><Link href="/bank/receive-pay" className={styles.cancel}>انصراف</Link><Link href="/bank/receive-pay/case/1/fund/processing" className={styles.confirm}>تأیید و تأمین وجه</Link></div>
      </section>
    </div>
  );
}
