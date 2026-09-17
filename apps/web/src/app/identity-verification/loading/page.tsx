import styles from "../page.module.css";

const logoUrl = "https://www.figma.com/api/mcp/asset/af3f33ef-c8f5-4734-88c3-a526aac0dfe9.png";

export default function IdentityLoadingPage() {
  return (
    <main className={styles.page} data-node-id="170:107" data-name="Web App / Identity Verification / Loading">
      <section className={styles.split} data-node-id="170:108" data-name="Split Container">
        <div className={styles.showcase} data-node-id="170:109" data-name="Brand Showcase">
          <p className={styles.brandName} data-node-id="170:110">چارخونه</p>
          <h1 className={styles.tagline} data-node-id="170:111">همراه مستأجر، حامی مالک</h1>
          <p className={styles.description} data-node-id="170:112">چارخونه مسیر قرارداد، تأمین مالی مستأجر و تسویه مالک را در یک تجربه یکپارچه و شفاف کنار هم قرار می‌دهد.</p>
        </div>
        <section className={styles.card} data-node-id="170:113" data-name="Auth Card Wrapper">
          <div className={styles.logoHeader} data-node-id="170:114" data-name="Logo Header">
            <img className={styles.logo} src={logoUrl} alt="چارخونه" width={140} height={60} data-node-id="170:115" />
          </div>
          <header className={styles.headers} data-node-id="170:116" data-name="Card Headers">
            <h2 data-node-id="170:117">تأیید هویت</h2>
            <p data-node-id="170:118">برای تکمیل حساب کاربری، کد ملی خود را وارد کنید.</p>
          </header>
          <div className={styles.verifiedMobile} data-node-id="170:119" data-name="Verified Mobile Section">
            <p className={styles.fieldLabel} data-node-id="170:120">شماره موبایل</p>
            <div className={styles.verifiedRow} data-node-id="170:121">
              <span className={styles.mobileValue} data-node-id="170:125">۰۹۱۲•••••۶۷</span>
              <span className={styles.verifiedBadge} data-node-id="170:122">تأیید شده</span>
            </div>
          </div>
          <div className={`${styles.inputSection} ${styles.faded}`} data-node-id="170:126" data-name="Input Section">
            <div className={styles.inputWidth} data-node-id="170:127">
              <p className={styles.fieldLabel}>کد ملی</p>
              <div className={styles.identityField}>۰۰۱۲۳۴۵۶۷۸</div>
            </div>
          </div>
          <div className={styles.action} data-node-id="170:128" data-name="Action Wrapper">
            <div className={`ch-button ${styles.submit} ${styles.loadingSubmit}`} aria-disabled="true" data-node-id="170:129">در حال بررسی…</div>
          </div>
        </section>
      </section>
    </main>
  );
}
