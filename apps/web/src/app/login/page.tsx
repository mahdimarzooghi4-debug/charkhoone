import { Button } from "@/components/ui/Button";
import { TextField } from "@/components/ui/TextField";
import styles from "./page.module.css";

// Exact original Figma login-card logo, stored locally to avoid expiring asset URLs.
const loginLogo = "/brand/login-card.png";

export default function LoginPage() {
  return (
    <main className={styles.page} data-node-id="163:165" data-name="Web App / Login">
      <div className={styles.split} data-node-id="163:168" data-name="Split Container">
        <section className={styles.showcase} data-node-id="163:169" data-name="Brand Showcase">
          <p className={styles.brandName} style={{ alignSelf: "flex-start", width: "auto", textAlign: "right" }} data-node-id="163:171">
            چارخونه
          </p>
          <h1 className={styles.tagline} data-node-id="142:1469">
            همراه مستأجر، حامی مالک
          </h1>
          <p className={styles.description} data-node-id="163:173">
            چارخونه مسیر قرارداد، تأمین مالی مستأجر و تسویه مالک را در یک تجربه یکپارچه و شفاف کنار هم قرار می‌دهد.
          </p>
        </section>

        <section className={styles.card} data-node-id="163:181" data-name="Auth Card Wrapper">
          <div className={styles.logoContainer} data-node-id="163:182" data-name="Logo Container">
            <div className={styles.logoHeader} data-node-id="164:35" data-name="Logo Header">
              <img
                className={styles.logo}
                src={loginLogo}
                alt="چارخونه"
                width={140}
                height={60}
                data-node-id="163:183"
              />
            </div>
          </div>

          <div className={styles.headers} data-node-id="163:184" data-name="Card Headers">
            <h2 data-node-id="163:185">به چارخونه خوش آمدید</h2>
            <p data-node-id="163:186">برای ورود به حساب کاربری، شماره موبایل خود را وارد کنید.</p>
          </div>

          <form
            className={styles.form}
            action="/otp-verification"
            method="get"
            data-node-id="163:187"
            data-name="Input Section"
          >
            <TextField
              id="mobile"
              name="mobile"
              label="شماره موبایل"
              type="tel"
              inputMode="numeric"
              autoComplete="tel"
              placeholder="۰۹۱۲۱۲۳۴۵۶۷"
              className={styles.mobileInput}
            />

            <div className={styles.action} data-node-id="163:188" data-name="Action Wrapper">
              <Button type="submit" className={styles.submit} data-node-id="163:189">
                دریافت کد تأیید
              </Button>
            </div>
          </form>

          <div className={styles.divider} data-node-id="163:192" data-name="Divider Wrapper" />

          <p className={styles.legal} data-node-id="163:193">
            با ورود به چارخونه، <span>قوانین و مقررات</span> و <span>حریم خصوصی</span> را می‌پذیرید.
          </p>
        </section>
      </div>
    </main>
  );
}
