import Link from "next/link";

export default function OrganizationPersonnelNewPage() {
  return (
    <section className="org-modal-page" data-node-id="554:37">
      <div className="org-modal-page__backdrop" />
      <form className="org-personnel-modal" aria-labelledby="add-personnel-title">
        <header className="org-personnel-modal__header">
          <Link href="/organization/personnel" className="org-personnel-modal__close" aria-label="بستن">×</Link>
          <h1 id="add-personnel-title">افزودن پرسنل</h1>
        </header>

        <p className="org-personnel-modal__lead">اطلاعات پرسنل را برای ثبت در چارخونه وارد کنید.</p>

        <fieldset className="org-form-section">
          <legend>اطلاعات پرسنلی</legend>

          <label className="org-form-field org-form-field--full">
            <span>نام و نام خانوادگی</span>
            <input name="fullName" placeholder="مثلاً علی رضایی" />
          </label>

          <div className="org-form-row">
            <label className="org-form-field">
              <span>کد ملی</span>
              <input name="nationalCode" inputMode="numeric" placeholder="۱۰ رقم" />
            </label>
            <label className="org-form-field">
              <span>شماره موبایل</span>
              <input name="mobile" inputMode="tel" placeholder="۰۹۱۲۱۲۳۴۵۶۷" />
            </label>
          </div>

          <div className="org-form-row">
            <label className="org-form-field">
              <span>کد پرسنلی</span>
              <input name="employeeCode" placeholder="مثلاً ۱۲۳۴" />
            </label>
            <label className="org-form-field">
              <span>واحد سازمانی</span>
              <select name="unit" defaultValue="">
                <option value="" disabled>انتخاب واحد سازمانی</option>
                <option>فناوری</option>
                <option>مالی</option>
                <option>منابع انسانی</option>
                <option>عملیات</option>
              </select>
            </label>
          </div>

          <div className="org-form-row org-form-row--single">
            <label className="org-form-field">
              <span>وضعیت همکاری</span>
              <select name="employmentStatus" defaultValue="فعال">
                <option>فعال</option>
                <option>غیرفعال</option>
              </select>
            </label>
          </div>

          <p className="org-form-help">اگر این کد ملی قبلاً برای همین سازمان ثبت شده باشد، پرسنل جدید ساخته نمی‌شود و اطلاعات موجود نمایش داده می‌شود.</p>
        </fieldset>

        <fieldset className="org-form-section">
          <legend>طرح بانکی</legend>
          <label className="org-form-field org-form-field--full">
            <span>طرح بانکی</span>
            <select name="bankPlan" defaultValue="بدون طرح">
              <option>بدون طرح</option>
              <option>طرح کارکنان سازمانی</option>
              <option>طرح مسکن کارکنان</option>
            </select>
          </label>
          <p className="org-form-help">بعداً می‌توانید از بخش طرح‌های بانکی، این پرسنل را به یک طرح اضافه کنید.</p>
        </fieldset>

        <footer className="org-personnel-modal__actions">
          <Link href="/organization/personnel" className="org-form-button org-form-button--secondary">انصراف</Link>
          <button type="submit" className="org-form-button org-form-button--primary">ثبت پرسنل</button>
        </footer>
      </form>
    </section>
  );
}
