import Link from "next/link";
import styles from "./page.module.css";
import { UserPanelSidebar } from "@/components/user/UserPanelSidebar";

function Badge({ children, tone = "active" }: { children: React.ReactNode; tone?: "active" | "tenant" | "waiting" }) {
  return <span className={`${styles.badge} ${styles[`badge_${tone}`]}`}>{children}</span>;
}

function InfoRow({ label, value, strong = false }: { label: string; value: string; strong?: boolean }) {
  const isNationalId = label === "کد ملی مستأجر" || label === "کد ملی مالک";

  return (
    <div className={styles.infoRow}>
      {strong ? (
        <strong>{value}</strong>
      ) : (
        <span
          className={`${styles.infoValue} ${isNationalId ? styles.nationalId : ""}`}
          dir={isNationalId ? "ltr" : undefined}
        >
          {value}
        </span>
      )}
      <span className={styles.infoLabel}>{label}</span>
    </div>
  );
}

export default function ContractDetailPage() {
  return (
    <main className={styles.page} data-node-id="150:277" data-name="Web App / Contract Detail">
      <section className={styles.mainContent} data-node-id="150:278" data-name="Main Content">
        <header className={styles.headerBar} data-node-id="150:279" data-name="Header Bar">
          <Link href="/user/contracts" className={styles.backButton} aria-label="بازگشت به قراردادها" data-node-id="150:281">
            <span aria-hidden="true">‹</span>
          </Link>

          <div className={styles.headerRight} data-node-id="150:283" data-name="Header Right">
            <p className={styles.breadcrumb} data-node-id="150:284">قراردادها / جزئیات قرارداد</p>
            <div className={styles.titleRow} data-node-id="150:285" data-name="Title and Badges">
              <Badge tone="active">فعال</Badge>
              <Badge tone="tenant">مستأجر</Badge>
              <h1 data-node-id="150:290">قرارداد سعادت‌آباد</h1>
            </div>
            <p className={styles.trackingCode} data-node-id="150:291">کد رهگیری: ۱۲۳۴۵۶۷۸۹۰۱۲</p>
          </div>
        </header>

        <div className={styles.columns} data-node-id="150:292" data-name="Columns Split">
          <aside className={styles.secondaryColumn} data-node-id="150:293" data-name="Secondary Column">
            <section className={styles.card} data-node-id="150:294" data-name="Property Info Card">
              <h2 data-node-id="150:295">اطلاعات ملک</h2>
              <div className={styles.infoList}>
                <InfoRow label="آدرس" value="تهران، سعادت‌آباد، خیابان نمونه، پلاک ۲۴، واحد ۳" />
                <InfoRow label="کدپستی" value="۱۹۹۸۷۶۵۴۳۲" />
              </div>
            </section>

            <section className={styles.card} data-node-id="150:303" data-name="Parties Card">
              <h2 data-node-id="150:304">طرفین قرارداد</h2>
              <div className={styles.infoList}>
                <InfoRow label="مستأجر" value="علی رضایی" />
                <InfoRow label="کد ملی مستأجر" value="۰۰۱•••••۷۸۹" />
                <InfoRow label="مالک" value="محمد رضایی" />
                <InfoRow label="کد ملی مالک" value="۰۰۲•••••۴۵۶" />
              </div>
            </section>

            <section className={styles.card} data-node-id="150:318" data-name="Status Card">
              <div className={styles.cardHeadingRow} data-node-id="150:319">
                <Badge tone="active">فعال</Badge>
                <h2 data-node-id="150:322">وضعیت قرارداد</h2>
              </div>
              <p className={styles.statusCopy} data-node-id="150:323">فرایند تأمین مالی تکمیل شده و قرارداد در چارخونه فعال است.</p>
              <div className={styles.infoList}>
                <InfoRow label="فعال از" value="۱۵ مهر ۱۴۰۵" />
              </div>
            </section>

          </aside>

          <div className={styles.primaryColumn} data-node-id="150:330" data-name="Main Column">
            <section className={`${styles.card} ${styles.nextPaymentCard}`} data-node-id="150:331" data-name="Next Payment Card">
              <div className={styles.cardHeadingRow} data-node-id="150:332">
                <Badge tone="waiting">در انتظار پرداخت</Badge>
                <h2 data-node-id="150:335">پرداخت بعدی</h2>
              </div>
              <div className={styles.paymentSummary} data-node-id="150:336">
                <div className={styles.amount} data-node-id="150:337">
                  <strong data-node-id="150:338">۶٬۷۰۸٬۳۳۳</strong>
                  <span data-node-id="150:339">تومان</span>
                </div>
                <div className={styles.paymentMeta} data-node-id="150:340">
                  <strong data-node-id="150:341">سررسید: ۱۵ آبان ۱۴۰۵</strong>
                  <span data-node-id="150:342">بابت سود ماهانه نمونه وام؛ اصل وام جداگانه تسویه می‌شود</span>
                </div>
              </div>
              <Link href="/user/receive-pay" className={styles.primaryAction} data-node-id="150:344">مشاهده در دریافت و پرداخت</Link>
            </section>

            <section className={styles.card} data-node-id="150:346" data-name="Contract Information Card">
              <h2 data-node-id="150:347">اطلاعات اصلی قرارداد</h2>
              <div className={styles.infoList}>
                <InfoRow label="رهن نقدی قرارداد" value="۵۰۰٬۰۰۰٬۰۰۰ تومان" />
                <InfoRow label="معادل رهن اجاره با ضریب ۳٪" value="۶۶۶٬۶۶۶٬۶۶۷ تومان" />
                <InfoRow label="رهن کامل معادل" value="۱٬۱۶۶٬۶۶۶٬۶۶۷ تومان" />
                <InfoRow label="اجاره ماهانه قرارداد" value="۲۰٬۰۰۰٬۰۰۰ تومان" strong />
                <InfoRow label="تاریخ شروع قرارداد" value="۱۵ مهر ۱۴۰۵" />
                <InfoRow label="تاریخ پایان قرارداد" value="۱۵ مهر ۱۴۰۶" />
                <InfoRow label="مدت زمان قرارداد" value="۱۲ ماه" />
              </div>
            </section>

            <section className={styles.card} data-node-id="150:364" data-name="Financing Card">
              <div className={styles.cardHeadingRow} data-node-id="150:365">
                <Badge tone="active">تکمیل شده</Badge>
                <h2 data-node-id="150:368">تأمین مالی قرارداد (طرح فعال)</h2>
              </div>
              <div className={styles.infoList}>
                <InfoRow label="طرح انتخاب‌شده" value="طرح ویژه واجد شرایط" />
                <InfoRow label="بانک صادرکننده" value="بانک نمونه — نتیجه واقعی متصل نیست" />
                <InfoRow label="مبلغ تأمین‌شده توسط بانک" value="۳۵۰٬۰۰۰٬۰۰۰ تومان" />
                <InfoRow label="آورده مستأجر از رهن کامل معادل" value="۸۱۶٬۶۶۶٬۶۶۷ تومان" />
                <InfoRow label="پرداختی ماهانه مستأجر (فقط سود وام)" value="۶٬۷۰۸٬۳۳۳ تومان" strong />
              </div>
              <p className={styles.infoNotice} data-node-id="150:385">ℹ️ این اعداد پیش‌نمایش‌اند: رتبه C3 و نرخ اسمی سالانه ۲۳٪ نمونه هستند؛ پرداخت ماهانه فقط سود وام است و اصل وام را شامل نمی‌شود.</p>
            </section>
          </div>
        </div>
      </section>

      <UserPanelSidebar nodeId="142:1948" name="Right Sidebar" />
    </main>
  );
}
