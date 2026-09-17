import Link from "next/link";

const roles = [
  { id: "admin", title: "مدیر پنل", description: "دسترسی کامل به کاربران، پرسنل، طرح‌ها، پرونده‌ها، پرداخت‌ها و تنظیمات", checked: true },
  { id: "finance", title: "مالی", description: "دسترسی به پرداخت‌ها، تعهدات سازمان و پرونده‌های مرتبط", checked: false },
  { id: "hr", title: "منابع انسانی", description: "دسترسی به پرسنل، طرح‌های تخصیص‌یافته و وضعیت پرونده کارکنان", checked: false },
  { id: "viewer", title: "مشاهده‌گر", description: "فقط مشاهده بخش‌های مجاز، بدون امکان ثبت یا تغییر", checked: false },
] as const;

export default function OrganizationAddUserPage() {
  return (
    <section className="org-user-form" data-node-id="542:33">
      <header className="org-user-form__header">
        <Link href="/organization/users">بازگشت به مدیریت کاربران</Link>
        <div>
          <h1>افزودن کاربر سازمان</h1>
          <p>ایجاد دسترسی جدید به پنل سازمان و تعیین نقش و سطح دسترسی</p>
        </div>
      </header>

      <form className="org-user-form__card">
        <h2>مشخصات کاربر جدید</h2>
        <div className="org-user-form__divider" />

        <div className="org-user-form__grid">
          <label>
            <span>ایمیل سازمانی</span>
            <input type="email" placeholder="name@org.ir" />
          </label>
          <label>
            <span>نام و نام خانوادگی</span>
            <input type="text" placeholder="مثلاً سارا احمدی" />
          </label>
        </div>

        <fieldset className="org-role-group">
          <legend>نقش کاربر</legend>
          <div className="org-role-grid">
            {roles.map((role) => (
              <label className="org-role-option" key={role.id}>
                <input defaultChecked={role.checked} name="role" type="radio" value={role.id} />
                <span className="org-role-option__control" aria-hidden="true" />
                <span className="org-role-option__copy">
                  <strong>{role.title}</strong>
                  <small>{role.description}</small>
                </span>
              </label>
            ))}
          </div>
          <p>سطح دسترسی براساس نقش انتخاب‌شده به‌صورت خودکار تنظیم می‌شود.</p>
        </fieldset>

        <div className="org-role-preview">
          <strong>دسترسی‌های نقش انتخاب‌شده</strong>
          <div>
            <span>پرسنل</span>
            <span>طرح‌های بانکی</span>
            <span>پرونده‌ها</span>
            <span>پرداخت‌ها</span>
            <span>تنظیمات و کاربران</span>
          </div>
        </div>

        <div className="org-user-form__actions">
          <Link className="org-user-form__button" href="/organization/users">انصراف</Link>
          <button className="org-user-form__button org-user-form__button--primary" type="button">افزودن کاربر</button>
        </div>
      </form>
    </section>
  );
}
