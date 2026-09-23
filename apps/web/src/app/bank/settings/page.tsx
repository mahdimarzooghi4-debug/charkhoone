import Link from "next/link";
import shell from "../panel.module.css";
import styles from "./page.module.css";

const assets = {
  logo: "/brand/dashboard-logo.png",
  home: "https://www.figma.com/api/mcp/asset/c8d8fed3-8645-4c40-aa6e-11e7261d30fb.svg",
  requests: "https://www.figma.com/api/mcp/asset/f8bc8f80-df1a-4950-9c16-ac1c13fe5ac6.svg",
  plans: "https://www.figma.com/api/mcp/asset/4a608fe9-8bce-41e6-992d-7333d31b6c4a.svg",
  payments: "https://www.figma.com/api/mcp/asset/48878073-9ee7-478c-9347-0d6be6a974e8.svg",
  settings: "https://www.figma.com/api/mcp/asset/33eaf642-562b-4d66-bc1b-e5062d66a42c.svg",
  logout: "https://www.figma.com/api/mcp/asset/fa77d743-bdb4-4a41-bc8b-3132bac82a11.svg",
} as const;

const users = [
  ["علی رضایی","مدیر تیم","۰۹۱۲•••۱۲۳۴","امروز، ۱۰:۴۵","فعال","active"],
  ["مریم احمدی","کارشناس","۰۹۱۲•••۵۶۷۸","دیروز، ۱۶:۲۰","فعال","active"],
  ["حسین کریمی","کارشناس","۰۹۱۲•••۹۸۷۶","۵ روز پیش","غیرفعال","inactive"],
] as const;

const connections = [
  ["خدمات بانکی","اجرای عملیات بانکی سیستمی فعال است.","متصل"],
  ["کارگزاری بانک","ارتباط با کارگزاری همین بانک برقرار است.","متصل"],
  ["دریافت وضعیت تراکنش‌ها","نتیجه و وضعیت تراکنش‌ها به‌صورت سیستمی دریافت می‌شود.","فعال"],
  ["اجرای تراکنش‌های سیستمی","عملیات مالی مجاز از داخل پنل انجام می‌شود.","فعال"],
] as const;

function Sidebar() {
  return <aside className={shell.sidebar}><div className={shell.brand}><img className={shell.logo} src={assets.logo} alt="چارخونه" width={127} height={55} /><div className={shell.bankIdentity}><strong>بانک نمونه</strong><span>تیم مدیریت تسهیلات</span></div></div><nav className={shell.nav}><Link href="/bank" className={shell.navItem}><span>خانه</span><img src={assets.home} alt="" /></Link><Link href="/bank/requests" className={shell.navItem}><span>درخواست‌ها</span><img src={assets.requests} alt="" /></Link><Link href="/bank/plans" className={shell.navItem}><span>طرح‌ها</span><img src={assets.plans} alt="" /></Link><Link href="/bank/receive-pay" className={shell.navItem}><span>دریافت و پرداخت</span><img src={assets.payments} alt="" /></Link><Link href="/bank/settings" className={`${shell.navItem} ${shell.navActive}`}><span>تنظیمات</span><img src={assets.settings} alt="" /></Link><Link href="/bank/login" className={`${shell.navItem} ${shell.logout}`}><span>خروج از حساب</span><img src={assets.logout} alt="" /></Link></nav></aside>;
}

function Field({ label, value }: { label:string; value:string }) { return <div className={styles.field}><label>{label}</label><div className={styles.input}>{value}</div></div>; }

export default function BankSettingsPage() {
  return (
    <main className={shell.page} data-node-id="284:601" data-name="Bank / Settings">
      <section className={styles.main}>
        <header className={styles.header}><h1>تنظیمات</h1><p>مدیریت اطلاعات بانک، کاربران و دسترسی‌های پنل چارخونه</p></header>

        <section className={styles.card}><h2>اطلاعات بانک</h2><div className={styles.divider} /><div className={styles.formGrid}><Field label="واحد مسئول" value="مدیریت تسهیلات" /><Field label="نام بانک" value="بانک نمونه" /><Field label="نام تیم" value="تیم مدیریت تسهیلات" /><Field label="شعبه / واحد" value="شعبه مرکزی تهران" /></div><Link href="/bank/settings" className={styles.save}>ذخیره تغییرات</Link></section>

        <section className={`${styles.card} ${styles.users}`}><div className={styles.usersTop}><Link href="/bank/settings/users/new" className={styles.addButton}>+ افزودن کاربر</Link><div className={styles.usersTitle}><h2>کاربران بانک</h2><span>مدیریت کاربران دارای دسترسی به پنل چارخونه</span></div></div><div className={styles.tableWrap}><div className={styles.table}><div className={styles.tableHeader}><span>اقدام</span><span>وضعیت</span><span>آخرین فعالیت</span><span>شماره موبایل</span><span>نقش</span><span>نام</span></div>{users.map(([name,role,mobile,last,status,tone],index) => <div className={styles.tableRow} key={name}><Link href={`/bank/settings/users/${index + 1}`} className={styles.manage}>مدیریت</Link><span className={tone === "active" ? styles.activeBadge : styles.inactiveBadge}>{status}</span><span className={styles.muted}>{last}</span><span className={styles.muted}>{mobile}</span><span className={styles.value}>{role}</span><span className={styles.name}>{name}</span></div>)}</div></div></section>

        <section className={styles.card}><h2>سطح دسترسی</h2><div className={styles.divider} /><div className={styles.roles}><div className={styles.role}><span className={styles.roleBadge}>کارشناس</span><p>دسترسی عملیاتی به درخواست‌ها و پرونده‌های مالی در محدوده مجاز</p></div><div className={styles.role}><span className={styles.roleBadge}>مدیر تیم</span><p>دسترسی مدیریتی به کاربران، طرح‌ها، درخواست‌ها، عملیات مالی و تنظیمات</p></div></div></section>

        <section className={`${styles.card} ${styles.connections}`}><h2>اتصال‌های سیستمی</h2><p className={styles.connectionLead}>وضعیت سرویس‌های موردنیاز برای عملیات مالی</p><Link href="/bank/settings/api" className={styles.apiButton}>اتصال API</Link><div className={styles.divider} />{connections.map(([title,desc,badge]) => <div className={styles.connectionRow} key={title}><span className={styles.greenBadge}>{badge}</span><div className={styles.connCopy}><strong>{title}</strong><span>{desc}</span></div></div>)}</section>

        <section className={styles.card}><h2>امنیت و ثبت فعالیت</h2><div className={styles.divider} /><div className={styles.connectionRow}><span className={styles.greenBadge}>فعال</span><div className={styles.connCopy}><strong>ثبت فعالیت کاربران</strong><span>اقدامات مهم کاربران بانک همراه با نام کاربر، زمان و نوع عملیات در سیستم ثبت می‌شود.</span></div></div><div className={styles.connectionRow}><span className={styles.greenBadge}>فعال</span><div className={styles.connCopy}><strong>ثبت عملیات مالی</strong><span>اجرای عملیات مالی و نتیجه تراکنش‌ها به‌صورت سیستمی ثبت می‌شود.</span></div></div></section>
      </section>
      <Sidebar />
    </main>
  );
}
