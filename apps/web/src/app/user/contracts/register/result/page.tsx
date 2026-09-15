import Link from "next/link";
import styles from "./page.module.css";

const assets = {
  logo: "https://www.figma.com/api/mcp/asset/06e084d5-656e-4b73-ba16-344b4ae7cdb8.png",
  avatar: "https://www.figma.com/api/mcp/asset/3685a4cd-ab22-4be8-a401-6c87e57b9eb7.png",
  info: "https://www.figma.com/api/mcp/asset/f63e649c-59de-40a0-bfa2-61a87464ae30.svg",
  radio: "https://www.figma.com/api/mcp/asset/2522a076-942a-4d6f-89e4-7826b746dab8.svg",
  check: "https://www.figma.com/api/mcp/asset/af53da02-ac4d-4a2b-acf0-51f9b0923346.svg",
  home: "https://www.figma.com/api/mcp/asset/0a2213a6-1a8f-4807-a3aa-d31738ac139c.svg",
  contracts: "https://www.figma.com/api/mcp/asset/64a8c022-7f77-4fc0-a2a8-0481ffa09233.svg",
  payments: "https://www.figma.com/api/mcp/asset/74125325-17f3-4ee1-8ed1-8aa31444a078.svg",
  account: "https://www.figma.com/api/mcp/asset/5d6e333b-dbb9-4351-8cdf-7d9a12356391.svg",
} as const;

const contractRows = [
  ["کد رهگیری", "۱۲۳۴۵۶۷۸۹۰۱۲", true],
  ["مبلغ رهن", "۵۰۰٬۰۰۰٬۰۰۰ تومان", false],
  ["اجاره ماهانه", "۲۰٬۰۰۰٬۰۰۰ تومان", false],
  ["تاریخ شروع", "۱۵ مهر ۱۴۰۵", false],
  ["تاریخ پایان", "۱۵ مهر ۱۴۰۶", false],
] as const;

const propertyRows = [
  ["آدرس", "تهران، سعادت‌آباد، خیابان نمونه، پلاک ۲۴، واحد ۳"],
  ["کدپستی", "۱۹۹۸۷۶۵۴۳۲"],
  ["پلاک", "۲۴"],
  ["واحد", "۳"],
] as const;

function DetailCard({ title, rows }: { title: string; rows: readonly (readonly [string, string, boolean?])[] }) {
  return (
    <section className={styles.detailCard}>
      <h2>{title}</h2>
      <div className={styles.detailList}>{rows.map(([label, value, strong], index) => <div key={label} className={`${styles.detailRow} ${index === rows.length - 1 ? styles.lastRow : ""}`}>{strong ? <strong>{value}</strong> : <span>{value}</span>}<span className={styles.detailLabel}>{label}</span></div>)}</div>
    </section>
  );
}

export default function ContractLookupResultPage() {
  return (
    <main className={styles.page} data-node-id="150:761" data-name="Web App / Contract Lookup Result">
      <section className={styles.mainContent} data-node-id="150:762">
        <header className={styles.headerBar} data-node-id="150:763"><Link href="/user/contracts/register" className={styles.backButton} aria-label="بازگشت">‹</Link><div className={styles.headerRight}><h1 data-node-id="150:768">استعلام قرارداد</h1><p data-node-id="150:769">سلام، علی رضایی</p></div></header>
        <section className={styles.pageHeader} data-node-id="150:770"><p data-node-id="150:771">قراردادها / استعلام قرارداد</p><h2 data-node-id="150:773">اطلاعات قرارداد یافت شد</h2><p data-node-id="150:776">اطلاعات قرارداد را بررسی کرده و نقش خود را در این قرارداد انتخاب کنید.</p></section>

        <div className={styles.columns} data-node-id="150:777">
          <div className={styles.mainColumn} data-node-id="150:778">
            <DetailCard title="اطلاعات قرارداد" rows={contractRows} />
            <DetailCard title="اطلاعات ملک" rows={propertyRows} />
            <div className={styles.officialNotice} data-node-id="150:819"><span>اطلاعات این قرارداد از سامانه رسمی خودنویس دریافت شده و غیرقابل تغییر است.</span><img src={assets.info} alt="" width={20} height={20} /></div>
          </div>

          <aside className={styles.roleCard} data-node-id="150:824">
            <div className={styles.roleHeader} data-node-id="150:825"><h2 data-node-id="150:826">نقش خود را انتخاب کنید</h2><p data-node-id="150:827">مشخص کنید در این قرارداد مالک هستید یا مستأجر.</p></div>
            <div className={styles.roleStack} data-node-id="150:828">
              <article className={styles.roleOption} data-node-id="150:829"><div className={styles.roleOptionTop}><span className={styles.radio}><img src={assets.radio} alt="" width={16} height={16} /></span><strong data-node-id="150:831">مالک (موجر)</strong></div><div className={styles.partyInfo}><span>محمد رضایی</span><small>کد ملی: ۰۰۲•••••۴۵۶</small></div></article>
              <article className={`${styles.roleOption} ${styles.roleSelected}`} data-node-id="150:836"><div className={styles.roleOptionTop}><span className={styles.selectedCheck}><img src={assets.check} alt="" width={12} height={12} /></span><strong data-node-id="150:838">مستأجر</strong></div><div className={styles.partyInfo}><strong>علی رضایی</strong><small>کد ملی: ۰۰۱•••••۷۸۹</small></div></article>
            </div>
            <div className={styles.nextNotice} data-node-id="203:242">در مرحله بعد، طرح‌های تأمین مالی واجد شرایط این قرارداد نمایش داده می‌شوند.</div>
            <div className={styles.actions} data-node-id="150:845"><Link href="/user/contracts/register/plans" className={styles.primaryAction} data-node-id="150:846">تأیید نقش و ادامه</Link><Link href="/user/contracts/register" className={styles.secondaryAction} data-node-id="150:850">استعلام کد دیگری</Link></div>
          </aside>
        </div>
      </section>

      <aside className={styles.sidebar} data-node-id="142:1843"><div className={styles.sidebarTop}><div className={styles.logoWrap}><img src={assets.logo} alt="چارخونه" width={127} height={55} /></div><nav className={styles.nav}><Link href="/user/home" className={styles.navItem}><span className={styles.navSpacer} /><span>خانه</span><img src={assets.home} alt="" width={20} height={20} /></Link><Link href="/user/contracts" className={`${styles.navItem} ${styles.navActive}`}><span className={styles.alertBadge}>۱</span><span>قراردادها</span><img src={assets.contracts} alt="" width={20} height={20} /></Link><Link href="/user/receive-pay" className={styles.navItem}><span className={styles.navSpacer} /><span>دریافت و پرداخت</span><img src={assets.payments} alt="" width={20} height={20} /></Link><Link href="/user/account" className={styles.navItem}><span className={styles.navSpacer} /><span>حساب من</span><img src={assets.account} alt="" width={20} height={20} /></Link></nav></div><div className={styles.profile}><img className={styles.avatar} src={assets.avatar} alt="" width={40} height={40} /><div className={styles.profileText}><strong>علی رضایی</strong><span>۰۹۱۲•••••۶۷</span></div></div></aside>
    </main>
  );
}
