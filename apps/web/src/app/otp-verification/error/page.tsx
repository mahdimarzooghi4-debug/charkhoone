import Link from "next/link";
import { Button } from "../../components/ui/Button";
import styles from "../page.module.css";

const logoUrl = "https://www.figma.com/api/mcp/asset/07f3bee8-bab1-475b-b731-2cf8a4196f7a.png";
const otpDigits = ["۴", "۸", "۲", "۱", "۶"] as const;

export default function OtpErrorPage() {
  return (
    <main className={styles.page} data-node-id="168:45" data-name="Web App / OTP Verification / Error">
      <section className={styles.split}>
        <div className={styles.showcase}><p className={styles.brandName}>چارخونه</p><h1 className={styles.tagline}>همراه مستأجر، حامی مالک</h1><p className={styles.description}>چارخونه مسیر قرارداد، تأمین مالی مستأجر و تسویه مالک را در یک تجربه یکپارچه و شفاف کنار هم قرار می‌دهد.</p></div>
        <section className={styles.card}>
          <div className={styles.logoHeader}><img className={styles.logo} src={logoUrl} alt="چارخونه" width={140} height={60} /></div>
          <header className={styles.headers}><h2>تأیید شماره موبایل</h2><p>کد ارسال‌شده به شماره ۰۹۱۲•••••۶۷ را وارد کنید.</p></header>
          <div className={styles.otpSection}><div className={styles.digits} aria-label="کد یک‌بار مصرف">{otpDigits.map((digit, index) => <div key={`${digit}-${index}`} className={`${styles.digitBox} ${styles.digitError}`}>{digit}</div>)}</div></div>
          <p className={styles.errorText}>کد واردشده صحیح نیست. لطفاً دوباره تلاش کنید.</p>
          <div className={styles.resend}><span>ارسال مجدد کد تا</span><strong>۰۰:۴۵</strong></div>
          <div className={styles.action}><Button href="/identity-verification" className={styles.submit}>تأیید و ادامه</Button></div>
          <Link className={styles.changeMobile} href="/login">تغییر شماره موبایل</Link>
        </section>
      </section>
    </main>
  );
}
