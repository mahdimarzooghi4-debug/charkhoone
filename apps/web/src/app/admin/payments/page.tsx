import Link from "next/link";
import {
  getPilotPayments,
  PilotApiError,
  type PilotPaymentQueueItem,
} from "@/lib/pilotOperations";

const PAGE_SIZE = 50;

const statusFilters = [
  { value: "", label: "همه" },
  { value: "Created", label: "ایجادشده" },
  { value: "Pending", label: "در انتظار" },
  { value: "Unknown", label: "نامشخص" },
  { value: "ReconciliationRequired", label: "نیازمند reconcile" },
  { value: "Succeeded", label: "موفق" },
  { value: "Failed", label: "ناموفق" },
  { value: "ArrearsBlocked", label: "مسدود بدهی" },
  { value: "Reversed", label: "برگشت‌خورده" },
] as const;

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

function statusTone(value: string | null): "success" | "warning" | "danger" | "neutral" {
  const normalized = value?.toLowerCase() ?? "";
  if (
    normalized.includes("failed") ||
    normalized.includes("arrearsblocked")
  ) {
    return "danger";
  }

  if (
    normalized.includes("pending") ||
    normalized.includes("unknown") ||
    normalized.includes("reconciliationrequired") ||
    normalized.includes("created")
  ) {
    return "warning";
  }

  if (
    normalized.includes("succeeded") ||
    normalized.includes("reversed")
  ) {
    return "success";
  }

  return "neutral";
}

function formatRial(value: string) {
  const [integerPart, fractionPart] = value.split(".", 2);
  const sign = integerPart.startsWith("-") ? "-" : "";
  const digits = sign ? integerPart.slice(1) : integerPart;
  const grouped = digits.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  const exact = fractionPart === undefined ? `${sign}${grouped}` : `${sign}${grouped}.${fractionPart}`;
  return `${exact} ریال`;
}

function formatDateTime(value: string) {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;

  return new Intl.DateTimeFormat("fa-IR-u-ca-persian", {
    dateStyle: "short",
    timeStyle: "short",
    timeZone: "UTC",
  }).format(parsed);
}

function pageHref(page: number, status?: string) {
  const params = new URLSearchParams({ page: String(page) });
  if (status) params.set("status", status);
  return `/admin/payments?${params.toString()}`;
}

function isAttention(item: PilotPaymentQueueItem) {
  return (
    item.paymentStatus === "Pending" ||
    item.paymentStatus === "Unknown" ||
    item.paymentStatus === "ReconciliationRequired"
  );
}

function FailureState({ error }: { error: unknown }) {
  const pilotError = error instanceof PilotApiError ? error : null;
  const needsAuthentication = pilotError?.status === 401 || pilotError?.status === 403;

  return (
    <section className="admin-payments__table-card admin-payments__state-card" role="alert">
      <h2>صف پرداخت واقعی در دسترس نیست</h2>
      <p>
        {needsAuthentication
          ? "این صفحه فقط bearer واقعی OIDC را به Pilot API پاس می‌دهد؛ login محلی یا payment fallback وجود ندارد."
          : "اتصال سروری پنل به Pilot payment API برقرار نیست یا backend پاسخ معتبر نداده است."}
      </p>
      <small>
        {pilotError
          ? `کد: ${pilotError.code} • HTTP ${pilotError.status}`
          : "کد: pilot_payment_web_unexpected_error"}
      </small>
      {needsAuthentication ? <Link href="/admin/login">ورود از مسیر OIDC</Link> : null}
    </section>
  );
}

export default async function AdminPaymentsPage({ searchParams }: { searchParams: SearchParams }) {
  const query = await searchParams;
  const page = parsePage(firstValue(query.page));
  const status = parseStatus(firstValue(query.status));

  let response: Awaited<ReturnType<typeof getPilotPayments>>;
  try {
    response = await getPilotPayments(page, PAGE_SIZE, status);
  } catch (error) {
    return (
      <section className="admin-payments" data-name="Admin / Pilot Payments">
        <header className="admin-payments__header">
          <span className="admin-payments__live">Pilot API • PostgreSQL</span>
          <div className="admin-payments__heading">
            <h1>پرداخت‌ها</h1>
            <p>صف read-only پرداخت‌های persist‌شده؛ بدون داده نمونه و بدون تغییر مستقیم مالی.</p>
          </div>
        </header>
        <FailureState error={error} />
      </section>
    );
  }

  const items = response.items;
  const attentionCount = items.filter(isAttention).length;
  const succeededCount = items.filter((item) => item.paymentStatus === "Succeeded").length;
  const blockedOrFailedCount = items.filter(
    (item) => item.paymentStatus === "Failed" || item.paymentStatus === "ArrearsBlocked",
  ).length;
  const hasNextPage = items.length === response.pageSize;

  return (
    <section className="admin-payments" data-name="Admin / Pilot Payments">
      <header className="admin-payments__header">
        <span className="admin-payments__live">Pilot API • PostgreSQL</span>
        <div className="admin-payments__heading">
          <h1>پرداخت‌ها</h1>
          <p>Payment instruction و آخرین evidence بیرونی مستقیماً از PostgreSQL خوانده می‌شوند.</p>
        </div>
      </header>

      <section className="admin-payments__metrics" aria-label="آمار صفحه جاری">
        <article className="admin-payments__metric">
          <span>پرداخت در این صفحه</span>
          <strong>{items.length.toLocaleString("fa-IR")}</strong>
          <small>فقط page جاری؛ بدون total ساختگی</small>
        </article>
        <article className="admin-payments__metric">
          <span>نیازمند توجه</span>
          <strong>{attentionCount.toLocaleString("fa-IR")}</strong>
          <small>Pending / Unknown / ReconciliationRequired</small>
        </article>
        <article className="admin-payments__metric">
          <span>موفق</span>
          <strong>{succeededCount.toLocaleString("fa-IR")}</strong>
          <small>PaymentInstruction persisted با status=Succeeded</small>
        </article>
        <article className="admin-payments__metric">
          <span>ناموفق یا مسدود</span>
          <strong>{blockedOrFailedCount.toLocaleString("fa-IR")}</strong>
          <small>Failed / ArrearsBlocked در همین page</small>
        </article>
      </section>

      <section className="admin-payments__controls" aria-label="فیلتر پرداخت‌ها">
        <nav className="admin-payments__filters" aria-label="فیلتر وضعیت">
          {statusFilters.map((filter) => {
            const active = (status ?? "") === filter.value;
            return (
              <Link
                key={filter.value || "all"}
                href={pageHref(1, filter.value || undefined)}
                className={`admin-payments__filter admin-payments__filter--${active ? "active" : "neutral"}`}
                aria-current={active ? "page" : undefined}
              >
                {filter.label}
              </Link>
            );
          })}
        </nav>
        <p className="admin-payments__source-note">
          {status ? `فیلتر API: ${status}` : "بدون فیلتر وضعیت"}
        </p>
      </section>

      <section className="admin-payments__table-card">
        <div className="admin-payments__table-wrap">
          <div className="admin-payments__table" role="table" aria-label="فهرست پرداخت‌های پایلوت">
            <div className="admin-payments__row admin-payments__row--head" role="row">
              <span role="columnheader">پرونده</span>
              <span role="columnheader">به‌روزرسانی</span>
              <span role="columnheader">Provider evidence</span>
              <span role="columnheader">وضعیت</span>
              <span role="columnheader">مبلغ</span>
              <span role="columnheader">نوع / ماه</span>
              <span role="columnheader">Payment instruction</span>
            </div>

            {items.map((item) => (
              <div className="admin-payments__row" role="row" key={item.paymentInstructionId}>
                <span role="cell">
                  <Link
                    className="admin-payments__action admin-payments__action--secondary"
                    href={`/admin/cases?contractId=${encodeURIComponent(item.contractId)}`}
                  >
                    مشاهده
                  </Link>
                </span>
                <span className="admin-payments__muted" role="cell">
                  {formatDateTime(item.updatedAtUtc)}
                </span>
                <span role="cell" title={item.externalReference ?? item.reasonCode ?? undefined}>
                  <span
                    className={`admin-payments__badge admin-payments__badge--${statusTone(
                      item.externalTransactionStatus,
                    )}`}
                  >
                    {item.externalTransactionStatus
                      ? `${item.provider ?? "provider"} • ${item.externalTransactionStatus}`
                      : "—"}
                  </span>
                </span>
                <span role="cell">
                  <span
                    className={`admin-payments__badge admin-payments__badge--${statusTone(
                      item.paymentStatus,
                    )}`}
                  >
                    {item.paymentStatus}
                  </span>
                </span>
                <strong role="cell">{formatRial(item.amountRial)}</strong>
                <span role="cell">
                  {item.kind} • ماه {item.contractMonthNumber.toLocaleString("fa-IR")}
                </span>
                <strong role="cell" title={item.paymentInstructionId}>
                  {item.paymentInstructionId}
                </strong>
              </div>
            ))}
          </div>
        </div>

        {items.length === 0 ? (
          <div className="admin-payments__empty-state admin-payments__empty-state--compact">
            <h2>پرداختی برای این فیلتر وجود ندارد</h2>
            <p>صف مستقیماً از PostgreSQL خوانده شده و داده fallback تولید نشده است.</p>
          </div>
        ) : null}

        <footer className="admin-payments__footer">
          <nav className="admin-payments__pagination" aria-label="صفحه‌بندی پرداخت‌ها">
            {page > 1 ? <Link href={pageHref(page - 1, status)}>قبلی</Link> : <span>قبلی</span>}
            <strong>{page.toLocaleString("fa-IR")}</strong>
            {hasNextPage ? <Link href={pageHref(page + 1, status)}>بعدی</Link> : <span>بعدی</span>}
          </nav>
          <p>
            page {response.page.toLocaleString("fa-IR")} • حداکثر {response.pageSize.toLocaleString("fa-IR")} پرداخت
          </p>
        </footer>
      </section>
    </section>
  );
}
