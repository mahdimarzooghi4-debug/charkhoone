import Link from "next/link";

const metrics = [
  { label: "قرارداد نزدیک انقضا", value: "۳ قرارداد", note: "پایان اعتبار تا ۳۰ روز آینده" },
  { label: "مانده در انتظار تسویه", value: "۱.۸ میلیارد تومان", note: "تسویه‌نشده با شرکا" },
  { label: "اتصال‌های فعال", value: "۱۸ اتصال", note: "API و Webhook در دسترس" },
  { label: "همکاران فعال", value: "۲۱ همکار", note: "از ۲۴ همکار ثبت‌شده" },
] as const;

const filters = [
  { label: "همه", tone: "active" },
  { label: "بانک و صندوق", tone: "warning" },
  { label: "کارگزاری", tone: "neutral" },
  { label: "سازمان", tone: "neutral" },
] as const;

const partners = [
  { id: "bank-tosee-maskan", name: "بانک توسعه مسکن", type: "بانک", activeCases: "۱۱۲", connection: "API", financialStatus: "تسویه‌شده", statusTone: "success", settlement: "ماهانه" },
  { id: "fund-maskane-atiye", name: "صندوق مسکن آتیه", type: "صندوق", activeCases: "۷۸", connection: "API", financialStatus: "در انتظار تسویه", statusTone: "warning", settlement: "هفتگی" },
  { id: "brokerage-sarmaye-iranian", name: "کارگزاری سرمایه ایرانیان", type: "کارگزاری", activeCases: "۴۱", connection: "Webhook", financialStatus: "تسویه‌شده", statusTone: "success", settlement: "هفتگی" },
  { id: "org-refah-karkonan", name: "سازمان رفاه کارکنان", type: "سازمان", activeCases: "۶۳", connection: "API", financialStatus: "بدهکار", statusTone: "danger", settlement: "ماهانه" },
  { id: "bank-shahr-nemune", name: "بانک شهر نمونه", type: "بانک", activeCases: "۹۴", connection: "API", financialStatus: "تسویه‌شده", statusTone: "success", settlement: "روزانه" },
  { id: "fund-sarmayegozari-omid", name: "صندوق سرمایه‌گذاری امید", type: "صندوق", activeCases: "۲۷", connection: "فایل", financialStatus: "در انتظار تسویه", statusTone: "warning", settlement: "ماهانه" },
  { id: "brokerage-tosee-bazar", name: "کارگزاری توسعه بازار", type: "کارگزاری", activeCases: "۱۹", connection: "Webhook", financialStatus: "بدون مانده", statusTone: "neutral", settlement: "هفتگی" },
  { id: "org-nemune", name: "سازمان نمونه", type: "سازمان", activeCases: "۵۸", connection: "API", financialStatus: "تسویه‌شده", statusTone: "success", settlement: "ماهانه" },
  { id: "bank-taavon-nemune", name: "بانک تعاون نمونه", type: "بانک", activeCases: "۳۶", connection: "API", financialStatus: "در انتظار تسویه", statusTone: "warning", settlement: "ماهانه" },
  { id: "nahad-hemayati-maskan", name: "نهاد حمایتی مسکن", type: "سازمان", activeCases: "۲۲", connection: "دستی", financialStatus: "بدون مانده", statusTone: "neutral", settlement: "ماهانه" },
] as const;

export default function AdminPartnersPage() {
  return (
    <section className="admin-partners" data-node-id="717:12" data-name="Admin / Partners">
      <header className="admin-partners__header">
        <div className="admin-partners__header-actions">
          <Link className="admin-partners__add" href="/admin/partners/new">افزودن همکار</Link>
        </div>
        <div className="admin-partners__heading">
          <h1>همکاران</h1>
          <p>مدیریت بانک‌ها، صندوق‌ها، کارگزاری‌ها، سازمان‌ها و نهادهای همکار چارخونه</p>
        </div>
      </header>

      <section className="admin-partners__metrics" aria-label="آمار همکاران">
        {metrics.map((item) => (
          <article className="admin-partners__metric" key={item.label}>
            <span>{item.label}</span>
            <strong>{item.value}</strong>
            <small>{item.note}</small>
          </article>
        ))}
      </section>

      <section className="admin-partners__controls" aria-label="جستجو و فیلتر همکاران">
        <div className="admin-partners__filters">
          {filters.map((filter) => (
            <button className={`admin-partners__filter admin-partners__filter--${filter.tone}`} type="button" key={filter.label}>
              {filter.label}
            </button>
          ))}
        </div>
        <label className="admin-partners__search">
          <span className="admin-partners__sr-only">جستجوی همکاران</span>
          <input type="search" placeholder="جستجو با نام همکار، شناسه یا نوع همکاری" />
        </label>
      </section>

      <section className="admin-partners__table-card">
        <div className="admin-partners__table-wrap">
          <div className="admin-partners__table" role="table" aria-label="فهرست همکاران">
            <div className="admin-partners__row admin-partners__row--head" role="row">
              <span role="columnheader">اقدام</span>
              <span role="columnheader">دوره تسویه</span>
              <span role="columnheader">وضعیت مالی</span>
              <span role="columnheader">اتصال</span>
              <span role="columnheader">پرونده فعال</span>
              <span role="columnheader">نوع همکار</span>
              <span role="columnheader">نام همکار</span>
            </div>

            {partners.map((partner) => (
              <div className="admin-partners__row" role="row" key={partner.id}>
                <span role="cell">
                  <Link className="admin-partners__manage" href={`/admin/partners/${partner.id}`}>مدیریت</Link>
                </span>
                <span role="cell">{partner.settlement}</span>
                <span role="cell"><span className={`admin-partners__badge admin-partners__badge--${partner.statusTone}`}>{partner.financialStatus}</span></span>
                <strong role="cell">{partner.connection}</strong>
                <span role="cell">{partner.activeCases}</span>
                <strong className="admin-partners__type" role="cell">{partner.type}</strong>
                <strong role="cell">{partner.name}</strong>
              </div>
            ))}
          </div>
        </div>

        <footer className="admin-partners__footer">
          <nav className="admin-partners__pagination" aria-label="صفحه‌بندی همکاران">
            <button type="button">قبلی</button>
            <button className="admin-partners__page--active" type="button" aria-current="page">۱</button>
            <button type="button">۲</button>
            <button type="button">۳</button>
            <button type="button">بعدی</button>
          </nav>
          <p>نمایش ۱۰ همکار از ۲۴ همکار</p>
        </footer>
      </section>
    </section>
  );
}
