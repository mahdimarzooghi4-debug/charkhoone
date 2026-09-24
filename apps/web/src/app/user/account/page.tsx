"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import styles from "./page.module.css";
import { UserPanelSidebar } from "@/components/user/UserPanelSidebar";

const chevron = "/brand/dashboard-nav-file.svg";
const NOTIFICATION_KEY = "charkhoone.preview.notifications";
const IBAN_KEY = "charkhoone.preview.iban";

function VerifiedBadge() {
  return <span className={styles.verifiedBadge}>تأیید شده</span>;
}

function maskIban(value: string) {
  const clean = value.replace(/\s+/g, "").toUpperCase();
  if (clean.length < 8) return clean;
  return `${clean.slice(0, 4)} •••• •••• •••• •••• ${clean.slice(-4)}`;
}

export default function AccountPage() {
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [iban, setIban] = useState("");

  useEffect(() => {
    const storedNotifications = window.localStorage.getItem(NOTIFICATION_KEY);
    if (storedNotifications !== null) setNotificationsEnabled(storedNotifications !== "false");
    setIban(window.localStorage.getItem(IBAN_KEY) ?? "");
  }, []);

  function toggleNotifications() {
    setNotificationsEnabled((current) => {
      const next = !current;
      window.localStorage.setItem(NOTIFICATION_KEY, String(next));
      return next;
    });
  }

  return (
    <main className={styles.page} data-node-id="161:424" data-name="Web App / Account">
      <section className={styles.mainContent} data-node-id="161:425">
        <header className={styles.header} data-node-id="161:426"><h1 data-node-id="161:428">حساب من</h1><p data-node-id="161:429">اطلاعات حساب و تنظیمات اصلی خود را مدیریت کنید.</p></header>

        <div className={styles.columns} data-node-id="163:196">
          <aside className={styles.secondaryColumn} data-node-id="163:197">
            <section className={styles.settingsCard} data-node-id="163:198">
              <h2 data-node-id="163:199">تنظیمات</h2>
              <div className={styles.settingsList} data-node-id="163:200">
                <button
                  type="button"
                  className={styles.settingsRow}
                  onClick={toggleNotifications}
                  role="switch"
                  aria-checked={notificationsEnabled}
                  aria-label={notificationsEnabled ? "غیرفعال کردن اعلان‌ها" : "فعال کردن اعلان‌ها"}
                >
                  <span className={`${styles.toggle} ${notificationsEnabled ? "" : styles.toggleOff}`} aria-hidden="true"><i /></span>
                  <span>اعلان‌ها</span>
                </button>
                <div className={styles.divider} />
                <Link className={styles.settingsRow} href="/terms"><img src={chevron} alt="" width={20} height={20} /><span>قوانین و مقررات</span></Link>
                <div className={styles.divider} />
                <Link className={styles.settingsRow} href="/privacy"><img src={chevron} alt="" width={20} height={20} /><span>حریم خصوصی</span></Link>
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
              <div className={styles.cardHeader}>
                <Link className={styles.outlineButton} href="/user/account/iban">
                  {iban ? "ویرایش شماره شبا" : "افزودن شماره شبا"}
                </Link>
                <h2 data-node-id="671:223">شماره شبا</h2>
              </div>
              <div className={styles.valueRow}>
                <strong className={styles.ibanValue} dir="ltr" data-node-id="671:225">{iban ? maskIban(iban) : "ثبت نشده"}</strong>
                <span className={iban ? styles.verifiedBadge : styles.neutralBadge}>{iban ? "ثبت شده" : "ثبت نشده"}</span>
              </div>
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
