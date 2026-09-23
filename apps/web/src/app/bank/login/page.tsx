import Link from "next/link";
import styles from "./page.module.css";

const logo = "/brand/dashboard-logo.png";
const divider = "https://www.figma.com/api/mcp/asset/a443b811-c35d-4512-bb35-9fe8dff55216.svg";

export default function BankLoginPage() {
  return (
    <main className={styles.page} data-node-id="790:12" data-name="Bank / Login">
      <section className={styles.formArea}>
        <div className={styles.loginCard} data-node-id="790:21" data-name="login-card">
          <header className={styles.headers}>
            <h1 data-node-id="790:22">ورود به پنل بانک</h1>
            <p data-node-id="790:23">برای ادامه، اطلاعات دسترسی پنل بانک را وارد کنید.</p>
          </header>
          <div className={styles.form}>
            <div className={styles.field}><label data-node-id="790:24">ایمیل یا شماره موبایل سازمانی</label><div className={styles.inputLike} data-node-id="790:25">user@bank.ir</div></div>
            <div className={styles.field}><label data-node-id="790:27">رمز عبور</label><div className={`${styles.inputLike} ${styles.passwordValue}`} data-node-id="790:28">••••••••••••</div></div>
            <p className={styles.helper} data-node-id="790:30">برای بازنشانی رمز، از مدیر دسترسی بانک یا پشتیبانی چارخونه درخواست دهید.</p>
            <Link href="/bank" className={styles.submit} data-node-id="790:31">ورود به پنل بانک</Link>
          </div>
          <img className={styles.divider} src={divider} alt="" />
          <p className={styles.accessNote} data-node-id="790:34">دسترسی پنل توسط چارخونه برای مسئول معرفی‌شده بانک فعال می‌شود.</p>
        </div>
        <p className={styles.footer} data-node-id="790:35">چارخونه — پنل بانک</p>
      </section>

      <aside className={styles.identityPanel} data-node-id="790:13" data-name="identity-panel">
        <img className={styles.logo} src={logo} alt="چارخونه" width={180} height={78} data-node-id="790:14" />
        <h2 data-node-id="790:15">پنل بانک چارخونه</h2>
        <p data-node-id="790:16">مدیریت پرونده‌ها و همکاری مالی</p>
        <p data-node-id="790:17">دسترسی این بخش فقط برای کاربران مجاز بانک فعال است.</p>
        <section className={styles.securityNote} data-node-id="790:18"><h3 data-node-id="790:19">دسترسی امن</h3><p data-node-id="790:20">اطلاعات ورود سازمانی خود را در اختیار دیگران قرار ندهید.</p></section>
      </aside>
    </main>
  );
}
