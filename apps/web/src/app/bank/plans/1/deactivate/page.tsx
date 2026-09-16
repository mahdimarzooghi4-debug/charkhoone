import Link from "next/link";
import BankExistingPlanPage from "../page";
import styles from "./page.module.css";

export default function BankPlanDeactivatePage() {
  return (
    <div className={styles.modalPage} data-node-id="327:2" data-name="Bank / Plan Deactivate Confirmation">
      <BankExistingPlanPage />
      <div className={styles.backdrop} aria-hidden="true" />
      <section className={styles.modal} role="dialog" aria-modal="true" aria-labelledby="deactivate-title">
        <h1 id="deactivate-title">غیرفعال کردن طرح</h1>
        <p className={styles.lead}>با غیرفعال‌سازی، این طرح برای پرونده‌های جدید قابل انتخاب نخواهد بود.</p>
        <div className={styles.divider} />
        <div className={styles.summary}><strong>طرح مسکن ویژه</strong><span>وضعیت فعلی: فعال &nbsp;•&nbsp; مدت: ۱۲ ماه &nbsp;•&nbsp; سقف تأمین: ۵۰۰٬۰۰۰٬۰۰۰ تومان</span></div>
        <p className={styles.warning}>قراردادها و پرونده‌های فعال با شرایط ثبت‌شده قبلی ادامه پیدا می‌کنند و تغییر نمی‌کنند.</p>
        <div className={styles.actions}><Link href="/bank/plans/1" className={styles.cancel}>انصراف</Link><Link href="/bank/plans" className={styles.confirm}>تأیید غیرفعال‌سازی</Link></div>
      </section>
    </div>
  );
}
