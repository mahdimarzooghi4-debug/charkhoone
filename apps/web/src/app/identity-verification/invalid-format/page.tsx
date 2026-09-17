import Link from "next/link";
import styles from "../page.module.css";

const logoUrl = "https://www.figma.com/api/mcp/asset/74e7a820-3387-48b0-9abb-5c5f1d568943.png";

export default function IdentityInvalidFormatPage() {
  return (
    <main className={styles.page} data-node-id="170:51" data-name="Web App / Identity Verification / Invalid Format">
      <section className={styles.split} data-node-id="170:52" data-name="Split Container">
        <div className={styles.showcase} data-node-id="170:53" data-name="Brand Showcase">
          <p className={styles.brandName} data-node-id="170:54">چارخونه</p>
          <h1 className={styles.tagline} data-node-id="170:55">همراه مستأجر، حامی مالک</h1>
          <p className={styles.description} data-node-id="170:56">چارخونه مسیر قرارداد، تأمین مالی مستأجر و تسویه مالک را در یک تجربه یکپارچه و شفاف کنار هم قرار می‌دهد.</p>
        </div>

        <section className={styles.card} data-node-id="170:57" data-name="Auth Card Wrapper">
          <div className={styles.logoHeader} data-node-id="170:58" data-name="Logo Header">
            <img className={styles.logo} src={logoUrl} alt="چارخونه" width={140} height={60} data-node-id="170:59" />
          </div>

          <header className={styles.headers} data-node-id="170:60" data-name="Card Headers">
            <h2 data-node-id="170:61">تأیید هویت</h2>
            <p data-node-id="170:62">برای تکمیل حساب کاربری، کد ملی خود را وارد کنید.</p>
          </header>

          <div className={styles.verifiedMobile} data-node-id="170:63" data-name="Verified Mobile Section">
            <p className={styles.fieldLabel} data-node-id="170:64">شماره موبایل</p>
            <div className={styles.verifiedRow} data-node-id="170:65">
              <span className={styles.mobileValue} data-node-id="170:69">۰۹۱۲•••••۶۷</span>
              <span className={styles.verifiedBadge} data-node-id="170:66">تأیید شده</span>
            </div>
          </div>

          <div className={styles.inputSection} data-node-id="170:70" data-name="Input Section">
            <div className={styles.inputWidth} data-node-id="170:71">
              <p className={styles.fieldLabel}>کد ملی</p>
              <div className={`${styles.identityField} ${styles.errorField}`}>۰۰۱۲۳۴۵۶۷۸</div>
            </div>
          </div>

          <p className={styles.errorText} data-node-id="170:74">کد ملی واردشده معتبر نیست.</p>

          <div className={styles.action} data-node-id="170:72" data-name="Action Wrapper">
            <Link href="/user/home" className={`ch-button ${styles.submit}`} data-node-id="170:73">تأیید هویت</Link>
          </div>
        </section>
      </section>
    </main>
  );
}
