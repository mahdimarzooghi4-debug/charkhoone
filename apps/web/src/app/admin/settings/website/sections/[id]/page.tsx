import Link from "next/link";

const tabs = [["عمومی","/admin/settings"],["ماشین‌حساب","/admin/settings/calculator"],["سایت","/admin/settings/website"],["پیامک","/admin/settings/sms"],["API","/admin/settings/integrations"],["طرح‌های مالی","/admin/settings/financial-products"],["طرح‌های عضویت","/admin/settings/membership-plans"]] as const;

type PageProps = { params: Promise<{ id: string }> };

export default async function AdminWebsiteSectionEditorPage({ params }: PageProps) {
  const { id } = await params;
  const sectionName = id === "hero" ? "Hero صفحه اصلی" : decodeURIComponent(id).replaceAll("-", " ");
  return (
    <section className="admin-settings admin-website" data-node-id="872:390" data-name="Admin / Settings / Website / Section Editor">
      <header className="admin-settings__header"><h1>تنظیمات</h1><p>مدیریت محتوای Landing، لینک‌های دانلود، صفحات حقوقی، پیش‌نویس و انتشار نسخه سایت</p></header>
      <nav className="admin-settings__tabs" aria-label="بخش‌های تنظیمات">{tabs.map(([label,href]) => <Link className={`admin-settings__tab${href === "/admin/settings/website" ? " admin-settings__tab--active" : ""}`} href={href} key={href}>{label}</Link>)}</nav>

      <div className="admin-website__editor-page">
        <section className="admin-settings__panel admin-website__editor admin-website__editor--focus"><div className="admin-settings__panel-heading"><h2>ویرایش بخش منتخب</h2><p>نمونه: {sectionName}</p></div><div className="admin-settings__fields"><label><span>عنوان</span><input defaultValue="راه ساده‌تر برای مدیریت اجاره و تأمین مالی مسکن" /></label><label><span>زیرعنوان</span><input defaultValue="متن معرفی کوتاه و ارزش پیشنهادی چارخونه" /></label><div className="admin-website__pair"><label><span>CTA اصلی</span><input defaultValue="شروع با چارخونه" /></label><label><span>وضعیت انتشار</span><input defaultValue="فعال" /></label></div></div><div className="admin-website__actions"><button className="admin-settings__secondary" type="button">ذخیره پیش‌نویس</button><button className="admin-settings__primary" type="button">ذخیره و انتشار</button></div></section>
      </div>

      <div className="admin-website__support-grid">
        <section className="admin-settings__panel"><div className="admin-settings__panel-heading"><h2>دانلود اپ و لینک‌ها</h2><p>لینک‌های دانلود و وضعیت انتشار نسخه‌ها را کنترل کنید.</p></div><div className="admin-settings__fields admin-website__two"><label><span>Android</span><input defaultValue="لینک دانلود فعال" /></label><label><span>iOS</span><input defaultValue="به‌زودی" /></label></div><button className="admin-settings__secondary" type="button">ذخیره لینک‌ها</button></section>
        <section className="admin-settings__panel"><div className="admin-settings__panel-heading"><h2>Footer، تماس و صفحات حقوقی</h2><p>اطلاعات تماس، قوانین، حریم خصوصی و لینک شرکا.</p></div><div className="admin-settings__fields admin-website__two"><label><span>اطلاعات تماس</span><input defaultValue="۰۲۱-۹۱۰۰۰۰۰۰ / support@..." /></label><label><span>قوانین و حریم خصوصی</span><input defaultValue="منتشرشده" /></label></div></section>
      </div>

      <section className="admin-settings__panel admin-website__publish"><div className="admin-settings__panel-heading"><h2>انتشار سایت</h2><p>تغییرات ابتدا به‌صورت پیش‌نویس ذخیره می‌شوند و فقط با انتشار ادمین روی سایت اصلی اعمال خواهند شد.</p></div><div className="admin-website__publish-row"><b className="admin-settings__badge admin-settings__badge--success">نسخه ۱۴۰۵.۱۸</b><b className="admin-settings__badge admin-settings__badge--warning">۶ تغییر منتشرنشده</b><span>آخرین انتشار: امروز ۱۱:۱۵</span><button className="admin-settings__primary" type="button">انتشار تغییرات سایت</button></div><small>انتشار، نسخه جدید سایت را ثبت می‌کند و امکان برگشت به نسخه قبل باید در پیاده‌سازی حفظ شود.</small></section>
    </section>
  );
}
