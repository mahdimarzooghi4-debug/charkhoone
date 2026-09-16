import Link from "next/link";
import { AccountModalScaffold } from "@/components/account/AccountModalScaffold";
import styles from "./page.module.css";

const assets = {
  logo: "https://www.figma.com/api/mcp/asset/865c34e0-be9f-4e4a-a299-800d1e34a6b6.png",
  avatar: "https://www.figma.com/api/mcp/asset/e8d07a76-e24f-4d22-9866-8da6bb041444.png",
  chevron: "https://www.figma.com/api/mcp/asset/ae3b5ba8-3bb0-4062-a553-3292a066a97a.svg",
  home: "https://www.figma.com/api/mcp/asset/9ba31f92-c2c3-4034-8577-93eb1d66416a.svg",
  contracts: "https://www.figma.com/api/mcp/asset/994f4541-0f3e-4a1e-abc6-14d49b1230f5.svg",
  payments: "https://www.figma.com/api/mcp/asset/9163a3f1-fbc0-4709-92f0-461248d5ccbf.svg",
  account: "https://www.figma.com/api/mcp/asset/b3358fec-4bcc-4949-825e-6236a1d55ee9.svg",
} as const;
const closeIcon = "https://www.figma.com/api/mcp/asset/6e31e94b-d2b5-4f65-8653-bc25c92cf4a5.svg";
const verificationDigits = ["۴", "۸", "۲", "۱", "۶"];

export default function ChangeMobileOtpPage() {
  return (
    <AccountModalScaffold assets={assets} nodeId="175:341">
      <section className={styles.modal} data-node-id="175:426">
        <header className={styles.modalHeader}>
          <Link href="/user/account" className={styles.closeButton} aria-label="بستن"><img src={closeIcon} alt="" width={14} height={14} /></Link>
          <h1>تأیید شماره جدید</h1>
        </header>
        <div className={styles.modalBody}>
          <p>کد ارسال‌شده به شماره ۰۹۱۲•••••۴۵ را وارد کنید.</p>
          <div className={styles.otpRow} dir="ltr">{verificationDigits.map((digit, index) => <span key={index} className={`${styles.otpDigit} ${index === 0 ? styles.otpDigitActive : ""}`}>{digit}</span>)}</div>
          <span className={styles.timer}>ارسال مجدد تا ۰۰:۵۹</span>
          <div className={styles.divider} />
        </div>
        <div className={styles.actions}>
          <Link href="/user/account" className={styles.primaryAction}>تأیید و تغییر شماره</Link>
          <div className={styles.secondaryLinks}><Link href="/user/account/change-mobile">ویرایش شماره</Link><Link href="/user/account" className={styles.cancel}>انصراف</Link></div>
        </div>
      </section>
    </AccountModalScaffold>
  );
}
