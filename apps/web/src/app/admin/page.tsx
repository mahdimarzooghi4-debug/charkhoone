import Link from "next/link";

const metrics = [
  { label: "کاربران ثبت‌شده", value: "۱۲٬۸۴۰ نفر", note: "مالک و مستأجر" },
  { label: "پرونده‌های در جریان", value: "۴۲۳ پرونده", note: "تمام پرونده‌های باز پلتفرم" },
  { label: "تراکنش‌های امروز", value: "۱۸۶ تراکنش", note: "پرداخت و تسویه ثبت‌شده" },
  { label: "در انتظار تسویه شرکا", value: "۱.۸ میلیارد", note: "تسویه‌نشده با شرکای مالی" },
] as const;

const actions = [
  { title: "۷ مغایرت مالی باز", note: "تطبیق بانکی یا پرونده نیازمند بررسی است", badge: "مالی", tone: "warning", href: "/admin/payments/reconciliation" },
  { title: "۳ اتصال API نیازمند بررسی", note: "خطا یا پاسخ ناموفق در سرویس‌های متصل", badge: "API", tone: "danger", href: "/admin/settings/integrations" },
  { title: "۲ پیامک ناموفق", note: "قالب یا وضعیت ارسال نیازمند پیگیری است", badge: "SMS", tone: "warning", href: "/admin/settings/sms" },
] as const;

const partnerAlerts = [
  { title: "مانده در انتظار تسویه", note: "۱.۸ میلیارد تومان با ۶ شریک", badge: "مالی", tone: "warning", href: "/admin/payments/settlements" },
  { title: "قراردادهای نزدیک انقضا", note: "۳ قرارداد تا ۳۰ روز آینده", badge: "قرارداد", tone: "danger", href: "/admin/partners" },
] as const;

const serviceHealth = [
  { label: "API", value: "۱۸/۲۱ فعال" },
  { label: "پیامک", value: "متصل" },
  { label: "سایت", value: "منتشر" },
  { label: "ماشین‌حساب", value: "فعال" },
] as const;

const financialToday = [
  { label: "تسویه انجام‌شده", value: "۳۱ مورد" },
  { label: "مغایرت باز", value: "۷ مورد" },
  { label: "پرداخت دستی", value: "۴ مورد" },
] as const;

const activities = [
  { event: "Webhook شریک مالی پاسخ ناموفق داد", id: "API-BANK-02", section: "API", time: "۵ دقیقه پیش", status: "نیازمند بررسی", href: "/admin/settings/integrations" },
  { event: "تسویه شریک مالی ثبت و نهایی شد", id: "STL-1405-431", section: "تسویه", time: "۱۸ دقیقه پیش", status: "انجام شد", href: "/admin/payments/settlements" },
] as const;

export default function AdminDashboardPage() {
  return (
    <section className="admin-dashboard" data-node-id="675:43" data-name="Admin / Dashboard">
      <header className="admin-dashboard__header">
        <div className="admin-dashboard__quick-actions">
          <Link className="admin-dashboard__button admin-dashboard__button--primary" href="/admin/payments/manual">ثبت پرداخت دستی</Link>
          <Link className="admin-dashboard__button" href="/admin/partners/new">افزودن همکار</Link>
        </div>
        <div className="admin-dashboard__heading">
          <h1>داشبورد</h1>
          <p>نمای عملیاتی کاربران، پرونده‌ها، پرداخت‌ها، شرکا و سرویس‌های اصلی چارخونه</p>
        </div>
      </header>

      <section className="admin-dashboard__metrics" aria-label="شاخص‌های کلیدی">
        {metrics.map((item) => (
          <article className="admin-dashboard__metric" key={item.label}>
            <span>{item.label}</span>
            <strong>{item.value}</strong>
            <small>{item.note}</small>
          </article>
        ))}
      </section>

      <div className="admin-dashboard__two-column">
        <section className="admin-dashboard__panel">
          <div className="admin-dashboard__section-title">
            <h2>نیازمند اقدام</h2>
            <p>هشدارهای مالی و زیرساختی که تیم چارخونه باید پیگیری کند</p>
          </div>
          <div className="admin-dashboard__list">
            {actions.map((item) => (
              <Link className="admin-dashboard__list-row" href={item.href} key={item.title}>
                <span className={`admin-dashboard__pill admin-dashboard__pill--${item.tone}`}>{item.badge}</span>
                <span className="admin-dashboard__list-copy"><strong>{item.title}</strong><small>{item.note}</small></span>
              </Link>
            ))}
          </div>
        </section>

        <section className="admin-dashboard__panel">
          <div className="admin-dashboard__section-title">
            <h2>وضعیت مالی و قراردادی شرکا</h2>
            <p>مانده تسویه و قراردادهای نزدیک انقضا</p>
          </div>
          <div className="admin-dashboard__list admin-dashboard__list--partners">
            {partnerAlerts.map((item) => (
              <Link className="admin-dashboard__list-row admin-dashboard__list-row--tall" href={item.href} key={item.title}>
                <span className={`admin-dashboard__pill admin-dashboard__pill--${item.tone}`}>{item.badge}</span>
                <span className="admin-dashboard__list-copy"><strong>{item.title}</strong><small>{item.note}</small></span>
              </Link>
            ))}
          </div>
        </section>
      </div>

      <div className="admin-dashboard__two-column admin-dashboard__two-column--compact">
        <section className="admin-dashboard__panel">
          <div className="admin-dashboard__section-title">
            <h2>سلامت سرویس‌ها</h2>
            <p>وضعیت API، پیامک، سایت و ماشین‌حساب</p>
          </div>
          <Link className="admin-dashboard__mini-grid admin-dashboard__mini-grid--four" href="/admin/settings/integrations">
            {serviceHealth.map((item) => <span className="admin-dashboard__mini" key={item.label}><small>{item.label}</small><strong>{item.value}</strong></span>)}
          </Link>
        </section>

        <section className="admin-dashboard__panel">
          <div className="admin-dashboard__section-title">
            <h2>عملکرد مالی امروز</h2>
            <p>خلاصه تسویه، مغایرت و ثبت‌های دستی امروز</p>
          </div>
          <Link className="admin-dashboard__mini-grid admin-dashboard__mini-grid--three" href="/admin/payments">
            {financialToday.map((item) => <span className="admin-dashboard__mini" key={item.label}><small>{item.label}</small><strong>{item.value}</strong></span>)}
          </Link>
        </section>
      </div>

      <section className="admin-dashboard__panel admin-dashboard__activity-panel">
        <div className="admin-dashboard__section-title">
          <h2>آخرین فعالیت‌های عملیاتی</h2>
          <p>آخرین رویدادهای مالی و زیرساختی ثبت‌شده در پلتفرم</p>
        </div>
        <div className="admin-dashboard__table-wrap">
          <div className="admin-dashboard__table" role="table" aria-label="آخرین فعالیت‌های عملیاتی">
            <div className="admin-dashboard__table-row admin-dashboard__table-head" role="row">
              <span role="columnheader">وضعیت</span><span role="columnheader">زمان</span><span role="columnheader">بخش</span><span role="columnheader">شناسه</span><span role="columnheader">رویداد</span>
            </div>
            {activities.map((item) => (
              <Link className="admin-dashboard__table-row" href={item.href} role="row" key={item.id}>
                <span className="admin-dashboard__table-status" role="cell">{item.status}</span><span role="cell">{item.time}</span><span role="cell">{item.section}</span><span role="cell">{item.id}</span><strong role="cell">{item.event}</strong>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </section>
  );
}
