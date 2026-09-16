import Link from "next/link";

const tabs = [["عمومی","/admin/settings"],["ماشین‌حساب","/admin/settings/calculator"],["سایت","/admin/settings/website"],["پیامک","/admin/settings/sms"],["API","/admin/settings/integrations"],["طرح‌های مالی","/admin/settings/financial-products"],["طرح‌های عضویت","/admin/settings/membership-plans"]] as const;

type PageProps = { params: Promise<{ id: string }> };

export default async function AdminCalculatorRuleEditorPage({ params }: PageProps) {
  const { id } = await params;
  const ruleId = decodeURIComponent(id || "CAL-1405-02");
  return (
    <section className="admin-settings admin-calculator" data-node-id="872:12" data-name="Admin / Settings / Calculator / Rule Editor">
      <header className="admin-settings__header"><h1>تنظیمات</h1><p>مدیریت Ruleها، پارامترها، تست، نسخه‌بندی و انتشار تنظیمات محاسباتی چارخونه</p></header>
      <nav className="admin-settings__tabs" aria-label="بخش‌های تنظیمات">{tabs.map(([label, href]) => <Link className={`admin-settings__tab${href === "/admin/settings/calculator" ? " admin-settings__tab--active" : ""}`} href={href} key={href}>{label}</Link>)}</nav>

      <section className="admin-settings__panel admin-calculator__editor admin-calculator__editor--focused">
        <div className="admin-settings__panel-heading"><h2>تنظیم Rule منتخب</h2><p>نمونه: {ruleId} — تغییرات قبل از انتشار به‌صورت پیش‌نویس ذخیره می‌شوند.</p></div>
        <div className="admin-calculator__badges"><b className="admin-settings__badge admin-settings__badge--success">فعال</b><b className="admin-settings__badge admin-settings__badge--success">متصل به ۲ طرح</b></div>
        <div className="admin-settings__fields admin-calculator__field-grid">
          <label><span>حداقل مبلغ</span><input defaultValue="۵۰ میلیون تومان" /></label><label><span>حداکثر مبلغ</span><input defaultValue="۵۰۰ میلیون تومان" /></label>
          <label><span>کارمزد پیش‌فرض</span><input defaultValue="۱٫۵٪" /></label><label><span>نرخ تبدیل رهن / اجاره</span><input defaultValue="مقدار قراردادی Rule" readOnly /></label>
          <label><span>گرد کردن مبلغ</span><input defaultValue="نزدیک‌ترین ۱۰٬۰۰۰ تومان" /></label><label><span>مدت اعتبار نتیجه</span><input defaultValue="۲۴ ساعت" /></label>
        </div>
        <div className="admin-calculator__actions"><button className="admin-settings__secondary" type="button">ذخیره پیش‌نویس</button><button className="admin-settings__primary" type="button">ذخیره و انتشار</button><button className="admin-calculator__warning" type="button">غیرفعال کردن</button></div>
      </section>

      <section className="admin-settings__panel admin-calculator__test admin-calculator__test--editor"><div className="admin-settings__panel-heading"><h2>تست Rule قبل از انتشار</h2><p>ورودی نمونه را اجرا کنید تا اعتبار محدودیت‌ها و خروجی Rule قبل از انتشار بررسی شود.</p></div><div className="admin-calculator__test-grid"><label><span>Rule تست</span><input defaultValue={ruleId} /></label><label><span>ودیعه نمونه</span><input defaultValue="۴۰۰ میلیون تومان" /></label><label><span>اجاره نمونه</span><input defaultValue="۸ میلیون تومان" /></label><article><span>نتیجه تست</span><strong>موفق — ورودی در محدوده Rule</strong></article><button className="admin-settings__primary" type="button">اجرای تست</button></div></section>
      <section className="admin-settings__panel admin-calculator__versions"><div className="admin-settings__panel-heading"><h2>نسخه‌بندی و انتشار</h2><p>هر انتشار نسخه جدید می‌سازد و نسخه قبلی برای بازگشت اضطراری حفظ می‌شود.</p></div><div className="admin-calculator__version-grid"><article><strong>۱۴۰۵.۲</strong><b className="admin-settings__badge admin-settings__badge--success">فعال</b><span>امروز ۱۰:۳۰</span></article><article><strong>۱۴۰۵.۳</strong><b className="admin-settings__badge admin-settings__badge--warning">پیش‌نویس</b><span>۳ تغییر</span></article><button className="admin-settings__secondary" type="button">بازگشت به نسخه قبل</button><button className="admin-settings__primary" type="button">انتشار نسخه جدید</button></div></section>
    </section>
  );
}
