import Link from "next/link";
import BankSettingsPage from "../page";
import styles from "./page.module.css";

export default function BankApiConnectionPage() {
  return (
    <div className={styles.wrap} data-node-id="430:4" data-name="Bank / Settings / API Connection">
      <BankSettingsPage />
      <div className={styles.backdrop} aria-hidden="true" />
      <section className={styles.modal} role="dialog" aria-modal="true" aria-labelledby="api-title">
        <div className={styles.header}><Link href="/bank/settings" className={styles.close} aria-label="بستن">×</Link><div className={styles.headerCopy}><h1 id="api-title">اتصال API بانک</h1><p>آدرس سرویس و اطلاعات دسترسی سیستم داخلی بانک را وارد کنید.</p></div></div>
        <div className={styles.status}><strong>اتصال فعلی فعال است</strong><span>API سیستم بانک</span></div>
        <div className={styles.field}><label>آدرس API</label><div className={styles.input}>https://api.bank.example/v1</div></div>
        <div className={styles.field}><label>کلید API</label><div className={styles.input}>bank_live_••••••••••</div></div>
        <div className={styles.field}><label>توکن / Secret</label><div className={styles.input}>••••••••••••••••</div></div>
        <div className={styles.note}>اطلاعات محرمانه بعد از ذخیره کامل نمایش داده نمی‌شوند.</div>
        <div className={styles.actions}><Link href="/bank/settings" className={`${styles.action} ${styles.cancel}`}>انصراف</Link><Link href="/bank/settings/api" className={`${styles.action} ${styles.test}`}>تست اتصال</Link><Link href="/bank/settings" className={`${styles.action} ${styles.save}`}>ذخیره و اتصال</Link></div>
      </section>
    </div>
  );
}
