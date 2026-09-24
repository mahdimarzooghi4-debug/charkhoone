import Link from "next/link";
import { OrganizationCsvButton } from "@/components/organization/OrganizationCsvButton";

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

function param(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] ?? "" : value ?? "";
}

function hrefFor({ q, bank, status, page }: { q?: string; bank?: string; status?: string; page?: number }) {
  const params = new URLSearchParams();
  if (q) params.set("q", q);
  if (bank && bank !== "همه") params.set("bank", bank);
  if (status && status !== "همه") params.set("status", status);
  if (page && page > 1) params.set("page", String(page));
  const query = params.toString();
  return query ? `/organization/bank-plans?${query}` : "/organization/bank-plans";
}

export default async function OrganizationBankPlansPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const q = param(params.q).trim();
  const bank = param(params.bank) || "همه";
  const status = param(params.status) || "همه";
  const requestedPage = Math.max(1, Number(param(params.page)) || 1);

  const filtered = plans.filter((plan) => {
    const matchesQuery = !q || plan.bank.includes(q) || plan.name.includes(q);
    const matchesBank = bank === "همه" || plan.bank === bank;
    const matchesStatus = status === "همه" || plan.status === status;
    return matchesQuery && matchesBank && matchesStatus;
  });

  const pageSize = 3;
  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize));
  const currentPage = Math.min(requestedPage, pageCount);
  const visible = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  const banks = ["همه", ...Array.from(new Set(plans.map((plan) => plan.bank)))];
  const statuses = ["همه", "فعال", "قابل انتخاب"];

  return (
    <section className="org-bank-plans" data-node-id="453:12">
      <header className="org-bank-plans__header">
        <div className="org-bank-plans__actions">
          <Link className="org-action-button org-action-button--primary" href="/organization/bank-plans/supportive-employees">انتخاب طرح جدید</Link>
          <OrganizationCsvButton
            className="org-action-button org-action-button--surface"
            filename="organization-bank-plans.csv"
            rows={[
              ["بانک", "طرح", "سقف تأمین مالی", "نرخ سود", "پرداخت سازمان", "پرسنل مشمول", "وضعیت"],
              ...filtered.map((plan) => [plan.bank, plan.name, plan.limit, plan.interest, plan.organizationPayment, plan.eligible, plan.status]),
            ]}
          >
            خروجی CSV
          </OrganizationCsvButton>
        </div>
        <div className="org-bank-plans__title">
          <h1>طرح‌های بانکی</h1>
          <p>طرح‌های قابل ارائه بانک‌ها را ببینید و برای پرسنل سازمان فعال کنید.</p>
        </div>
      </header>

      <div className="org-bank-plans__metrics">
        {metrics.map((metric) => <article className="org-bank-plan-metric" key={metric.label}><span>{metric.label}</span><strong>{metric.value}</strong><small>{metric.note}</small></article>)}
      </div>

      <div className="org-bank-plans__note"><strong>نکته</strong><span>شرایط طرح را بانک تعریف می‌کند؛ پرداخت می‌تواند بر عهده مستأجر، سازمان یا به‌صورت مشترک باشد.</span></div>

      <form className="org-bank-plans__controls" method="get">
        <label className="org-bank-plans__search">
          <span className="sr-only">جستجوی طرح بانکی</span>
          <input type="search" name="q" defaultValue={q} placeholder="جستجو با نام بانک یا طرح" />
        </label>
        <select className="org-bank-plans__filter" name="bank" defaultValue={bank} aria-label="فیلتر بانک">
          {banks.map((item) => <option key={item} value={item}>{item === "همه" ? "همه بانک‌ها" : item}</option>)}
        </select>
        <select className="org-bank-plans__filter" name="status" defaultValue={status} aria-label="فیلتر وضعیت">
          {statuses.map((item) => <option key={item} value={item}>{item === "همه" ? "همه وضعیت‌ها" : item}</option>)}
        </select>
        <button type="submit" className="org-action-button org-action-button--surface">اعمال فیلتر</button>
      </form>

      <div className="org-bank-plans-table-wrap">
        <table className="org-bank-plans-table">
          <thead><tr><th>بانک</th><th>طرح</th><th>سقف تأمین مالی</th><th>نرخ سود</th><th>پرداخت سازمان</th><th>پرسنل مشمول</th><th>وضعیت</th><th>اقدام</th></tr></thead>
          <tbody>
            {visible.map((plan) => (
              <tr key={plan.id}>
                <td><strong>{plan.bank}</strong></td><td><strong>{plan.name}</strong></td><td>{plan.limit}</td><td>{plan.interest}</td><td>{plan.organizationPayment}</td><td>{plan.eligible}</td>
                <td><span className={`org-plan-status org-plan-status--${plan.status === "فعال" ? "active" : "available"}`}>{plan.status}</span></td>
                <td><Link className={`org-plan-table-action ${plan.status === "قابل انتخاب" ? "org-plan-table-action--primary" : ""}`} href={`/organization/bank-plans/${plan.id}`}>{plan.status === "فعال" ? "مشاهده" : "انتخاب"}</Link></td>
              </tr>
            ))}
            {visible.length === 0 && <tr><td colSpan={8}>طرحی مطابق فیلتر پیدا نشد.</td></tr>}
          </tbody>
        </table>
        <footer className="org-bank-plans-table__footer">
          <span>نمایش {visible.length.toLocaleString("fa-IR")} طرح از {filtered.length.toLocaleString("fa-IR")} طرح</span>
          <div className="org-pagination" aria-label="صفحه‌بندی طرح‌ها">
            {currentPage > 1 && <Link href={hrefFor({ q, bank, status, page: currentPage - 1 })}>قبلی</Link>}
            {Array.from({ length: pageCount }, (_, index) => index + 1).map((pageNumber) => (
              <Link key={pageNumber} className={currentPage === pageNumber ? "org-pagination__active" : undefined} href={hrefFor({ q, bank, status, page: pageNumber })}>{pageNumber.toLocaleString("fa-IR")}</Link>
            ))}
            {currentPage < pageCount && <Link href={hrefFor({ q, bank, status, page: currentPage + 1 })}>بعدی</Link>}
          </div>
        </footer>
      </div>
    </section>
  );
}
