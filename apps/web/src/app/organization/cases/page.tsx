import Link from "next/link";

type CaseTone = "success" | "warning" | "muted" | "danger";

type CaseRow = {
  id: string;
  personnel: string;
  plan: string;
  charkhooneh: string;
  charkhoonehTone: CaseTone;
  bank: string;
  bankTone?: CaseTone;
  payment: string;
  paymentTone: CaseTone;
  updatedAt: string;
};

const metrics = [
  { label: "تأمین مالی فعال", value: "۴۸ پرونده", note: "تأمین مالی انجام‌شده" },
  { label: "ارسال‌شده به بانک", value: "۲۶ پرونده", note: "در انتظار یا در حال بررسی بانک" },
  { label: "نیازمند اقدام سازمان", value: "۹ پرونده", note: "پرداخت یا تکمیل اقدام سازمان" },
  { label: "پرونده‌های فعال", value: "۱۲۸ پرونده", note: "برای پرسنل سازمان" },
] as const;

const rows: CaseRow[] = [
  { id: "1405-128", personnel: "علی رضایی", plan: "طرح حمایتی کارکنان", charkhooneh: "فعال", charkhoonehTone: "success", bank: "تأیید بانک", bankTone: "success", payment: "پرداخت‌شده", paymentTone: "success", updatedAt: "۱۴۰۵/۰۶/۰۸" },
  { id: "1405-127", personnel: "مریم محمدی", plan: "طرح حمایتی کارکنان", charkhooneh: "در بررسی چارخونه", charkhoonehTone: "muted", bank: "—", payment: "—", paymentTone: "muted", updatedAt: "۱۴۰۵/۰۶/۰۸" },
  { id: "1405-126", personnel: "رضا کریمی", plan: "طرح حمایتی کارکنان", charkhooneh: "ارسال‌شده به بانک", charkhoonehTone: "muted", bank: "در انتظار بررسی", payment: "—", paymentTone: "muted", updatedAt: "۱۴۰۵/۰۶/۰۷" },
  { id: "1405-125", personnel: "امیر حسینی", plan: "طرح حمایتی کارکنان", charkhooneh: "نیازمند تکمیل", charkhoonehTone: "warning", bank: "—", payment: "—", paymentTone: "muted", updatedAt: "۱۴۰۵/۰۶/۰۷" },
  { id: "1405-124", personnel: "نگار موسوی", plan: "طرح حمایتی کارکنان", charkhooneh: "تأیید بانک", charkhoonehTone: "success", bank: "تأییدشده", bankTone: "success", payment: "آماده پرداخت", paymentTone: "muted", updatedAt: "۱۴۰۵/۰۶/۰۶" },
  { id: "1405-123", personnel: "حسین جعفری", plan: "طرح حمایتی کارکنان", charkhooneh: "فعال", charkhoonehTone: "success", bank: "تأیید بانک", bankTone: "success", payment: "پرداخت‌شده", paymentTone: "success", updatedAt: "۱۴۰۵/۰۶/۰۵" },
  { id: "1405-122", personnel: "سارا احمدی", plan: "طرح مسکن کارکنان", charkhooneh: "در انتظار اقدام سازمان", charkhoonehTone: "warning", bank: "—", payment: "نیازمند پرداخت", paymentTone: "warning", updatedAt: "۱۴۰۵/۰۶/۰۵" },
  { id: "1405-121", personnel: "زهرا یوسفی", plan: "طرح کارکنان سازمانی", charkhooneh: "ردشده", charkhoonehTone: "danger", bank: "رد بانک", bankTone: "danger", payment: "—", paymentTone: "muted", updatedAt: "۱۴۰۵/۰۶/۰۴" },
  { id: "1405-120", personnel: "محمد نادری", plan: "طرح مسکن کارکنان", charkhooneh: "در بررسی چارخونه", charkhoonehTone: "muted", bank: "—", payment: "—", paymentTone: "muted", updatedAt: "۱۴۰۵/۰۶/۰۴" },
  { id: "1405-119", personnel: "نرگس اکبری", plan: "طرح حمایتی کارکنان", charkhooneh: "ارسال‌شده به بانک", charkhoonehTone: "muted", bank: "در حال بررسی", payment: "—", paymentTone: "muted", updatedAt: "۱۴۰۵/۰۶/۰۳" },
];

export default function OrganizationCasesPage() {
  return (
    <section className="org-cases" data-node-id="495:29">
      <header className="org-cases__header">
        <button type="button" className="org-action-button org-action-button--surface">خروجی</button>
        <div>
          <h1>پرونده‌ها</h1>
          <p>پیگیری وضعیت پرونده‌های پرسنل سازمان در چارخونه</p>
        </div>
      </header>

      <div className="org-cases__metrics">
        {metrics.map((metric) => (
          <article className="org-case-metric" key={metric.label}>
            <span>{metric.label}</span>
            <strong>{metric.value}</strong>
            <small>{metric.note}</small>
          </article>
        ))}
      </div>

      <div className="org-cases__controls">
        <div className="org-cases__filters" aria-label="فیلتر پرونده‌ها">
          <button type="button" className="org-case-filter org-case-filter--active">همه</button>
          <button type="button" className="org-case-filter org-case-filter--warning">نیازمند اقدام</button>
          <button type="button" className="org-case-filter">در بانک</button>
          <button type="button" className="org-case-filter">فعال</button>
        </div>
        <label className="org-cases__search">
          <span className="sr-only">جستجوی پرونده</span>
          <input type="search" placeholder="جستجو با نام، کد ملی یا شماره پرونده" />
        </label>
      </div>

      <div className="org-cases-table-wrap">
        <table className="org-cases-table">
          <thead>
            <tr>
              <th>پرسنل</th>
              <th>طرح</th>
              <th>وضعیت در چارخونه</th>
              <th>وضعیت بانک</th>
              <th>پرداخت سازمان</th>
              <th>به‌روزرسانی</th>
              <th>اقدام</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id}>
                <td><strong>{row.personnel}</strong></td>
                <td><strong>{row.plan}</strong></td>
                <td><span className={`org-case-badge org-case-badge--${row.charkhoonehTone}`}>{row.charkhooneh}</span></td>
                <td className={row.bankTone === "danger" ? "org-cases-table__danger" : ""}>{row.bank}</td>
                <td><span className={`org-case-badge org-case-badge--${row.paymentTone}`}>{row.payment}</span></td>
                <td className="org-cases-table__muted">{row.updatedAt}</td>
                <td><Link className="org-cases-table__view" href={`/organization/cases/${row.id}`}>مشاهده</Link></td>
              </tr>
            ))}
          </tbody>
        </table>
        <footer className="org-cases__footer">
          <div className="org-pagination" aria-label="صفحه‌بندی پرونده‌ها">
            <button type="button">بعدی</button>
            <button type="button" className="org-pagination__active">۱</button>
            <button type="button">۲</button>
            <button type="button">۳</button>
            <button type="button">قبلی</button>
          </div>
          <span>نمایش ۱۰ پرونده از ۱۲۸ پرونده</span>
        </footer>
      </div>
    </section>
  );
}
