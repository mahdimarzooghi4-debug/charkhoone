import Link from "next/link";

const users = {
  "usr-001": { name: "علی رضایی", mobile: "۰۹۱۲•••••۶۷", nationalId: "۰۰۱•••••۷۸۹", role: "مالک و مستأجر", status: "فعال", statusTone: "active" },
  "usr-002": { name: "مریم احمدی", mobile: "۰۹۱۹•••••۲۱", nationalId: "۰۴۸•••••۸۱۲", role: "مالک", status: "در حال احراز", statusTone: "pending" },
  "usr-003": { name: "رضا کاظمی", mobile: "۰۹۳۵•••••۸۰", nationalId: "۰۹۰•••••۰۲۱", role: "مستأجر", status: "فعال", statusTone: "active" },
  "usr-004": { name: "سارا محمدی", mobile: "۰۹۱۰•••••۴۴", nationalId: "۰۳۷•••••۷۷۰", role: "مالک و مستأجر", status: "فعال", statusTone: "active" },
  "usr-005": { name: "امیر حسینی", mobile: "۰۹۱۳•••••۱۹", nationalId: "۰۷۱•••••۱۴۳", role: "مستأجر", status: "محدود", statusTone: "limited" },
  "usr-006": { name: "نگار کریمی", mobile: "۰۹۱۲•••••۷۵", nationalId: "۰۵۵•••••۵۲۹", role: "مالک", status: "فعال", statusTone: "active" },
  "usr-007": { name: "محمد مرادی", mobile: "۰۹۳۶•••••۳۳", nationalId: "۰۸۲•••••۲۱۰", role: "مستأجر", status: "در حال احراز", statusTone: "pending" },
  "usr-008": { name: "زهرا اکبری", mobile: "۰۹۹۱•••••۵۸", nationalId: "۰۴۴•••••۴۱۶", role: "مستأجر", status: "فعال", statusTone: "active" },
  "usr-009": { name: "حسین عباسی", mobile: "۰۹۱۱•••••۹۰", nationalId: "۰۲۱•••••۱۹۸", role: "مالک", status: "محدود", statusTone: "limited" },
  "usr-010": { name: "الهام یوسفی", mobile: "۰۹۳۸•••••۱۲", nationalId: "۰۶۰•••••۰۳۱", role: "مالک و مستأجر", status: "فعال", statusTone: "active" },
} as const;

type UserId = keyof typeof users;
type PageProps = { params: Promise<{ id: string }> };

const accountFacts = [
  { label: "نام و نام خانوادگی", key: "name" },
  { label: "کد ملی", key: "nationalId" },
  { label: "وضعیت حساب", key: "status" },
  { label: "شماره موبایل", key: "mobile" },
  { label: "نقش کاربر", key: "role" },
] as const;

const events = [
  { title: "ثبت‌نام کاربر", note: "حساب کاربری با شماره موبایل ایجاد شد.", meta: "۱۴۰۵/۰۵/۱۰", status: "ثبت شد", tone: "muted" },
  { title: "تکمیل احراز هویت", note: "شماره موبایل و کد ملی کاربر تأیید شد.", meta: "۲ قرارداد", status: "فعال", tone: "active" },
  { title: "فعال شدن قرارداد", note: "یک قرارداد فعال به حساب کاربر متصل شد.", meta: "۱۴۰۵/۰۵/۲۸", status: "فعال", tone: "active" },
] as const;

export default async function AdminUserDetailPage({ params }: PageProps) {
  const { id } = await params;
  const user = users[id as UserId] ?? users["usr-001"];

  return (
    <section className="admin-user-detail" data-node-id="691:6" data-name="Admin / User Detail">
      <header className="admin-user-detail__header">
        <Link className="admin-user-detail__back" href="/admin/users">بازگشت به کاربران</Link>
        <div className="admin-user-detail__heading">
          <h1>جزئیات کاربر</h1>
          <p>{user.name} — {user.mobile}</p>
        </div>
      </header>

      <section className="admin-user-detail__panel admin-user-detail__summary">
        <div className="admin-user-detail__panel-head">
          <span className={`admin-user-detail__badge admin-user-detail__badge--${user.statusTone}`}>{user.status}</span>
          <h2>اطلاعات حساب</h2>
        </div>
        <div className="admin-user-detail__facts">
          {accountFacts.map((fact) => (
            <article key={fact.label}>
              <span>{fact.label}</span>
              <strong>{user[fact.key]}</strong>
            </article>
          ))}
        </div>
      </section>

      <div className="admin-user-detail__two-column">
        <section className="admin-user-detail__panel admin-user-detail__compact-panel">
          <div className="admin-user-detail__panel-head">
            <span className="admin-user-detail__badge admin-user-detail__badge--active">فعال</span>
            <h2>نقش‌ها و قراردادها</h2>
          </div>
          <strong className="admin-user-detail__lead">۲ قرارداد متصل</strong>
          <p className="admin-user-detail__description">۱ قرارداد به‌عنوان مستأجر • ۱ قرارداد به‌عنوان مالک</p>
          <div className="admin-user-detail__mini-grid">
            <article><span>قرارداد فعال</span><strong>۲ قرارداد</strong></article>
            <article><span>آخرین فعالیت</span><strong>امروز ۱۴:۳۲</strong></article>
          </div>
          <Link className="admin-user-detail__small-action" href="/admin/cases">مشاهده قراردادها</Link>
        </section>

        <section className="admin-user-detail__panel admin-user-detail__compact-panel">
          <div className="admin-user-detail__panel-head">
            <span className="admin-user-detail__badge admin-user-detail__badge--active">فعال</span>
            <h2>احراز هویت، دسترسی و کنترل حساب</h2>
          </div>
          <strong className="admin-user-detail__lead">احراز هویت تکمیل شده</strong>
          <p className="admin-user-detail__description">شماره موبایل و کد ملی کاربر با موفقیت تأیید شده است.</p>
          <div className="admin-user-detail__mini-grid">
            <article><span>وضعیت احراز</span><strong>تأیید شده</strong></article>
            <article><span>تاریخ ثبت‌نام</span><strong>۱۴۰۵/۰۵/۱۰</strong></article>
          </div>
          <Link className="admin-user-detail__small-action" href="/admin/cases">مشاهده پرونده‌ها</Link>
        </section>
      </div>

      <section className="admin-user-detail__panel admin-user-detail__financial">
        <div className="admin-user-detail__section-copy">
          <h2>وضعیت مالی و حساب بانکی</h2>
          <p>اطلاعات مرتبط با دریافت، پرداخت و حساب بانکی کاربر.</p>
        </div>
        <div className="admin-user-detail__financial-grid">
          <article><span>شماره شبا</span><strong>ثبت شده</strong><small>IR••••••••••••••••••••۱۲</small></article>
          <article><span>وضعیت پرداخت</span><strong>تأیید شده</strong><small>پرداخت معوق ندارد</small></article>
          <article><span>دسترسی به سامانه</span><strong>فعال</strong><small>محدودیتی برای دسترسی ثبت نشده</small></article>
        </div>
      </section>

      <section className="admin-user-detail__panel admin-user-detail__events">
        <div className="admin-user-detail__section-copy">
          <h2>آخرین رویدادها</h2>
          <p>سوابق مهم این کاربر در چارخونه</p>
        </div>
        <div className="admin-user-detail__event-list">
          {events.map((event) => (
            <div className="admin-user-detail__event" key={event.title}>
              <div className="admin-user-detail__event-meta">
                <span>{event.meta}</span>
                <span className={`admin-user-detail__badge admin-user-detail__badge--${event.tone}`}>{event.status}</span>
              </div>
              <div className="admin-user-detail__event-copy">
                <strong>{event.title}</strong>
                <small>{event.note}</small>
              </div>
            </div>
          ))}
        </div>
      </section>
    </section>
  );
}
