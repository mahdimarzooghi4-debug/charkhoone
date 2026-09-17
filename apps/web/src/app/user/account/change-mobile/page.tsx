import Link from "next/link";
import { AccountModalScaffold } from "@/components/account/AccountModalScaffold";
import styles from "./page.module.css";

const assets = {
  logo: "https://www.figma.com/api/mcp/asset/f2638568-e068-47d3-8620-99bebfd876dc.png",
  avatar: "https://www.figma.com/api/mcp/asset/fe9dd1d1-a9b9-4246-80dc-13436e084f09.png",
  chevron: "https://www.figma.com/api/mcp/asset/daceb9ec-5611-4e59-b00b-a2059d6ae6ad.svg",
  home: "https://www.figma.com/api/mcp/asset/22969abd-1d27-4e5a-93ec-72a6941944cf.svg",
  contracts: "https://www.figma.com/api/mcp/asset/dc175925-ad9b-4c30-b92d-70242c66cb5b.svg",
  payments: "https://www.figma.com/api/mcp/asset/bd4b5fb0-5882-4d8c-a101-7bb7c9d5ca87.svg",
  account: "https://www.figma.com/api/mcp/asset/ee47819f-0af7-4a7a-87b3-0f58689188c3.svg",
} as const;

const xCircle = "https://www.figma.com/api/mcp/asset/f6461ac0-c52e-4ece-ab66-693129d2bc78.svg";

export default function ChangeMobileStep1Page() {
  return (
    <AccountModalScaffold assets={assets} nodeId="175:224">
      <section className={styles.modal} data-node-id="175:312" data-name="Change Mobile Modal">
        <header className={styles.modalHeader} data-node-id="175:313">
          <Link href="/user/account" className={styles.closeButton} aria-label="بستن"><img src={xCircle} alt="" width={14} height={14} /></Link>
          <h1 data-node-id="175:316">تغییر شماره موبایل</h1>
        </header>
        <div className={styles.modalBody} data-node-id="175:317">
          <p data-node-id="175:318">شماره موبایل جدید خود را وارد کنید. کد تأیید به این شماره ارسال خواهد شد.</p>
          <div className={styles.currentMobile} data-node-id="175:319"><span data-node-id="175:320">شماره فعلی</span><strong data-node-id="175:321">۰۹۱۲•••••۶۷</strong></div>
          <div className={styles.divider} />
        </div>
        <div className={styles.actions} data-node-id="175:323">
          <Link href="/user/account/change-mobile/otp" className={styles.primaryAction} data-node-id="175:325">دریافت کد تأیید</Link>
          <Link href="/user/account" className={styles.cancelAction} data-node-id="175:328">انصراف</Link>
        </div>
      </section>
    </AccountModalScaffold>
  );
}
