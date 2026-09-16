import Link from "next/link";
import OrganizationHrApiPage from "../page";

const summary = [
  { label: "پرسنل بررسی‌شده", value: "۱٬۲۵۳ نفر" },
  { label: "پرسنل جدید", value: "۱۲ نفر" },
  { label: "اطلاعات به‌روزشده", value: "۳۸ نفر" },
  { label: "خطای همگام‌سازی", value: "۰ مورد" },
] as const;

export default function OrganizationHrApiSyncSuccessPage() {
  return (
    <>
      <OrganizationHrApiPage />
      <div className="org-sync-success" data-node-id="571:42">
        <section className="org-sync-success__modal" role="dialog" aria-modal="true" aria-labelledby="sync-success-title">
          <header className="org-sync-success__head">
            <div className="org-sync-success__copy">
              <h2 id="sync-success-title">همگام‌سازی با موفقیت انجام شد</h2>
              <p>اطلاعات پرسنل سازمان از سیستم منابع انسانی دریافت و به‌روزرسانی شد.</p>
            </div>
            <span className="org-sync-success__icon" aria-hidden="true">✓</span>
          </header>

          <div className="org-sync-success__summary">
            {summary.map((item) => (
              <div className="org-sync-success__summary-row" key={item.label}>
                <strong>{item.value}</strong>
                <span>{item.label}</span>
              </div>
            ))}
          </div>

          <div className="org-sync-success__note">
            <strong>آخرین همگام‌سازی: امروز، ۱۸:۳۱</strong>
            <span>پرسنل جدید و تغییرات ثبت‌شده اکنون در فهرست پرسنل قابل مشاهده‌اند.</span>
          </div>

          <div className="org-sync-success__actions">
            <Link className="org-hr-api__button" href="/organization/settings/hr-api">مشاهده اتصال</Link>
            <Link className="org-hr-api__button org-hr-api__button--primary" href="/organization/personnel">مشاهده پرسنل</Link>
          </div>
        </section>
      </div>
    </>
  );
}
