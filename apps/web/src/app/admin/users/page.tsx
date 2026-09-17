import Link from "next/link";

const metrics = [
  { label: "در حال احراز هویت", value: "۸۴ نفر", note: "احراز هویت هنوز تکمیل نشده است" },
  { label: "نقش اصلی: مالک", value: "۴٬۶۰۰ نفر", note: "کاربرانی که نقش اصلی آن‌ها مالک است" },
  { label: "نقش اصلی: مستأجر", value: "۸٬۲۴۰ نفر", note: "کاربرانی که نقش اصلی آن‌ها مستأجر است" },
  { label: "کل کاربران ثبت‌شده", value: "۱۲٬۸۴۰ نفر", note: "مالک و مستأجر" },
] as const;

const users = [
  { id: "usr-001", name: "علی رضایی", maskedId: "***۱۲۳۴", activity: "امروز", nationalId: "۰۰۱…۷۸۹", mobile: "۰۹۱۲…۶۷", role: "مالک و مستأجر", status: "فعال", tone: "active" },
  { id: "usr-002", name: "مریم احمدی", maskedId: "***۴۸۱۲", activity: "امروز", nationalId: "۰۴۸…۸۱۲", mobile: "۰۹۱۹…۲۱", role: "مالک", status: "در حال احراز", tone: "pending" },
  { id: "usr-003", name: "رضا کاظمی", maskedId: "***۹۰۲۱", activity: "امروز", nationalId: "۰۹۰…۰۲۱", mobile: "۰۹۳۵…۸۰", role: "مستأجر", status: "فعال", tone: "active" },
  { id: "usr-004", name: "سارا محمدی", maskedId: "***۳۷۷۰", activity: "دیروز", nationalId: "۰۳۷…۷۷۰", mobile: "۰۹۱۰…۴۴", role: "مالک و مستأجر", status: "فعال", tone: "active" },
  { id: "usr-005", name: "امیر حسینی", maskedId: "***۷۱۴۳", activity: "دیروز", nationalId: "۰۷۱…۱۴۳", mobile: "۰۹۱۳…۱۹", role: "مستأجر", status: "محدود", tone: "limited" },
  { id: "usr-006", name: "نگار کریمی", maskedId: "***۵۵۲۹", activity: "۲ روز", nationalId: "۰۵۵…۵۲۹", mobile: "۰۹۱۲…۷۵", role: "مالک", status: "فعال", tone: "active" },
  { id: "usr-007", name: "محمد مرادی", maskedId: "***۸۲۱۰", activity: "۲ روز", nationalId: "۰۸۲…۲۱۰", mobile: "۰۹۳۶…۳۳", role: "مستأجر", status: "در حال احراز", tone: "pending" },
  { id: "usr-008", name: "زهرا اکبری", maskedId: "***۴۴۱۶", activity: "۳ روز", nationalId: "۰۴۴…۴۱۶", mobile: "۰۹۹۱…۵۸", role: "مستأجر", status: "فعال", tone: "active" },
  { id: "usr-009", name: "حسین عباسی", maskedId: "***۲۱۹۸", activity: "۴ روز", nationalId: "۰۲۱…۱۹۸", mobile: "۰۹۱۱…۹۰", role: "مالک", status: "محدود", tone: "limited" },
  { id: "usr-010", name: "الهام یوسفی", maskedId: "***۶۰۳۱", activity: "۵ روز", nationalId: "۰۶۰…۰۳۱", mobile: "۰۹۳۸…۱۲", role: "مالک و مستأجر", status: "فعال", tone: "active" },
] as const;

const filters = ["فعال", "در حال احراز", "محدود", "همه"] as const;

export default function AdminUsersPage() {
  return (
    <section className="admin-users" data-node-id="683:6" data-name="Admin / Users">
      <header className="admin-users__header">
        <button className="admin-users__export" type="button">خروجی کاربران</button>
        <div className="admin-users__heading">
          <h1>کاربران</h1>
          <p>مدیریت کاربران چارخونه؛ مالک‌ها، مستأجرها و وضعیت احراز هویت آن‌ها</p>
        </div>
      </header>

      <section className="admin-users__metrics" aria-label="آمار کاربران">
        {metrics.map((item) => (
          <article className="admin-users__metric" key={item.label}>
            <span>{item.label}</span>
            <strong>{item.value}</strong>
            <small>{item.note}</small>
          </article>
        ))}
      </section>

      <section className="admin-users__controls" aria-label="جستجو و فیلتر کاربران">
        <div className="admin-users__filters">
          {filters.map((filter) => (
            <button
              className={["admin-users__filter", filter === "همه" ? "admin-users__filter--active" : ""].filter(Boolean).join(" ")}
              type="button"
              key={filter}
            >
              {filter}
            </button>
          ))}
        </div>
        <label className="admin-users__search">
          <span className="admin-users__sr-only">جستجوی کاربران</span>
          <input type="search" placeholder="جستجو با نام، شماره موبایل یا کد ملی" />
        </label>
      </section>

      <section className="admin-users__registration-strip" aria-label="خلاصه ثبت‌نام و احراز هویت امروز">
        <div>
          <strong>ثبت‌نام امروز: ۴۸ کاربر</strong>
          <span>۲ حساب امروز محدود شده و نیازمند پیگیری است</span>
        </div>
        <div>
          <strong className="admin-users__registration-highlight">احراز هویت امروز: ۳۱ تکمیل</strong>
          <span>۵ مورد نیازمند بررسی دستی؛ ۸۴ کاربر در جریان احراز</span>
        </div>
      </section>

      <div className="admin-users__table-wrap">
        <div className="admin-users__table" role="table" aria-label="فهرست کاربران">
          <div className="admin-users__row admin-users__table-head" role="row">
            <span role="columnheader">اقدام</span>
            <span role="columnheader">وضعیت</span>
            <span role="columnheader">نقش</span>
            <span role="columnheader">شماره موبایل</span>
            <span role="columnheader">کد ملی</span>
            <span role="columnheader">آخرین فعالیت</span>
            <span role="columnheader">کاربر</span>
          </div>

          {users.map((user) => (
            <div className="admin-users__row" role="row" key={user.id}>
              <Link className="admin-users__manage" href={`/admin/users/${user.id}`} role="cell">مدیریت</Link>
              <span role="cell"><span className={`admin-users__status admin-users__status--${user.tone}`}>{user.status}</span></span>
              <strong role="cell">{user.role}</strong>
              <span role="cell">{user.mobile}</span>
              <span role="cell">{user.nationalId}</span>
              <strong role="cell">{user.activity}</strong>
              <span className="admin-users__person" role="cell"><strong>{user.name}</strong><small>کد ملی {user.maskedId}</small></span>
            </div>
          ))}
        </div>
      </div>

      <footer className="admin-users__footer">
        <nav className="admin-users__pagination" aria-label="صفحه‌بندی کاربران">
          <button type="button">قبلی</button>
          <button className="admin-users__page--active" type="button" aria-current="page">۱</button>
          <button type="button">۲</button>
          <button type="button">۳</button>
          <button type="button">…</button>
          <button type="button">۱۲۸</button>
          <button type="button">بعدی</button>
        </nav>
        <p>نمایش ۱۰ کاربر از ۱۲٬۸۴۰ کاربر</p>
      </footer>
    </section>
  );
}
