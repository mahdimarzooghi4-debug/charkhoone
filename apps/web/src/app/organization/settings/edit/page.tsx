import Link from "next/link";

export default function OrganizationSettingsEditPage() {
  return (
    <section className="org-settings-edit" data-node-id="583:259">
      <header className="org-settings-edit__header">
        <Link className="org-settings-back" href="/organization/settings">بازگشت به تنظیمات</Link>
        <div>
          <h1>ویرایش اطلاعات سازمان</h1>
          <p>اطلاعات اصلی سازمان و اطلاعات تماس را ویرایش کنید.</p>
        </div>
      </header>

      <form className="org-settings-edit__card">
        <h2>اطلاعات سازمان</h2>
        <div className="org-settings-card__divider" />

        <div className="org-settings-form-grid">
          <div className="org-settings-field">
            <label htmlFor="organization-name">نام سازمان</label>
            <input id="organization-name" defaultValue="سازمان نمونه" />
          </div>
          <div className="org-settings-field">
            <label htmlFor="organization-id">شناسه سازمانی</label>
            <input id="organization-id" defaultValue="ORG-۱۴۰۵-۰۲۸" />
          </div>
          <div className="org-settings-field">
            <label htmlFor="manager-name">نام مسئول پنل</label>
            <input id="manager-name" defaultValue="مریم محمدی" />
          </div>
          <div className="org-settings-field">
            <label htmlFor="manager-role">سمت مسئول</label>
            <input id="manager-role" defaultValue="مدیر منابع انسانی" />
          </div>
          <div className="org-settings-field">
            <label htmlFor="phone">شماره تماس</label>
            <input id="phone" defaultValue="۰۹۱۲۱۲۳۴۵۶۷" inputMode="tel" />
          </div>
          <div className="org-settings-field">
            <label htmlFor="email">ایمیل</label>
            <input id="email" type="email" defaultValue="hr@example.com" dir="ltr" />
          </div>
        </div>

        <div className="org-settings-edit__actions">
          <Link className="org-settings-link" href="/organization/settings">انصراف</Link>
          <Link className="org-settings-link org-settings-link--primary" href="/organization/settings">ذخیره تغییرات</Link>
        </div>
      </form>
    </section>
  );
}
