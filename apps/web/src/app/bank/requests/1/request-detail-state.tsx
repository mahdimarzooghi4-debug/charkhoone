import Link from "next/link";
import shell from "../../panel.module.css";
import styles from "./page.module.css";
import state from "./state.module.css";

type ResultVariant = "rejected" | "approved";

type Assets = Readonly<{
  avatar: string;
  logo: string;
  dot: string;
  check: string;
  home: string;
  requests: string;
  plans: string;
  payments: string;
  settings: string;
  logout: string;
}>;

type Props = {
  variant: ResultVariant;
  assets: Assets;
  nodeId: string;
};

const summary = [
  ["زمان ثبت", "۱۴۰۵/۰۶/۰۸ — ۱۰:۴۵"],
  ["مدت تأمین مالی", "۱۲ ماه"],
  ["طرح انتخاب‌شده", "طرح مسکن ویژه"],
  ["مبلغ درخواست", "۵۰۰٬۰۰۰٬۰۰۰ تومان"],
  ["متقاضی", "محمد رضایی"],
] as const;

const tenantRows = [
  ["نام و نام خانوادگی", "محمد رضایی"],
  ["کد ملی", "۰۰۱***۴۵۶۷"],
  ["شماره موبایل", "۰۹۱۲***۴۵۶۷"],
] as const;

const contractRows = [
  ["کد قرارداد", "۱۴۰۵-۸۳۲۱", false],
  ["کد رهگیری خودنویس", "۱۲۳۴۵۶۷۸۹۰", false],
  ["ودیعه قرارداد", "۸۰۰٬۰۰۰٬۰۰۰ تومان", false],
  ["اجاره ماهانه", "۲۰٬۰۰۰٬۰۰۰ تومان", false],
  ["مدت قرارداد", "۱۲ ماه", false],
  ["وضعیت", "معتبر", true],
] as const;

const financing = [
  ["تاریخ پایان قرارداد", "۱۵ مهر ۱۴۰۶"],
  ["سود ماهانه بانک", "۱۲٬۵۰۰٬۰۰۰ تومان"],
  ["وجه تضمین مستأجر", "۳۰۰٬۰۰۰٬۰۰۰ تومان"],
  ["اصل تسهیلات درخواستی", "۵۰۰٬۰۰۰٬۰۰۰ تومان"],
] as const;

const checks = [
  ["رتبه اعتباری", "A"],
  ["سقف قابل تأمین براساس اعتبار", "۵۰۰٬۰۰۰٬۰۰۰ تومان"],
  ["تطابق با شرایط طرح", ""],
  ["اعتبار قرارداد خودنویس", ""],
  ["هویت و تطابق متقاضی", ""],
  ["وجه مستأجر در کارگزاری", ""],
] as const;

function Sidebar({ assets }: { assets: Assets }) {
  return (
    <aside className={shell.sidebar}>
      <div className={shell.brand}>
        <img className={shell.logo} src={assets.logo} alt="چارخونه" width={127} height={55} />
        <div className={shell.bankIdentity}><strong>بانک نمونه</strong><span>تیم مدیریت تسهیلات</span></div>
      </div>
      <nav className={shell.nav}>
        <Link href="/bank" className={shell.navItem}><span>خانه</span><img src={assets.home} alt="" /></Link>
        <Link href="/bank/requests" className={`${shell.navItem} ${shell.navActive}`}><span>درخواست‌ها</span><img src={assets.requests} alt="" /></Link>
        <Link href="/bank/plans" className={shell.navItem}><span>طرح‌ها</span><img src={assets.plans} alt="" /></Link>
        <Link href="/bank/receive-pay" className={shell.navItem}><span>دریافت و پرداخت</span><img src={assets.payments} alt="" /></Link>
        <Link href="/bank/settings" className={shell.navItem}><span>تنظیمات</span><img src={assets.settings} alt="" /></Link>
        <Link href="/bank/login" className={`${shell.navItem} ${shell.logout}`}><span>خروج از حساب</span><img src={assets.logout} alt="" /></Link>
      </nav>
    </aside>
  );
}

export function BankRequestResultDetail({ variant, assets, nodeId }: Props) {
  const rejected = variant === "rejected";
  const badgeText = rejected ? "ردشده" : "تأییدشده";
  const finalText = rejected ? "ردشده توسط بانک" : "تأییدشده توسط بانک";

  return (
    <main className={shell.page} data-node-id={nodeId} data-name={rejected ? "Bank / Request Detail / Rejected" : "Bank / Request Detail / Approved"}>
      <section className={shell.mainContent}>
        <header className={shell.header}>
          <div className={shell.userInfo}>
            <div className={shell.userCopy}><strong>شعبه مرکزی تهران</strong><span>تیم چارخونه بانک</span></div>
            <img className={shell.avatar} src={assets.avatar} alt="" width={40} height={40} />
          </div>
          <div className={styles.detailHeader}>
            <Link href="/bank/requests" className={styles.backLink}>بازگشت به درخواست‌ها</Link>
            <div className={styles.titleRow}>
              <span className={rejected ? state.rejectedBadge : state.approvedBadge}>{badgeText}</span>
              <h1>جزئیات درخواست تأمین مالی</h1>
            </div>
            <p className={styles.requestCode}>درخواست ۱۴۰۵-۸۳۲۱</p>
          </div>
        </header>

        <section className={styles.summaryCard}>
          {summary.map(([label, value]) => <div className={styles.summaryItem} key={label}><span>{label}</span><strong>{value}</strong></div>)}
        </section>

        <div className={styles.twoCards}>
          <section className={styles.card}>
            <h2 className={styles.cardTitle}>اطلاعات متقاضی</h2><div className={styles.divider} />
            <div className={styles.rows}>{tenantRows.map(([label, value]) => <div className={styles.row} key={label}><strong>{value}</strong><span>{label}</span></div>)}</div>
            <div className={styles.verified}><span>احراز هویت شده</span><img src={assets.dot} alt="" /></div>
          </section>
          <section className={styles.card}>
            <h2 className={styles.cardTitle}>اطلاعات قرارداد</h2><div className={styles.divider} />
            <div className={styles.contractGrid}>{contractRows.map(([label, value, valid]) => <div className={styles.row} key={label}><strong className={valid ? styles.valid : ""}>{value}</strong><span>{label}</span></div>)}</div>
            <p className={styles.contractNote}>اطلاعات قرارداد از سامانه خودنویس دریافت شده است.</p>
          </section>
        </div>

        <section className={styles.card}>
          <h2 className={styles.cardTitle}>ساختار تأمین مالی</h2><div className={styles.divider} />
          <div className={styles.financeGrid}>{financing.map(([label, value]) => <div className={styles.summaryItem} key={label}><span>{label}</span><strong>{value}</strong></div>)}</div>
          <div className={styles.infoBox}><p>۱. اصل تسهیلات پس از تأیید، به حساب کنترل‌شده چارخونه در کارگزاری همین بانک منتقل می‌شود.</p><p>۲. اصل تسهیلات در طول قرارداد در ساختار کارگزاری باقی می‌ماند و سود تسهیلات طبق شرایط طرح به‌صورت ماهانه به بانک پرداخت می‌شود.</p></div>
        </section>

        <section className={styles.card}>
          <h2 className={styles.cardTitle}>خلاصه اعتبارسنجی و آمادگی پرونده</h2><div className={styles.divider} />
          <div className={styles.checks}>{checks.map(([label, value]) => <div className={styles.checkRow} key={label}><span className={styles.checkStatus}>تأیید شده</span><span className={styles.checkValue}>{value}</span><span className={styles.checkLabel}>{label}<span className={styles.checkIcon}><img src={assets.check} alt="" /></span></span></div>)}</div>
          <div className={styles.divider} />
          <div className={styles.finalStatus}><span className={rejected ? state.finalRejected : state.finalApproved}>{finalText}</span><span>وضعیت پرونده</span></div>
        </section>

        <section className={styles.ruleBox}><strong>قاعده تأمین مالی</strong><p>تأمین اصل تسهیلات پس از تأیید واریز وجه مستأجر به حساب کارگزاری همین بانک انجام می‌شود.</p></section>

        <section className={`${styles.card} ${styles.decisionCard}`}>
          <h2 className={styles.cardTitle}>تصمیم بانک</h2><div className={styles.divider} />
          {rejected ? (
            <div className={`${state.decisionResult} ${state.rejectedResult}`} data-name="rejection-result">
              <div className={state.resultRow}><span className={state.resultRejected}>ردشده</span><span className={state.resultLabel}>وضعیت تصمیم بانک</span></div>
              <div className={state.resultRow}><span className={state.resultValue}>عدم تأیید نهایی درخواست براساس بررسی بانک</span><span className={state.resultLabel}>دلیل رد</span></div>
              <div className={state.resultRow}><span className={state.resultLabel}>۱۴۰۵/۰۶/۰۸ — علی رضایی</span><span className={state.resultLabel}>ثبت تصمیم</span></div>
            </div>
          ) : (
            <>
              <div className={`${state.decisionResult} ${state.approvedResult}`} data-name="approval-result">
                <div className={state.resultRow}><span className={state.resultApproved}>تأییدشده</span><span className={state.resultLabel}>وضعیت تصمیم بانک</span></div>
                <div className={state.resultRow}><span className={state.resultValue}>۵۰۰٬۰۰۰٬۰۰۰ تومان</span><span className={state.resultLabel}>مبلغ نهایی تأییدشده</span></div>
                <div className={state.resultRow}><span className={state.resultLabel}>۱۴۰۵/۰۶/۰۸ — علی رضایی</span><span className={state.resultLabel}>ثبت تصمیم</span></div>
              </div>
              <div className={state.nextStep} data-name="next-step">
                <Link href="/bank/receive-pay" className={state.nextStepLink}>مشاهده در دریافت و پرداخت</Link>
                <p>پرونده تأیید شده و برای تأمین اصل تسهیلات وارد مرحله مالی شده است.</p>
              </div>
            </>
          )}
        </section>
      </section>
      <Sidebar assets={assets} />
    </main>
  );
}
