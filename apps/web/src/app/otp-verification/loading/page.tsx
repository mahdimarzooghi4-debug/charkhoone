import Link from "next/link";
import styles from "../page.module.css";

const logoUrl = "https://www.figma.com/api/mcp/asset/63e769d6-d861-4929-a849-51329c1b8ad2.png";
const otpDigits = ["۴", "۸", "۲", "۱", "۶"] as const;

export default function OtpLoadingPage() {
  return (
    <main className={styles.page} data-node-id="168:215" data-name="Web App / OTP Verification / Loading">
      <section className={styles.split} data-node-id="168:216" data-name="Split Container">
        <div className={styles.showcase} data-node-id="168:217" data-name="Brand Showcase">
          <p className={styles.brandName} data-node-id="168:218">چارخونه</p>
          <h1 className={styles.tagline} data-node-id="168:219">همراه مستأجر، حامی مالک</h1>
          <p className={styles.description} data-node-id="168:220">چارخونه مسیر قرارداد، تأمین مالی مستأجر و تسویه مالک را در یک تجربه یکپارچه و شفاف کنار هم قرار می‌دهد.</p>
        </div>

        <section className={styles.card} data-node-id="168:221" data-name="Auth Card Wrapper">
          <div className={styles.logoHeader} data-node-id="168:222" data-name="Logo Header">
            <img className={styles.logo} src={logoUrl} alt="چارخونه" width={140} height={60} data-node-id="168:223" />
          </div>

          <header className={styles.headers} data-node-id="168:224" data-name="Card Headers">
            <h2 data-node-id="168:225">کد تأیید را وارد کنید</h2>
            <p data-node-id="168:226">کد ارسال‌شده به شماره ۰۹۱۲•••••۶۷ را وارد کنید.</p>
          </header>

          <div className={styles.otpSection} data-node-id="168:227" data-name="OTP Input Section">
            <div className={`${styles.digits} ${styles.faded}`} data-node-id="168:228" data-name="Digits Track" aria-label="کد یک‌بار مصرف در حال بررسی">
              {otpDigits.map((digit, index) => (
                <div key={`${digit}-${index}`} className={styles.digitBox} data-node-id={`168:${229 + index * 2}`}>{digit}</div>
              ))}
            </div>
          </div>

          <div className={`${styles.resend} ${styles.faded}`} data-node-id="168:239" data-name="Resend Section">
            <span data-node-id="168:240">کد را دریافت نکردید؟</span>
            <strong data-node-id="168:241">ارسال مجدد تا ۰۰:۵۹</strong>
          </div>

          <div className={styles.action} data-node-id="168:242" data-name="Action Wrapper">
            <div className={`ch-button ${styles.submit} ${styles.loadingSubmit}`} aria-disabled="true" data-node-id="168:243">در حال بررسی…</div>
          </div>

          <Link className={styles.changeMobile} href="/login" data-node-id="168:244">تغییر شماره موبایل</Link>
        </section>
      </section>
    </main>
  );
}
