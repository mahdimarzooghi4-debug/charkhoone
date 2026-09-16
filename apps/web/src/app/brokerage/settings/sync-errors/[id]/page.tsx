import Link from "next/link";
import BrokerageSettingsPage from "../../page";

const syncErrorDetails = {
  "TRX-A4196": {
    id: "TRX-A4196",
    type: "وجه مستأجر",
    issue: "شناسه پرونده ارسال‌شده توسط سیستم کارگزاری در چارخونه معتبر نیست.",
    amount: "۱۵۰٬۰۰۰٬۰۰۰ تومان",
    receivedAt: "۱۴۰۵/۰۶/۰۸ — ۱۴:۰۵",
    source: "سیستم داخلی کارگزاری",
    receivedCaseId: "۱۴۰۵-۸۳۲۱-X",
    referenceCaseId: "یافت نشد",
    matchStatus: "ناموفق",
    diagnosis:
      "شناسه پرونده با الگوی معتبر چارخونه تطبیق ندارد. این رکورد تا زمان دریافت شناسه صحیح در عملیات مالی قطعی نمی‌شود.",
  },
  "TRX-A4088": {
    id: "TRX-A4088",
    type: "سهم چارخونه از درآمد",
    issue: "مبلغ دریافت‌شده با دوره مالی چارخونه تطبیق کامل ندارد.",
    amount: "—",
    receivedAt: "—",
    source: "سیستم داخلی کارگزاری",
    receivedCaseId: "—",
    referenceCaseId: "—",
    matchStatus: "ناموفق",
    diagnosis: "رکورد برای تطبیق با دوره مالی مرجع نیازمند بررسی اپراتور است.",
  },
  "TRX-A3971": {
    id: "TRX-A3971",
    type: "سود واقعی دوره",
    issue: "دوره ارسال‌شده توسط سیستم کارگزاری در چارخونه یافت نشد.",
    amount: "—",
    receivedAt: "—",
    source: "سیستم داخلی کارگزاری",
    receivedCaseId: "—",
    referenceCaseId: "یافت نشد",
    matchStatus: "ناموفق",
    diagnosis: "دوره مالی مرجع برای این رکورد پیدا نشد و رکورد تا همگام‌سازی صحیح قطعی نمی‌شود.",
  },
} as const;

type SyncErrorId = keyof typeof syncErrorDetails;

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function BrokerageSettingsSyncErrorDetailPage({ params }: PageProps) {
  const { id } = await params;
  const error = syncErrorDetails[id as SyncErrorId] ?? syncErrorDetails["TRX-A4196"];

  return (
    <div
      className="brokerage-sync-error-detail"
      data-node-id="413:2"
      data-name="Brokerage / Settings / Sync Error Detail"
    >
      <BrokerageSettingsPage />

      <div className="brokerage-sync-error-detail__backdrop" aria-hidden="true" />

      <section
        className="brokerage-sync-error-detail__modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="brokerage-sync-error-detail-title"
      >
        <header className="brokerage-sync-error-detail__header">
          <Link
            className="brokerage-sync-error-detail__close"
            href="/brokerage/settings/sync-errors"
            aria-label="بستن جزئیات خطای تطبیق"
          >
            ×
          </Link>

          <div className="brokerage-sync-error-detail__header-copy">
            <h1 id="brokerage-sync-error-detail-title">بررسی خطای تطبیق</h1>
            <p>جزئیات داده دریافتی از سیستم داخلی کارگزاری و نتیجه تطبیق با چارخونه</p>
          </div>
        </header>

        <section className="brokerage-sync-error-detail__summary">
          <span className="brokerage-sync-error-detail__status">نیازمند بررسی</span>
          <div>
            <strong>{error.id} — {error.type}</strong>
            <p>{error.issue}</p>
          </div>
        </section>

        <section className="brokerage-sync-error-detail__record-card">
          <h2>خلاصه رکورد</h2>
          <div className="brokerage-sync-error-detail__record-grid">
            <article><span>نوع داده</span><strong>{error.type}</strong></article>
            <article><span>مبلغ</span><strong>{error.amount}</strong></article>
            <article><span>زمان دریافت</span><strong>{error.receivedAt}</strong></article>
            <article><span>منبع</span><strong>{error.source}</strong></article>
          </div>
        </section>

        <section className="brokerage-sync-error-detail__compare-section">
          <h2>مقایسه داده دریافتی با مرجع چارخونه</h2>
          <div className="brokerage-sync-error-detail__compare-grid">
            <article className="brokerage-sync-error-detail__compare-card">
              <h3>مرجع چارخونه</h3>
              <div><span>شناسه پرونده</span><strong>{error.referenceCaseId}</strong></div>
              <div><span>وضعیت تطبیق</span><strong>{error.matchStatus}</strong></div>
            </article>

            <article className="brokerage-sync-error-detail__compare-card">
              <h3>داده دریافتی</h3>
              <div><span>شناسه پرونده</span><strong>{error.receivedCaseId}</strong></div>
              <div><span>شناسه تراکنش</span><strong>{error.id}</strong></div>
            </article>
          </div>
        </section>

        <section className="brokerage-sync-error-detail__diagnosis">
          <h2>نتیجه بررسی سیستم</h2>
          <p>{error.diagnosis}</p>
          <p className="brokerage-sync-error-detail__diagnosis-warning">
            اصلاح مبلغ یا شناسه از این صفحه مجاز نیست؛ داده باید در سیستم داخلی کارگزاری اصلاح و دوباره همگام شود.
          </p>
        </section>

        <footer className="brokerage-sync-error-detail__actions">
          <Link className="brokerage-sync-error-detail__button brokerage-sync-error-detail__button--secondary" href="/brokerage/settings/sync-errors">
            بازگشت به خطاها
          </Link>
          <button className="brokerage-sync-error-detail__button brokerage-sync-error-detail__button--primary" type="button">
            همگام‌سازی مجدد
          </button>
        </footer>
      </section>
    </div>
  );
}
