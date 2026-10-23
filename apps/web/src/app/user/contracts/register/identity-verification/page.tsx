import { TextField } from "@/components/ui/TextField";
import styles from "@/app/identity-verification/page.module.css";

const identityLogo = "/brand/login-card.png";

export default function IdentityVerificationPage() {
  return (
    <main
      className={styles.page}
      data-node-id="167:211"
      data-name="Web App / Khodnevis Ownership Verification"
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
            <h2 data-node-id="167:221">تطبیق هویت پیش از استعلام خودنویس</h2>
            <p data-node-id="167:222">کد ملی فقط هنگام درخواست استعلام واقعی قرارداد از خودنویس لازم است. این صفحه پیش‌نمایش این مرحله است و هنوز به سرویس استعلام متصل نیست.</p>
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
                شماره از نشست احراز هویت معتبر دریافت می‌شود
              </bdi>
              <span className={styles.verifiedBadge} data-node-id="167:241" data-name="Verified Badge">
                <span data-node-id="167:240">هنوز تأیید نشده</span>
              </span>
            </div>
          </div>

          <div className={styles.inputSection} data-node-id="167:228" data-name="Input Section">
            <div className={styles.inputWidth} style={{ width: "100%" }} data-node-id="167:229" data-name="Input">
              <TextField
                id="national-id"
                name="nationalId"
                disabled
                aria-describedby="identity-preview-message"
                label="کد ملی"
                type="text"
                inputMode="numeric"
                autoComplete="off"
                maxLength={10}
                placeholder="ورود اطلاعات پس از اتصال استعلام معتبر فعال می‌شود"
                className={styles.nationalIdInput}
              />
            </div>
          </div>

          <div className={styles.action} data-node-id="167:234" data-name="Action Wrapper">
            <button
              type="button"
              className={`ch-button ${styles.submit}`}
              data-node-id="167:235"
              disabled
              aria-disabled="true"
              title="استعلام واقعی کد ملی و موبایل هنوز به ارائه‌دهنده متصل نشده است"
            >
              تطبیق هویت و استعلام خودنویس هنوز فعال نیست
            </button>
          </div>
        <p id="identity-preview-message">در این پیش‌نمایش کد ملی جمع‌آوری یا ارسال نمی‌شود؛ استعلام فقط در نسخه عملیاتی، پس از تأیید شما انجام خواهد شد.</p>
        </section>
      </div>
    </main>
  );
}
