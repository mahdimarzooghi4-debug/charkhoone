import Link from "next/link";

const tabs = [["عمومی","/admin/settings"],["ماشین‌حساب","/admin/settings/calculator"],["سایت","/admin/settings/website"],["پیامک","/admin/settings/sms"],["API","/admin/settings/integrations"],["طرح‌های مالی","/admin/settings/financial-products"],["طرح‌های عضویت","/admin/settings/membership-plans"]] as const;
const metrics = [
  { label: "نسخه منتشرشده", value: "۱۴۰۵.۱۸", note: "آخرین انتشار امروز ۱۱:۱۵" },
  { label: "تغییرات پیش‌نویس", value: "۶ مورد", note: "منتظر انتشار روی سایت" },
  { label: "بخش‌های فعال", value: "۷ از ۷", note: "همه بخش‌های Landing فعال" },
  { label: "وضعیت سایت", value: "آنلاین", note: "بدون خطای انتشار" },
] as const;
const sections = [
  { id: "hero", name: "Hero", changed: "امروز ۱۰:۴۲" }, { id: "audiences", name: "مخاطبان", changed: "دیروز" }, { id: "how-it-works", name: "نحوه کار", changed: "۲ روز پیش" }, { id: "why-charkhoone", name: "چرا چارخونه", changed: "۴ روز پیش" }, { id: "download", name: "دانلود اپ", changed: "امروز ۰۹:۱۰" }, { id: "final-cta", name: "CTA نهایی", changed: "۵ روز پیش" }, { id: "footer", name: "Footer", changed: "هفته قبل" },
] as const;

export default function AdminWebsiteSettingsPage() {
  return (
    <section className="admin-settings admin-website" data-node-id="732:89" data-name="Admin / Settings / Website">
      <header className="admin-settings__header"><h1>تنظیمات</h1><p>مدیریت محتوای Landing، لینک‌های دانلود، صفحات حقوقی، پیش‌نویس و انتشار نسخه سایت</p></header>
      <nav className="admin-settings__tabs" aria-label="بخش‌های تنظیمات">{tabs.map(([label,href]) => <Link className={`admin-settings__tab${href === "/admin/settings/website" ? " admin-settings__tab--active" : ""}`} href={href} key={href}>{label}</Link>)}</nav>
      <section className="admin-settings__metrics">{metrics.map((item) => <article key={item.label}><span>{item.label}</span><strong>{item.value}</strong><small>{item.note}</small></article>)}</section>

      <div className="admin-website__columns">
        <section className="admin-settings__panel admin-website__sections"><div className="admin-settings__panel-heading"><h2>مدیریت بخش‌های Landing</h2><p>بخش‌ها را فعال/غیرفعال کنید و محتوای هر بخش را از همین صفحه ویرایش کنید.</p></div><div className="admin-website__table" role="table"><div className="admin-website__row admin-website__row--head"><span>اقدام</span><span>وضعیت</span><span>آخرین تغییر</span><span>بخش</span></div>{sections.map((item) => <div className="admin-website__row" key={item.id}><span><Link className="admin-settings__secondary admin-website__edit" href={`/admin/settings/website/sections/${item.id}`}>ویرایش</Link></span><span><b className="admin-settings__badge admin-settings__badge--success">فعال</b></span><span>{item.changed}</span><strong>{item.name}</strong></div>)}</div></section>
        <section className="admin-settings__panel admin-website__editor"><div className="admin-settings__panel-heading"><h2>ویرایش بخش منتخب</h2><p>نمونه: Hero صفحه اصلی</p></div><div className="admin-settings__fields"><label><span>عنوان</span><input defaultValue="راه ساده‌تر برای مدیریت اجاره و تأمین مالی مسکن" /></label><label><span>زیرعنوان</span><input defaultValue="متن معرفی کوتاه و ارزش پیشنهادی چارخونه" /></label><div className="admin-website__pair"><label><span>CTA اصلی</span><input defaultValue="شروع با چارخونه" /></label><label><span>وضعیت انتشار</span><input defaultValue="فعال" /></label></div></div><div className="admin-website__actions"><button className="admin-settings__secondary" type="button">ذخیره پیش‌نویس</button><button className="admin-settings__primary" type="button">ذخیره و انتشار</button></div></section>
      </div>

      <div className="admin-settings__split">
        <section className="admin-settings__panel"><div className="admin-settings__panel-heading"><h2>دانلود اپ و لینک‌ها</h2><p>لینک‌های دانلود و وضعیت انتشار نسخه‌ها را کنترل کنید.</p></div><div className="admin-settings__fields admin-website__two"><label><span>Android</span><input defaultValue="لینک دانلود فعال" /></label><label><span>iOS</span><input defaultValue="به‌زودی" /></label></div><button className="admin-settings__secondary" type="button">ذخیره لینک‌ها</button></section>
        <section className="admin-settings__panel"><div className="admin-settings__panel-heading"><h2>Footer، تماس و صفحات حقوقی</h2><p>اطلاعات تماس، قوانین، حریم خصوصی و لینک شرکا.</p></div><div className="admin-settings__fields admin-website__two"><label><span>اطلاعات تماس</span><input defaultValue="۰۲۱-۹۱۰۰۰۰۰۰ / support@..." /></label><label><span>قوانین و حریم خصوصی</span><input defaultValue="منتشرشده" /></label></div></section>
      </div>

      <section className="admin-settings__panel admin-website__publish"><div className="admin-settings__panel-heading"><h2>انتشار سایت</h2><p>تغییرات ابتدا به‌صورت پیش‌نویس ذخیره می‌شوند و فقط با انتشار ادمین روی سایت اصلی اعمال خواهند شد.</p></div><div className="admin-website__publish-row"><b className="admin-settings__badge admin-settings__badge--success">نسخه ۱۴۰۵.۱۸</b><b className="admin-settings__badge admin-settings__badge--warning">۶ تغییر منتشرنشده</b><span>آخرین انتشار: امروز ۱۱:۱۵</span><button className="admin-settings__primary" type="button">انتشار تغییرات سایت</button></div><small>انتشار، نسخه جدید سایت را ثبت می‌کند و امکان برگشت به نسخه قبل باید در پیاده‌سازی حفظ شود.</small></section>
    </section>
  );
}
