import Link from "next/link";
import { OrganizationCsvButton } from "@/components/organization/OrganizationCsvButton";

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

function param(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] ?? "" : value ?? "";
}

function filterMatch(row: CaseRow, filter: string) {
  if (filter === "action") return row.charkhoonehTone === "warning" || row.paymentTone === "warning";
  if (filter === "bank") return row.charkhooneh.includes("بانک") || row.bank !== "—";
  if (filter === "active") return row.charkhooneh === "فعال";
  return true;
}

function hrefFor(q: string, filter: string, page: number) {
  const params = new URLSearchParams();
  if (q) params.set("q", q);
  if (filter !== "all") params.set("filter", filter);
  if (page > 1) params.set("page", String(page));
  const qs = params.toString();
  return qs ? `/organization/cases?${qs}` : "/organization/cases";
}

export default async function OrganizationCasesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const q = param(params.q).trim();
  const filter = param(params.filter) || "all";
  const requestedPage = Math.max(1, Number(param(params.page)) || 1);

  const filtered = rows.filter((row) => {
    const matchesQuery = !q || `${row.id} ${row.personnel} ${row.plan}`.includes(q);
    return matchesQuery && filterMatch(row, filter);
  });

  const pageSize = 4;
  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize));
  const currentPage = Math.min(requestedPage, pageCount);
  const visible = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  return (
    <section className="org-cases" data-node-id="495:29">
      <header className="org-cases__header">
        <OrganizationCsvButton
          className="org-action-button org-action-button--surface"
          filename="organization-cases.csv"
          rows={[
            ["پرونده", "پرسنل", "طرح", "وضعیت چارخونه", "وضعیت بانک", "پرداخت", "آخرین بروزرسانی"],
            ...filtered.map((row) => [row.id, row.personnel, row.plan, row.charkhooneh, row.bank, row.payment, row.updatedAt]),
          ]}
        >
          خروجی CSV
        </OrganizationCsvButton>
        <div><h1>پرونده‌ها</h1><p>پیگیری وضعیت پرونده‌های پرسنل سازمان در چارخونه</p></div>
      </header>

      <div className="org-cases__metrics">
        {metrics.map((metric) => <article className="org-case-metric" key={metric.label}><span>{metric.label}</span><strong>{metric.value}</strong><small>{metric.note}</small></article>)}
      </div>

      <div className="org-cases__controls">
        <div className="org-cases__filters" aria-label="فیلتر پرونده‌ها">
          <Link href={hrefFor(q, "all", 1)} className={`org-case-filter ${filter === "all" ? "org-case-filter--active" : ""}`}>همه</Link>
          <Link href={hrefFor(q, "action", 1)} className={`org-case-filter org-case-filter--warning ${filter === "action" ? "org-case-filter--active" : ""}`}>نیازمند اقدام</Link>
          <Link href={hrefFor(q, "bank", 1)} className={`org-case-filter ${filter === "bank" ? "org-case-filter--active" : ""}`}>در بانک</Link>
          <Link href={hrefFor(q, "active", 1)} className={`org-case-filter ${filter === "active" ? "org-case-filter--active" : ""}`}>فعال</Link>
        </div>
        <form className="org-cases__search" method="get">
          {filter !== "all" && <input type="hidden" name="filter" value={filter} />}
          <span className="sr-only">جستجوی پرونده</span>
          <input name="q" type="search" defaultValue={q} placeholder="جستجو با نام، کد ملی یا شماره پرونده" />
        </form>
      </div>

      <div className="org-cases-table-wrap">
        <table className="org-cases-table">
          <thead><tr><th>پرسنل</th><th>طرح</th><th>وضعیت در چارخونه</th><th>وضعیت بانک</th><th>پرداخت سازمان</th><th>آخرین بروزرسانی</th><th>اقدام</th></tr></thead>
          <tbody>
            {visible.map((row) => (
              <tr key={row.id}>
                <td><div><strong>{row.personnel}</strong><small>پرونده {row.id}</small></div></td>
                <td><strong>{row.plan}</strong></td>
                <td><span className={`org-status org-status--${row.charkhoonehTone}`}>{row.charkhooneh}</span></td>
                <td><span className={`org-status org-status--${row.bankTone ?? "muted"}`}>{row.bank}</span></td>
                <td><span className={`org-status org-status--${row.paymentTone}`}>{row.payment}</span></td>
                <td>{row.updatedAt}</td>
                <td><Link className="org-case-table__view" href={`/organization/cases/${row.id}`}>مشاهده</Link></td>
              </tr>
            ))}
            {visible.length === 0 && <tr><td colSpan={7}>پرونده‌ای مطابق فیلتر پیدا نشد.</td></tr>}
          </tbody>
        </table>
      </div>

      <footer className="org-cases__footer">
        <span>نمایش {visible.length.toLocaleString("fa-IR")} پرونده از {filtered.length.toLocaleString("fa-IR")} پرونده نمونه</span>
        <div className="org-pagination">
          {currentPage > 1 && <Link href={hrefFor(q, filter, currentPage - 1)}>قبلی</Link>}
          {Array.from({ length: pageCount }, (_, index) => index + 1).map((pageNumber) => <Link key={pageNumber} className={pageNumber === currentPage ? "org-pagination__active" : undefined} href={hrefFor(q, filter, pageNumber)}>{pageNumber.toLocaleString("fa-IR")}</Link>)}
          {currentPage < pageCount && <Link href={hrefFor(q, filter, currentPage + 1)}>بعدی</Link>}
        </div>
      </footer>
    </section>
  );
}
