import Link from "next/link";
import shell from "../../../panel.module.css";
import styles from "./page.module.css";

const assets = {
  logo: "https://www.figma.com/api/mcp/asset/7a91ef54-2cb3-46bc-92b1-c9ff578da621.png",
  home: "https://www.figma.com/api/mcp/asset/88878089-3708-4ec6-aa51-47556d010cb7.svg",
  requests: "https://www.figma.com/api/mcp/asset/6e3ae60b-833b-4de0-9a6e-e0870c4785b8.svg",
  plans: "https://www.figma.com/api/mcp/asset/fb26ed8a-1c01-4602-b9ac-cd0772ccda52.svg",
  payments: "https://www.figma.com/api/mcp/asset/94a1068d-cd74-4851-b541-6b4f406e67b1.svg",
  settings: "https://www.figma.com/api/mcp/asset/a4eb5c5a-5144-4378-ae45-6da154523c7e.svg",
  logout: "https://www.figma.com/api/mcp/asset/9435a12b-6f1b-48c0-99c8-1c88a20eeaf1.svg",
} as const;

function Sidebar() {
  return <aside className={shell.sidebar}><div className={shell.brand}><img className={shell.logo} src={assets.logo} alt="چارخونه" width={127} height={55} /><div className={shell.bankIdentity}><strong>بانک نمونه</strong><span>تیم مدیریت تسهیلات</span></div></div><nav className={shell.nav}><Link href="/bank" className={shell.navItem}><span>خانه</span><img src={assets.home} alt="" /></Link><Link href="/bank/requests" className={shell.navItem}><span>درخواست‌ها</span><img src={assets.requests} alt="" /></Link><Link href="/bank/plans" className={shell.navItem}><span>طرح‌ها</span><img src={assets.plans} alt="" /></Link><Link href="/bank/receive-pay" className={shell.navItem}><span>دریافت و پرداخت</span><img src={assets.payments} alt="" /></Link><Link href="/bank/settings" className={`${shell.navItem} ${shell.navActive}`}><span>تنظیمات</span><img src={assets.settings} alt="" /></Link><Link href="/bank/login" className={`${shell.navItem} ${shell.logout}`}><span>خروج از حساب</span><img src={assets.logout} alt="" /></Link></nav></aside>;
}

export default function BankAddUserPage() {
  return (
    <main className={shell.page} data-node-id="289:161" data-name="Bank / Settings / Add User">
      <section className={styles.main}>
        <header className={styles.header}><Link href="/bank/settings" className={styles.back}>‹ بازگشت به تنظیمات</Link><h1>افزودن کاربر بانک</h1><p>ایجاد دسترسی جدید برای یکی از کاربران بانک در پنل چارخونه</p></header>
        <section className={styles.card}>
          <h2>مشخصات کاربر جدید</h2><div className={styles.divider} />
          <div className={styles.formGrid}><div className={styles.field}><label>شماره موبایل</label><div className={styles.input}>۰۹۱۲۱۲۳۴۵۶۷</div></div><div className={styles.field}><label>نام و نام خانوادگی</label><div className={styles.input}>مثلاً علی رضایی</div></div></div>
          <div className={styles.roleGroup}><span className={styles.roleLabel}>نقش کاربری</span><div className={styles.roles}><div className={styles.role}><div className={styles.roleCopy}><h3>کارشناس</h3><p>دسترسی عملیاتی به درخواست‌ها و پرونده‌های مالی در محدوده مجاز</p></div><span className={styles.radio} /></div><div className={`${styles.role} ${styles.roleSelected}`}><div className={styles.roleCopy}><h3>مدیر تیم</h3><p>دسترسی مدیریتی به کاربران، طرح‌ها، درخواست‌ها، عملیات مالی و تنظیمات</p></div><span className={`${styles.radio} ${styles.radioSelected}`} /></div></div><span className={styles.helper}>سطح دسترسی براساس نقش انتخاب‌شده تعیین می‌شود.</span></div>
          <div className={styles.preview}><h3>دسترسی‌های این نقش</h3><div className={styles.chips}><span className={styles.chip}>تنظیمات</span><span className={styles.chip}>دریافت و پرداخت</span><span className={styles.chip}>بررسی درخواست‌ها</span><span className={styles.chip}>مدیریت طرح‌ها</span><span className={styles.chip}>مدیریت کاربران</span></div></div>
          <div className={styles.actions}><Link href="/bank/settings" className={styles.cancel}>انصراف</Link><Link href="/bank/settings" className={styles.submit}>افزودن کاربر</Link></div>
        </section>
      </section>
      <Sidebar />
    </main>
  );
}
