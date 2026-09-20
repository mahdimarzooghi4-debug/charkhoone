import Link from "next/link";
import styles from "./page.module.css";
import { UserPanelSidebar } from "@/components/user/UserPanelSidebar";
import { PreviewAction } from "@/components/user/PreviewAction";

const chevron = "/brand/dashboard-nav-file.svg";

function VerifiedBadge() {
  return <span className={styles.verifiedBadge}>تأیید شده</span>;
}

export default function AccountPage() {
  return (
    <main className={styles.page} data-node-id="161:424" data-name="Web App / Account">
      <section className={styles.mainContent} data-node-id="161:425">
        <header className={styles.header} data-node-id="161:426"><h1 data-node-id="161:428">حساب من</h1><p data-node-id="161:429">اطلاعات حساب و تنظیمات اصلی خود را مدیریت کنید.</p></header>

        <div className={styles.columns} data-node-id="163:196">
          <aside className={styles.secondaryColumn} data-node-id="163:197">
            <section className={styles.settingsCard} data-node-id="163:198">
              <h2 data-node-id="163:199">تنظیمات</h2>
              <div className={styles.settingsList} data-node-id="163:200">
                <div className={styles.settingsRow} data-node-id="163:201"><span className={styles.toggle} aria-hidden="true"><i /></span><span>اعلان‌ها</span></div>
                <div className={styles.divider} />
                <PreviewAction className={styles.settingsRow} label="قوانین و مقررات" title="قوانین و مقررات" message="متن حقوقی نهایی هنوز منتشر نشده است. تا تأیید نسخه نهایی، این بخش صرفاً مسیر طراحی را نمایش می‌دهد."><img src={chevron} alt="" width={20} height={20} /><span>قوانین و مقررات</span></PreviewAction>
                <div className={styles.divider} />
                <PreviewAction className={styles.settingsRow} label="حریم خصوصی" title="حریم خصوصی" message="سیاست حریم خصوصی باید پیش از سرویس واقعی تأیید و منتشر شود. متن حقوقی ساختگی نمایش نمی‌دهیم."><img src={chevron} alt="" width={20} height={20} /><span>حریم خصوصی</span></PreviewAction>
              </div>
            </section>
          </aside>

          <div className={styles.primaryColumn} data-node-id="163:215">
            <section className={`${styles.card} ${styles.profileCard}`} data-node-id="163:216">
              <div className={styles.profileHeader} data-node-id="163:217">
                <div className={styles.profileName}><div className={styles.nameRow}><VerifiedBadge /><strong data-node-id="163:224">علی رضایی</strong></div></div>
                <span className={styles.initialAvatar} data-node-id="163:218">ع ر</span>
              </div>
              <Link href="/user/account/profile-image" className={styles.textAction} data-node-id="163:226">تغییر تصویر</Link>
            </section>

            <section className={styles.card} data-node-id="163:228">
              <div className={styles.cardHeader}><Link href="/user/account/change-mobile" className={styles.outlineButton} data-node-id="163:230">تغییر شماره موبایل</Link><h2 data-node-id="163:235">شماره موبایل</h2></div>
              <div className={styles.valueRow}><strong className={styles.ltrNumber} dir="ltr" data-node-id="163:237">۰۹۱۲•••••۶۷</strong><VerifiedBadge /></div>
              <p className={styles.hint} data-node-id="163:240">برای تغییر شماره، شماره جدید باید با کد تأیید ثبت شود.</p>
            </section>

            <section className={styles.card} data-node-id="671:220">
              <div className={styles.cardHeader}><PreviewAction className={styles.outlineButton} label="افزودن شماره شبا" title="ثبت شماره شبا" message="ثبت شبای واقعی به حساب احراز هویت‌شده و اعتبارسنجی بانکی نیاز دارد؛ در پیش‌نمایش شماره بانکی دریافت نمی‌کنیم.">افزودن شماره شبا (پیش‌نمایش)</PreviewAction><h2 data-node-id="671:223">شماره شبا</h2></div>
              <div className={styles.valueRow}><strong data-node-id="671:225">ثبت نشده</strong><span className={styles.neutralBadge}>ثبت نشده</span></div>
              <p className={styles.hint} data-node-id="671:227">شماره شبای بانکی خود را برای دریافت و تسویه ثبت کنید.</p>
            </section>

            <section className={styles.card} data-node-id="163:241">
              <h2 data-node-id="163:242">اطلاعات هویتی</h2>
              <div className={styles.identityList}><div className={styles.identityRow}><strong>علی رضایی</strong><span>نام و نام خانوادگی</span></div><div className={styles.divider} /><div className={styles.identityRow}><strong className={styles.ltrNumber} dir="ltr">۰۰۱•••••۷۸۹</strong><span>کد ملی</span></div></div>
            </section>

            <section className={`${styles.card} ${styles.membershipCard}`} data-node-id="204:100">
              <h2 data-node-id="204:101">عضویت چارخونه</h2>
              <div className={styles.membershipList}>
                <div className={styles.membershipRow}><span>وضعیت</span><span className={styles.activeBadge}>نمونه فعال</span></div>
                <div className={styles.membershipRow}><span>سقف تأمین مالی</span><strong>۵۰۰٬۰۰۰٬۰۰۰ تومان</strong></div>
                <div className={styles.membershipRow}><span>دفعات باقی‌مانده</span><strong>۱ بار</strong></div>
              </div>
              <Link href="/user/contracts/register/plans/membership" className={styles.membershipLink} data-node-id="204:113">مشاهده عضویت (نمونه)</Link>
            </section>
          </div>
        </div>
      </section>

      <UserPanelSidebar nodeId="161:491" />
    </main>
  );
}
