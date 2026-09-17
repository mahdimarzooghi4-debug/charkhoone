import Link from "next/link";

const metrics = [
  { label: "تسویه امروز", value: "۴۳ تسویه", note: "۱٬۱۸۰٬۰۰۰٬۰۰۰ تومان" },
  { label: "در انتظار تأیید", value: "۹ تسویه", note: "۲۴۰٬۰۰۰٬۰۰۰ تومان" },
  { label: "انجام‌شده امروز", value: "۳۱ تسویه", note: "۸۷۰٬۰۰۰٬۰۰۰ تومان" },
  { label: "نیازمند اقدام", value: "۳ تسویه", note: "۷۰٬۰۰۰٬۰۰۰ تومان" },
] as const;

const filters = [
  { label: "همه", tone: "active" },
  { label: "در انتظار", tone: "warning" },
  { label: "انجام‌شده", tone: "neutral" },
  { label: "نیازمند اقدام", tone: "neutral" },
] as const;

const settlements = [
  { party: "بانک توسعه مسکن", period: "مرداد ۱۴۰۵", counterparty: "بانک توسعه مسکن", amount: "۸۵٬۰۰۰٬۰۰۰ تومان", status: "انجام‌شده", tone: "success", time: "امروز ۱۴:۱۰", action: "مشاهده", actionTone: "primary" },
  { party: "صندوق مسکن آتیه", period: "مرداد ۱۴۰۵", counterparty: "صندوق مسکن آتیه", amount: "۴۵٬۰۰۰٬۰۰۰ تومان", status: "در انتظار", tone: "warning", time: "امروز ۱۳:۴۰", action: "بررسی", actionTone: "secondary" },
  { party: "تسویه مالکان", period: "هفته ۴ مرداد", counterparty: "مالکین", amount: "۷۲٬۰۰۰٬۰۰۰ تومان", status: "انجام‌شده", tone: "success", time: "امروز ۱۲:۱۵", action: "مشاهده", actionTone: "secondary" },
  { party: "بانک شهر نمونه", period: "مرداد ۱۴۰۵", counterparty: "بانک شهر نمونه", amount: "۳۲٬۰۰۰٬۰۰۰ تومان", status: "نیازمند اقدام", tone: "danger", time: "امروز ۱۱:۲۰", action: "بررسی", actionTone: "secondary" },
  { party: "کارگزاری سرمایه ایرانیان", period: "مرداد ۱۴۰۵", counterparty: "کارگزاری سرمایه ایرانیان", amount: "۹۰٬۰۰۰٬۰۰۰ تومان", status: "انجام‌شده", tone: "success", time: "امروز ۱۰:۰۵", action: "مشاهده", actionTone: "primary" },
  { party: "تسویه مالکان", period: "هفته ۳ مرداد", counterparty: "مالکین", amount: "۵۸٬۰۰۰٬۰۰۰ تومان", status: "انجام‌شده", tone: "success", time: "دیروز", action: "مشاهده", actionTone: "secondary" },
  { party: "سازمان رفاه کارکنان", period: "مرداد ۱۴۰۵", counterparty: "سازمان رفاه کارکنان", amount: "۲۷٬۰۰۰٬۰۰۰ تومان", status: "در انتظار", tone: "warning", time: "دیروز", action: "بررسی", actionTone: "primary" },
  { party: "بانک تعاون نمونه", period: "مرداد ۱۴۰۵", counterparty: "بانک تعاون نمونه", amount: "۶۶٬۰۰۰٬۰۰۰ تومان", status: "انجام‌شده", tone: "success", time: "۲ روز پیش", action: "مشاهده", actionTone: "secondary" },
  { party: "صندوق سرمایه‌گذاری امید", period: "مرداد ۱۴۰۵", counterparty: "صندوق سرمایه‌گذاری امید", amount: "۴۱٬۰۰۰٬۰۰۰ تومان", status: "انجام‌شده", tone: "success", time: "۲ روز پیش", action: "مشاهده", actionTone: "secondary" },
  { party: "تسویه مالکان", period: "هفته ۳ مرداد", counterparty: "مالکین", amount: "۵۳٬۰۰۰٬۰۰۰ تومان", status: "انجام‌شده", tone: "success", time: "۳ روز پیش", action: "مشاهده", actionTone: "primary" },
] as const;

export default function AdminSettlementsPage() {
  return (
    <section className="admin-payments" data-node-id="730:98" data-name="Admin / Payments / Settlements">
      <header className="admin-payments__header">
        <div className="admin-payments__header-actions">
          <button className="admin-payments__export" type="button">خروجی</button>
          <Link className="admin-payments__manual" href="/admin/payments/manual">ثبت پرداخت دستی</Link>
        </div>
        <div className="admin-payments__heading">
          <h1>پرداخت‌ها</h1>
          <p>مدیریت تراکنش‌ها، تسویه‌ها، مغایرت‌های مالی و ثبت پرداخت دستی در چارخونه</p>
        </div>
      </header>

      <section className="admin-payments__metrics" aria-label="آمار تسویه‌ها">
        {metrics.map((item) => <article className="admin-payments__metric" key={item.label}><span>{item.label}</span><strong>{item.value}</strong><small>{item.note}</small></article>)}
      </section>

      <nav className="admin-payments__tabs" aria-label="بخش‌های پرداخت">
        <Link className="admin-payments__tab" href="/admin/payments">تراکنش‌ها</Link>
        <Link className="admin-payments__tab admin-payments__tab--active" href="/admin/payments/settlements" aria-current="page">تسویه‌ها</Link>
        <Link className="admin-payments__tab" href="/admin/payments/reconciliation">مغایرت‌ها</Link>
      </nav>

      <section className="admin-payments__controls" aria-label="جستجو و فیلتر تسویه‌ها">
        <div className="admin-payments__filters">{filters.map((item) => <button className={`admin-payments__filter admin-payments__filter--${item.tone}`} type="button" key={item.label}>{item.label}</button>)}</div>
        <label className="admin-payments__search"><span className="admin-payments__sr-only">جستجوی تسویه‌ها</span><input type="search" placeholder="جستجو با شریک، ذی‌نفع یا دوره تسویه" /></label>
      </section>

      <section className="admin-payments__table-card">
        <div className="admin-payments__table-wrap"><div className="admin-payments__table" role="table" aria-label="فهرست تسویه‌ها">
          <div className="admin-payments__row admin-payments__row--head" role="row"><span role="columnheader">اقدام</span><span role="columnheader">تاریخ</span><span role="columnheader">وضعیت</span><span role="columnheader">مبلغ تسویه</span><span role="columnheader">طرف تسویه</span><span role="columnheader">دوره</span><span role="columnheader">شریک / ذی‌نفع</span></div>
          {settlements.map((item, index) => <div className="admin-payments__row" role="row" key={`${item.party}-${index}`}>
            <span role="cell"><button className={`admin-payments__action admin-payments__action--${item.actionTone}`} type="button">{item.action}</button></span>
            <span className="admin-payments__muted" role="cell">{item.time}</span>
            <span role="cell"><span className={`admin-payments__badge admin-payments__badge--${item.tone}`}>{item.status}</span></span>
            <strong role="cell">{item.amount}</strong><span role="cell">{item.counterparty}</span><strong role="cell">{item.period}</strong><strong role="cell">{item.party}</strong>
          </div>)}
        </div></div>
        <footer className="admin-payments__footer"><nav className="admin-payments__pagination" aria-label="صفحه‌بندی تسویه‌ها"><button type="button">قبلی</button><button className="admin-payments__page--active" type="button" aria-current="page">۱</button><button type="button">۲</button><button type="button">۳</button><button type="button">بعدی</button></nav><p>نمایش ۱۰ پرداخت از ۱٬۲۸۴ پرداخت</p></footer>
      </section>
    </section>
  );
}
