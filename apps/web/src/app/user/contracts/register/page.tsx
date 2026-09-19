import Link from "next/link";
import styles from "./page.module.css";
import { UserPanelSidebar } from "@/components/user/UserPanelSidebar";

// Match the permanent same-origin Figma sidebar assets used on home and contracts.
export default function RegisterTrackingCodePage() {
  return (
    <main className={styles.page} data-node-id="150:706" data-name="Web App / Register Tracking Code">
      <section className={styles.mainContent} data-node-id="150:707">
        <header className={styles.headerBar} data-node-id="150:708">
          <Link href="/user/contracts" className={styles.backButton} aria-label="بازگشت به قراردادها" data-node-id="150:710">‹</Link>
          <div className={styles.headerRight} data-node-id="150:712"><h1 data-node-id="150:713">ثبت کد رهگیری</h1><p data-node-id="150:714">سلام، علی رضایی</p></div>
        </header>

        <section className={styles.pageHeader} data-node-id="150:715"><p data-node-id="150:716">قراردادها / ثبت قرارداد</p><h2 data-node-id="150:717">ثبت کد رهگیری قرارداد</h2><p data-node-id="150:718">کد رهگیری قرارداد ثبت‌شده در خودنویس را وارد کنید.</p></section>

        <div className={styles.columns} data-node-id="150:719">
          <aside className={styles.infoPanel} data-node-id="150:720"><h2 data-node-id="150:721">کد رهگیری را از کجا پیدا کنم؟</h2><div className={styles.divider} /><p data-node-id="150:723">پس از ثبت نهایی قرارداد در سامانه خودنویس، کد رهگیری برای قرارداد صادر می‌شود. این کد معمولاً یک شماره ۱۲ رقمی است.</p><p data-node-id="150:724">اطلاعات قرارداد پس از استعلام به‌صورت خواندنی نمایش داده می‌شود و نیازی به ورود دستی اطلاعات ملک و طرفین نیست.</p></aside>

          <section className={styles.primaryCard} data-node-id="150:725">
            <div className={styles.cardHeader} data-node-id="150:726"><h2 data-node-id="150:727">کد رهگیری قرارداد</h2><p data-node-id="150:728">برای دریافت اطلاعات رسمی قرارداد، کد رهگیری خودنویس را وارد کنید.</p></div>
            <div className={styles.divider} />
            <div className={styles.formFixture} data-node-id="150:730" aria-label="محل ورود کد رهگیری مطابق طرح فیگما" />
            <div className={styles.actions} data-node-id="150:731"><Link href="/user/contracts/register/result" className={styles.primaryAction} data-node-id="150:732">استعلام قرارداد</Link><Link href="/user/contracts" className={styles.backLink} data-node-id="150:735">بازگشت به قراردادها</Link></div>
          </section>
        </div>
      </section>

      <UserPanelSidebar nodeId="142:1878" />
    </main>
  );
}
