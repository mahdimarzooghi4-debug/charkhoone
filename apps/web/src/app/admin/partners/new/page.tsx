import Link from "next/link";

export default function AdminAddPartnerPage() {
  return (
    <section
      className="admin-partner-form"
      data-node-id="725:14"
      data-name="Admin / Partners / Add Partner"
    >
      <header className="admin-partner-form__header">
        <Link className="admin-partner-form__back" href="/admin/partners">
          بازگشت به همکاران
        </Link>
        <div className="admin-partner-form__heading">
          <h1>افزودن همکار</h1>
          <p>اطلاعات همکاری، اتصال و شرایط مالی همکار جدید را ثبت کنید.</p>
        </div>
      </header>

      <form className="admin-partner-form__card" aria-label="افزودن همکار جدید">
        <h2>اطلاعات پایه و اتصال</h2>
        <div className="admin-partner-form__divider" aria-hidden="true" />

        <div className="admin-partner-form__grid">
          <label className="admin-partner-form__field">
            <span>نام همکار</span>
            <input type="text" placeholder="نام رسمی همکار" />
          </label>

          <label className="admin-partner-form__field">
            <span>شناسه همکار</span>
            <input type="text" defaultValue="PRT-۱۴۰۵-۰۲۵" readOnly />
          </label>

          <label className="admin-partner-form__field">
            <span>نوع اتصال</span>
            <select defaultValue="">
              <option value="" disabled>API / Webhook / دستی</option>
              <option value="api">API</option>
              <option value="webhook">Webhook</option>
              <option value="manual">دستی</option>
            </select>
          </label>

          <label className="admin-partner-form__field">
            <span>نوع همکار</span>
            <select defaultValue="">
              <option value="" disabled>بانک / صندوق / کارگزاری / سازمان</option>
              <option value="bank">بانک</option>
              <option value="fund">صندوق</option>
              <option value="brokerage">کارگزاری</option>
              <option value="organization">سازمان</option>
            </select>
          </label>

          <label className="admin-partner-form__field">
            <span>دوره تسویه</span>
            <select defaultValue="">
              <option value="" disabled>روزانه / هفتگی / ماهانه</option>
              <option value="daily">روزانه</option>
              <option value="weekly">هفتگی</option>
              <option value="monthly">ماهانه</option>
            </select>
          </label>

          <label className="admin-partner-form__field">
            <span>مدل مالی همکاری</span>
            <select defaultValue="">
              <option value="" disabled>درصدی / ثابت / ترکیبی</option>
              <option value="percentage">درصدی</option>
              <option value="fixed">ثابت</option>
              <option value="hybrid">ترکیبی</option>
            </select>
          </label>

          <label className="admin-partner-form__field">
            <span>سهم چارخونه</span>
            <input type="text" inputMode="decimal" placeholder="مثلاً ۱.۵٪" />
          </label>

          <label className="admin-partner-form__field">
            <span>شماره شبا تسویه</span>
            <input type="text" dir="ltr" placeholder="IR-- ---- ---- ---- ---- ---- --" />
          </label>

          <label className="admin-partner-form__field">
            <span>پایان قرارداد</span>
            <input type="text" inputMode="numeric" defaultValue="۱۴۰۶/۰۱/۰۱" />
          </label>

          <label className="admin-partner-form__field">
            <span>شروع قرارداد</span>
            <input type="text" inputMode="numeric" defaultValue="۱۴۰۵/۰۱/۰۱" />
          </label>
        </div>

        <div className="admin-partner-form__actions">
          <Link className="admin-partner-form__cancel" href="/admin/partners">
            انصراف
          </Link>
          <button className="admin-partner-form__submit" type="button">
            ثبت همکار
          </button>
        </div>
      </form>
    </section>
  );
}
