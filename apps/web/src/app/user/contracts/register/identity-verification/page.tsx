import Link from "next/link";
import { UserPanelSidebar } from "@/components/user/UserPanelSidebar";
import styles from "../page.module.css";

// The ownership-check stage belongs to Khodnevis contract lookup, never login.
// It is a non-collecting preview until the authenticated provider API is hosted.
export default function KhodnevisIdentityPreviewPage() {
  return (
    <main className={styles.page} data-name="Web App / Khodnevis Ownership Match">
      <section className={styles.mainContent}>
        <header className={styles.headerBar}>
          <Link href="/user/contracts/register" className={styles.backButton} aria-label="بازگشت">‹</Link>
          <div className={styles.headerRight}><h1>تطبیق هویت برای استعلام خودنویس</h1></div>
        </header>
        <section className={styles.pageHeader}>
          <p>قراردادها / ثبت کد رهگیری / تطبیق هویت</p>
          <h2>کد ملی فقط هنگام استعلام رسمی خودنویس لازم است</h2>
          <p>ورود به چارخونه به کد ملی نیازی ندارد.</p>
        </section>
        <section className={styles.primaryCard} aria-label="پیش‌نمایش تطبیق مالکیت">
          <div className={styles.cardHeader}>
            <h2>تطبیق کد ملی و موبایل</h2>
            <p>شماره موبایل باید توسط ارائه‌دهنده ورود تأیید شده باشد؛ پیش از دریافت اطلاعات رسمی قرارداد، کد ملی با همان شماره تطبیق داده می‌شود.</p>
          </div>
          <div className={styles.divider} />
          <label htmlFor="khodnevis-national-id">کد ملی</label>
          <input id="khodnevis-national-id" className={styles.trackingInput}
            type="text" inputMode="numeric" autoComplete="off" maxLength={10}
            placeholder="پس از اتصال استعلام واقعی فعال می‌شود" disabled
            aria-describedby="khodnevis-notice" />
          <p id="khodnevis-notice" className={styles.previewHint}>
            این صفحه پیش‌نمایش است. هیچ کد ملی دریافت یا ذخیره نمی‌شود و هیچ استعلام پولی انجام نمی‌شود.
          </p>
          <button type="button" className={styles.primaryAction} disabled
            aria-disabled="true">تطبیق و استعلام خودنویس هنوز فعال نیست</button>
          <Link className={styles.backLink} href="/user/contracts/register">بازگشت به کد رهگیری نمونه</Link>
        </section>
      </section>
      <UserPanelSidebar nodeId="142:1878" />
    </main>
  );
}
