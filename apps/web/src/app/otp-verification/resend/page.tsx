import Link from "next/link";
import styles from "../page.module.css";

const logoUrl = "https://www.figma.com/api/mcp/asset/f0ed9039-f6b4-467b-978d-9da8c2980be2.png";
const emptyDigits = [0, 1, 2, 3, 4] as const;

export default function OtpResendPage() {
  return (
    <main className={styles.page} data-node-id="168:248" data-name="Web App / OTP Verification / Resend Available">
      <section className={styles.split} data-node-id="168:249" data-name="Split Container">
        <div className={styles.showcase} data-node-id="168:250" data-name="Brand Showcase">
          <p className={styles.brandName} data-node-id="168:251">چارخونه</p>
          <h1 className={styles.tagline} data-node-id="168:252">همراه مستأجر، حامی مالک</h1>
          <p className={styles.description} data-node-id="168:253">چارخونه مسیر قرارداد، تأمین مالی مستأجر و تسویه مالک را در یک تجربه یکپارچه و شفاف کنار هم قرار می‌دهد.</p>
        </div>

        <section className={styles.card} data-node-id="168:254" data-name="Auth Card Wrapper">
          <div className={styles.logoHeader} data-node-id="168:255" data-name="Logo Header">
            <img className={styles.logo} src={logoUrl} alt="چارخونه" width={140} height={60} data-node-id="168:256" />
          </div>

          <header className={styles.headers} data-node-id="168:257" data-name="Card Headers">
            <h2 data-node-id="168:258">کد تأیید را وارد کنید</h2>
            <p data-node-id="168:259">کد ارسال‌شده به شماره ۰۹۱۲•••••۶۷ را وارد کنید.</p>
          </header>

          <div className={styles.otpSection} data-node-id="168:260" data-name="OTP Input Section">
            <div className={styles.digits} data-node-id="168:261" data-name="Digits Track" aria-label="کد یک‌بار مصرف جدید">
              {emptyDigits.map((index) => (
                <div key={index} className={styles.digitBox} data-node-id={`168:${262 + index * 2}`} aria-hidden="true">​</div>
              ))}
            </div>
          </div>

          <div className={styles.resend} data-node-id="168:272" data-name="Resend Section">
            <span data-node-id="168:273">کد را دریافت نکردید؟</span>
            <span className={styles.resendLink} data-node-id="168:274">ارسال مجدد کد</span>
          </div>

          <p className={styles.successText} data-node-id="168:281">کد جدید ارسال شد.</p>

          <div className={styles.action} data-node-id="168:275" data-name="Action Wrapper">
            <Link href="/identity-verification" className={`ch-button ${styles.submit}`} data-node-id="168:276">تأیید و ورود</Link>
          </div>

          <Link className={styles.changeMobile} href="/login" data-node-id="168:277">تغییر شماره موبایل</Link>
        </section>
      </section>
    </main>
  );
}
