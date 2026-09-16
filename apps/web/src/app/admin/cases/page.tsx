import Link from "next/link";

const metrics = [
  { label: "تأمین مالی فعال", value: "۲۸۴ پرونده", note: "پرونده‌های فعال با جریان مالی جاری" },
  { label: "در بررسی شریک مالی", value: "۹۶ پرونده", note: "در انتظار یا در حال بررسی بانک و صندوق" },
  { label: "نیازمند بررسی", value: "۱۲ پرونده", note: "نیازمند اقدام تیم چارخونه" },
  { label: "پرونده‌های در جریان", value: "۴۲۳ پرونده", note: "تمام پرونده‌های باز پلتفرم" },
] as const;

const filters = [
  { label: "همه", tone: "active" },
  { label: "نیازمند بررسی", tone: "warning" },
  { label: "در بررسی", tone: "neutral" },
  { label: "فعال", tone: "neutral" },
] as const;

const cases = [
  { id: "CS-1405-1182", user: "علی رضایی", stage: "فعال", stageTone: "success", partner: "بانک نمونه", payment: "پرداخت‌شده", paymentTone: "success", updated: "امروز" },
  { id: "CS-1405-1181", user: "مریم احمدی", stage: "در بررسی", stageTone: "neutral", partner: "بانک توسعه", payment: "—", paymentTone: "neutral", updated: "امروز" },
  { id: "CS-1405-1178", user: "رضا کاظمی", stage: "ارسال‌شده به بانک", stageTone: "neutral", partner: "بانک نمونه", payment: "—", paymentTone: "neutral", updated: "امروز" },
  { id: "CS-1405-1176", user: "سارا محمدی", stage: "نیازمند تکمیل", stageTone: "warning", partner: "—", payment: "—", paymentTone: "neutral", updated: "دیروز" },
  { id: "CS-1405-1170", user: "امیر حسینی", stage: "تأیید شریک مالی", stageTone: "success", partner: "بانک توسعه", payment: "آماده پرداخت", paymentTone: "warning", updated: "دیروز" },
  { id: "CS-1405-1168", user: "نگار کریمی", stage: "فعال", stageTone: "success", partner: "بانک نمونه", payment: "پرداخت‌شده", paymentTone: "success", updated: "۲ روز پیش" },
  { id: "CS-1405-1163", user: "محمد مرادی", stage: "در انتظار تأیید", stageTone: "warning", partner: "صندوق مسکن", payment: "—", paymentTone: "neutral", updated: "۲ روز پیش" },
  { id: "CS-1405-1159", user: "زهرا اکبری", stage: "ردشده", stageTone: "danger", partner: "بانک توسعه", payment: "—", paymentTone: "neutral", updated: "۳ روز پیش", partnerTone: "danger" },
  { id: "CS-1405-1156", user: "حسین عباسی", stage: "در بررسی", stageTone: "neutral", partner: "صندوق مسکن", payment: "—", paymentTone: "neutral", updated: "۴ روز پیش" },
  { id: "CS-1405-1150", user: "الهام یوسفی", stage: "ارسال‌شده به بانک", stageTone: "neutral", partner: "بانک نمونه", payment: "—", paymentTone: "neutral", updated: "۵ روز پیش" },
] as const;

export default function AdminCasesPage() {
  return (
    <section className="admin-cases" data-node-id="698:12" data-name="Admin / Cases">
      <header className="admin-cases__header">
        <button className="admin-cases__export" type="button">خروجی</button>
        <div className="admin-cases__heading">
          <h1>پرونده‌ها</h1>
          <p>مدیریت، پایش و کنترل مرحله پرونده‌ها، شریک مالی و وضعیت بررسی در کل پلتفرم چارخونه</p>
        </div>
      </header>

      <section className="admin-cases__metrics" aria-label="آمار پرونده‌ها">
        {metrics.map((item) => (
          <article className="admin-cases__metric" key={item.label}>
            <span>{item.label}</span>
            <strong>{item.value}</strong>
            <small>{item.note}</small>
          </article>
        ))}
      </section>

      <section className="admin-cases__controls" aria-label="جستجو و فیلتر پرونده‌ها">
        <div className="admin-cases__filters">
          {filters.map((filter) => (
            <button className={`admin-cases__filter admin-cases__filter--${filter.tone}`} type="button" key={filter.label}>
              {filter.label}
            </button>
          ))}
        </div>
        <label className="admin-cases__search">
          <span className="admin-cases__sr-only">جستجوی پرونده‌ها</span>
          <input type="search" placeholder="جستجو با نام، کد ملی یا شماره پرونده" />
        </label>
      </section>

      <section className="admin-cases__table-card">
        <div className="admin-cases__table-wrap">
          <div className="admin-cases__table" role="table" aria-label="فهرست پرونده‌ها">
            <div className="admin-cases__row admin-cases__row--head" role="row">
              <span role="columnheader">اقدام</span>
              <span role="columnheader">به‌روزرسانی</span>
              <span role="columnheader">وضعیت پرداخت</span>
              <span role="columnheader">شریک مالی</span>
              <span role="columnheader">مرحله پرونده</span>
              <span role="columnheader">شماره پرونده</span>
              <span role="columnheader">کاربر</span>
            </div>

            {cases.map((item) => (
              <div className="admin-cases__row" role="row" key={item.id}>
                <span role="cell"><Link className="admin-cases__manage" href={`/admin/cases/${item.id}`}>مدیریت</Link></span>
                <span className="admin-cases__muted" role="cell">{item.updated}</span>
                <span role="cell"><span className={`admin-cases__badge admin-cases__badge--${item.paymentTone}`}>{item.payment}</span></span>
                <span className={"partnerTone" in item && item.partnerTone === "danger" ? "admin-cases__partner--danger" : ""} role="cell">{item.partner}</span>
                <span role="cell"><span className={`admin-cases__badge admin-cases__badge--${item.stageTone}`}>{item.stage}</span></span>
                <strong role="cell">{item.id}</strong>
                <strong role="cell">{item.user}</strong>
              </div>
            ))}
          </div>
        </div>

        <footer className="admin-cases__footer">
          <nav className="admin-cases__pagination" aria-label="صفحه‌بندی پرونده‌ها">
            <button type="button">قبلی</button>
            <button className="admin-cases__page--active" type="button" aria-current="page">۱</button>
            <button type="button">۲</button>
            <button type="button">۳</button>
            <button type="button">بعدی</button>
          </nav>
          <p>نمایش ۱۰ پرونده از ۴۲۳ پرونده</p>
        </footer>
      </section>
    </section>
  );
}
