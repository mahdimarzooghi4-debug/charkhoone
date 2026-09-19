import type { ReactNode } from "react";
import Link from "next/link";
import styles from "./AccountModalScaffold.module.css";
import { UserPanelExit } from "@/components/user/UserPanelExit";

type AssetSet = {
  logo: string;
  avatar: string;
  chevron: string;
  home: string;
  contracts: string;
  payments: string;
  account: string;
};

export function AccountModalScaffold({ assets, children, nodeId }: { assets: AssetSet; children: ReactNode; nodeId: string }) {
  return (
    <main className={styles.page} data-node-id={nodeId}>
      <section className={styles.mainContent}>
        <header className={styles.header}><h1>حساب من</h1><p>اطلاعات حساب و تنظیمات اصلی خود را مدیریت کنید.</p></header>
        <div className={styles.columns}>
          <aside className={styles.secondaryColumn}>
            <section className={styles.settingsCard}><h2>تنظیمات</h2><div className={styles.settingsList}><div className={styles.settingsRow}><span className={styles.toggle}><i /></span><span>اعلان‌ها</span></div><div className={styles.divider} /><div className={styles.settingsRow}><img src={assets.chevron} alt="" width={20} height={20} /><span>قوانین و مقررات</span></div><div className={styles.divider} /><div className={styles.settingsRow}><img src={assets.chevron} alt="" width={20} height={20} /><span>حریم خصوصی</span></div></div></section>
          </aside>
          <div className={styles.primaryColumn}>
            <section className={`${styles.card} ${styles.profileCard}`}><div className={styles.profileHeader}><div className={styles.nameRow}><span className={styles.verified}>تأیید شده</span><strong>علی رضایی</strong></div><span className={styles.initialAvatar}>ع ر</span></div><span className={styles.textAction}>تغییر تصویر</span></section>
            <section className={styles.card}><div className={styles.cardHeader}><span className={styles.outlineButton}>تغییر شماره موبایل</span><h2>شماره موبایل</h2></div><div className={styles.valueRow}><span className={styles.verified}>تأیید شده</span><strong>۰۹۱۲•••••۶۷</strong></div><p className={styles.hint}>برای تغییر شماره، شماره جدید باید با کد تأیید ثبت شود.</p></section>
            <section className={styles.card}><h2>اطلاعات هویتی</h2><div className={styles.identityList}><div className={styles.identityRow}><strong>علی رضایی</strong><span>نام و نام خانوادگی</span></div><div className={styles.divider} /><div className={styles.identityRow}><strong>۰۰۱•••••۷۸۹</strong><span>کد ملی</span></div></div></section>
          </div>
        </div>
      </section>
      <aside className={styles.sidebar}><div className={styles.sidebarTop}><div className={styles.logoWrap}><img src={assets.logo} alt="چارخونه" width={127} height={55} /></div><nav className={styles.nav}><Link href="/user/home" className={styles.navItem}><span>خانه</span><img src={assets.home} alt="" width={20} height={20} /></Link><Link href="/user/contracts" className={styles.navItem}><span>قراردادها</span><img src={assets.contracts} alt="" width={20} height={20} /></Link><Link href="/user/receive-pay" className={styles.navItem}><span>دریافت و پرداخت</span><img src={assets.payments} alt="" width={20} height={20} /></Link><Link href="/user/account" className={`${styles.navItem} ${styles.navActive}`}><span>حساب من</span><img src={assets.account} alt="" width={20} height={20} /></Link></nav></div><UserPanelExit /></aside>
      <div className={styles.backdrop}>{children}</div>
    </main>
  );
}
