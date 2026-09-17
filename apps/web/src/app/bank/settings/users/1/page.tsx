import Link from "next/link";
import BankSettingsPage from "../../page";
import styles from "./page.module.css";

export default function BankManageUserPage() {
  return (
    <div className={styles.wrap} data-node-id="319:2" data-name="Bank / Settings / Manage User">
      <BankSettingsPage />
      <div className={styles.backdrop} aria-hidden="true" />
      <section className={styles.modal} role="dialog" aria-modal="true" aria-labelledby="manage-user-title">
        <div className={styles.header}><Link href="/bank/settings" className={styles.close} aria-label="بستن">×</Link><div className={styles.headerCopy}><h1 id="manage-user-title">مدیریت کاربر بانک</h1><p>نقش و وضعیت دسترسی این کاربر را مدیریت کنید.</p></div></div>
        <div className={styles.divider} />
        <div className={styles.summary}><div className={styles.row}><span>مریم احمدی</span><label>نام و نام خانوادگی</label></div><div className={styles.row}><span>۰۹۱۲•••۵۶۷۸</span><label>شماره موبایل</label></div></div>
        <div className={styles.field}><label>نقش</label><div className={styles.selectLike}>کارشناس</div><span className={styles.helper}>سطح دسترسی براساس نقش انتخاب‌شده تعیین می‌شود.</span></div>
        <div className={styles.field}><label>وضعیت دسترسی</label><div className={styles.statusOptions}><span className={styles.statusInactive}>غیرفعال</span><span className={styles.statusActive}>فعال</span></div></div>
        <div className={styles.preview}><strong>دسترسی‌های نقش کارشناس</strong><p>بررسی درخواست‌ها &nbsp;•&nbsp; مشاهده طرح‌ها &nbsp;•&nbsp; مشاهده پرونده‌های مالی &nbsp;•&nbsp; مشاهده دریافت و پرداخت در محدوده مجاز</p></div>
        <div className={styles.warning}>غیرفعال‌کردن دسترسی، سوابق فعالیت و عملیات مالی ثبت‌شده این کاربر را حذف نمی‌کند.</div>
        <div className={styles.divider} />
        <div className={styles.actions}><Link href="/bank/settings" className={styles.cancel}>انصراف</Link><Link href="/bank/settings" className={styles.save}>ذخیره تغییرات</Link></div>
      </section>
    </div>
  );
}
