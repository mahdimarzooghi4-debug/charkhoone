import Link from "next/link";

const metrics = [
  { label: "تراکنش‌های امروز", value: "۱۸۶ تراکنش", note: "۲٬۴۸۰٬۰۰۰٬۰۰۰ تومان" },
  { label: "تسویه در انتظار", value: "۱۷ مورد", note: "۳۱۰٬۰۰۰٬۰۰۰ تومان" },
  { label: "تسویه‌شده امروز", value: "۱۶۲ مورد", note: "۲٬۰۶۰٬۰۰۰٬۰۰۰ تومان" },
  { label: "مغایرت باز", value: "۷ مورد", note: "۱۱۰٬۰۰۰٬۰۰۰ تومان" },
] as const;

const filters = [
  { label: "همه", tone: "active" },
  { label: "در انتظار", tone: "warning" },
  { label: "موفق", tone: "neutral" },
  { label: "ناموفق", tone: "neutral" },
] as const;

const payments = [
  { id: "payment-1182", user: "علی رضایی", caseId: "CS-1405-1182", type: "تسویه مالک", amount: "۲۴٬۰۰۰٬۰۰۰ تومان", status: "موفق", statusTone: "success", time: "امروز ۱۴:۳۲", action: "مشاهده", actionTone: "primary" },
  { id: "payment-1181", user: "مریم احمدی", caseId: "CS-1405-1181", type: "پرداخت مستأجر", amount: "۱۸٬۰۰۰٬۰۰۰ تومان", status: "در انتظار", statusTone: "warning", time: "امروز ۱۳:۰۵", action: "مشاهده", actionTone: "secondary" },
  { id: "payment-1178", user: "رضا کاظمی", caseId: "CS-1405-1178", type: "تأمین مالی", amount: "۳۵٬۰۰۰٬۰۰۰ تومان", status: "موفق", statusTone: "success", time: "امروز ۱۲:۴۰", action: "مشاهده", actionTone: "secondary" },
  { id: "payment-1176", user: "سارا محمدی", caseId: "CS-1405-1176", type: "تسویه مالک", amount: "۲۲٬۰۰۰٬۰۰۰ تومان", status: "ناموفق", statusTone: "danger", time: "امروز ۱۱:۲۲", action: "بررسی", actionTone: "secondary" },
  { id: "payment-1170", user: "نگار کریمی", caseId: "CS-1405-1170", type: "پرداخت مستأجر", amount: "۱۶٬۰۰۰٬۰۰۰ تومان", status: "موفق", statusTone: "success", time: "امروز ۱۰:۴۸", action: "مشاهده", actionTone: "primary" },
  { id: "payment-1168", user: "حسین جعفری", caseId: "CS-1405-1168", type: "تسویه مالک", amount: "۲۱٬۰۰۰٬۰۰۰ تومان", status: "موفق", statusTone: "success", time: "دیروز", action: "مشاهده", actionTone: "secondary" },
  { id: "payment-1163", user: "محمد مرادی", caseId: "CS-1405-1163", type: "تطبیق مالی", amount: "۴۵٬۰۰۰٬۰۰۰ تومان", status: "نیازمند بررسی", statusTone: "warning", time: "دیروز", action: "بررسی", actionTone: "primary" },
  { id: "payment-1159", user: "زهرا یوسفی", caseId: "CS-1405-1159", type: "پرداخت مستأجر", amount: "۱۹٬۰۰۰٬۰۰۰ تومان", status: "موفق", statusTone: "success", time: "۲ روز پیش", action: "مشاهده", actionTone: "secondary" },
  { id: "payment-1156", user: "الهام یوسفی", caseId: "CS-1405-1156", type: "تسویه مالک", amount: "۲۰٬۰۰۰٬۰۰۰ تومان", status: "در انتظار", statusTone: "warning", time: "۲ روز پیش", action: "مشاهده", actionTone: "secondary" },
  { id: "payment-1150", user: "نرگس اکبری", caseId: "CS-1405-1150", type: "پرداخت مستأجر", amount: "۲۳٬۰۰۰٬۰۰۰ تومان", status: "موفق", statusTone: "success", time: "۳ روز پیش", action: "مشاهده", actionTone: "primary" },
] as const;

export default function AdminPaymentsPage() {
  return (
    <section className="admin-payments" data-node-id="708:12" data-name="Admin / Payments">
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

      <section className="admin-payments__metrics" aria-label="آمار پرداخت‌ها">
        {metrics.map((item) => (
          <article className="admin-payments__metric" key={item.label}>
            <span>{item.label}</span>
            <strong>{item.value}</strong>
            <small>{item.note}</small>
          </article>
        ))}
      </section>

      <nav className="admin-payments__tabs" aria-label="بخش‌های پرداخت">
        <Link className="admin-payments__tab admin-payments__tab--active" href="/admin/payments" aria-current="page">تراکنش‌ها</Link>
        <Link className="admin-payments__tab" href="/admin/payments/settlements">تسویه‌ها</Link>
        <Link className="admin-payments__tab" href="/admin/payments/reconciliation">مغایرت‌ها</Link>
      </nav>

      <section className="admin-payments__controls" aria-label="جستجو و فیلتر پرداخت‌ها">
        <div className="admin-payments__filters">
          {filters.map((filter) => (
            <button className={`admin-payments__filter admin-payments__filter--${filter.tone}`} type="button" key={filter.label}>
              {filter.label}
            </button>
          ))}
        </div>
        <label className="admin-payments__search">
          <span className="admin-payments__sr-only">جستجوی پرداخت‌ها</span>
          <input type="search" placeholder="جستجو با نام کاربر، شماره پرونده یا شناسه پرداخت" />
        </label>
      </section>

      <section className="admin-payments__table-card">
        <div className="admin-payments__table-wrap">
          <div className="admin-payments__table" role="table" aria-label="فهرست پرداخت‌ها">
            <div className="admin-payments__row admin-payments__row--head" role="row">
              <span role="columnheader">اقدام</span>
              <span role="columnheader">زمان</span>
              <span role="columnheader">وضعیت</span>
              <span role="columnheader">مبلغ</span>
              <span role="columnheader">نوع تراکنش</span>
              <span role="columnheader">پرونده</span>
              <span role="columnheader">کاربر</span>
            </div>

            {payments.map((item) => (
              <div className="admin-payments__row" role="row" key={item.id}>
                <span role="cell">
                  <Link className={`admin-payments__action admin-payments__action--${item.actionTone}`} href={`/admin/payments/${item.id}`}>
                    {item.action}
                  </Link>
                </span>
                <span className="admin-payments__muted" role="cell">{item.time}</span>
                <span role="cell"><span className={`admin-payments__badge admin-payments__badge--${item.statusTone}`}>{item.status}</span></span>
                <strong role="cell">{item.amount}</strong>
                <span role="cell">{item.type}</span>
                <strong role="cell">{item.caseId}</strong>
                <strong role="cell">{item.user}</strong>
              </div>
            ))}
          </div>
        </div>

        <footer className="admin-payments__footer">
          <nav className="admin-payments__pagination" aria-label="صفحه‌بندی پرداخت‌ها">
            <button type="button">قبلی</button>
            <button className="admin-payments__page--active" type="button" aria-current="page">۱</button>
            <button type="button">۲</button>
            <button type="button">۳</button>
            <button type="button">بعدی</button>
          </nav>
          <p>نمایش ۱۰ پرداخت از ۱٬۲۸۴ پرداخت</p>
        </footer>
      </section>
    </section>
  );
}
