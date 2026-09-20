import Link from "next/link";
import styles from "../flow.module.css";
import { UserPanelSidebar } from "@/components/user/UserPanelSidebar";

const settlementRows = [
  ["وضعیت قرارداد", "فسخ شده", "danger"],
  ["وضعیت تسویه مالی", "محاسبه تعهدات مستأجر", "normal"],
  ["سه پرداخت سود معوق مستأجر (نمونه)", "۲۰٬۱۲۴٬۹۹۹ تومان", "normal"],
  ["مبلغ ناخالص قابل تسویه", "در انتظار محاسبه", "normal"],
  ["تاریخ برآوردی واریز تسویه", "پس از تکمیل نهایی محاسبات", "normal"],
] as const;

const contractRows = [
  ["ملک مورد اجاره", "سعادت‌آباد، خیابان سرو", "normal"],
  ["مستأجر حقیقی", "علی رضایی", "normal"],
  ["کد ملی مستأجر", "۰۰۱•••••۷۸۹", "normal"],
  ["تاریخ شروع قرارداد", "۱۵ مهر ۱۴۰۵", "normal"],
  ["وضعیت جاری در سامانه", "فسخ شده", "danger"],
  ["کد رهگیری معتبر", "۱۲۳۴۵۶۷۸۹۰۱۲", "normal"],
] as const;

export default function OwnerContractTerminatedPage() {
  return (
    <main className={styles.page} data-node-id="173:219" data-name="Web App / Contract Terminated / Owner">
      <section className={styles.mainContent} data-node-id="173:220">
        <header className={styles.pageHeader} data-node-id="173:221">
          <div className={styles.breadcrumb} data-node-id="173:222"><span>قراردادها</span><span>/</span><span>وضعیت قرارداد</span></div>
          <div className={styles.titleBlock} data-node-id="173:226"><div className={styles.badges}><span className={styles.badgeTerminated}>فسخ شده</span><span className={styles.badgeWarning}>مالک</span></div><div className={styles.titleCopy}><h1 data-node-id="173:233">قرارداد فسخ شده است</h1><p data-node-id="173:234">در سناریوی نمایشی، سه پرداخت سود معوق ثبت شده است؛ فسخ واقعی ثبت یا اجرا نشده است.</p></div></div>
        </header>

        <section className={`${styles.hero} ${styles.dangerHero}`} data-node-id="173:235">
          <div className={styles.heroTop}><span className={styles.dangerBadge}>فسخ خودکار</span><span className={styles.alertIcon}>!</span></div>
          <h2 data-node-id="173:241">قرارداد به‌علت عدم پرداخت اقساط فسخ گردید</h2>
          <p data-node-id="173:242">به‌دلیل ثبت سه قسط معوق توسط مستأجر، قرارداد فسخ شده است. تسویه مبالغ مربوط به این قرارداد از محل آورده مستأجر و طبق فرایند مالی سیستم انجام می‌شود. مبلغ قابل تسویه پس از تعیین اصل وام و تعهدات قانونی محاسبه می‌شود؛ هیچ واریز واقعی در این نمونه انجام نمی‌شود.</p>
          <span className={styles.dangerPill} data-node-id="173:245">۳ قسط پرداخت‌نشده مستأجر</span>
        </section>

        <div className={styles.columns} data-node-id="173:246">
          <aside className={`${styles.sideColumn} ${styles.sideColumnNarrow}`} data-node-id="173:247">
            <section className={styles.card} data-node-id="173:248"><h2 data-node-id="173:249">وضعیت فرایند فسخ و تسویه</h2><div className={styles.divider} /><div className={styles.timeline}><div className={styles.timelineRow}><span className={`${styles.stepDot} ${styles.stepDone}`}>۱</span><div className={styles.timelineCopy}><strong>ثبت ۳ قسط معوق مستأجر</strong></div><span className={`${styles.timelineStatus} ${styles.done}`}>تکمیل شده</span></div><div className={styles.timelineRow}><span className={`${styles.stepDot} ${styles.stepDone}`}>۲</span><div className={styles.timelineCopy}><strong>فسخ خودکار قرارداد</strong></div><span className={`${styles.timelineStatus} ${styles.done}`}>تکمیل شده</span></div><div className={styles.timelineRow}><span className={`${styles.stepDot} ${styles.stepActive}`}>۳</span><div className={styles.timelineCopy}><strong>محاسبه تسویه از محل آورده</strong></div><span className={`${styles.timelineStatus} ${styles.active}`}>در حال انجام</span></div><div className={styles.timelineRow}><span className={styles.stepDot}>۴</span><div className={styles.timelineCopy}><strong>واریز وجه قابل پرداخت به مالک</strong></div><span className={styles.timelineStatus}>در انتظار</span></div></div></section>
          </aside>

          <div className={styles.mainColumn} data-node-id="173:280">
            <section className={styles.card} data-node-id="173:281"><div className={styles.cardHeader}><span className={styles.badgeWaiting}>در حال انجام</span><h2 data-node-id="173:285">خلاصه وضعیت تسویه مالی مالک</h2></div><div className={styles.divider} /><div className={styles.rowList}>{settlementRows.map(([label, value, tone]) => <div className={styles.row} key={label}><strong className={tone === "danger" ? styles.dangerText : ""}>{value}</strong><span>{label}</span></div>)}</div><div className={styles.divider} /><div className={styles.infoBoxMuted} data-node-id="173:304">نمایش این فرایند صرفاً نمونه است؛ کسر از آورده، میزان قابل تسویه و کارمزد آن به محاسبه نهایی و قراردادهای واقعی وابسته‌اند.</div></section>

            <section className={styles.card} data-node-id="173:306"><h2 data-node-id="173:307">خلاصه مشخصات قرارداد منقضی</h2><div className={styles.divider} /><div className={styles.rowList}>{contractRows.map(([label, value, tone]) => <div className={styles.row} key={label}><strong className={tone === "danger" ? styles.dangerText : ""}>{value}</strong><span>{label}</span></div>)}</div></section>

            <div className={styles.actions} data-node-id="173:328"><Link href="/user/receive-pay?scenario=termination" className={styles.primaryAction} data-node-id="173:329">مشاهده جزئیات تسویه مالی</Link><span className={styles.infoBoxMuted} data-node-id="173:331">اسناد این قرارداد در پیش‌نمایش بارگذاری نشده‌اند.</span></div>
          </div>
        </div>
      </section>

      <UserPanelSidebar nodeId="142:2103" />
    </main>
  );
}
