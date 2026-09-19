import Link from "next/link";
import styles from "./page.module.css";
import { UserPanelExit } from "@/components/user/UserPanelExit";

const assets = {
  logo: "https://www.figma.com/api/mcp/asset/a2a337ac-2d09-4a34-9133-34a036902ee1.png",
  avatar: "https://www.figma.com/api/mcp/asset/e0f4be78-f29c-4aef-a8ba-84a76a0d2137.png",
  chevron: "https://www.figma.com/api/mcp/asset/b42c8b86-7104-4e4f-aa77-a140afe1ccb4.svg",
  home: "https://www.figma.com/api/mcp/asset/5bf7f5aa-ffef-4767-b13a-11379b6ff4db.svg",
  contracts: "https://www.figma.com/api/mcp/asset/a5e21c58-a5d7-48d2-a3d7-bb2a7b0d309f.svg",
  payments: "https://www.figma.com/api/mcp/asset/c41cf9d8-1a0c-4e08-8725-de94ddaac0e6.svg",
  account: "https://www.figma.com/api/mcp/asset/0046a9e8-9f89-40b3-a185-d2368b291481.svg",
} as const;

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
                <button type="button" className={styles.settingsRow} data-node-id="163:206"><img src={assets.chevron} alt="" width={20} height={20} /><span>قوانین و مقررات</span></button>
                <div className={styles.divider} />
                <button type="button" className={styles.settingsRow} data-node-id="163:210"><img src={assets.chevron} alt="" width={20} height={20} /><span>حریم خصوصی</span></button>
              </div>
            </section>
            <button type="button" className={styles.logoutAction} data-node-id="163:213">خروج از حساب</button>
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
              <div className={styles.valueRow}><strong data-node-id="163:237">۰۹۱۲•••••۶۷</strong><VerifiedBadge /></div>
              <p className={styles.hint} data-node-id="163:240">برای تغییر شماره، شماره جدید باید با کد تأیید ثبت شود.</p>
            </section>

            <section className={styles.card} data-node-id="671:220">
              <div className={styles.cardHeader}><button type="button" className={styles.outlineButton} data-node-id="671:222">افزودن شماره شبا</button><h2 data-node-id="671:223">شماره شبا</h2></div>
              <div className={styles.valueRow}><strong data-node-id="671:225">ثبت نشده</strong><span className={styles.neutralBadge}>ثبت نشده</span></div>
              <p className={styles.hint} data-node-id="671:227">شماره شبای بانکی خود را برای دریافت و تسویه ثبت کنید.</p>
            </section>

            <section className={styles.card} data-node-id="163:241">
              <h2 data-node-id="163:242">اطلاعات هویتی</h2>
              <div className={styles.identityList}><div className={styles.identityRow}><strong>علی رضایی</strong><span>نام و نام خانوادگی</span></div><div className={styles.divider} /><div className={styles.identityRow}><strong>۰۰۱•••••۷۸۹</strong><span>کد ملی</span></div></div>
            </section>

            <section className={`${styles.card} ${styles.membershipCard}`} data-node-id="204:100">
              <h2 data-node-id="204:101">عضویت چارخونه</h2>
              <div className={styles.membershipList}>
                <div className={styles.membershipRow}><span>وضعیت</span><span className={styles.activeBadge}>فعال</span></div>
                <div className={styles.membershipRow}><span>سقف تأمین مالی</span><strong>۵۰۰٬۰۰۰٬۰۰۰ تومان</strong></div>
                <div className={styles.membershipRow}><span>دفعات باقی‌مانده</span><strong>۲ بار</strong></div>
              </div>
              <button type="button" className={styles.membershipLink} data-node-id="204:113">مشاهده عضویت</button>
            </section>
          </div>
        </div>
      </section>

      <aside className={styles.sidebar} data-node-id="161:491">
        <div className={styles.sidebarTop}><div className={styles.logoWrap}><img src={assets.logo} alt="چارخونه" width={127} height={55} /></div><nav className={styles.nav} aria-label="ناوبری حساب کاربری"><Link href="/user/home" className={styles.navItem}><span>خانه</span><img src={assets.home} alt="" width={20} height={20} /></Link><Link href="/user/contracts" className={styles.navItem}><span>قراردادها</span><img src={assets.contracts} alt="" width={20} height={20} /></Link><Link href="/user/receive-pay" className={styles.navItem}><span>دریافت و پرداخت</span><img src={assets.payments} alt="" width={20} height={20} /></Link><Link href="/user/account" className={`${styles.navItem} ${styles.navActive}`}><span>حساب من</span><img src={assets.account} alt="" width={20} height={20} /></Link></nav></div><UserPanelExit />
      </aside>
    </main>
  );
}
