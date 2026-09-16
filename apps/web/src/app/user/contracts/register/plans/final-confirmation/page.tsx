import Link from "next/link";
import styles from "./page.module.css";

const assets = {
  logo: "https://www.figma.com/api/mcp/asset/111be251-23b7-4187-be02-afac43cdfdac.png",
  avatar: "https://www.figma.com/api/mcp/asset/71906f1c-7798-45cb-aab7-f7583140fcb6.png",
  successCheck: "https://www.figma.com/api/mcp/asset/650fce52-b95b-4a81-a9b0-2b341b4a7dc2.svg",
  timelineCheck: "https://www.figma.com/api/mcp/asset/4e4ea6fc-0fdf-40ba-a3e1-dfc0a1d1b0c9.svg",
  checkboxCheck: "https://www.figma.com/api/mcp/asset/6d106aa4-0e8f-4a8f-b263-d2b2f8a59fa5.svg",
  home: "https://www.figma.com/api/mcp/asset/5fcaaac7-7abf-4396-a9d5-28f5bde04d5d.svg",
  contracts: "https://www.figma.com/api/mcp/asset/0cbac8e9-2d26-4bde-b3c4-e238f8073be0.svg",
  payments: "https://www.figma.com/api/mcp/asset/a5285d60-eced-42bd-a11b-93445b3b7e26.svg",
  account: "https://www.figma.com/api/mcp/asset/041fd1ab-9d92-4704-b99f-4955e889e219.svg",
} as const;

const finalTerms = [
  ["مبلغ رهن", "۵۰۰٬۰۰۰٬۰۰۰ تومان", "default"],
  ["اجاره ماهانه قرارداد", "۲۰٬۰۰۰٬۰۰۰ تومان در ماه", "default"],
  ["تاریخ شروع", "۱۵ مهر ۱۴۰۵", "default"],
  ["تاریخ پایان", "۱۵ مهر ۱۴۰۶", "default"],
  ["مدت قرارداد", "۱۲ ماه", "default"],
] as const;

const financingRows = [
  ["طرح انتخاب‌شده", "طرح ویژه کارکنان", "default"],
  ["بانک", "بانک نمونه", "default"],
  ["مبلغ تأمین‌شده", "۴۵۰٬۰۰۰٬۰۰۰ تومان", "primary"],
  ["آورده پرداخت‌شدۀ شما", "۵۰٬۰۰۰٬۰۰۰ تومان", "accent"],
  ["پرداخت ماهانه تأمین مالی", "۱۸٬۵۰۰٬۰۰۰ تومان", "primary"],
  ["مدت بازپرداخت", "۱۲ ماه", "default"],
] as const;

type Tone = "default" | "primary" | "accent";

function Rows({ rows }: { rows: readonly (readonly [string, string, Tone?])[] }) {
  return (
    <div className={styles.rows}>
      {rows.map(([label, value, tone = "default"], index) => (
        <div key={label} className={`${styles.row} ${index === rows.length - 1 ? styles.lastRow : ""}`}>
          <strong className={tone === "primary" ? styles.primaryValue : tone === "accent" ? styles.accentValue : ""}>{value}</strong>
          <span>{label}</span>
        </div>
      ))}
    </div>
  );
}

const process = [
  { title: "تأیید بانک", note: "تکمیل شده", done: true },
  { title: "پرداخت آورده", note: "تکمیل شده", done: true },
  { title: "تأیید نهایی شما", note: "نیاز به اقدام", active: true, number: "۳" },
  { title: "تأیید نهایی مالک", note: "در انتظار", number: "۴" },
  { title: "فعال شدن قرارداد", note: "در انتظار", number: "۵" },
] as const;

export default function FinalConfirmationPage() {
  return (
    <main className={styles.page} data-node-id="150:1489" data-name="Web App / Contribution Paid / Final Confirmation">
      <section className={styles.mainContent} data-node-id="150:1490">
        <header className={styles.pageHeader} data-node-id="150:1491">
          <p data-node-id="150:1492">قراردادها / تأیید نهایی</p>
          <div className={styles.titleRow} data-node-id="150:1493"><span className={styles.paidBadge} data-node-id="150:1495">آورده پرداخت شده</span><h1 data-node-id="150:1494">تأیید نهایی قرارداد</h1></div>
          <p data-node-id="150:1497">آورده شما با موفقیت پرداخت شده است. پیش از ادامه، شرایط نهایی قرارداد را بررسی و تأیید کنید.</p>
        </header>

        <div className={styles.columns} data-node-id="150:1498">
          <div className={styles.mainColumn} data-node-id="150:1499">
            <section className={styles.successCard} data-node-id="150:1500">
              <div className={styles.successTop} data-node-id="150:1501"><span className={styles.successIcon}><img src={assets.successCheck} alt="" width={24} height={24} /></span><div><h2 data-node-id="150:1506">پرداخت آورده با موفقیت انجام شد</h2><p data-node-id="150:1507">پرداخت شما ثبت شد و فرایند قرارداد وارد مرحله تأیید نهایی شده است.</p></div></div>
              <div className={styles.successDivider} />
              <div className={styles.successAmount} data-node-id="150:1509"><div><strong data-node-id="150:1511">۵۰٬۰۰۰٬۰۰۰</strong><span data-node-id="150:1512">تومان</span></div><p data-node-id="150:1513">شماره پیگیری: ۱۲۳۴۵۶۷۸۹</p></div>
            </section>

            <section className={styles.card} data-node-id="150:1514"><h2 data-node-id="150:1515">شرایط نهایی قرارداد</h2><Rows rows={finalTerms} /></section>

            <section className={styles.card} data-node-id="150:1535">
              <div className={styles.cardTitleRow} data-node-id="150:1536"><h2 data-node-id="150:1537">تأمین مالی قرارداد</h2><span className={styles.approvedBadge} data-node-id="150:1538">تأیید شده</span></div>
              <Rows rows={financingRows} />
            </section>

            <section className={styles.card} data-node-id="150:1568">
              <h2 data-node-id="150:1569">ملک و طرفین قرارداد</h2>
              <div className={styles.propertyBlock} data-node-id="150:1570"><span data-node-id="150:1571">مشخصات ملک</span><strong data-node-id="150:1572">تهران، سعادت‌آباد، خیابان نمونه، پلاک ۲۴، واحد ۳</strong></div>
              <div className={styles.divider} />
              <div className={styles.parties} data-node-id="150:1574">
                <div className={styles.party}><span>مستأجر</span><div><strong data-node-id="150:1578">علی رضایی</strong><small className={styles.tenantBadge}>مستأجر</small></div><p data-node-id="150:1581">کد ملی: ۰۰۱•••••۷۸۹</p></div>
                <div className={styles.partyDivider} />
                <div className={styles.party}><span>مالک</span><div><strong data-node-id="150:1586">محمد رضایی</strong><small className={styles.ownerBadge}>مالک</small></div><p data-node-id="150:1589">کد ملی: ۰۰۲•••••۴۵۶</p></div>
              </div>
            </section>
          </div>

          <aside className={styles.secondaryColumn} data-node-id="150:1590">
            <section className={styles.card} data-node-id="150:1591">
              <h2 data-node-id="150:1592">وضعیت فرایند</h2>
              <div className={styles.verticalTimeline} data-node-id="150:1593">
                {process.map((step, index) => (
                  <div className={styles.processItem} key={step.title}>
                    <div className={styles.processTrack}>
                      <span className={`${styles.processDot} ${step.done ? styles.doneDot : ""} ${step.active ? styles.activeDot : ""} ${!step.done && !step.active ? styles.waitingDot : ""}`}>{step.done ? <img src={assets.timelineCheck} alt="" width={14} height={14} /> : step.number}</span>
                      {index < process.length - 1 ? <span className={`${styles.processLine} ${index < 2 ? styles.doneLine : ""}`} /> : null}
                    </div>
                    <div className={`${styles.processCopy} ${step.active ? styles.activeCopy : ""} ${!step.done && !step.active ? styles.waitingCopy : ""}`}><strong>{step.title}</strong><span>{step.note}</span></div>
                  </div>
                ))}
              </div>
            </section>

            <section className={styles.nextSteps} data-node-id="150:1635">
              <h2 data-node-id="150:1636">پس از تأیید شما چه می‌شود؟</h2>
              <ol>
                <li>درخواست تأیید نهایی برای مالک ارسال می‌شود.</li>
                <li>پس از تکمیل تأیید نهایی، مبلغ تأمین مالی وارد مسیر مالی تعیین‌شده قرارداد می‌شود.</li>
                <li>قرارداد در چارخونه فعال می‌شود.</li>
              </ol>
            </section>

            <div className={styles.confirmationArea} data-node-id="150:1647">
              <div className={styles.confirmationRow} data-node-id="150:1648"><p data-node-id="150:1652">اطلاعات قرارداد و شرایط تأمین مالی را بررسی کرده‌ام و تأیید نهایی آن را می‌پذیرم.</p><span className={styles.checkbox}><img src={assets.checkboxCheck} alt="" width={12} height={12} /></span></div>
              <Link href="/user/contracts/register/plans/waiting-owner" className={styles.primaryAction} data-node-id="150:1653">تأیید نهایی و ادامه</Link>
              <Link href="/user/contracts/123456789012" className={styles.secondaryAction} data-node-id="150:1655">مشاهده جزئیات قرارداد</Link>
            </div>
          </aside>
        </div>
      </section>

      <aside className={styles.sidebar} data-node-id="142:1668">
        <div className={styles.sidebarTop}><div className={styles.logoWrap}><img src={assets.logo} alt="چارخونه" width={127} height={55} /></div><nav className={styles.nav}><Link href="/user/home" className={styles.navItem}><span className={styles.navSpacer} /><span>خانه</span><img src={assets.home} alt="" width={20} height={20} /></Link><Link href="/user/contracts" className={`${styles.navItem} ${styles.navActive}`}><span className={styles.alertBadge}>۱</span><span>قراردادها</span><img src={assets.contracts} alt="" width={20} height={20} /></Link><Link href="/user/receive-pay" className={styles.navItem}><span className={styles.navSpacer} /><span>دریافت و پرداخت</span><img src={assets.payments} alt="" width={20} height={20} /></Link><Link href="/user/account" className={styles.navItem}><span className={styles.navSpacer} /><span>حساب من</span><img src={assets.account} alt="" width={20} height={20} /></Link></nav></div>
        <div className={styles.profile}><img className={styles.avatar} src={assets.avatar} alt="" width={40} height={40} /><div className={styles.profileText}><strong>علی رضایی</strong><span>۰۹۱۲•••••۶۷</span></div></div>
      </aside>
    </main>
  );
}
