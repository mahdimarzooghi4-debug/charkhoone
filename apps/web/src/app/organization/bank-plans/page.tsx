import Link from "next/link";

type PlanStatus = "فعال" | "قابل انتخاب";

type BankPlanRow = {
  bank: string;
  name: string;
  limit: string;
  interest: string;
  organizationPayment: string;
  eligible: string;
  status: PlanStatus;
  id: string;
};

const metrics = [
  { label: "طرح‌های فعال سازمان", value: "۲ طرح", note: "برای پرسنل فعال است" },
  { label: "طرح‌های قابل انتخاب", value: "۷ طرح", note: "از بانک‌های همکار" },
  { label: "بانک‌های همکار", value: "۳ بانک", note: "دارای طرح سازمانی" },
  { label: "پرسنل بدون طرح", value: "۱۲ نفر", note: "نیازمند انتخاب طرح" },
] as const;

const plans: BankPlanRow[] = [
  { bank: "بانک نمونه", name: "طرح کارکنان سازمانی", limit: "تا ۵۰۰ میلیون تومان", interest: "۱۸٪", organizationPayment: "۲۴۰ میلیون / دوره", eligible: "۱۸۶ نفر", status: "فعال", id: "employee-plan" },
  { bank: "بانک توسعه", name: "طرح مسکن کارکنان", limit: "تا ۷۵۰ میلیون تومان", interest: "۱۹٪", organizationPayment: "بدون تعهد", eligible: "۹۴ نفر", status: "فعال", id: "housing-plan" },
  { bank: "بانک نمونه", name: "طرح حمایتی کارکنان", limit: "تا ۳۵۰ میلیون تومان", interest: "۱۷٪", organizationPayment: "پرداخت کامل سازمان", eligible: "۲۲۰ نفر", status: "قابل انتخاب", id: "supportive-employees" },
  { bank: "بانک همکاری", name: "طرح ویژه سازمان‌ها", limit: "تا ۶۰۰ میلیون تومان", interest: "۱۸.۵٪", organizationPayment: "بدون تعهد", eligible: "۳۴۲ نفر", status: "قابل انتخاب", id: "organization-special" },
  { bank: "بانک توسعه", name: "طرح کارکنان جدید", limit: "تا ۴۵۰ میلیون تومان", interest: "۲۰٪", organizationPayment: "۱۲۰ میلیون / دوره", eligible: "۱۲۸ نفر", status: "قابل انتخاب", id: "new-employees" },
  { bank: "بانک همکاری", name: "طرح مسکن ۱۲ ماهه", limit: "تا ۸۰۰ میلیون تومان", interest: "۱۹.۵٪", organizationPayment: "پرداخت کامل سازمان", eligible: "۷۶ نفر", status: "قابل انتخاب", id: "housing-12-month" },
];

export default function OrganizationBankPlansPage() {
  return (
    <section className="org-bank-plans" data-node-id="453:12">
      <header className="org-bank-plans__header">
        <div className="org-bank-plans__actions">
          <Link className="org-action-button org-action-button--primary" href="/organization/bank-plans/supportive-employees">انتخاب طرح جدید</Link>
          <button className="org-action-button org-action-button--surface" type="button">خروجی</button>
        </div>
        <div className="org-bank-plans__title">
          <h1>طرح‌های بانکی</h1>
          <p>طرح‌های قابل ارائه بانک‌ها را ببینید و برای پرسنل سازمان فعال کنید.</p>
        </div>
      </header>

      <div className="org-bank-plans__metrics">
        {metrics.map((metric) => (
          <article className="org-bank-plan-metric" key={metric.label}>
            <span>{metric.label}</span>
            <strong>{metric.value}</strong>
            <small>{metric.note}</small>
          </article>
        ))}
      </div>

      <div className="org-bank-plans__note">
        <strong>نکته</strong>
        <span>شرایط طرح را بانک تعریف می‌کند؛ پرداخت می‌تواند بر عهده مستأجر، سازمان یا به‌صورت مشترک باشد.</span>
      </div>

      <div className="org-bank-plans__controls">
        <label className="org-bank-plans__search">
          <span className="sr-only">جستجوی طرح بانکی</span>
          <input type="search" placeholder="جستجو با نام بانک یا طرح" />
        </label>
        <button type="button" className="org-bank-plans__filter">همه بانک‌ها</button>
        <button type="button" className="org-bank-plans__filter">همه وضعیت‌ها</button>
      </div>

      <div className="org-bank-plans-table-wrap">
        <table className="org-bank-plans-table">
          <thead>
            <tr>
              <th>بانک</th>
              <th>طرح</th>
              <th>سقف تأمین مالی</th>
              <th>نرخ سود</th>
              <th>پرداخت سازمان</th>
              <th>پرسنل مشمول</th>
              <th>وضعیت</th>
              <th>اقدام</th>
            </tr>
          </thead>
          <tbody>
            {plans.map((plan) => (
              <tr key={plan.id}>
                <td><strong>{plan.bank}</strong></td>
                <td><strong>{plan.name}</strong></td>
                <td>{plan.limit}</td>
                <td>{plan.interest}</td>
                <td>{plan.organizationPayment}</td>
                <td>{plan.eligible}</td>
                <td><span className={`org-plan-status org-plan-status--${plan.status === "فعال" ? "active" : "available"}`}>{plan.status}</span></td>
                <td>
                  <Link className={`org-plan-table-action ${plan.status === "قابل انتخاب" ? "org-plan-table-action--primary" : ""}`} href={`/organization/bank-plans/${plan.id}`}>
                    {plan.status === "فعال" ? "مشاهده" : "انتخاب"}
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <footer className="org-bank-plans-table__footer">
          <span>نمایش ۶ طرح از ۷ طرح قابل ارائه</span>
          <div className="org-pagination" aria-label="صفحه‌بندی طرح‌ها">
            <button type="button">قبلی</button>
            <button type="button" className="org-pagination__active">۱</button>
            <button type="button">۲</button>
            <button type="button">بعدی</button>
          </div>
        </footer>
      </div>
    </section>
  );
}
