import Link from "next/link";
import {
  getPilotCases,
  isAdminPreviewMode,
  PilotApiError,
  type PilotCaseQueueItem,
} from "@/lib/pilotOperations";

const PAGE_SIZE = 50;

const statusFilters = [
  { value: "", label: "همه" },
  { value: "IdentityPending", label: "احراز هویت" },
  { value: "PlanSelectionPending", label: "انتخاب طرح" },
  { value: "PropertyContractPending", label: "قرارداد ملک" },
  { value: "ExternalChecksPending", label: "بررسی بیرونی" },
  { value: "ExternalCheckIndeterminate", label: "نامعین" },
  { value: "DecisionReady", label: "آماده تصمیم" },
  { value: "BankApprovalPending", label: "بانک" },
  { value: "FundingPending", label: "تأمین مالی" },
  { value: "ApprovedFunded", label: "تأمین‌شده" },
] as const;

const statusLabels: Record<string, string> = {
  IdentityPending: "در انتظار احراز هویت",
  PlanSelectionPending: "در انتظار انتخاب طرح",
  PropertyContractPending: "در انتظار قرارداد ملک",
  ExternalChecksPending: "در انتظار بررسی بیرونی",
  ExternalCheckIndeterminate: "بررسی بیرونی نامعین",
  DecisionReady: "آماده تصمیم",
  BankApprovalPending: "در انتظار بانک",
  FundingPending: "در انتظار تأمین مالی",
  ApprovedFunded: "تأمین مالی تکمیل",
  Active: "فعال",
  Draft: "پیش‌نویس",
  Pending: "در انتظار",
  Verified: "تأییدشده",
  Approved: "تأییدشده",
  Confirmed: "تأییدشده",
  Succeeded: "موفق",
  Unknown: "نامشخص",
  Indeterminate: "نامعین",
  NeedsDocuments: "نیازمند مدارک",
};

const operationLabels: Record<string, string> = {
  Identity: "احراز هویت",
  PropertyContract: "قرارداد ملک",
  CreditEligibility: "اعتبارسنجی",
  BankFunding: "تأمین مالی بانکی",
  TenantContributionFunding: "تأمین سهم مستأجر",
};

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

function firstValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function parsePage(value: string | undefined) {
  const parsed = Number.parseInt(value ?? "", 10);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : 1;
}

function parseStatus(value: string | undefined) {
  const normalized = value?.trim();
  return normalized && /^[A-Za-z]+$/.test(normalized) && normalized.length <= 80
    ? normalized
    : undefined;
}

function formatStatus(value: string | null) {
  if (!value) return "—";
  return statusLabels[value] ?? value;
}

function statusTone(value: string | null): "success" | "warning" | "neutral" | "danger" {
  const normalized = value?.toLowerCase() ?? "";
  if (
    normalized.includes("failed") ||
    normalized.includes("declined") ||
    normalized.includes("rejected")
  ) {
    return "danger";
  }

  if (
    normalized.includes("pending") ||
    normalized.includes("unknown") ||
    normalized.includes("indeterminate") ||
    normalized.includes("needsdocuments")
  ) {
    return "warning";
  }

  if (
    normalized.includes("verified") ||
    normalized.includes("approved") ||
    normalized.includes("confirmed") ||
    normalized.includes("succeeded") ||
    normalized.includes("active") ||
    normalized.includes("funded")
  ) {
    return "success";
  }

  return "neutral";
}

function formatUpdatedAt(value: string) {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;

  return new Intl.DateTimeFormat("fa-IR-u-ca-persian", {
    dateStyle: "short",
    timeStyle: "short",
    timeZone: "UTC",
  }).format(parsed);
}

function fundingState(item: PilotCaseQueueItem) {
  if (item.tenantContributionStatus) {
    return `سهم مستأجر: ${formatStatus(item.tenantContributionStatus)}`;
  }

  if (item.fundFreezeStatus) {
    return `فریز اصل: ${formatStatus(item.fundFreezeStatus)}`;
  }

  if (item.bankApprovalStatus) {
    return `بانک: ${formatStatus(item.bankApprovalStatus)}`;
  }

  if (item.creditEligibilityStatus) {
    return `اعتبار: ${formatStatus(item.creditEligibilityStatus)}`;
  }

  return "—";
}

function pageHref(page: number, status?: string) {
  const params = new URLSearchParams({ page: String(page) });
  if (status) params.set("status", status);
  return `/admin/cases?${params.toString()}`;
}

function FailureState({ error }: { error: unknown }) {
  const pilotError = error instanceof PilotApiError ? error : null;
  const needsAuthentication = pilotError?.status === 401 || pilotError?.status === 403;

  return (
    <section className="admin-cases__table-card admin-cases__state-card" role="alert">
      <h2>داده عملیاتی در دسترس نیست</h2>
      <p>
        {needsAuthentication
          ? "این صفحه فقط bearer واقعی OIDC را به API پایلوت پاس می‌دهد. ورود محلی یا داده نمونه وجود ندارد."
          : "اتصال سروری پنل به Pilot API برقرار نیست یا API پاسخ معتبر نداده است."}
      </p>
      <small>
        {pilotError ? `کد: ${pilotError.code} • HTTP ${pilotError.status}` : "کد: pilot_web_unexpected_error"}
      </small>
      {needsAuthentication ? <Link href="/admin/login">ورود از مسیر OIDC</Link> : null}
    </section>
  );
}

export default async function AdminCasesPage({ searchParams }: { searchParams: SearchParams }) {
  const query = await searchParams;
  const previewMode = isAdminPreviewMode();
  const page = parsePage(firstValue(query.page));
  const status = parseStatus(firstValue(query.status));

  let response: Awaited<ReturnType<typeof getPilotCases>>;
  try {
    response = await getPilotCases(page, PAGE_SIZE, status);
  } catch (error) {
    return (
      <section className="admin-cases" data-name="Admin / Pilot Cases">
        <header className="admin-cases__header">
          <div />
          <div className="admin-cases__heading">
            <h1>پرونده‌های پایلوت</h1>
            <p>{previewMode ? "پیش‌نمایش Stage با داده کنترل‌شده برای QA رابط کاربری." : "صف عملیاتی واقعی از PostgreSQL؛ بدون داده نمونه و بدون امکان تغییر مستقیم state."}</p>
          </div>
        </header>
        <FailureState error={error} />
      </section>
    );
  }

  const items = response.items;
  const reconcileCount = items.filter((item) => item.suggestedOperation !== null).length;
  const contractCount = items.filter((item) => item.contractId !== null).length;
  const fundingEvidenceCount = items.filter(
    (item) =>
      item.creditEligibilityStatus !== null ||
      item.bankApprovalStatus !== null ||
      item.fundFreezeStatus !== null ||
      item.tenantContributionStatus !== null,
  ).length;
  const hasNextPage = items.length === response.pageSize;

  return (
    <section className="admin-cases" data-name="Admin / Pilot Cases">
      <header className="admin-cases__header">
        <span className="admin-cases__live">{previewMode ? "پیش‌نمایش آزمایشی • کنترل کیفیت" : "Pilot API • PostgreSQL"}</span>
        <div className="admin-cases__heading">
          <h1>پرونده‌های پایلوت</h1>
          <p>{previewMode ? "داده‌های نمایشی کنترل‌شده برای تکمیل و بررسی تجربه ادمین." : "صف واقعی عملیات؛ شناسه‌ها و وضعیت‌ها مستقیماً از backend محافظت‌شده خوانده می‌شوند."}</p>
        </div>
      </header>

      <section className="admin-cases__metrics" aria-label="آمار صفحه جاری">
        <article className="admin-cases__metric">
          <span>پرونده در این صفحه</span>
          <strong>{items.length.toLocaleString("fa-IR")}</strong>
          <small>فقط صفحه جاری، نه آمار ساختگی کل سامانه</small>
        </article>
        <article className="admin-cases__metric">
          <span>پیشنهاد پیگیری</span>
          <strong>{reconcileCount.toLocaleString("fa-IR")}</strong>
          <small>عملیات پیشنهادی سامانه برای وضعیت فعلی</small>
        </article>
        <article className="admin-cases__metric">
          <span>دارای قرارداد</span>
          <strong>{contractCount.toLocaleString("fa-IR")}</strong>
          <small>پرونده‌های این صفحه با contract واقعی</small>
        </article>
        <article className="admin-cases__metric">
          <span>دارای evidence مالی</span>
          <strong>{fundingEvidenceCount.toLocaleString("fa-IR")}</strong>
          <small>اعتبار، بانک، فریز اصل یا سهم مستأجر</small>
        </article>
      </section>

      <section className="admin-cases__controls" aria-label="فیلتر پرونده‌ها">
        <nav className="admin-cases__filters" aria-label="فیلتر وضعیت">
          {statusFilters.map((filter) => {
            const active = (status ?? "") === filter.value;
            return (
              <Link
                className={`admin-cases__filter admin-cases__filter--${active ? "active" : "neutral"}`}
                href={pageHref(1, filter.value || undefined)}
                aria-current={active ? "page" : undefined}
                key={filter.value || "all"}
              >
                {filter.label}
              </Link>
            );
          })}
        </nav>
        <p className="admin-cases__source-note">
          {previewMode ? (status ? `فیلتر پیش‌نمایش: ${status}` : "داده نمایشی Stage") : (status ? `فیلتر سرویس: ${status}` : "بدون فیلتر وضعیت")}
        </p>
      </section>

      <section className="admin-cases__table-card">
        <div className="admin-cases__table-wrap">
          <div className="admin-cases__table" role="table" aria-label="فهرست پرونده‌های پایلوت">
            <div className="admin-cases__row admin-cases__row--head" role="row">
              <span role="columnheader">اقدام</span>
              <span role="columnheader">به‌روزرسانی</span>
              <span role="columnheader">پیگیری</span>
              <span role="columnheader">شواهد مالی</span>
              <span role="columnheader">قرارداد</span>
              <span role="columnheader">وضعیت پرونده</span>
              <span role="columnheader">متقاضی</span>
            </div>

            {items.map((item) => (
              <div className="admin-cases__row" role="row" key={item.creditApplicationId}>
                <span role="cell">
                  <Link
                    className="admin-cases__manage"
                    href={`/admin/cases/${item.creditApplicationId}`}
                  >
                    مدیریت
                  </Link>
                </span>
                <span className="admin-cases__muted" role="cell">
                  {formatUpdatedAt(item.updatedAtUtc)}
                </span>
                <span role="cell">
                  <span
                    className={`admin-cases__badge admin-cases__badge--${item.suggestedOperation ? "warning" : "neutral"}`}
                  >
                    {item.suggestedOperation ? operationLabels[item.suggestedOperation] ?? item.suggestedOperation : "—"}
                  </span>
                </span>
                <span role="cell">
                  <span
                    className={`admin-cases__badge admin-cases__badge--${statusTone(
                      item.tenantContributionStatus ??
                        item.fundFreezeStatus ??
                        item.bankApprovalStatus ??
                        item.creditEligibilityStatus,
                    )}`}
                  >
                    {fundingState(item)}
                  </span>
                </span>
                <span role="cell">
                  <span
                    className={`admin-cases__badge admin-cases__badge--${statusTone(item.contractStatus)}`}
                  >
                    {formatStatus(item.contractStatus)}
                  </span>
                </span>
                <strong role="cell" title={item.creditApplicationId}>
                  {formatStatus(item.applicationStatus)}
                </strong>
                <strong role="cell" title={item.applicantUserId}>
                  {item.applicantUserId}
                </strong>
              </div>
            ))}
          </div>
        </div>

        {items.length === 0 ? (
          <div className="admin-cases__empty">{previewMode ? "برای این فیلتر، پرونده نمایشی وجود ندارد." : "برای این page و فیلتر، پرونده‌ای در PostgreSQL ثبت نشده است."}</div>
        ) : null}

        <footer className="admin-cases__footer">
          <nav className="admin-cases__pagination" aria-label="صفحه‌بندی پرونده‌ها">
            {page > 1 ? <Link href={pageHref(page - 1, status)}>قبلی</Link> : <span>قبلی</span>}
            <strong>{page.toLocaleString("fa-IR")}</strong>
            {hasNextPage ? <Link href={pageHref(page + 1, status)}>بعدی</Link> : <span>بعدی</span>}
          </nav>
          <p>
            صفحه {response.page.toLocaleString("fa-IR")} • حداکثر {response.pageSize.toLocaleString("fa-IR")} پرونده
          </p>
        </footer>
      </section>
    </section>
  );
}
