import Link from "next/link";
import styles from "./page.module.css";

const assets = {
  logo: "https://www.figma.com/api/mcp/asset/7f40479b-6ac6-4a28-95e9-97fae6fc9550.png",
  avatar: "https://www.figma.com/api/mcp/asset/a98a9b2e-2112-4b3b-89b0-710129bf2661.png",
  check: "https://www.figma.com/api/mcp/asset/585e63cb-3d50-456e-a82e-62324c2d06db.svg",
  heroCheck: "https://www.figma.com/api/mcp/asset/8896de31-f888-48af-84f5-66e913d1b00c.svg",
  home: "https://www.figma.com/api/mcp/asset/242784e9-2c39-4ffa-9ccc-29f7701475fa.svg",
  contracts: "https://www.figma.com/api/mcp/asset/6e23d090-8351-458a-8545-ac01eb329be5.svg",
  payments: "https://www.figma.com/api/mcp/asset/211d5e01-736d-45cf-87d9-5dc8c7e4ae98.svg",
  account: "https://www.figma.com/api/mcp/asset/a9242c74-b74b-4330-b803-2f27ab3062cf.svg",
} as const;

const contractRows = [
  ["ملک", "سعادت‌آباد"],
  ["تاریخ شروع", "۱۵ مهر ۱۴۰۵"],
  ["تاریخ پایان", "۱۵ مهر ۱۴۰۶"],
  ["کد رهگیری", "۱۲۳۴۵۶۷۸۹۰۱۲"],
] as const;

const financeRows = [
  ["مبلغ رهن قرارداد", "۵۰۰٬۰۰۰٬۰۰۰ تومان", false],
  ["مبلغ تأمین‌شده توسط بانک", "۴۵۰٬۰۰۰٬۰۰۰ تومان", true],
  ["حق عضویت چارخونه", "۵۰٬۰۰۰٬۰۰۰ تومان", false],
] as const;

const planRows = [
  ["طرح", "طرح ویژه کارکنان", false],
  ["بانک", "بانک نمونه", false],
  ["مبلغ تأمین مالی", "۴۵۰٬۰۰۰٬۰۰۰ تومان", false],
  ["پرداخت ماهانه تأمین مالی", "۱۸٬۵۰۰٬۰۰۰ تومان", true],
  ["مدت بازپرداخت", "۱۲ ماه", false],
  ["وضعیت طرح", "تأیید بانک", true],
] as const;

function Rows({ rows }: { rows: readonly (readonly [string, string, boolean?])[] }) {
  return <div className={styles.rows}>{rows.map(([label, value, emphasized], index) => <div className={`${styles.row} ${index === rows.length - 1 ? styles.lastRow : ""}`} key={label}><strong className={emphasized ? styles.emphasized : ""}>{value}</strong><span>{label}</span></div>)}</div>;
}

type ProcessStep = {
  title: string;
  note: string;
  done?: boolean;
  active?: boolean;
  number?: string;
};

const process: readonly ProcessStep[] = [
  { title: "درخواست ثبت شد", note: "تکمیل شده", done: true },
  { title: "تأیید بانک", note: "تکمیل شده", done: true },
  { title: "عضویت چارخونه", note: "نیاز به اقدام", active: true, number: "۳" },
  { title: "تأیید نهایی طرفین", note: "در انتظار", number: "۴" },
  { title: "فعال شدن قرارداد", note: "در انتظار", number: "۵" },
];

export default function FinancingApprovedPage() {
  return (
    <main className={styles.page} data-node-id="912:106" data-name="Web App / Financing Approved / Membership Required">
      <section className={styles.mainContent} data-node-id="912:107">
        <header className={styles.pageHeader} data-node-id="912:108">
          <p data-node-id="912:109">قراردادها / وضعیت تأمین مالی</p>
          <div className={styles.titleRow}><span className={styles.approvedBadge}>تأیید شده</span><h1 data-node-id="912:113">درخواست تأمین مالی تأیید شد</h1></div>
          <p data-node-id="912:114">برای ادامه فرایند، ابتدا عضویت چارخونه را تکمیل کنید.</p>
        </header>

        <div className={styles.columns} data-node-id="912:115">
          <aside className={styles.secondaryColumn} data-node-id="912:116">
            <section className={styles.card} data-node-id="912:117">
              <h2 data-node-id="912:118">وضعیت فرایند</h2>
              <div className={styles.verticalTimeline}>
                {process.map((step, index) => (
                  <div className={styles.processItem} key={step.title}>
                    <div className={`${styles.processCopy} ${step.active ? styles.activeCopy : ""} ${!step.done && !step.active ? styles.waitingCopy : ""}`}><strong>{step.title}</strong><span>{step.note}</span></div>
                    <div className={styles.processTrack}>
                      <span className={`${styles.processDot} ${step.done ? styles.doneDot : ""} ${step.active ? styles.activeDot : ""} ${!step.done && !step.active ? styles.waitingDot : ""}`}>{step.done ? <img src={assets.check} alt="" width={14} height={14} /> : step.number}</span>
                      {index < process.length - 1 ? <span className={`${styles.processLine} ${index < 2 ? styles.doneLine : ""}`} /> : null}
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <section className={styles.card} data-node-id="912:161"><h2>قرارداد مرتبط</h2><Rows rows={contractRows} /></section>
            <Link href="/user/contracts/123456789012" className={styles.contractLink} data-node-id="912:179">مشاهده قرارداد</Link>
          </aside>

          <div className={styles.detailColumn} data-node-id="912:180">
            <section className={styles.heroCard} data-node-id="912:181">
              <span className={styles.heroIcon}><img src={assets.heroCheck} alt="" width={24} height={24} /></span>
              <div><h2 data-node-id="912:187">تأمین مالی شما توسط بانک تأیید شده است</h2><p data-node-id="912:188">برای ادامه، انتخاب و پرداخت حق عضویت چارخونه الزامی است.</p></div>
            </section>

            <section className={`${styles.card} ${styles.primaryCard}`} data-node-id="912:189">
              <div className={styles.primaryCopy}><span>حق عضویت چارخونه</span><strong data-node-id="912:192">مرحله بعد</strong><p data-node-id="912:193">پس از فعال‌شدن عضویت، وارد مرحله پرداخت آورده می‌شوید.</p></div>
              <Link href="/user/contracts/register/plans/membership" className={styles.primaryAction} data-node-id="912:195">ادامه</Link>
            </section>

            <section className={styles.card} data-node-id="912:197"><h2>جزئیات مالی</h2><Rows rows={financeRows} /><div className={styles.formula}>رهن قرارداد = تأمین مالی + آورده شما</div></section>

            <section className={styles.card} data-node-id="912:212">
              <h2>جزئیات طرح تأییدشده</h2>
              <Rows rows={planRows} />
              <div className={styles.rentNotice}><div><strong>۲۰٬۰۰۰٬۰۰۰ تومان در ماه</strong><span>اجاره ماهانه قرارداد</span></div><p>تذکر: اجاره ماهانه قرارداد اطلاعاتی است و ارتباطی به پرداخت ماهانه تأمین مالی ندارد.</p></div>
            </section>
          </div>
        </div>
      </section>

      <aside className={styles.sidebar} data-node-id="912:244">
        <div className={styles.sidebarTop}><div className={styles.logoWrap}><img src={assets.logo} alt="چارخونه" width={127} height={55} /></div><nav className={styles.nav}><Link href="/user/home" className={styles.navItem}><span className={styles.navSpacer} /><span>خانه</span><img src={assets.home} alt="" width={20} height={20} /></Link><Link href="/user/contracts" className={`${styles.navItem} ${styles.navActive}`}><span className={styles.alertBadge}>۱</span><span>قراردادها</span><img src={assets.contracts} alt="" width={20} height={20} /></Link><Link href="/user/receive-pay" className={styles.navItem}><span className={styles.navSpacer} /><span>دریافت و پرداخت</span><img src={assets.payments} alt="" width={20} height={20} /></Link><Link href="/user/account" className={styles.navItem}><span className={styles.navSpacer} /><span>حساب من</span><img src={assets.account} alt="" width={20} height={20} /></Link></nav></div>
        <div className={styles.profile}><img className={styles.avatar} src={assets.avatar} alt="" width={40} height={40} /><div className={styles.profileText}><strong>علی رضایی</strong><span>۰۹۱۲•••••۶۷</span></div></div>
      </aside>
    </main>
  );
}
