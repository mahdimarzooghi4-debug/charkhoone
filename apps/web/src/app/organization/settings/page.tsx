import Link from "next/link";

const organizationInfo = [
  { label: "نام سازمان", value: "سازمان نمونه" },
  { label: "شناسه سازمانی", value: "ORG-۱۴۰۵-۰۲۸" },
  { label: "نام مسئول پنل", value: "مریم محمدی" },
  { label: "سمت مسئول", value: "مدیر منابع انسانی" },
  { label: "شماره تماس", value: "۰۹۱۲۱۲۳۴۵۶۷" },
  { label: "ایمیل", value: "hr@example.com" },
] as const;

export default function OrganizationSettingsPage() {
  return (
    <section className="org-settings" data-node-id="528:29">
      <header className="org-settings__header">
        <h1>تنظیمات</h1>
        <p>مدیریت اطلاعات سازمان، کاربران، اتصال منابع انسانی و طرح‌های بانکی.</p>
      </header>

      <article className="org-settings-card">
        <h2>اطلاعات سازمان</h2>
        <div className="org-settings-card__divider" />
        <div className="org-settings-info-grid">
          {organizationInfo.map((item) => (
            <div className="org-settings-info" key={item.label}>
              <span>{item.label}</span>
              <strong>{item.value}</strong>
            </div>
          ))}
        </div>
        <div className="org-settings-actions">
          <Link className="org-settings-link org-settings-link--primary" href="/organization/settings/edit">
            ویرایش اطلاعات
          </Link>
        </div>
      </article>

      <div className="org-settings__secondary">
        <article className="org-settings-small-card">
          <h2>مدیریت کاربران</h2>
          <p>کاربران و سطح دسترسی به پنل سازمانی را مدیریت کنید.</p>
          <div className="org-settings-actions">
            <Link className="org-settings-link org-settings-link--primary" href="/organization/users">
              مدیریت کاربران
            </Link>
          </div>
        </article>

        <article className="org-settings-small-card">
          <h2>اتصال منابع انسانی</h2>
          <p>اتصال API منابع انسانی و همگام‌سازی پرسنل را مدیریت کنید.</p>
          <div className="org-settings-actions">
            <Link className="org-settings-link" href="/organization/settings/hr-api">
              تنظیم اتصال API
            </Link>
            <Link className="org-settings-link org-settings-link--primary" href="/organization/settings/hr-api/sync-success">
              همگام‌سازی الآن
            </Link>
          </div>
        </article>
      </div>

      <article className="org-settings-small-card">
        <h2>طرح‌های بانکی</h2>
        <p>طرح‌های بانکی مرتبط با سازمان را مشاهده و بررسی کنید.</p>
        <div className="org-settings-actions">
          <Link className="org-settings-link" href="/organization/bank-plans">
            مشاهده طرح‌های بانکی
          </Link>
        </div>
      </article>
    </section>
  );
}
