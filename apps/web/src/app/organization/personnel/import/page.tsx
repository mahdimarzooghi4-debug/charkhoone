import Link from "next/link";

const requiredColumns = ["نام و نام خانوادگی", "کد ملی", "شماره موبایل", "کد پرسنلی", "واحد سازمانی", "وضعیت همکاری"];
const rules = [
  "کد ملی باید ۱۰ رقم باشد.",
  "شماره موبایل باید با ۰۹ شروع شود.",
  "کد پرسنلی برای هر پرسنل سازمان الزامی است.",
  "وضعیت همکاری فقط فعال یا غیرفعال باشد.",
  "اگر کد ملی قبلاً برای همین سازمان ثبت شده باشد، رکورد به‌عنوان تکراری مشخص می‌شود.",
  "در این مرحله طرح بانکی برای پرسنل انتخاب نمی‌شود.",
];

export default function OrganizationPersonnelImportPage() {
  return (
    <section className="org-import" data-node-id="554:887">
      <header className="org-import__header">
        <Link href="/organization/personnel" className="org-import__back">بازگشت به پرسنل ←</Link>
        <h1>ورود گروهی پرسنل</h1>
        <p>فایل اطلاعات پرسنل را بارگذاری کنید تا قبل از ثبت بررسی شود.</p>
      </header>

      <div className="org-import__columns">
        <article className="org-import-card org-import-card--upload">
          <div className="org-import-card__heading">
            <h2>بارگذاری فایل پرسنل</h2>
            <p>فایل Excel یا CSV شامل اطلاعات پرسنل سازمان را انتخاب کنید.</p>
          </div>

          <label className="org-upload-zone">
            <span className="org-upload-zone__icon" aria-hidden="true">⇧</span>
            <strong>فایل را اینجا بکشید یا انتخاب کنید</strong>
            <span>فرمت‌های مجاز: XLSX، XLS، CSV — حداکثر ۱۰ مگابایت</span>
            <input type="file" accept=".xlsx,.xls,.csv" />
            <span className="org-form-button org-form-button--secondary">انتخاب فایل</span>
          </label>

          <div className="org-selected-file">
            <div className="org-selected-file__actions">
              <button type="button">حذف فایل</button>
              <button type="button">تغییر فایل</button>
            </div>
            <div className="org-selected-file__meta">
              <span className="org-status org-status--success">آماده بررسی</span>
              <div>
                <strong>personnel-shahrivar.xlsx</strong>
                <small>۲.۴ مگابایت</small>
              </div>
              <span className="org-selected-file__icon" aria-hidden="true">▤</span>
            </div>
          </div>
        </article>

        <aside className="org-import__aside">
          <article className="org-import-card">
            <div className="org-import-card__heading">
              <h2>قالب فایل</h2>
              <p>برای جلوگیری از خطا، اطلاعات را مطابق قالب استاندارد چارخونه وارد کنید.</p>
            </div>
            <button type="button" className="org-form-button org-form-button--secondary org-form-button--block">دانلود فایل نمونه اکسل</button>
            <p className="org-import-card__warning">نام ستون‌ها را در فایل نمونه تغییر ندهید.</p>
            <div className="org-chip-list">
              {requiredColumns.map((column) => <span key={column}>{column}</span>)}
            </div>
            <p className="org-form-help">هر ردیف باید مربوط به یک پرسنل باشد.</p>
          </article>

          <article className="org-import-card">
            <h2>نکات ورود اطلاعات</h2>
            <ul className="org-import-rules">
              {rules.map((rule) => <li key={rule}>{rule}</li>)}
            </ul>
          </article>
        </aside>
      </div>

      <footer className="org-import__actions">
        <Link href="/organization/personnel" className="org-form-button org-form-button--secondary">انصراف</Link>
        <Link href="/organization/personnel/import/review" className="org-form-button org-form-button--primary">بررسی فایل</Link>
      </footer>
    </section>
  );
}
