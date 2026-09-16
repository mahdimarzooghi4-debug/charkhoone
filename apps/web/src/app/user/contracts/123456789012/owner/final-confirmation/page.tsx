import Link from "next/link";
import styles from "../flow.module.css";

const assets = {
  logo: "https://www.figma.com/api/mcp/asset/c1f87bf2-bba6-4548-843c-29b65eb29063.png",
  avatar: "https://www.figma.com/api/mcp/asset/bfe209c9-041e-4e08-9374-98838d067797.png",
  current: "https://www.figma.com/api/mcp/asset/8146a09c-56da-4cbd-b80c-94b8d1f5a9c6.svg",
  waiting: "https://www.figma.com/api/mcp/asset/06014be6-42d5-474b-bde0-0449847f71cb.svg",
  home: "https://www.figma.com/api/mcp/asset/ddba9bea-561a-4927-b111-334fe444d727.svg",
  contracts: "https://www.figma.com/api/mcp/asset/5c4e003e-e0a9-4cb4-8fb4-f399c42abc4a.svg",
  payments: "https://www.figma.com/api/mcp/asset/d60f3d84-6049-4928-a099-fa3832a23820.svg",
  account: "https://www.figma.com/api/mcp/asset/e3cc315e-cb49-4a61-b521-5559d870076f.svg",
} as const;

const conditions = [
  ["مبلغ رهن", "۵۰۰٬۰۰۰٬۰۰۰ تومان"],
  ["اجاره ماهانه قرارداد", "۲۰٬۰۰۰٬۰۰۰ تومان"],
  ["تاریخ شروع", "۱۵ مهر ۱۴۰۵"],
  ["تاریخ پایان", "۱۵ مهر ۱۴۰۶"],
  ["مدت قرارداد", "۱۲ ماه"],
] as const;

export default function OwnerFinalConfirmationPage() {
  return (
    <main className={styles.page} data-node-id="150:1830" data-name="Web App / Owner Final Contract Confirmation">
      <section className={styles.mainContent} data-node-id="150:1831">
        <header className={styles.pageHeader} data-node-id="150:1832">
          <div className={styles.breadcrumb} data-node-id="150:1833"><span>قراردادها</span><span>/</span><span>تأیید نهایی</span></div>
          <div className={styles.titleBlock} data-node-id="150:1837"><div className={styles.badges}><span className={styles.badgeWarning}>نیاز به تأیید شما</span><span className={styles.badgeOwner}>مالک</span></div><div className={styles.titleCopy}><h1 data-node-id="150:1845">تأیید نهایی قرارداد</h1><p data-node-id="150:1846">اطلاعات قرارداد و روش دریافت انتخاب‌شده را بررسی و تأیید کنید.</p></div></div>
        </header>

        <div className={styles.columns} data-node-id="150:1847">
          <aside className={styles.sideColumn} data-node-id="150:1848">
            <section className={styles.card} data-node-id="150:1849">
              <h2 data-node-id="150:1850">وضعیت فرایند</h2><div className={styles.divider} />
              <div className={styles.processCompact} data-node-id="150:1852">
                <div className={styles.processCompactRow}><span className={styles.done}>تکمیل شده</span><div className={styles.processContent}><strong>تأیید بانک</strong><span className={styles.processCheck}>✓</span></div></div>
                <div className={styles.processCompactRow}><span className={styles.done}>تکمیل شده</span><div className={styles.processContent}><strong>پرداخت آورده مستأجر</strong><span className={styles.processCheck}>✓</span></div></div>
                <div className={styles.processCompactRow}><span className={styles.done}>تکمیل شده</span><div className={styles.processContent}><strong>تأیید نهایی مستأجر</strong><span className={styles.processCheck}>✓</span></div></div>
                <div className={styles.processCompactRow}><span className={styles.active}>نیاز به اقدام</span><div className={styles.processContent}><strong className={styles.current}>تأیید نهایی شما</strong><span className={styles.processIcon}><img src={assets.current} alt="" width={24} height={24} /></span></div></div>
                <div className={styles.processCompactRow}><span>در انتظار</span><div className={styles.processContent}><strong>فعال شدن قرارداد</strong><span className={styles.processIcon}><img src={assets.waiting} alt="" width={24} height={24} /></span></div></div>
              </div>
            </section>

            <section className={styles.infoCard} data-node-id="150:1883"><h3 data-node-id="150:1884">پس از تأیید شما</h3><div className={styles.stepsList}><p>۱. تأیید نهایی طرفین تکمیل می‌شود.</p><p>۲. مبلغ تأمین مالی وارد مسیر مالی قرارداد می‌شود.</p><p>۳. قرارداد در چارخونه فعال می‌شود.</p><p>۴. دریافتی‌های شما براساس روش انتخاب‌شده مدیریت می‌شوند.</p></div></section>

            <section className={`${styles.card} ${styles.actionBlock}`} data-node-id="150:1894"><div className={styles.checkboxRow} data-node-id="150:1895"><span className={styles.checkbox}>✓</span><p data-node-id="150:1896">اطلاعات قرارداد و روش دریافت انتخاب‌شده را بررسی کرده‌ام و تأیید نهایی آن را می‌پذیرم.</p></div><Link href="/user/contracts/123456789012/owner" className={styles.primaryButton} data-node-id="150:1899">تأیید نهایی قرارداد</Link></section>
          </aside>

          <div className={styles.mainColumn} data-node-id="150:1902">
            <section className={styles.card} data-node-id="150:1903"><h2 data-node-id="150:1904">شرایط قرارداد</h2><div className={styles.divider} /><div className={styles.summaryGrid}>{conditions.map(([label, value]) => <div key={label}><strong>{value}</strong><span>{label}</span></div>)}</div></section>

            <section className={styles.card} data-node-id="150:1922"><div className={styles.cardHeader}><div className={styles.badges}><span className={styles.badgeSuccess}>تأیید نهایی</span><span className={styles.badgeSuccess}>آورده پرداخت شده</span><span className={styles.badgeSuccess}>تأیید شده</span></div><h2 data-node-id="150:1931">وضعیت مستأجر</h2></div><div className={styles.divider} /><div className={styles.inlineDetails}><span>کد ملی: ۰۰۱•••••۷۸۹</span><strong>مستأجر: علی رضایی</strong></div></section>

            <section className={styles.card} data-node-id="150:1936"><div className={styles.cardHeader}><span className={styles.badgeSuccess}>تأیید شده</span><h2 data-node-id="150:1940">تأمین مالی قرارداد</h2></div><div className={styles.divider} /><div className={`${styles.summaryGrid} ${styles.two}`}><div><strong>بانک نمونه</strong><span>بانک ارائه دهنده</span></div><div><strong>۴۵۰٬۰۰۰٬۰۰۰ تومان</strong><span>مبلغ تأمین‌شده</span></div></div><div className={styles.notice} data-node-id="150:1949">پس از تکمیل تأیید نهایی، مبلغ تأمین مالی وارد مسیر مالی تعیین‌شده این قرارداد می‌شود.</div></section>

            <section className={`${styles.card} ${styles.selectedPayout}`} data-node-id="150:1952"><div className={styles.selectedPayoutHeader}><Link href="/user/contracts/123456789012/owner/settlement-preference" data-node-id="150:1953">تغییر روش دریافت</Link><strong data-node-id="150:1956">روش دریافت انتخاب‌شده: تجمیع دریافتی در صندوق</strong></div><p data-node-id="150:1959">مبالغ خالص قابل تجمیع این قرارداد براساس شرایط انتخاب‌شده در صندوق تجمیع می‌شوند.</p><div className={styles.divider} /><div className={styles.rowList}><div className={styles.row}><span>مبلغ ناخالص دریافتی:</span><strong>۲۰٬۰۰۰٬۰۰۰ تومان</strong></div><div className={styles.row}><span>کارمزد خدمات چارخونه - ۰٫۵٪:</span><strong>−۱۰۰٬۰۰۰ تومان</strong></div><div className={styles.row}><span>مبلغ خالص قابل تجمیع:</span><strong className={styles.moneyGreen}>۱۹٬۹۰۰٬۰۰۰ تومان</strong></div><div className={styles.row}><span>بازده</span><strong>براساس شرایط صندوق</strong></div></div></section>

            <section className={styles.card} data-node-id="150:1966"><h2 data-node-id="150:1967">ملک و طرفین قرارداد</h2><div className={styles.divider} /><div className={styles.propertyInfo}><div><strong>تهران، سعادت‌آباد، خیابان نمونه، پلاک ۲۴، واحد ۳</strong><span>ملک مورد نظر</span></div></div><div className={styles.divider} /><div className={styles.partyGrid}><div className={styles.party}><div className={styles.partyTop}><span className={styles.partyBadgeTenant}>مستأجر</span><strong>علی رضایی</strong></div><small>کد ملی: ۰۰۱•••••۷۸۹</small></div><div className={styles.party}><div className={styles.partyTop}><span className={styles.partyBadgeOwner}>مالک</span><strong>محمد رضایی</strong></div><small>کد ملی: ۰۰۲•••••۴۵۶</small></div></div></section>
          </div>
        </div>
      </section>

      <aside className={styles.sidebar} data-node-id="142:1528"><div className={styles.sidebarTop}><div className={styles.logoWrap}><img src={assets.logo} alt="چارخونه" width={127} height={55} /></div><nav className={styles.nav}><Link href="/user/home" className={styles.navItem}><span className={styles.navSpacer} /><span>خانه</span><img src={assets.home} alt="" width={20} height={20} /></Link><Link href="/user/contracts" className={`${styles.navItem} ${styles.navActive}`}><span className={styles.alertBadge}>۱</span><span>قراردادها</span><img src={assets.contracts} alt="" width={20} height={20} /></Link><Link href="/user/receive-pay" className={styles.navItem}><span className={styles.navSpacer} /><span>دریافت و پرداخت</span><img src={assets.payments} alt="" width={20} height={20} /></Link><Link href="/user/account" className={styles.navItem}><span className={styles.navSpacer} /><span>حساب من</span><img src={assets.account} alt="" width={20} height={20} /></Link></nav></div><div className={styles.profile}><img className={styles.avatar} src={assets.avatar} alt="" width={40} height={40} /><div className={styles.profileText}><strong>علی رضایی</strong><span>۰۹۱۲•••••۶۷</span></div></div></aside>
    </main>
  );
}
