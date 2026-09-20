import Link from "next/link";
import styles from "../flow.module.css";
import { UserPanelSidebar } from "@/components/user/UserPanelSidebar";

/** Inline information icon, independent of expiring Figma URLs. */
function InfoIcon({ size = 20 }: { size?: number }) {
  return (
    <svg aria-hidden="true" focusable="false" width={size} height={size} viewBox="0 0 20 20"
      fill="none" stroke="currentColor" strokeWidth="1.7">
      <circle cx="10" cy="10" r="8" />
      <path d="M10 9v5M10 6.5h.01" strokeLinecap="round" />
    </svg>
  );
}

const toPersianDigits = (value: number) =>
  String(value).replace(/[0-9]/g, (digit) => "۰۱۲۳۴۵۶۷۸۹"[Number(digit)]);

const process = [
  ["اتصال قرارداد", "تکمیل شده", "done"],
  ["فرایند تأمین مالی مستأجر", "در حال انجام", "active"],
  ["انتخاب روش دریافت مالک", "در انتظار", "waiting"],
  ["تأیید نهایی مالک", "در انتظار", "waiting"],
  ["فعال شدن قرارداد", "در انتظار", "waiting"],
] as const;

export default function OwnerContractConnectedPage() {
  return (
    <main className={styles.page} data-node-id="170:278" data-name="Web App / Owner Contract Connected">
      <section className={styles.mainContent} data-node-id="170:279">
        <header className={styles.pageHeader} data-node-id="170:280">
          <div className={styles.breadcrumb} data-node-id="170:281"><span>قراردادها</span><span>/</span><span>وضعیت قرارداد</span></div>
          <div className={styles.titleBlock} data-node-id="170:285">
            <div className={styles.badges}><span className={styles.badgeWarning}>در حال تکمیل فرایند</span><span className={styles.badgeOwnerDark}>مالک</span></div>
            <div className={styles.titleCopy}><h1 data-node-id="170:293">قرارداد به حساب شما متصل شد</h1><p data-node-id="170:294">اطلاعات این قرارداد با نقش مالک به حساب شما متصل شده است.</p></div>
          </div>
        </header>

        <section className={styles.hero} data-node-id="170:295">
          <div className={styles.heroTop}><span className={styles.heroBadge}>در انتظار مستأجر</span><h2 data-node-id="170:299">در انتظار تکمیل فرایند مستأجر</h2></div>
          <div className={styles.divider} />
          <p data-node-id="170:301">فرایند تأمین مالی مستأجر هنوز تکمیل نشده است. در حال حاضر اقدامی از طرف شما لازم نیست.</p>
        </section>

        <div className={styles.columns} data-node-id="170:302">
          <aside className={styles.sideColumn} data-node-id="170:303">
            <section className={styles.card} data-node-id="170:304">
              <h2 data-node-id="170:305">اطلاعات ملک</h2><div className={styles.divider} />
              <div className={styles.propertyInfo}><div><span>آدرس ملک</span><strong>تهران، سعادت‌آباد، خیابان نمونه، پلاک ۲۴، واحد ۳</strong></div><div><span>کدپستی</span><strong>۱۹۹۸۷۶۵۴۳۲</strong></div></div>
            </section>
            <section className={styles.card} data-node-id="170:314">
              <h2 data-node-id="170:315">وضعیت فرایند</h2><div className={styles.divider} />
              <div className={styles.timeline} data-node-id="170:317">
                {process.map(([title, subtitle, state], index) => <div key={title} className={styles.timelineRow}><span className={`${styles.stepDot} ${state === "done" ? styles.stepDone : state === "active" ? styles.stepActive : ""}`}>{toPersianDigits(index + 1)}</span><div className={styles.timelineCopy}><strong className={state === "active" ? styles.activeText : ""}>{title}</strong><small>{subtitle}</small></div></div>)}
              </div>
            </section>
          </aside>

          <div className={styles.mainColumn} data-node-id="170:348">
            <section className={styles.card} data-node-id="170:349"><h2 data-node-id="170:350">خلاصه قرارداد</h2><div className={styles.divider} /><div className={styles.summaryGrid}><div><strong>۵۰۰٬۰۰۰٬۰۰۰ تومان</strong><span>مبلغ رهن</span></div><div><strong>۲۰٬۰۰۰٬۰۰۰ تومان</strong><span>اجاره ماهانه قرارداد</span></div><div><strong>۱۵ مهر ۱۴۰۵</strong><span>تاریخ شروع</span></div><div><strong>۱۵ مهر ۱۴۰۶</strong><span>تاریخ پایان</span></div><div><strong>۱۲۳۴۵۶۷۸۹۰۱۲</strong><span>کد رهگیری</span></div></div></section>
            <section className={styles.card} data-node-id="170:368"><div className={styles.cardHeader}><span className={styles.badgeWarning}>در حال تکمیل فرایند تأمین مالی</span><h2 data-node-id="170:373">مستأجر</h2></div><div className={styles.divider} /><div className={styles.inlineDetails}><span className={styles.connectedNationalId}><span>کد ملی:</span><bdi dir="ltr" className={styles.connectedNationalIdValue}>۰۰۱•••••۷۸۹</bdi></span><strong>علی رضایی</strong></div></section>
            <section className={styles.infoCard} data-node-id="170:378"><div className={`${styles.infoHeader} ${styles.connectedInfoHeader}`}><InfoIcon /><h3 data-node-id="170:380">مرحله بعد</h3></div><p data-node-id="170:382">پس از تکمیل فرایند تأمین مالی و تأییدهای لازم از سمت مستأجر، برای انتخاب روش دریافت و تأیید نهایی قرارداد به شما اطلاع داده می‌شود.</p><p>برای مشاهده ادامه مسیر در نسخه نمایشی (بدون بررسی واقعی وضعیت مستأجر)، از دکمه زیر استفاده کنید.</p><Link href="/user/contracts/123456789012/owner/settlement-preference" className={styles.primaryButton}>پیش‌نمایش مرحله بعد: انتخاب روش دریافت</Link></section>
          </div>
        </div>

        <footer className={styles.bottomBar} data-node-id="170:383"><Link href="/user/contracts" className={styles.outlineButton} data-node-id="170:384">بازگشت به قراردادها</Link><div className={styles.bottomNote}><InfoIcon size={16} /><span>در حال حاضر اقدامی از طرف شما لازم نیست.</span></div></footer>
      </section>

      <UserPanelSidebar nodeId="142:1633" />
    </main>
  );
}
