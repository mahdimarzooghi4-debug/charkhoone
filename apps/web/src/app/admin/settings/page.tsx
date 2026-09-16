import Link from "next/link";

const tabs = [
  ["عمومی", "/admin/settings"],
  ["ماشین‌حساب", "/admin/settings/calculator"],
  ["سایت", "/admin/settings/website"],
  ["پیامک", "/admin/settings/sms"],
  ["API", "/admin/settings/integrations"],
  ["طرح‌های مالی", "/admin/settings/financial-products"],
  ["طرح‌های عضویت", "/admin/settings/membership-plans"],
] as const;

const metrics = [
  { label: "محیط عملیاتی", value: "Production", note: "تنظیمات روی سامانه اصلی اعمال می‌شود" },
  { label: "وضعیت پلتفرم", value: "آنلاین", note: "ورود، پرونده و پرداخت در دسترس" },
  { label: "حالت نگهداری", value: "غیرفعال", note: "آخرین نگهداری: ۱۴۰۵/۰۵/۲۱" },
  { label: "نیازمند اقدام", value: "۲ مورد", note: "یک Credential و یک هشدار سرویس" },
] as const;

const services = [
  { name: "ورود و ثبت‌نام", time: "امروز ۱۴:۳۲", status: "فعال", tone: "success", action: "محدود کردن" },
  { name: "احراز هویت", time: "امروز ۱۴:۲۸", status: "فعال", tone: "success", action: "محدود کردن" },
  { name: "پرونده‌ها", time: "امروز ۱۴:۳۰", status: "فعال", tone: "success", action: "محدود کردن" },
  { name: "پرداخت‌ها", time: "امروز ۱۴:۳۱", status: "فعال", tone: "success", action: "محدود کردن" },
  { name: "پیام‌ها و اعلان‌ها", time: "امروز ۱۴:۲۰", status: "محدود", tone: "warning", action: "فعال کردن" },
] as const;

export default function AdminSettingsPage() {
  return (
    <section className="admin-settings" data-node-id="721:12" data-name="Admin / Settings">
      <header className="admin-settings__header"><h1>تنظیمات</h1><p>کنترل تنظیمات پایه پلتفرم، سلامت سرویس‌ها، دسترسی سراسری و حالت نگهداری چارخونه</p></header>
      <nav className="admin-settings__tabs" aria-label="بخش‌های تنظیمات">{tabs.map(([label, href], index) => <Link className={`admin-settings__tab${index === 0 ? " admin-settings__tab--active" : ""}`} href={href} key={href} aria-current={index === 0 ? "page" : undefined}>{label}</Link>)}</nav>
      <section className="admin-settings__metrics" aria-label="وضعیت عمومی">{metrics.map((item) => <article key={item.label}><span>{item.label}</span><strong>{item.value}</strong><small>{item.note}</small></article>)}</section>

      <section className="admin-settings__panel">
        <div className="admin-settings__panel-heading"><h2>اطلاعات پلتفرم و پشتیبانی</h2><p>اطلاعات پایه‌ای که در کانال‌های عمومی، پشتیبانی و پیام‌های سیستمی استفاده می‌شوند.</p></div>
        <div className="admin-settings__fields admin-settings__fields--four">
          <label><span>نام پلتفرم</span><input defaultValue="چارخونه" /></label>
          <label><span>ایمیل پشتیبانی</span><input dir="ltr" defaultValue="support@charkhooneh.ir" /></label>
          <label><span>شماره پشتیبانی</span><input defaultValue="۰۲۱-۹۱۰۰۰۰۰۰" /></label>
          <label><span>منطقه زمانی</span><input defaultValue="تهران (UTC+03:30)" /></label>
        </div>
        <button className="admin-settings__primary" type="button">ذخیره اطلاعات</button>
      </section>

      <section className="admin-settings__panel">
        <div className="admin-settings__panel-heading"><h2>کنترل سرویس‌های اصلی</h2><p>هر سرویس را مستقل محدود یا فعال کنید؛ تغییر وضعیت روی تجربه کاربر اعمال می‌شود.</p></div>
        <div className="admin-settings__service-table" role="table" aria-label="سرویس‌های اصلی">
          <div className="admin-settings__service-row admin-settings__service-row--head" role="row"><span>اقدام</span><span>وضعیت</span><span>آخرین بررسی</span><span>سرویس</span></div>
          {services.map((item) => <div className="admin-settings__service-row" role="row" key={item.name}><span><button type="button" className={item.tone === "warning" ? "admin-settings__primary admin-settings__primary--small" : "admin-settings__secondary admin-settings__secondary--small"}>{item.action}</button></span><span><b className={`admin-settings__badge admin-settings__badge--${item.tone}`}>{item.status}</b></span><span>{item.time}</span><strong>{item.name}</strong></div>)}
        </div>
      </section>

      <div className="admin-settings__split">
        <section className="admin-settings__panel"><div className="admin-settings__panel-heading"><h2>حالت نگهداری و پیام سراسری</h2><p>برای نگهداری برنامه‌ریزی‌شده، دسترسی کاربران را موقتاً محدود و پیام عمومی نمایش دهید.</p></div><div className="admin-settings__mini-grid"><article><span>وضعیت فعلی</span><strong>غیرفعال</strong></article><article><span>بازه برنامه‌ریزی‌شده</span><strong>تعریف نشده</strong></article><article><span>پیام کاربران</span><strong>سامانه در دسترس است</strong></article></div></section>
        <section className="admin-settings__panel"><div className="admin-settings__panel-heading"><h2>کنترل دسترسی سراسری</h2><p>در شرایط عملیاتی می‌توانید ورود، ایجاد پرونده یا پرداخت جدید را بدون قطع کامل سامانه محدود کنید.</p></div><div className="admin-settings__mini-grid"><article><span>ثبت‌نام جدید</span><strong className="admin-settings__ok">مجاز</strong></article><article><span>ایجاد پرونده</span><strong className="admin-settings__ok">مجاز</strong></article><article><span>پرداخت جدید</span><strong className="admin-settings__ok">مجاز</strong></article></div><button className="admin-settings__primary" type="button">ذخیره دسترسی‌ها</button></section>
      </div>
      <p className="admin-settings__audit">آخرین تغییر تنظیمات عمومی: امروز ۱۳:۵۵ — همه تغییرات مدیریتی با زمان و کاربر ثبت می‌شوند.</p>
    </section>
  );
}
