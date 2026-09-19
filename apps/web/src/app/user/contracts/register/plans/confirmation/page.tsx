import Link from "next/link";
import styles from "./page.module.css";
import { UserPanelSidebar } from "@/components/user/UserPanelSidebar";

const assets = {
  logo: "https://www.figma.com/api/mcp/asset/42402834-b287-4a2c-9df2-b041c1bb4d86.png",
  avatar: "https://www.figma.com/api/mcp/asset/cbe87eb8-7020-4dcc-9e13-ed3b57f71c55.png",
  check: "https://www.figma.com/api/mcp/asset/68470f9c-a962-438b-b66e-430e565babb5.svg",
  info: "https://www.figma.com/api/mcp/asset/9eaae733-41b7-418b-bbe5-37cce108ddfe.svg",
  home: "https://www.figma.com/api/mcp/asset/6c123ec7-4ca4-473a-b2f9-58a4c59a1147.svg",
  contracts: "https://www.figma.com/api/mcp/asset/3a58ab0c-58ba-4187-af7e-c04122762b79.svg",
  payments: "https://www.figma.com/api/mcp/asset/2edf3b2d-f107-41e3-bf93-767c19463d6b.svg",
  account: "https://www.figma.com/api/mcp/asset/18c4c0ec-61e5-4d92-94f5-727d6daf2717.svg",
} as const;

const staffPlanRows = [
  ["مبلغ تأمین مالی", "۴۵۰٬۰۰۰٬۰۰۰ تومان", false],
  ["آورده موردنیاز شما", "۵۰٬۰۰۰٬۰۰۰ تومان", false],
  ["پرداخت ماهانه تأمین مالی", "۱۸٬۵۰۰٬۰۰۰ تومان", true],
  ["مدت بازپرداخت", "۱۲ ماه", false],
] as const;

const generalPlanRows = [
  ["مبلغ تأمین مالی", "۴۰۰٬۰۰۰٬۰۰۰ تومان", false],
  ["آورده موردنیاز شما", "۱۰۰٬۰۰۰٬۰۰۰ تومان", false],
  ["پرداخت ماهانه تأمین مالی", "۲۰٬۵۰۰٬۰۰۰ تومان", true],
  ["مدت بازپرداخت", "۱۲ ماه", false],
] as const;

const contractRows = [
  ["موقعیت ملک", "سعادت‌آباد"],
  ["مبلغ رهن قرارداد", "۵۰۰٬۰۰۰٬۰۰۰ تومان"],
  ["اجاره ماهانه", "۲۰٬۰۰۰٬۰۰۰ تومان"],
  ["مدت زمان قرارداد", "۱۵ مهر ۱۴۰۵ تا ۱۵ مهر ۱۴۰۶"],
] as const;

const staffSummaryRows = [
  ["طرح انتخاب‌شده", "طرح ویژه کارکنان", false],
  ["بانک ارائه‌دهنده", "بانک نمونه", false],
  ["مبلغ درخواست", "۴۵۰٬۰۰۰٬۰۰۰ تومان", true],
  ["آورده موردنیاز شما", "۵۰٬۰۰۰٬۰۰۰ تومان", false],
  ["پرداخت ماهانه", "۱۸٬۵۰۰٬۰۰۰ تومان", true],
] as const;

const generalSummaryRows = [
  ["طرح انتخاب‌شده", "طرح عمومی", false],
  ["بانک ارائه‌دهنده", "بانک نمونه", false],
  ["مبلغ درخواست", "۴۰۰٬۰۰۰٬۰۰۰ تومان", true],
  ["آورده موردنیاز شما", "۱۰۰٬۰۰۰٬۰۰۰ تومان", false],
  ["پرداخت ماهانه", "۲۰٬۵۰۰٬۰۰۰ تومان", true],
] as const;

const steps = [
  ["۳", "اعلام نتیجه نهایی", "نتیجه بررسی و تایید نهایی شرایط طرح در پنل کاربری چارخونه به شما اطلاع داده می‌شود."],
  ["۲", "بررسی اعتبارسنجی بانک", "بانک نمونه مدارک و سوابق اعتباری شما را بر اساس ضوابط طرح انتخابی مورد بررسی قرار می‌دهد."],
  ["۱", "ارسال پرونده به بانک", "درخواست شما به همراه مشخصات قرارداد به صورت سیستمی جهت بررسی به بانک ارجاع داده خواهد شد."],
] as const;

function DataRows({ rows }: { rows: readonly (readonly [string, string, boolean?])[] }) {
  return (
    <div className={styles.dataRows}>
      {rows.map(([label, value, emphasized], index) => (
        <div key={label} className={`${styles.dataRow} ${index === rows.length - 1 ? styles.lastRow : ""}`}>
          <strong className={emphasized ? styles.emphasized : ""}>{value}</strong>
          <span>{label}</span>
        </div>
      ))}
    </div>
  );
}

export default async function PlanConfirmationPage({
  searchParams,
}: {
  searchParams: Promise<{ plan?: string }>;
}) {
  // Query string carries preview selection only; it does not submit a bank request.
  const { plan } = await searchParams;
  const isGeneral = plan === "general";
  const planRows = isGeneral ? generalPlanRows : staffPlanRows;
  const summaryRows = isGeneral ? generalSummaryRows : staffSummaryRows;

  return (
    <main className={styles.page} data-node-id="150:1053" data-name="Web App / Plan Confirmation">
      <section className={styles.mainContent} data-node-id="150:1054">
        <header className={styles.pageHeader} data-node-id="150:1055">
          <p data-node-id="150:1056">قراردادها / تأیید طرح</p>
          <h1 data-node-id="150:1057">تأیید طرح تأمین مالی</h1>
          <p data-node-id="150:1058">پیش از ارسال درخواست، شرایط طرح انتخاب‌شده را بررسی کنید.</p>
        </header>

        <div className={styles.columns} data-node-id="150:1059">
          <aside className={styles.summaryColumn} data-node-id="150:1060">
            <section className={styles.card} data-node-id="150:1061">
              <h2 data-node-id="150:1062">خلاصه درخواست</h2>
              <DataRows rows={summaryRows} />
              <div className={styles.divider} />
              <div className={styles.confirmationRow} data-node-id="150:1084">
                <p data-node-id="150:1085">شرایط طرح و مبالغ نمایش‌داده‌شده را بررسی کرده‌ام و صحت آن‌ها را تأیید می‌کنم.</p>
                <span className={styles.checkbox} aria-label="تأیید شده"><img src={assets.check} alt="" width={10} height={10} /></span>
              </div>
              <div className={styles.summaryActions}>
                <Link href="/user/contracts/register/plans/review" className={styles.primaryAction} data-node-id="150:1089">ارسال درخواست تأمین مالی</Link>
                <Link href="/user/contracts/register/plans" className={styles.secondaryAction} data-node-id="150:1091">تغییر طرح انتخاب‌شده</Link>
              </div>
            </section>
          </aside>

          <div className={styles.detailColumn} data-node-id="150:1093">
            <section className={styles.card} data-node-id="150:1094">
              <div className={styles.planHeader} data-node-id="150:1095">
                <div className={styles.badges}><span className={styles.badgeEligible}>واجد شرایط</span><span className={styles.badgeSpecial}>{isGeneral ? "عمومی" : "ویژه"}</span></div>
                <div className={styles.planTitle}><h2 data-node-id="150:1102">{isGeneral ? "طرح عمومی" : "طرح ویژه کارکنان"}</h2><p data-node-id="150:1103">بانک نمونه</p></div>
              </div>
              <div className={styles.divider} />
              <DataRows rows={planRows} />
              <div className={styles.rentRow} data-node-id="150:1121">
                <strong data-node-id="150:1122">۲۰٬۰۰۰٬۰۰۰ تومان</strong>
                <div><span data-node-id="150:1124">اجاره ماهانه قرارداد مرتبط</span><span className={styles.infoBubble}><img src={assets.info} alt="" width={14} height={14} /></span></div>
              </div>
            </section>

            <section className={styles.card} data-node-id="150:1127">
              <h2 data-node-id="150:1128">مشخصات قرارداد مرتبط</h2>
              <div className={styles.divider} />
              <DataRows rows={contractRows} />
            </section>

            <section className={styles.card} data-node-id="150:1146">
              <h2 data-node-id="150:1147">پس از ارسال درخواست چه می‌شود؟</h2>
              <div className={styles.steps} data-node-id="150:1148">
                {steps.map(([number, title, text]) => (
                  <article className={styles.step} key={number}>
                    <span className={styles.stepNumber}>{number}</span>
                    <h3>{title}</h3>
                    <p>{text}</p>
                  </article>
                ))}
              </div>
            </section>
          </div>
        </div>
      </section>

      <UserPanelSidebar nodeId="142:1773" />
    </main>
  );
}
