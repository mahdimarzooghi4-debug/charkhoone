import Link from "next/link";
import styles from "../page.module.css";

const logo = "https://www.figma.com/api/mcp/asset/7665e923-039b-492d-8a14-0a0e874c03ef.png";
const divider = "https://www.figma.com/api/mcp/asset/8ecb5a35-0086-46c6-958d-5ad684c4988d.svg";

export default function BankLoginFailedPage() {
  return (
    <main className={styles.page} data-node-id="793:36" data-name="Bank / Login / Failed">
      <section className={styles.formArea}>
        <div className={styles.loginCard} data-node-id="793:45" data-name="login-card">
          <header className={styles.headers}><h1 data-node-id="793:46">ورود به پنل بانک</h1><p data-node-id="793:47">برای ادامه، اطلاعات دسترسی پنل بانک را وارد کنید.</p></header>
          <div className={styles.form}>
            <div className={styles.field}><label data-node-id="793:48">ایمیل یا شماره موبایل سازمانی</label><div className={`${styles.inputLike} ${styles.errorInput}`} data-node-id="793:49">user@bank.ir</div></div>
            <div className={styles.field}><label data-node-id="793:51">رمز عبور</label><div className={`${styles.inputLike} ${styles.passwordValue} ${styles.errorInput}`} data-node-id="793:52">••••••••••••</div></div>
            <p className={`${styles.helper} ${styles.errorHelper}`} data-node-id="793:54">ایمیل/شماره موبایل یا رمز عبور نادرست است. دوباره تلاش کنید.</p>
            <Link href="/bank" className={styles.submit} data-node-id="793:55">ورود به پنل بانک</Link>
          </div>
          <img className={styles.divider} src={divider} alt="" />
          <p className={styles.accessNote} data-node-id="793:58">دسترسی پنل توسط چارخونه برای مسئول معرفی‌شده بانک فعال می‌شود.</p>
        </div>
        <p className={styles.footer} data-node-id="793:59">چارخونه — پنل بانک</p>
      </section>

      <aside className={styles.identityPanel} data-node-id="793:37" data-name="identity-panel">
        <img className={styles.logo} src={logo} alt="چارخونه" width={180} height={78} data-node-id="793:38" />
        <h2 data-node-id="793:39">پنل بانک چارخونه</h2><p data-node-id="793:40">مدیریت پرونده‌ها و همکاری مالی</p><p data-node-id="793:41">دسترسی این بخش فقط برای کاربران مجاز بانک فعال است.</p>
        <section className={styles.securityNote} data-node-id="793:42"><h3 data-node-id="793:43">دسترسی امن</h3><p data-node-id="793:44">اطلاعات ورود سازمانی خود را در اختیار دیگران قرار ندهید.</p></section>
      </aside>
    </main>
  );
}
