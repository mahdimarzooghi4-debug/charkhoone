import Link from "next/link";
import styles from "./page.module.css";

const assets = {
  logo: "https://www.figma.com/api/mcp/asset/1def9067-ca4e-4713-a5b6-0db9ead957ef.png",
  avatar: "https://www.figma.com/api/mcp/asset/3662feca-4510-4db8-83f5-f1098d4f503e.png",
  check: "https://www.figma.com/api/mcp/asset/a4883803-b125-4a49-b77e-f0079b0fd35a.svg",
  sparkles: "https://www.figma.com/api/mcp/asset/2e9b573c-f10c-4ea0-b550-6cec0cddf9f5.svg",
  info: "https://www.figma.com/api/mcp/asset/d6f80679-e1a8-4c38-ae41-94fc3f16da55.svg",
  home: "https://www.figma.com/api/mcp/asset/16a57e68-3a0c-47a4-857d-b31ba311eff0.svg",
  contracts: "https://www.figma.com/api/mcp/asset/3b9f73ae-1bc5-4199-92e1-849ffde6e48e.svg",
  payments: "https://www.figma.com/api/mcp/asset/65177fbd-fd24-4b41-b919-2ba5ce9f08b0.svg",
  account: "https://www.figma.com/api/mcp/asset/93c159cd-87cd-472d-9394-6e4cd537e73b.svg",
} as const;

type Plan = {
  title: string;
  bank: string;
  badges: readonly { label: string; tone: "eligible" | "public" | "special" }[];
  rows: readonly (readonly [string, string, boolean?])[];
  note: string;
  selected?: boolean;
};

const plans: readonly Plan[] = [
  {
    title: "طرح عمومی",
    bank: "بانک نمونه",
    badges: [
      { label: "واجد شرایط", tone: "eligible" },
      { label: "عمومی", tone: "public" },
    ],
    rows: [
      ["مبلغ تأمین مالی", "۴۰۰٬۰۰۰٬۰۰۰ تومان"],
      ["آورده موردنیاز", "۱۰۰٬۰۰۰٬۰۰۰ تومان"],
      ["پرداخت ماهانه تأمین مالی", "۲۰٬۵۰۰٬۰۰۰ تومان"],
      ["مدت بازپرداخت", "۱۲ ماه"],
    ],
    note: "برای کاربران واجد شرایط عمومی",
  },
  {
    title: "طرح ویژه کارکنان",
    bank: "بانک نمونه",
    badges: [
      { label: "واجد شرایط", tone: "eligible" },
      { label: "ویژه", tone: "special" },
    ],
    rows: [
      ["مبلغ تأمین مالی", "۴۵۰٬۰۰۰٬۰۰۰ تومان"],
      ["آورده موردنیاز", "۵۰٬۰۰۰٬۰۰۰ تومان", true],
      ["پرداخت ماهانه تأمین مالی", "۱۸٬۵۰۰٬۰۰۰ تومان", true],
      ["مدت بازپرداخت", "۱۲ ماه"],
    ],
    note: "شرایط بهتر نسبت به طرح عمومی",
    selected: true,
  },
] as const;

function PlanCard({ plan }: { plan: Plan }) {
  return (
    <article className={`${styles.planCard} ${plan.selected ? styles.planCardSelected : ""}`}>
      <div className={styles.cardHeader}>
        {plan.selected ? (
          <span className={styles.selectedMark} aria-label="طرح انتخاب‌شده">
            <img src={assets.check} alt="" width={14} height={14} />
          </span>
        ) : (
          <div className={styles.selectionSpacer} aria-hidden="true" />
        )}
        <div className={styles.titleGroup}>
          <div className={styles.badges}>
            {plan.badges.map((badge) => (
              <span key={badge.label} className={`${styles.badge} ${styles[badge.tone]}`}>
                {badge.label}
              </span>
            ))}
          </div>
          <div className={styles.planTitle}>
            <h3>{plan.title}</h3>
            <p>{plan.bank}</p>
          </div>
        </div>
      </div>

      <div className={styles.divider} />
      <div className={styles.metrics}>
        {plan.rows.map(([label, value, emphasized], index) => (
          <div key={label} className={`${styles.metricRow} ${index === plan.rows.length - 1 ? styles.lastMetric : ""}`}>
            <strong className={emphasized ? styles.emphasized : ""}>{value}</strong>
            <span>{label}</span>
          </div>
        ))}
      </div>
      <div className={styles.divider} />

      {plan.selected ? (
        <div className={styles.specialNote}>
          <span>{plan.note}</span>
          <img src={assets.sparkles} alt="" width={16} height={16} />
        </div>
      ) : (
        <p className={styles.generalNote}>{plan.note}</p>
      )}
    </article>
  );
}

export default function EligibleFinancingPlansPage() {
  return (
    <main className={styles.page} data-node-id="150:904" data-name="Web App / Eligible Financing Plans">
      <section className={styles.mainContent} data-node-id="150:905">
        <header className={styles.headerBar} data-node-id="150:906">
          <Link href="/user/contracts/register/result" className={styles.backButton} aria-label="بازگشت به اطلاعات قرارداد">‹</Link>
          <div className={styles.headerRight} data-node-id="150:910">
            <h1 data-node-id="150:911">انتخاب طرح</h1>
            <p data-node-id="150:912">سلام، علی رضایی</p>
          </div>
        </header>

        <section className={styles.pageHeader} data-node-id="150:913">
          <p data-node-id="150:914">قراردادها / انتخاب طرح تأمین مالی</p>
          <h2 data-node-id="150:915">طرح‌های قابل استفاده برای شما</h2>
          <p data-node-id="150:916">براساس شرایط شما و این قرارداد، طرح‌های زیر قابل انتخاب هستند.</p>
        </section>

        <section className={styles.contractContext} data-node-id="150:917">
          <div><strong>۴۵۰٬۰۰۰٬۰۰۰ تومان</strong><span>مبلغ موردنیاز:</span></div>
          <div><strong className={styles.contextRegular}>۲۰٬۰۰۰٬۰۰۰ تومان</strong><span>اجاره ماهانه:</span></div>
          <div><strong className={styles.contextRegular}>۵۰۰٬۰۰۰٬۰۰۰ تومان</strong><span>مبلغ رهن:</span></div>
          <div><strong>سعادت‌آباد</strong><span>قرارداد:</span></div>
        </section>

        <section className={styles.planRow} data-node-id="150:930">
          {plans.map((plan) => <PlanCard key={plan.title} plan={plan} />)}
        </section>

        <section className={styles.actions} data-node-id="150:995">
          <Link href="/user/contracts/register/plans/confirmation" className={styles.primaryAction} data-node-id="150:996">انتخاب طرح و ادامه</Link>
          <Link href="/user/contracts/register/result" className={styles.secondaryAction} data-node-id="150:998">بازگشت به اطلاعات قرارداد</Link>
        </section>

        <div className={styles.informationNote} data-node-id="150:999">
          <p data-node-id="150:1000">شرایط نمایش‌داده‌شده براساس اطلاعات فعلی شما و قرارداد محاسبه شده‌اند. شرایط نهایی پس از ثبت درخواست و بررسی بانک مشخص می‌شود.</p>
          <img src={assets.info} alt="" width={20} height={20} />
        </div>
      </section>

      <aside className={styles.sidebar} data-node-id="142:1808">
        <div className={styles.sidebarTop}>
          <div className={styles.logoWrap}><img src={assets.logo} alt="چارخونه" width={127} height={55} /></div>
          <nav className={styles.nav} aria-label="ناوبری حساب کاربری">
            <Link href="/user/home" className={styles.navItem}><span className={styles.navSpacer} /><span>خانه</span><img src={assets.home} alt="" width={20} height={20} /></Link>
            <Link href="/user/contracts" className={`${styles.navItem} ${styles.navActive}`}><span className={styles.alertBadge}>۱</span><span>قراردادها</span><img src={assets.contracts} alt="" width={20} height={20} /></Link>
            <Link href="/user/receive-pay" className={styles.navItem}><span className={styles.navSpacer} /><span>دریافت و پرداخت</span><img src={assets.payments} alt="" width={20} height={20} /></Link>
            <Link href="/user/account" className={styles.navItem}><span className={styles.navSpacer} /><span>حساب من</span><img src={assets.account} alt="" width={20} height={20} /></Link>
          </nav>
        </div>
        <div className={styles.profile}>
          <img className={styles.avatar} src={assets.avatar} alt="" width={40} height={40} />
          <div className={styles.profileText}><strong>علی رضایی</strong><span>۰۹۱۲•••••۶۷</span></div>
        </div>
      </aside>
    </main>
  );
}
