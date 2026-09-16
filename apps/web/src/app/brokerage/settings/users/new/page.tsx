import Link from "next/link";
import BrokerageSettingsPage from "../../page";

export default function BrokerageSettingsAddUserPage() {
  return (
    <div className="brokerage-add-user" data-node-id="399:2" data-name="Brokerage / Settings / Add User">
      <BrokerageSettingsPage />

      <div className="brokerage-add-user__backdrop" aria-hidden="true" />

      <section
        className="brokerage-add-user__modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="brokerage-add-user-title"
      >
        <header className="brokerage-add-user__header">
          <Link
            className="brokerage-add-user__close"
            href="/brokerage/settings"
            aria-label="بستن پنجره افزودن کاربر"
          >
            ×
          </Link>

          <div className="brokerage-add-user__header-copy">
            <h1 id="brokerage-add-user-title">افزودن کاربر</h1>
            <p>تعریف دسترسی برای کاربر جدید پنل کارگزاری</p>
          </div>
        </header>

        <form className="brokerage-add-user__form">
          <label className="brokerage-add-user__field">
            <span>نام و نام خانوادگی</span>
            <input type="text" name="fullName" placeholder="مثلاً نیما احمدی" autoComplete="name" />
          </label>

          <label className="brokerage-add-user__field">
            <span>شماره موبایل</span>
            <input
              type="tel"
              name="mobile"
              placeholder="۰۹۱۲۱۲۳۴۵۶۷"
              inputMode="tel"
              autoComplete="tel"
              dir="rtl"
            />
          </label>

          <label className="brokerage-add-user__field">
            <span>نقش</span>
            <select name="role" defaultValue="operations-specialist">
              <option value="panel-manager">مدیر پنل</option>
              <option value="finance-operations">عملیات مالی</option>
              <option value="operations-specialist">کارشناس عملیات</option>
              <option value="observer">ناظر</option>
            </select>
          </label>

          <label className="brokerage-add-user__field">
            <span>سطح دسترسی</span>
            <select name="access" defaultValue="cases-resources">
              <option value="full">کامل</option>
              <option value="finance-transfer">مالی و انتقال</option>
              <option value="cases-resources">پرونده‌ها و منابع</option>
              <option value="read-only">فقط مشاهده</option>
            </select>
          </label>

          <p className="brokerage-add-user__note">
            دسترسی‌ها براساس نقش انتخابی اعمال می‌شوند و بعداً از بخش مدیریت کاربر قابل تغییرند.
          </p>

          <div className="brokerage-add-user__actions">
            <Link className="brokerage-add-user__button brokerage-add-user__button--secondary" href="/brokerage/settings">
              انصراف
            </Link>
            <button className="brokerage-add-user__button brokerage-add-user__button--primary" type="button">
              افزودن کاربر
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
