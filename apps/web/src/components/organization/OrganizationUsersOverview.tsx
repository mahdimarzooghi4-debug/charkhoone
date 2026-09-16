import Link from "next/link";

type UserRow = {
  id: string;
  name: string;
  email: string;
  role: string;
  access: string;
  lastLogin: string;
  twoFactor: string;
  active: boolean;
};

const metrics = [
  { label: "نیازمند اقدام امنیتی", value: "۱ کاربر", note: "ورود دومرحله‌ای غیرفعال است" },
  { label: "دعوت‌شده", value: "۰ کاربر", note: "دعوت در انتظار پذیرش" },
  { label: "کاربران فعال", value: "۴ کاربر", note: "دارای دسترسی فعال به پنل" },
  { label: "کل کاربران پنل", value: "۴ کاربر", note: "مدیر، مالی، منابع انسانی و مشاهده‌گر" },
] as const;

const users: UserRow[] = [
  { id: "maryam", name: "مریم محمدی", email: "maryam@org.ir", role: "مدیر پنل", access: "دسترسی کامل", lastLogin: "امروز، ۱۶:۴۲", twoFactor: "فعال", active: true },
  { id: "ali", name: "علی رضایی", email: "ali@org.ir", role: "مالی", access: "پرداخت‌ها و پرونده‌ها", lastLogin: "امروز، ۱۱:۰۵", twoFactor: "فعال", active: true },
  { id: "sara", name: "سارا کریمی", email: "sara@org.ir", role: "منابع انسانی", access: "پرسنل و پرونده‌ها", lastLogin: "۱۴۰۵/۰۶/۰۷", twoFactor: "فعال", active: true },
  { id: "reza", name: "رضا حسینی", email: "reza@org.ir", role: "مشاهده‌گر", access: "فقط مشاهده", lastLogin: "۱۴۰۵/۰۶/۰۵", twoFactor: "غیرفعال", active: true },
];

export function OrganizationUsersOverview() {
  return (
    <section className="org-users" data-node-id="533:29">
      <header className="org-users__header">
        <div className="org-users__actions">
          <button className="org-action-button org-action-button--surface" type="button">خروجی</button>
          <Link className="org-action-button org-action-button--surface" href="/organization/settings">بازگشت به تنظیمات</Link>
          <Link className="org-action-button org-action-button--primary" href="/organization/users/new">افزودن کاربر</Link>
        </div>
        <div className="org-users__copy">
          <h1>مدیریت کاربران</h1>
          <p>تعریف کاربران پنل سازمان و مدیریت نقش و سطح دسترسی هر کاربر</p>
        </div>
      </header>

      <div className="org-users__metrics">
        {metrics.map((metric) => (
          <article className="org-user-metric" key={metric.label}>
            <span>{metric.label}</span>
            <strong>{metric.value}</strong>
            <small>{metric.note}</small>
          </article>
        ))}
      </div>

      <div className="org-users__controls">
        <div className="org-users__filters" aria-label="فیلتر کاربران">
          <button type="button">فعال</button>
          <button type="button">دعوت‌شده</button>
          <button type="button">غیرفعال</button>
          <button className="is-active" type="button">همه</button>
        </div>
        <label className="org-users__search">
          <span className="sr-only">جستجو با نام یا ایمیل کاربر</span>
          <input type="search" placeholder="جستجو با نام یا ایمیل کاربر" />
        </label>
      </div>

      <div className="org-users__security-strip">
        <div>
          <strong>سطوح دسترسی بر اساس نقش</strong>
          <span>هر کاربر فقط بخش‌هایی را می‌بیند که برای نقش او مجاز شده است</span>
        </div>
        <div>
          <strong>ورود دومرحله‌ای</strong>
          <span>برای کاربران دارای دسترسی مالی و مدیریتی پیشنهاد می‌شود فعال باشد</span>
        </div>
      </div>

      <div className="org-users-table-wrap">
        <table className="org-users-table">
          <thead>
            <tr>
              <th>کاربر</th>
              <th>نقش</th>
              <th>سطح دسترسی</th>
              <th>آخرین ورود</th>
              <th>ورود دومرحله‌ای</th>
              <th>وضعیت</th>
              <th>اقدام</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id}>
                <td><div className="org-user-cell"><strong>{user.name}</strong><span>{user.email}</span></div></td>
                <td><strong>{user.role}</strong></td>
                <td>{user.access}</td>
                <td>{user.lastLogin}</td>
                <td className={user.twoFactor === "غیرفعال" ? "org-user-security--off" : ""}>{user.twoFactor}</td>
                <td><span className="org-user-status">{user.active ? "فعال" : "غیرفعال"}</span></td>
                <td><Link className="org-user-manage-link" href={`/organization/users/${user.id}`}>مدیریت</Link></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="org-users__footer">نمایش ۴ کاربر از ۴ کاربر</div>
    </section>
  );
}
