import Link from "next/link";

const tabs = [
  ["عمومی", "/admin/settings"], ["ماشین‌حساب", "/admin/settings/calculator"], ["سایت", "/admin/settings/website"], ["پیامک", "/admin/settings/sms"], ["API", "/admin/settings/integrations"], ["طرح‌های مالی", "/admin/settings/financial-products"], ["طرح‌های عضویت", "/admin/settings/membership-plans"],
] as const;
const metrics = [
  { label: "نسخه فعال", value: "۱۴۰۵.۲", note: "منتشرشده برای کاربران" },
  { label: "Ruleهای فعال", value: "۴", note: "متصل به طرح‌های مالی" },
  { label: "تغییرات پیش‌نویس", value: "۳ تغییر", note: "هنوز منتشر نشده" },
  { label: "آخرین انتشار", value: "امروز ۱۰:۳۰", note: "بدون خطای گزارش‌شده" },
] as const;
const rules = [
  { id: "CAL-1405-02", linkId: "CAL-1405-02", connection: "طرح ودیعه", version: "۱۴۰۵.۲", status: "فعال", tone: "success" },
  { id: "CAL-1405-01", linkId: "CAL-1405-01", connection: "اجاره سازمانی", version: "۱۴۰۵.۱", status: "فعال", tone: "success" },
  { id: "CAL-1405-03", linkId: "CAL-1405-03", connection: "تأمین مالی آتیه", version: "۱۴۰۵.۱", status: "فعال", tone: "success" },
  { id: "CAL-1405-04", linkId: "CAL-1405-04", connection: "طرح آزمایشی", version: "پیش‌نویس", status: "پیش‌نویس", tone: "warning" },
] as const;

function SettingsTabs() {
  return <nav className="admin-settings__tabs" aria-label="بخش‌های تنظیمات">{tabs.map(([label, href]) => <Link className={`admin-settings__tab${href === "/admin/settings/calculator" ? " admin-settings__tab--active" : ""}`} href={href} key={href}>{label}</Link>)}</nav>;
}

export default function AdminCalculatorPage() {
  return (
    <section className="admin-settings admin-calculator" data-node-id="732:12" data-name="Admin / Settings / Calculator">
      <header className="admin-settings__header"><h1>تنظیمات</h1><p>مدیریت Ruleها، پارامترها، تست، نسخه‌بندی و انتشار تنظیمات محاسباتی چارخونه</p></header>
      <SettingsTabs />
      <section className="admin-settings__metrics">{metrics.map((item) => <article key={item.label}><span>{item.label}</span><strong>{item.value}</strong><small>{item.note}</small></article>)}</section>

      <div className="admin-calculator__columns">
        <section className="admin-settings__panel admin-calculator__rules">
          <div className="admin-settings__panel-heading"><h2>Ruleهای ماشین‌حساب</h2><p>هر Rule می‌تواند به یک یا چند طرح مالی متصل شود و مستقل نسخه‌بندی شود.</p></div>
          <div className="admin-calculator__rule-table" role="table">
            <div className="admin-calculator__rule-row admin-calculator__rule-row--head" role="row"><span>اقدام</span><span>وضعیت</span><span>نسخه</span><span>اتصال</span><span>Rule</span></div>
            {rules.map((rule) => <div className="admin-calculator__rule-row" role="row" key={rule.id}><span><Link className="admin-settings__secondary admin-calculator__manage" href={`/admin/settings/calculator/rules/${rule.linkId}`}>مدیریت</Link></span><span><b className={`admin-settings__badge admin-settings__badge--${rule.tone}`}>{rule.status}</b></span><span>{rule.version}</span><span>{rule.connection}</span><strong>{rule.id}</strong></div>)}
          </div>
          <div className="admin-calculator__rule-footer"><button className="admin-settings__primary" type="button">Rule جدید</button><p>۴ Rule فعال از ۵ Rule ثبت‌شده</p></div>
        </section>

        <section className="admin-settings__panel admin-calculator__editor">
          <div className="admin-settings__panel-heading"><h2>تنظیم Rule منتخب</h2><p>نمونه: CAL-1405-02 — تغییرات قبل از انتشار به‌صورت پیش‌نویس ذخیره می‌شوند.</p></div>
          <div className="admin-calculator__badges"><b className="admin-settings__badge admin-settings__badge--success">فعال</b><b className="admin-settings__badge admin-settings__badge--success">متصل به ۲ طرح</b></div>
          <div className="admin-settings__fields admin-calculator__field-grid">
            <label><span>حداقل مبلغ</span><input defaultValue="۵۰ میلیون تومان" /></label><label><span>حداکثر مبلغ</span><input defaultValue="۵۰۰ میلیون تومان" /></label>
            <label><span>کارمزد پیش‌فرض</span><input defaultValue="۱٫۵٪" /></label><label><span>نرخ تبدیل رهن / اجاره</span><input defaultValue="مقدار قراردادی Rule" readOnly /></label>
            <label><span>گرد کردن مبلغ</span><input defaultValue="نزدیک‌ترین ۱۰٬۰۰۰ تومان" /></label><label><span>مدت اعتبار نتیجه</span><input defaultValue="۲۴ ساعت" /></label>
          </div>
          <div className="admin-calculator__actions"><button className="admin-settings__secondary" type="button">ذخیره پیش‌نویس</button><button className="admin-settings__primary" type="button">ذخیره و انتشار</button><button className="admin-calculator__warning" type="button">غیرفعال کردن</button></div>
        </section>
      </div>

      <section className="admin-settings__panel admin-calculator__test"><div className="admin-settings__panel-heading"><h2>تست Rule قبل از انتشار</h2><p>ورودی نمونه را اجرا کنید تا اعتبار محدودیت‌ها و خروجی Rule قبل از انتشار بررسی شود.</p></div><div className="admin-calculator__test-grid"><label><span>Rule تست</span><input defaultValue="CAL-1405-02" /></label><label><span>ودیعه نمونه</span><input defaultValue="۴۰۰ میلیون تومان" /></label><label><span>اجاره نمونه</span><input defaultValue="۸ میلیون تومان" /></label><article><span>نتیجه تست</span><strong>موفق — ورودی در محدوده Rule</strong></article><button className="admin-settings__primary" type="button">اجرای تست</button></div></section>

      <section className="admin-settings__panel admin-calculator__versions"><div className="admin-settings__panel-heading"><h2>نسخه‌بندی و انتشار</h2><p>هر انتشار نسخه جدید می‌سازد و نسخه قبلی برای بازگشت اضطراری حفظ می‌شود.</p></div><div className="admin-calculator__version-grid"><article><strong>۱۴۰۵.۲</strong><b className="admin-settings__badge admin-settings__badge--success">فعال</b><span>امروز ۱۰:۳۰</span></article><article><strong>۱۴۰۵.۳</strong><b className="admin-settings__badge admin-settings__badge--warning">پیش‌نویس</b><span>۳ تغییر</span></article><button className="admin-settings__secondary" type="button">بازگشت به نسخه قبل</button><button className="admin-settings__primary" type="button">انتشار نسخه جدید</button></div></section>
    </section>
  );
}
