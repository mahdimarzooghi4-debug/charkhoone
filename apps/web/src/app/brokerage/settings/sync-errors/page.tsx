import Link from "next/link";
import BrokerageSettingsPage from "../page";

const syncErrors = [
  {
    id: "TRX-۸۴۱۹۶",
    detailId: "TRX-A4196",
    type: "وجه مستأجر",
    issue: "شناسه پرونده نامعتبر",
  },
  {
    id: "TRX-۸۴۰۸۸",
    detailId: "TRX-A4088",
    type: "سهم چارخونه از درآمد",
    issue: "مبلغ با دوره مالی نمی‌خواند",
  },
  {
    id: "TRX-۸۳۹۷۱",
    detailId: "TRX-A3971",
    type: "سود واقعی دوره",
    issue: "دوره در چارخونه یافت نشد",
  },
] as const;

export default function BrokerageSettingsSyncErrorsPage() {
  return (
    <div className="brokerage-sync-errors" data-node-id="409:2" data-name="Brokerage / Settings / Sync Errors">
      <BrokerageSettingsPage />

      <div className="brokerage-sync-errors__backdrop" aria-hidden="true" />

      <section
        className="brokerage-sync-errors__modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="brokerage-sync-errors-title"
      >
        <header className="brokerage-sync-errors__header">
          <Link
            className="brokerage-sync-errors__close"
            href="/brokerage/settings"
            aria-label="بستن خطاهای همگام‌سازی"
          >
            ×
          </Link>

          <div className="brokerage-sync-errors__header-copy">
            <h1 id="brokerage-sync-errors-title">خطاهای همگام‌سازی</h1>
            <p>
              رکوردهایی که از سیستم داخلی کارگزاری دریافت شده‌اند اما با داده‌های چارخونه تطبیق کامل ندارند.
            </p>
          </div>
        </header>

        <div className="brokerage-sync-errors__summary">
          <p>تا زمان تطبیق، این رکوردها وارد محاسبات مالی قطعی نمی‌شوند.</p>
          <strong>۳ رکورد نیازمند بررسی</strong>
        </div>

        <div className="brokerage-sync-errors-table" role="table" aria-label="خطاهای همگام‌سازی کارگزاری">
          <div className="brokerage-sync-errors-table__row brokerage-sync-errors-table__head" role="row">
            <span role="columnheader">اقدام</span>
            <span role="columnheader">وضعیت</span>
            <span role="columnheader">مشکل</span>
            <span role="columnheader">نوع داده</span>
            <span role="columnheader">شناسه</span>
          </div>

          {syncErrors.map((error) => (
            <div className="brokerage-sync-errors-table__row" role="row" key={error.id}>
              <span role="cell">
                <Link
                  className="brokerage-sync-errors-table__review"
                  href={`/brokerage/settings/sync-errors/${error.detailId}`}
                >
                  بررسی
                </Link>
              </span>
              <span role="cell">
                <span className="brokerage-sync-errors-table__status">نیازمند بررسی</span>
              </span>
              <span role="cell">{error.issue}</span>
              <span role="cell">{error.type}</span>
              <strong role="cell">{error.id}</strong>
            </div>
          ))}
        </div>

        <p className="brokerage-sync-errors__policy-note">
          اصلاح مبلغ به‌صورت دستی مجاز نیست؛ بررسی باید با داده مرجع سیستم داخلی کارگزاری انجام شود.
        </p>

        <div className="brokerage-sync-errors__actions">
          <Link className="brokerage-sync-errors__button brokerage-sync-errors__button--secondary" href="/brokerage/settings">
            بستن
          </Link>
          <button className="brokerage-sync-errors__button brokerage-sync-errors__button--primary" type="button">
            همگام‌سازی مجدد
          </button>
        </div>
      </section>
    </div>
  );
}
