import Link from "next/link";
import {
  getPilotCase,
  PilotApiError,
  type PilotCaseDetail,
  type PilotReconcileOperation,
} from "@/lib/pilotOperations";

type PageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function firstValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

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

const verificationTypeLabels: Record<string, string> = {
  Identity: "احراز هویت",
  PropertyContract: "قرارداد ملک",
  CreditEligibility: "اعتبارسنجی",
  BankFunding: "تأمین مالی بانکی",
  TenantContributionFunding: "تأمین سهم مستأجر",
};

const auditActionLabels: Record<string, string> = {
  CaseViewed: "مشاهده پرونده",
  StateUpdated: "به‌روزرسانی وضعیت",
};

function toFaDigits(value: string) {
  return value
    .replace(/\d/g, (digit) => "۰۱۲۳۴۵۶۷۸۹"[Number(digit)])
    .replaceAll(",", "٬")
    .replaceAll(".", "٫");
}

function formatStatus(value: string | null | undefined) {
  if (!value) return "—";
  return statusLabels[value] ?? value;
}

function formatOperation(value: string | null | undefined) {
  if (!value) return "—";
  return operationLabels[value] ?? value;
}

function formatIdentifier(value: string | null | undefined) {
  if (!value) return "—";
  return toFaDigits(
    value
      .replace(/^contract-/, "قرارداد ")
      .replace(/^property-/, "ملک ")
      .replace(/^owner-/, "مالک ")
      .replace(/^plan-/, "طرح ")
      .replace(/^fund-/, "صندوق ")
      .replace(/^preview-/, "آزمایشی "),
  );
}

function formatDateTime(value: string | null | undefined) {
  if (!value) return "—";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;

  return new Intl.DateTimeFormat("fa-IR-u-ca-persian", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "UTC",
  }).format(parsed);
}

function formatRial(value: string | number | null | undefined) {
  if (value === null || value === undefined) return "—";
  const numeric = typeof value === "number" ? value : Number(value);
  const rendered = Number.isFinite(numeric)
    ? numeric.toLocaleString("fa-IR", { maximumFractionDigits: 20 })
    : toFaDigits(String(value));
  return `${rendered} ریال`;
}

function tone(value: string | null | undefined): "success" | "warning" | "neutral" | "danger" {
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

function Badge({
  children,
  value,
}: {
  children: React.ReactNode;
  value?: string | null;
}) {
  return (
    <span className={`admin-case-detail__badge admin-case-detail__badge--${tone(value)}`}>
      {children}
    </span>
  );
}

function ReconcileForm({
  applicationId,
  operation,
}: {
  applicationId: string;
  operation: PilotReconcileOperation;
}) {
  return (
    <form
      className="admin-case-detail__reconcile"
      action={`/admin/api/pilot/cases/${applicationId}/reconcile`}
      method="post"
    >
      <input type="hidden" name="operation" value={operation} />
      <div>
        <strong>عملیات پیشنهادی سامانه: {formatOperation(operation)}</strong>
        <p>
          این فرم فقط تلاش مجدد همان سرویس اصلی را درخواست می‌کند؛ وضعیت، مبلغ، رتبه یا نتیجه سرویس قابل ورود نیست.
        </p>
      </div>
      <label>
        <span>دلیل پیگیری</span>
        <textarea
          name="reason"
          required
          maxLength={1000}
          rows={3}
          placeholder="مثال: پیگیری پس از timeout سرویس بیرونی و بررسی evidence موجود."
        />
      </label>
      <button className="admin-case-detail__action admin-case-detail__action--primary" type="submit">
        ثبت درخواست پیگیری
      </button>
    </form>
  );
}

function FailureState({ error }: { error: unknown }) {
  const pilotError = error instanceof PilotApiError ? error : null;
  return (
    <section className="admin-case-detail__panel admin-case-detail__failure" role="alert">
      <h2>جزئیات واقعی پرونده در دسترس نیست</h2>
      <p>
        {pilotError?.status === 401 || pilotError?.status === 403
          ? "bearer معتبر OIDC یا allowlist اپراتور برای Pilot API لازم است. پنل هیچ login محلی یا داده fallback ندارد."
          : pilotError?.status === 404
            ? "این applicationId در PostgreSQL پیدا نشد."
            : "اتصال پنل به Pilot API برقرار نیست یا backend پاسخ معتبر نداده است."}
      </p>
      <small>
        {pilotError ? `کد: ${pilotError.code} • HTTP ${pilotError.status}` : "کد: pilot_web_unexpected_error"}
      </small>
      <Link className="admin-case-detail__back" href="/admin/cases">
        بازگشت به پرونده‌ها
      </Link>
    </section>
  );
}

function FinancialEvidence({ item }: { item: PilotCaseDetail }) {
  return (
    <section className="admin-case-detail__panel admin-case-detail__detail-panel">
      <div className="admin-case-detail__section-heading">
        <h2>شواهد مالی</h2>
        <p>فقط داده persist‌شده backend؛ وب هیچ مبلغ یا نتیجه‌ای را محاسبه یا تولید نمی‌کند.</p>
      </div>
      <div className="admin-case-detail__detail-list">
        <div className="admin-case-detail__detail-row">
          <Badge value={item.creditEligibility?.status}>
            {formatStatus(item.creditEligibility?.status)}
          </Badge>
          <div>
            <span>اعتبارسنجی</span>
            <strong>
              {item.creditEligibility
                ? `${formatRial(item.creditEligibility.maximumEligibleLoanRial)} • ${item.creditEligibility.provider}`
                : "—"}
            </strong>
          </div>
        </div>
        <div className="admin-case-detail__detail-row">
          <Badge value={item.bankApproval?.status}>{formatStatus(item.bankApproval?.status)}</Badge>
          <div>
            <span>تأیید بانک</span>
            <strong>
              {item.bankApproval
                ? `${formatRial(item.bankApproval.approvedLoanRial)} • ${item.bankApproval.provider}`
                : "—"}
            </strong>
          </div>
        </div>
        <div className="admin-case-detail__detail-row">
          <Badge value={item.fundFreeze?.status}>{formatStatus(item.fundFreeze?.status)}</Badge>
          <div>
            <span>تثبیت اصل سرمایه</span>
            <strong>{item.fundFreeze?.fundReference ?? "—"}</strong>
          </div>
        </div>
        <div className="admin-case-detail__detail-row">
          <Badge value={item.tenantContributionFunding?.status}>
            {formatStatus(item.tenantContributionFunding?.status)}
          </Badge>
          <div>
            <span>سهم مستأجر</span>
            <strong>
              {item.tenantContributionFunding
                ? `${formatRial(item.tenantContributionFunding.amountRial)} • ${item.tenantContributionFunding.currency}`
                : "—"}
            </strong>
          </div>
        </div>
      </div>
    </section>
  );
}

export default async function AdminCaseDetailPage({ params, searchParams }: PageProps) {
  const { id } = await params;
  const query = await searchParams;

  let item: PilotCaseDetail;
  try {
    item = await getPilotCase(id);
  } catch (error) {
    return (
      <section className="admin-case-detail" data-name="Admin / Pilot Case Detail">
        <header className="admin-case-detail__header">
          <Link className="admin-case-detail__back" href="/admin/cases">
            بازگشت به پرونده‌ها
          </Link>
          <div className="admin-case-detail__heading">
            <h1>جزئیات پرونده پایلوت</h1>
            <p>{toFaDigits(id)}</p>
          </div>
        </header>
        <FailureState error={error} />
      </section>
    );
  }

  const reconcileResult = firstValue(query.reconcile);
  const reconcileCode = firstValue(query.code);

  return (
    <section className="admin-case-detail" data-name="Admin / Pilot Case Detail">
      <header className="admin-case-detail__header">
        <Link className="admin-case-detail__back" href="/admin/cases">
          بازگشت به پرونده‌ها
        </Link>
        <div className="admin-case-detail__heading">
          <h1>جزئیات پرونده پایلوت</h1>
          <p>{toFaDigits(item.creditApplicationId)}</p>
        </div>
      </header>

      {reconcileResult ? (
        <div
          className={`admin-case-detail__notice admin-case-detail__notice--${reconcileResult === "ok" ? "success" : "warning"}`}
          role="status"
        >
          {reconcileResult === "ok"
            ? "درخواست پیگیری توسط API پذیرفته شد و داده صفحه دوباره از backend خوانده شده است."
            : `درخواست پیگیری انجام نشد. کد: ${reconcileCode ?? "pilot_reconcile_failed"}`}
        </div>
      ) : null}

      <section className="admin-case-detail__panel admin-case-detail__summary">
        <div className="admin-case-detail__section-heading">
          <h2>خلاصه واقعی پرونده</h2>
          <p>شناسه و stateها مستقیماً از protected /api/v1/pilot آمده‌اند.</p>
        </div>
        <div className="admin-case-detail__summary-grid">
          <article>
            <span>وضعیت پرونده</span>
            <strong>{formatStatus(item.applicationStatus)}</strong>
            <small>{formatDateTime(item.updatedAtUtc)}</small>
          </article>
          <article>
            <span>وضعیت قرارداد</span>
            <strong>{formatStatus(item.contractStatus)}</strong>
            <small>{item.contractId ? formatIdentifier(item.contractId) : "بدون قرارداد"}</small>
          </article>
          <article>
            <span>متقاضی</span>
            <strong title={item.applicantUserId}>{item.applicantUserId}</strong>
            <small>OIDC subject کاربر عمداً expose نمی‌شود</small>
          </article>
          <article>
            <span>عملیات پیشنهادی</span>
            <strong>{formatOperation(item.suggestedOperation)}</strong>
            <small>پیشنهاد backend؛ نه تغییر مستقیم state</small>
          </article>
        </div>
      </section>

      <div className="admin-case-detail__columns">
        <FinancialEvidence item={item} />

        <section className="admin-case-detail__panel admin-case-detail__detail-panel">
          <div className="admin-case-detail__section-heading">
            <h2>شناسه‌های مرتبط پرونده</h2>
            <p>شناسه‌های trusted persisted برای application، plan، contract، owner و property.</p>
          </div>
          <dl className="admin-case-detail__facts">
            <div>
              <dt>طرح</dt>
              <dd>
                {item.bankLoanPlanId
                  ? `${formatIdentifier(item.bankLoanPlanId)} • نسخه ${toFaDigits(item.bankLoanPlanVersion ?? "—")}`
                  : "—"}
              </dd>
            </div>
            <div>
              <dt>قرارداد</dt>
              <dd>{formatIdentifier(item.contractId)}</dd>
            </div>
            <div>
              <dt>مالک</dt>
              <dd>{formatIdentifier(item.ownerUserId)}</dd>
            </div>
            <div>
              <dt>ملک</dt>
              <dd>{formatIdentifier(item.propertyId)}</dd>
            </div>
          </dl>
        </section>
      </div>

      {item.fundingAllocation ? (
        <section className="admin-case-detail__panel">
          <div className="admin-case-detail__section-heading">
            <h2>تخصیص تأمین مالی</h2>
            <p>نمایش read-only از allocation persisted؛ واحد همه مبالغ ریال است.</p>
          </div>
          <dl className="admin-case-detail__facts admin-case-detail__facts--grid">
            <div>
              <dt>معادل رهن کامل</dt>
              <dd>{formatRial(item.fundingAllocation.fullDepositEquivalentRial)}</dd>
            </div>
            <div>
              <dt>حداکثر تسهیلات مجاز</dt>
              <dd>{formatRial(item.fundingAllocation.maximumEligibleLoanRial)}</dd>
            </div>
            <div>
              <dt>تسهیلات تأییدشده بانک</dt>
              <dd>{formatRial(item.fundingAllocation.bankApprovedLoanRial)}</dd>
            </div>
            <div>
              <dt>سهم مستأجر</dt>
              <dd>{formatRial(item.fundingAllocation.tenantContributionRial)}</dd>
            </div>
          </dl>
        </section>
      ) : null}

      <div className="admin-case-detail__columns admin-case-detail__columns--lower">
        <section className="admin-case-detail__panel">
          <div className="admin-case-detail__section-heading">
            <h2>بررسی‌های بیرونی</h2>
            <p>provider evidence واقعی به ترتیب backend.</p>
          </div>
          {item.verificationRequests.length ? (
            <div className="admin-case-detail__timeline">
              {item.verificationRequests.map((verification) => (
                <div key={verification.id}>
                  <time>{formatDateTime(verification.updatedAtUtc)}</time>
                  <p>
                    <strong>
                      {verificationTypeLabels[verification.type] ?? verification.type} • {formatStatus(verification.status)}
                    </strong>
                    <span>
                      {verification.provider}
                      {verification.externalReference
                        ? ` • ${verification.externalReference}`
                        : ""}
                      {verification.reasonCode ? ` • ${verification.reasonCode}` : ""}
                    </span>
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <div className="admin-case-detail__timeline admin-case-detail__timeline--empty">
              <p>verification persisted برای این پرونده وجود ندارد.</p>
            </div>
          )}
        </section>

        <section className="admin-case-detail__panel">
          <div className="admin-case-detail__section-heading">
            <h2>آخرین رویدادهای سیستمی</h2>
            <p>رویدادهای persist‌شده CreditApplication؛ جدیدترین‌ها در این نما.</p>
          </div>
          {item.recentAuditEvents.length ? (
            <div className="admin-case-detail__timeline">
              {item.recentAuditEvents.map((event) => (
                <div key={event.id}>
                  <time>{formatDateTime(event.occurredAtUtc)}</time>
                  <p>
                    <strong>{auditActionLabels[event.action] ?? event.action}</strong>
                    <span>
                      {event.actorId} • {event.reason}
                    </span>
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <div className="admin-case-detail__timeline admin-case-detail__timeline--empty">
              <p>audit event قابل نمایش وجود ندارد.</p>
            </div>
          )}
        </section>
      </div>

      <section className="admin-case-detail__management" aria-label="reconcile پرونده">
        <div className="admin-case-detail__management-copy">
          <h2>کنترل محدود اپراتور</h2>
          <p>
            پنل فقط named reconcile را به service authoritative می‌فرستد. هیچ control برای set کردن status، مبلغ، grade یا ledger وجود ندارد.
          </p>
        </div>
        {item.suggestedOperation ? (
          <ReconcileForm
            applicationId={item.creditApplicationId}
            operation={item.suggestedOperation}
          />
        ) : (
          <Badge value={item.applicationStatus}>در وضعیت فعلی عملیات پیشنهادی وجود ندارد</Badge>
        )}
      </section>
    </section>
  );
}
