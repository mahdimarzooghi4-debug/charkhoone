import Link from "next/link";
import styles from "../page.module.css";

const logoUrl = "https://www.figma.com/api/mcp/asset/1b6be4d7-97b0-48d5-b10a-904d38b36bfe.png";
const otpDigits = ["۴", "۸", "۲", "۱", "۶"] as const;

export default function OtpErrorPage() {
  return (
    <main className={styles.page} data-node-id="168:45" data-name="Web App / OTP Verification / Error">
      <section className={styles.split} data-node-id="168:46" data-name="Split Container">
        <div className={styles.showcase} data-node-id="168:47" data-name="Brand Showcase">
          <p className={styles.brandName} data-node-id="168:48">چارخونه</p>
          <h1 className={styles.tagline} data-node-id="168:49">همراه مستأجر، حامی مالک</h1>
          <p className={styles.description} data-node-id="168:50">چارخونه مسیر قرارداد، تأمین مالی مستأجر و تسویه مالک را در یک تجربه یکپارچه و شفاف کنار هم قرار می‌دهد.</p>
        </div>

        <section className={styles.card} data-node-id="168:51" data-name="Auth Card Wrapper">
          <div className={styles.logoHeader} data-node-id="168:52" data-name="Logo Header">
            <img className={styles.logo} src={logoUrl} alt="چارخونه" width={140} height={60} data-node-id="168:53" />
          </div>

          <header className={styles.headers} data-node-id="168:54" data-name="Card Headers">
            <h2 data-node-id="168:55">کد تأیید را وارد کنید</h2>
            <p data-node-id="168:56">کد ارسال‌شده به شماره ۰۹۱۲•••••۶۷ را وارد کنید.</p>
          </header>

          <div className={styles.otpSection} data-node-id="168:57" data-name="OTP Input Section">
            <div className={styles.digits} data-node-id="168:58" data-name="Digits Track" aria-label="کد یک‌بار مصرف">
              {otpDigits.map((digit, index) => (
                <div key={`${digit}-${index}`} className={`${styles.digitBox} ${styles.digitError}`} data-node-id={`${168 + Math.floor(index / 5)}:${59 + index * 2}`}>
                  {digit}
                </div>
              ))}
            </div>
            <p className={styles.errorText} data-node-id="168:76">کد واردشده صحیح نیست.</p>
          </div>

          <div className={styles.resend} data-node-id="168:69" data-name="Resend Section">
            <span data-node-id="168:70">کد را دریافت نکردید؟</span>
            <strong data-node-id="168:71">ارسال مجدد تا ۰۰:۵۹</strong>
          </div>

          <div className={styles.action} data-node-id="168:72" data-name="Action Wrapper">
            <Link href="/identity-verification" className={`ch-button ${styles.submit}`} data-node-id="168:73">تأیید و ورود</Link>
          </div>

          <Link className={styles.changeMobile} href="/login" data-node-id="168:74">تغییر شماره موبایل</Link>
        </section>
      </section>
    </main>
  );
}
