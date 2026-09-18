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
  const rendered =
    typeof value === "number"
      ? value.toLocaleString("fa-IR", { maximumFractionDigits: 20 })
      : value;
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
        <strong>عملیات پیشنهادی backend: {operation}</strong>
        <p>
          این فرم فقط retry همان service authoritative را درخواست می‌کند؛ status، مبلغ، grade یا provider result قابل ورود نیست.
        </p>
      </div>
      <label>
        <span>دلیل انسانی retry</span>
        <textarea
          name="reason"
          required
          maxLength={1000}
          rows={3}
          placeholder="مثال: پیگیری پس از timeout سرویس بیرونی و بررسی evidence موجود."
        />
      </label>
      <button className="admin-case-detail__action admin-case-detail__action--primary" type="submit">
        ثبت درخواست reconcile
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
        <h2>Evidence مالی</h2>
        <p>فقط داده persist‌شده backend؛ وب هیچ مبلغ یا نتیجه‌ای را محاسبه یا تولید نمی‌کند.</p>
      </div>
      <div className="admin-case-detail__detail-list">
        <div className="admin-case-detail__detail-row">
          <Badge value={item.creditEligibility?.status}>
            {item.creditEligibility?.status ?? "—"}
          </Badge>
          <div>
            <span>Credit eligibility</span>
            <strong>
              {item.creditEligibility
                ? `${formatRial(item.creditEligibility.maximumEligibleLoanRial)} • ${item.creditEligibility.provider}`
                : "—"}
            </strong>
          </div>
        </div>
        <div className="admin-case-detail__detail-row">
          <Badge value={item.bankApproval?.status}>{item.bankApproval?.status ?? "—"}</Badge>
          <div>
            <span>Bank approval</span>
            <strong>
              {item.bankApproval
                ? `${formatRial(item.bankApproval.approvedLoanRial)} • ${item.bankApproval.provider}`
                : "—"}
            </strong>
          </div>
        </div>
        <div className="admin-case-detail__detail-row">
          <Badge value={item.fundFreeze?.status}>{item.fundFreeze?.status ?? "—"}</Badge>
          <div>
            <span>Fund principal freeze</span>
            <strong>{item.fundFreeze?.fundReference ?? "—"}</strong>
          </div>
        </div>
        <div className="admin-case-detail__detail-row">
          <Badge value={item.tenantContributionFunding?.status}>
            {item.tenantContributionFunding?.status ?? "—"}
          </Badge>
          <div>
            <span>Tenant contribution</span>
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
            <p>{id}</p>
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
          <p>{item.creditApplicationId}</p>
        </div>
      </header>

      {reconcileResult ? (
        <div
          className={`admin-case-detail__notice admin-case-detail__notice--${reconcileResult === "ok" ? "success" : "warning"}`}
          role="status"
        >
          {reconcileResult === "ok"
            ? "درخواست reconcile توسط API پذیرفته شد و داده صفحه دوباره از backend خوانده شده است."
            : `درخواست reconcile انجام نشد. کد: ${reconcileCode ?? "pilot_reconcile_failed"}`}
        </div>
      ) : null}

      <section className="admin-case-detail__panel admin-case-detail__summary">
        <div className="admin-case-detail__section-heading">
          <h2>خلاصه واقعی پرونده</h2>
          <p>شناسه و stateها مستقیماً از protected /api/v1/pilot آمده‌اند.</p>
        </div>
        <div className="admin-case-detail__summary-grid">
          <article>
            <span>Application status</span>
            <strong>{item.applicationStatus}</strong>
            <small>{formatDateTime(item.updatedAtUtc)}</small>
          </article>
          <article>
            <span>Contract status</span>
            <strong>{item.contractStatus ?? "—"}</strong>
            <small>{item.contractId ?? "بدون قرارداد"}</small>
          </article>
          <article>
            <span>Applicant user</span>
            <strong title={item.applicantUserId}>{item.applicantUserId}</strong>
            <small>OIDC subject کاربر عمداً expose نمی‌شود</small>
          </article>
          <article>
            <span>Suggested operation</span>
            <strong>{item.suggestedOperation ?? "—"}</strong>
            <small>پیشنهاد backend؛ نه تغییر مستقیم state</small>
          </article>
        </div>
      </section>

      <div className="admin-case-detail__columns">
        <FinancialEvidence item={item} />

        <section className="admin-case-detail__panel admin-case-detail__detail-panel">
          <div className="admin-case-detail__section-heading">
            <h2>Binding پرونده</h2>
            <p>شناسه‌های trusted persisted برای application، plan، contract، owner و property.</p>
          </div>
          <dl className="admin-case-detail__facts">
            <div>
              <dt>Plan</dt>
              <dd>
                {item.bankLoanPlanId
                  ? `${item.bankLoanPlanId} @ ${item.bankLoanPlanVersion ?? "—"}`
                  : "—"}
              </dd>
            </div>
            <div>
              <dt>Contract</dt>
              <dd>{item.contractId ?? "—"}</dd>
            </div>
            <div>
              <dt>Owner user</dt>
              <dd>{item.ownerUserId ?? "—"}</dd>
            </div>
            <div>
              <dt>Property</dt>
              <dd>{item.propertyId ?? "—"}</dd>
            </div>
          </dl>
        </section>
      </div>

      {item.fundingAllocation ? (
        <section className="admin-case-detail__panel">
          <div className="admin-case-detail__section-heading">
            <h2>Funding allocation</h2>
            <p>نمایش read-only از allocation persisted؛ واحد همه مبالغ ریال است.</p>
          </div>
          <dl className="admin-case-detail__facts admin-case-detail__facts--grid">
            <div>
              <dt>Full deposit equivalent</dt>
              <dd>{formatRial(item.fundingAllocation.fullDepositEquivalentRial)}</dd>
            </div>
            <div>
              <dt>Maximum eligible loan</dt>
              <dd>{formatRial(item.fundingAllocation.maximumEligibleLoanRial)}</dd>
            </div>
            <div>
              <dt>Bank approved loan</dt>
              <dd>{formatRial(item.fundingAllocation.bankApprovedLoanRial)}</dd>
            </div>
            <div>
              <dt>Tenant contribution</dt>
              <dd>{formatRial(item.fundingAllocation.tenantContributionRial)}</dd>
            </div>
          </dl>
        </section>
      ) : null}

      <div className="admin-case-detail__columns admin-case-detail__columns--lower">
        <section className="admin-case-detail__panel">
          <div className="admin-case-detail__section-heading">
            <h2>Verification requests</h2>
            <p>provider evidence واقعی به ترتیب backend.</p>
          </div>
          {item.verificationRequests.length ? (
            <div className="admin-case-detail__timeline">
              {item.verificationRequests.map((verification) => (
                <div key={verification.id}>
                  <time>{formatDateTime(verification.updatedAtUtc)}</time>
                  <p>
                    <strong>
                      {verification.type} • {verification.status}
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
            <h2>آخرین audit eventها</h2>
            <p>رویدادهای persist‌شده CreditApplication؛ جدیدترین‌ها در این نما.</p>
          </div>
          {item.recentAuditEvents.length ? (
            <div className="admin-case-detail__timeline">
              {item.recentAuditEvents.map((event) => (
                <div key={event.id}>
                  <time>{formatDateTime(event.occurredAtUtc)}</time>
                  <p>
                    <strong>{event.action}</strong>
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
          <Badge value={item.applicationStatus}>در state فعلی عملیات پیشنهادی وجود ندارد</Badge>
        )}
      </section>
    </section>
  );
}
