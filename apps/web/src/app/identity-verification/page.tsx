import Link from "next/link";
import { TextField } from "@/components/ui/TextField";
import styles from "./page.module.css";

const identityLogo = "/brand/login-card.png";

export default function IdentityVerificationPage() {
  return (
    <main
      className={styles.page}
      data-node-id="167:211"
      data-name="Web App / Identity Verification"
    >
      <div className={styles.split} data-node-id="167:212" data-name="Split Container">
        <section className={styles.showcase} data-node-id="167:213" data-name="Brand Showcase">
          <p className={styles.brandName} data-node-id="167:214">
            چارخونه
          </p>
          <h1 className={styles.tagline} data-node-id="142:1471">
            همراه مستأجر، حامی مالک
          </h1>
          <p className={styles.description} data-node-id="167:216">
            چارخونه مسیر قرارداد، تأمین مالی مستأجر و تسویه مالک را در یک تجربه یکپارچه و شفاف کنار هم قرار می‌دهد.
          </p>
        </section>

        <section className={styles.card} data-node-id="167:217" data-name="Auth Card Wrapper">
          <div className={styles.logoHeader} data-node-id="167:218" data-name="Logo Header">
            <img
              className={styles.logo}
              src={identityLogo}
              alt="چارخونه"
              width={140}
              height={60}
              data-node-id="167:219"
            />
          </div>

          <div className={styles.headers} data-node-id="167:220" data-name="Card Headers">
            <h2 data-node-id="167:221">تأیید هویت</h2>
            <p data-node-id="167:222">برای تکمیل حساب کاربری، کد ملی خود را وارد کنید.</p>
          </div>

          <div
            className={styles.verifiedMobile}
            data-node-id="167:223"
            data-name="Verified Mobile Section"
          >
            <p className={styles.fieldLabel} data-node-id="167:224">
              شماره موبایل
            </p>
            <div className={styles.verifiedRow} data-node-id="167:225" data-name="Frame">
              <bdi dir="ltr" className={styles.mobileValue} data-node-id="167:227">
                ۰۹۱۲•••••۶۷
              </bdi>
              <span className={styles.verifiedBadge} data-node-id="167:241" data-name="Verified Badge">
                <span data-node-id="167:240">تأیید شده</span>
              </span>
            </div>
          </div>

          <div className={styles.inputSection} data-node-id="167:228" data-name="Input Section">
            <div className={styles.inputWidth} style={{ width: "100%" }} data-node-id="167:229" data-name="Input">
              <TextField
                id="national-id"
                name="nationalId"
                label="کد ملی"
                type="text"
                inputMode="numeric"
                autoComplete="off"
                maxLength={10}
                placeholder="۰۰۱۲۳۴۵۶۷۸"
                className={styles.nationalIdInput}
              />
            </div>
          </div>

          <div className={styles.action} data-node-id="167:234" data-name="Action Wrapper">
            <Link
              href="/user/home"
              className={`ch-button ${styles.submit}`}
              data-node-id="167:235"
            >
              تأیید هویت
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}
