import Link from "next/link";

const metrics = [
  { label: "تراکنش بررسی‌شده", value: "۲۹۴ مورد", note: "امروز" },
  { label: "مغایرت باز", value: "۷ مورد", note: "۱۱۰٬۰۰۰٬۰۰۰ تومان" },
  { label: "مغایرت حل‌شده", value: "۱۸ مورد", note: "این هفته" },
  { label: "نیازمند پیگیری", value: "۴ مورد", note: "اولویت بالا" },
] as const;

const filters = [
  { label: "همه", tone: "active" },
  { label: "باز", tone: "warning" },
  { label: "حل‌شده", tone: "neutral" },
  { label: "اولویت بالا", tone: "neutral" },
] as const;

const rows = [
  { description: "مبلغ واریزی کمتر از ثبت سیستم", reference: "REC-24081", source: "بانک توسعه مسکن", difference: "۲٬۴۰۰٬۰۰۰ تومان", status: "باز", tone: "warning", time: "امروز ۱۴:۲۰", action: "بررسی", actionTone: "primary" },
  { description: "تراکنش موفق بدون تطبیق پرونده", reference: "REC-24079", source: "درگاه پرداخت", difference: "۱۸٬۰۰۰٬۰۰۰ تومان", status: "باز", tone: "warning", time: "امروز ۱۳:۵۵", action: "بررسی", actionTone: "secondary" },
  { description: "شناسه پیگیری اصلاح شد", reference: "REC-24074", source: "بانک شهر نمونه", difference: "۰ تومان", status: "حل‌شده", tone: "success", time: "امروز ۱۲:۴۰", action: "مشاهده", actionTone: "secondary" },
  { description: "تسویه شریک در فایل بانکی نیست", reference: "REC-24070", source: "صندوق مسکن آتیه", difference: "۴۵٬۰۰۰٬۰۰۰ تومان", status: "اولویت بالا", tone: "danger", time: "امروز ۱۱:۳۲", action: "بررسی", actionTone: "secondary" },
  { description: "تراکنش تکراری حذف شد", reference: "REC-24066", source: "درگاه پرداخت", difference: "۰ تومان", status: "حل‌شده", tone: "success", time: "امروز ۱۰:۴۸", action: "مشاهده", actionTone: "primary" },
  { description: "اختلاف کارمزد شریک", reference: "REC-24059", source: "بانک تعاون نمونه", difference: "۶٬۵۰۰٬۰۰۰ تومان", status: "باز", tone: "warning", time: "دیروز", action: "بررسی", actionTone: "secondary" },
  { description: "ثبت دیرهنگام Webhook", reference: "REC-24052", source: "کارگزاری سرمایه ایرانیان", difference: "۰ تومان", status: "حل‌شده", tone: "success", time: "دیروز", action: "مشاهده", actionTone: "primary" },
  { description: "شبا مقصد با پرونده همخوان نیست", reference: "REC-24041", source: "تسویه مالکان", difference: "۱۲٬۰۰۰٬۰۰۰ تومان", status: "باز", tone: "warning", time: "۲ روز پیش", action: "بررسی", actionTone: "secondary" },
  { description: "تاریخ ارزش اصلاح شد", reference: "REC-24036", source: "بانک توسعه مسکن", difference: "۰ تومان", status: "حل‌شده", tone: "success", time: "۲ روز پیش", action: "مشاهده", actionTone: "secondary" },
  { description: "تعدیل دستی نیازمند مستندات", reference: "REC-24025", source: "سامانه داخلی", difference: "۳٬۸۰۰٬۰۰۰ تومان", status: "باز", tone: "warning", time: "۳ روز پیش", action: "بررسی", actionTone: "primary" },
] as const;

export default function AdminReconciliationPage() {
  return (
    <section className="admin-payments" data-node-id="730:383" data-name="Admin / Payments / Reconciliation">
      <header className="admin-payments__header">
        <div className="admin-payments__header-actions"><button className="admin-payments__export" type="button">خروجی</button><Link className="admin-payments__manual" href="/admin/payments/manual">ثبت پرداخت دستی</Link></div>
        <div className="admin-payments__heading"><h1>پرداخت‌ها</h1><p>مدیریت تراکنش‌ها، تسویه‌ها، مغایرت‌های مالی و ثبت پرداخت دستی در چارخونه</p></div>
      </header>
      <section className="admin-payments__metrics" aria-label="آمار مغایرت‌ها">{metrics.map((item) => <article className="admin-payments__metric" key={item.label}><span>{item.label}</span><strong>{item.value}</strong><small>{item.note}</small></article>)}</section>
      <nav className="admin-payments__tabs" aria-label="بخش‌های پرداخت"><Link className="admin-payments__tab" href="/admin/payments">تراکنش‌ها</Link><Link className="admin-payments__tab" href="/admin/payments/settlements">تسویه‌ها</Link><Link className="admin-payments__tab admin-payments__tab--active" href="/admin/payments/reconciliation" aria-current="page">مغایرت‌ها</Link></nav>
      <section className="admin-payments__controls" aria-label="جستجو و فیلتر مغایرت‌ها"><div className="admin-payments__filters">{filters.map((item) => <button className={`admin-payments__filter admin-payments__filter--${item.tone}`} type="button" key={item.label}>{item.label}</button>)}</div><label className="admin-payments__search"><span className="admin-payments__sr-only">جستجوی مغایرت‌ها</span><input type="search" placeholder="جستجو با شناسه مرجع، منبع یا شرح مغایرت" /></label></section>
      <section className="admin-payments__table-card"><div className="admin-payments__table-wrap"><div className="admin-payments__table" role="table" aria-label="فهرست مغایرت‌ها">
        <div className="admin-payments__row admin-payments__row--head" role="row"><span role="columnheader">اقدام</span><span role="columnheader">به‌روزرسانی</span><span role="columnheader">وضعیت</span><span role="columnheader">اختلاف</span><span role="columnheader">منبع</span><span role="columnheader">شناسه مرجع</span><span role="columnheader">شرح مغایرت</span></div>
        {rows.map((item) => <div className="admin-payments__row" role="row" key={item.reference}><span role="cell"><button className={`admin-payments__action admin-payments__action--${item.actionTone}`} type="button">{item.action}</button></span><span className="admin-payments__muted" role="cell">{item.time}</span><span role="cell"><span className={`admin-payments__badge admin-payments__badge--${item.tone}`}>{item.status}</span></span><strong role="cell">{item.difference}</strong><span role="cell">{item.source}</span><strong role="cell">{item.reference}</strong><strong role="cell">{item.description}</strong></div>)}
      </div></div><footer className="admin-payments__footer"><nav className="admin-payments__pagination" aria-label="صفحه‌بندی مغایرت‌ها"><button type="button">قبلی</button><button className="admin-payments__page--active" type="button" aria-current="page">۱</button><button type="button">۲</button><button type="button">۳</button><button type="button">بعدی</button></nav><p>نمایش ۱۰ پرداخت از ۱٬۲۸۴ پرداخت</p></footer></section>
    </section>
  );
}
