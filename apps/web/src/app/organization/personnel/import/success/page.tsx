import Link from "next/link";

const results = [
  { label: "تکراری", value: "۳ نفر", note: "اطلاعات در سامانه موجود است", tone: "warning" },
  { label: "دارای خطا", value: "۹ نفر", note: "نیازمند اصلاح در فایل اصلی", tone: "danger" },
  { label: "ثبت‌شده", value: "۲۳۸ نفر", note: "بدون اشکال ساختاری", tone: "success" },
] as const;

export default function OrganizationPersonnelImportSuccessPage() {
  return (
    <section className="org-import-success" data-node-id="559:200">
      <header className="org-import-success__header">
        <h1>فعال‌سازی انجام شد</h1>
        <p>ورود گروهی پرسنل با موفقیت انجام شد.</p>
      </header>

      <article className="org-import-success__hero">
        <div className="org-import-success__check">✓</div>
        <h2>ورود گروهی پرسنل انجام شد</h2>
        <strong>۲۳۸ پرسنل با موفقیت ثبت شدند</strong>
        <p>پرسنل ثبت‌شده اکنون در فهرست پرسنل سازمان قابل مشاهده هستند.</p>
      </article>

      <article className="org-import-success__card">
        <h2>نتیجه ورود گروهی</h2>
        <div className="org-import-success__metrics">
          {results.map((item) => (
            <div className={`org-review-metric org-review-metric--${item.tone}`} key={item.label}>
              <span>{item.label}</span>
              <strong>{item.value}</strong>
              <small>{item.note}</small>
            </div>
          ))}
        </div>
      </article>

      <article className="org-import-success__card org-import-success__error-card">
        <h2>۱۲ ردیف ثبت نشد</h2>
        <div>
          <button type="button" className="org-form-button org-form-button--secondary org-form-button--small">دانلود گزارش خطاها</button>
          <p><strong>۹ ردیف دارای خطا و ۳ ردیف تکراری بودند و در سیستم ثبت نشدند.</strong><span>پس از اصلاح فایل می‌توانید فقط موارد ثبت‌نشده را دوباره وارد کنید.</span></p>
        </div>
      </article>

      <article className="org-import-success__card">
        <h2>اطلاعات ثبت‌شده</h2>
        <dl className="org-import-success__details">
          <div><dt>روش ثبت</dt><dd>ورود گروهی</dd></div>
          <div><dt>طرح بانکی</dt><dd>بدون طرح</dd></div>
          <div><dt>وضعیت اولیه</dt><dd>ثبت‌شده در سازمان</dd></div>
        </dl>
        <p className="org-form-help">انتخاب طرح بانکی بعداً از بخش طرح‌های بانکی انجام می‌شود.</p>
      </article>

      <footer className="org-import-success__actions">
        <Link href="/organization/personnel/import" className="org-form-button org-form-button--secondary">ورود گروهی جدید</Link>
        <Link href="/organization/personnel" className="org-form-button org-form-button--primary">مشاهده پرسنل</Link>
      </footer>
    </section>
  );
}
