import Link from "next/link";
import styles from "../page.module.css";

const logoUrl = "/brand/login-card.png";

export default function IdentityMismatchPage() {
  return (
    <main className={styles.page} data-node-id="170:79" data-name="Web App / Identity Verification / Mismatch">
      <section className={styles.split} data-node-id="170:80" data-name="Split Container">
        <div className={styles.showcase} data-node-id="170:81" data-name="Brand Showcase">
          <p className={styles.brandName} data-node-id="170:82">چارخونه</p>
          <h1 className={styles.tagline} data-node-id="170:83">همراه مستأجر، حامی مالک</h1>
          <p className={styles.description} data-node-id="170:84">چارخونه مسیر قرارداد، تأمین مالی مستأجر و تسویه مالک را در یک تجربه یکپارچه و شفاف کنار هم قرار می‌دهد.</p>
        </div>

        <section className={styles.card} data-node-id="170:85" data-name="Auth Card Wrapper">
          <div className={styles.logoHeader} data-node-id="170:86" data-name="Logo Header">
            <img className={styles.logo} src={logoUrl} alt="چارخونه" width={140} height={60} data-node-id="170:87" />
          </div>

          <header className={styles.headers} data-node-id="170:88" data-name="Card Headers">
            <h2 data-node-id="170:89">تأیید هویت</h2>
            <p data-node-id="170:90">برای تکمیل حساب کاربری، کد ملی خود را وارد کنید.</p>
          </header>

          <div className={styles.verifiedMobile} data-node-id="170:91" data-name="Verified Mobile Section">
            <p className={styles.fieldLabel} data-node-id="170:92">شماره موبایل</p>
            <div className={styles.verifiedRow} data-node-id="170:93">
              <span className={styles.mobileValue} data-node-id="170:97">۰۹۱۲•••••۶۷</span>
              <span className={styles.verifiedBadge} data-node-id="170:94">تأیید شده</span>
            </div>
          </div>

          <div className={styles.inputSection} data-node-id="170:98" data-name="Input Section">
            <div className={styles.inputWidth} data-node-id="170:99">
              <p className={styles.fieldLabel}>کد ملی</p>
              <div className={`${styles.identityField} ${styles.errorField}`}>۰۰۱۲۳۴۵۶۷۸</div>
            </div>
          </div>

          <p className={styles.errorText} data-node-id="170:102">کد ملی واردشده با اطلاعات مالک این شماره موبایل مطابقت ندارد.</p>

          <div className={styles.action} data-node-id="170:100" data-name="Action Wrapper">
            <Link href="/user/home" className={`ch-button ${styles.submit}`} data-node-id="170:101">تأیید هویت</Link>
          </div>
        </section>
      </section>
    </main>
  );
}
