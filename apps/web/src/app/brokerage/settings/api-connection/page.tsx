import Link from "next/link";
import BrokerageSettingsPage from "../page";

export default function BrokerageSettingsApiConnectionPage() {
  return (
    <div
      className="brokerage-api-connection"
      data-node-id="427:2"
      data-name="Brokerage / Settings / API Connection"
    >
      <BrokerageSettingsPage />

      <div className="brokerage-api-connection__backdrop" aria-hidden="true" />

      <section
        className="brokerage-api-connection__modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="brokerage-api-connection-title"
      >
        <header className="brokerage-api-connection__header">
          <Link
            className="brokerage-api-connection__close"
            href="/brokerage/settings"
            aria-label="بستن اتصال API"
          >
            ×
          </Link>

          <div className="brokerage-api-connection__header-copy">
            <h1 id="brokerage-api-connection-title">اتصال API کارگزاری</h1>
            <p>آدرس سرویس و اطلاعات دسترسی سیستم داخلی کارگزاری را وارد کنید.</p>
          </div>
        </header>

        <div className="brokerage-api-connection__status" role="status">
          <strong>اتصال فعلی فعال است</strong>
          <span>API سیستم کارگزاری</span>
        </div>

        <form className="brokerage-api-connection__form">
          <label className="brokerage-api-connection__field">
            <span>آدرس API</span>
            <input
              dir="ltr"
              type="url"
              name="apiUrl"
              defaultValue="https://api.brokerage.ir/v1"
              autoComplete="url"
            />
          </label>

          <label className="brokerage-api-connection__field">
            <span>کلید API</span>
            <input
              dir="ltr"
              type="text"
              name="apiKey"
              defaultValue="brk_live_••••••••••"
              autoComplete="off"
              spellCheck={false}
            />
          </label>

          <label className="brokerage-api-connection__field">
            <span>توکن / Secret</span>
            <input
              dir="ltr"
              type="text"
              name="apiSecret"
              defaultValue="••••••••••••••••"
              autoComplete="off"
              spellCheck={false}
            />
          </label>

          <p className="brokerage-api-connection__security-note">
            اطلاعات محرمانه بعد از ذخیره کامل نمایش داده نمی‌شوند.
          </p>

          <div className="brokerage-api-connection__actions">
            <Link
              className="brokerage-api-connection__button brokerage-api-connection__button--secondary brokerage-api-connection__button--cancel"
              href="/brokerage/settings"
            >
              انصراف
            </Link>
            <button
              className="brokerage-api-connection__button brokerage-api-connection__button--secondary brokerage-api-connection__button--test"
              type="button"
            >
              تست اتصال
            </button>
            <button
              className="brokerage-api-connection__button brokerage-api-connection__button--secondary brokerage-api-connection__button--save"
              type="button"
            >
              ذخیره و اتصال
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
