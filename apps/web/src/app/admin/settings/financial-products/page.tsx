import Link from "next/link";

const tabs = [["عمومی","/admin/settings"],["ماشین‌حساب","/admin/settings/calculator"],["سایت","/admin/settings/website"],["پیامک","/admin/settings/sms"],["API","/admin/settings/integrations"],["طرح‌های مالی","/admin/settings/financial-products"],["طرح‌های عضویت","/admin/settings/membership-plans"]] as const;
const metrics = [
  { label: "طرح‌های فعال", value: "۵ طرح", note: "قابل انتخاب در تجربه کاربر" },
  { label: "پیش‌نویس", value: "۲ طرح", note: "هنوز منتشر نشده‌اند" },
  { label: "شرکای ارائه‌دهنده", value: "۴ شریک", note: "بانک، صندوق و سازمان" },
  { label: "نیازمند بازبینی", value: "۱ طرح", note: "شرایط مالی در انتظار تأیید" },
] as const;
const products = [
  { id: "deposit-housing", name: "طرح ودیعه مسکن", partner: "بانک توسعه مسکن", ceiling: "۵۰۰ میلیون", fee: "۱٫۵٪", calculator: "CAL-1405-02", status: "فعال", tone: "success" },
  { id: "corporate-rent", name: "طرح اجاره سازمانی", partner: "سازمان رفاه کارکنان", ceiling: "۳۰۰ میلیون", fee: "توافقی", calculator: "CAL-1405-01", status: "فعال", tone: "success" },
  { id: "atiye-financing", name: "طرح تأمین مالی آتیه", partner: "صندوق مسکن آتیه", ceiling: "۷۰۰ میلیون", fee: "۱٫۲٪", calculator: "CAL-1405-03", status: "فعال", tone: "success" },
  { id: "brokerage-pilot", name: "طرح آزمایشی کارگزاری", partner: "کارگزاری سرمایه ایرانیان", ceiling: "۲۵۰ میلیون", fee: "۱٫۸٪", calculator: "CAL-1405-04", status: "پیش‌نویس", tone: "neutral" },
  { id: "urban-housing", name: "طرح مسکن شهری", partner: "بانک شهر نمونه", ceiling: "۴۰۰ میلیون", fee: "۱٫۴٪", calculator: "CAL-1405-02", status: "نیازمند بررسی", tone: "warning" },
] as const;

export default function AdminFinancialProductsPage() {
  return <section className="admin-settings admin-financial-products" data-node-id="755:12" data-name="Admin / Settings / Financial Products">
    <header className="admin-settings__header"><h1>تنظیمات</h1><p>مدیریت طرح‌ها و محصولات مالی، شرایط هر طرح، شریک ارائه‌دهنده و وضعیت انتشار</p></header>
    <nav className="admin-settings__tabs" aria-label="بخش‌های تنظیمات">{tabs.map(([label,href]) => <Link className={`admin-settings__tab${href === "/admin/settings/financial-products" ? " admin-settings__tab--active" : ""}`} href={href} key={href}>{label}</Link>)}</nav>
    <section className="admin-settings__metrics">{metrics.map((item) => <article key={item.label}><span>{item.label}</span><strong>{item.value}</strong><small>{item.note}</small></article>)}</section>
    <div className="admin-financial-products__title-row"><div><h2>طرح‌ها و محصولات مالی</h2><p>شرایط هر طرح، شریک ارائه‌دهنده، محدودیت‌ها و اتصال به ماشین‌حساب را مدیریت کنید.</p></div><Link className="admin-settings__primary admin-financial-products__add" href="/admin/settings/financial-products/new">افزودن طرح مالی</Link></div>
    <section className="admin-settings__panel admin-financial-products__table-card"><div className="admin-financial-products__table" role="table"><div className="admin-financial-products__row admin-financial-products__row--head"><span>اقدام</span><span>وضعیت</span><span>ماشین‌حساب</span><span>کارمزد</span><span>سقف تأمین</span><span>شریک ارائه‌دهنده</span><span>نام طرح</span></div>{products.map((item) => <div className="admin-financial-products__row" key={item.id}><span><Link className="admin-settings__secondary admin-financial-products__manage" href={`/admin/settings/financial-products/${item.id}`}>مدیریت</Link></span><span><b className={`admin-settings__badge admin-settings__badge--${item.tone}`}>{item.status}</b></span><strong className="admin-financial-products__rule">{item.calculator}</strong><span>{item.fee}</span><span>{item.ceiling}</span><span>{item.partner}</span><strong>{item.name}</strong></div>)}</div><p className="admin-financial-products__count">۵ طرح از ۷ طرح ثبت‌شده</p></section>
    <section className="admin-settings__panel admin-financial-products__editor"><div className="admin-financial-products__editor-head"><div><h2>ویرایش طرح مالی منتخب</h2><p>طرح ودیعه مسکن — شرایط مالی و اتصال به ماشین‌حساب را از همین فرم مدیریت کنید.</p></div><div><button className="admin-settings__primary" type="button">ذخیره و انتشار</button><button className="admin-financial-products__draft" type="button">ذخیره پیش‌نویس</button></div></div><div className="admin-financial-products__field-grid"><article><span>نام طرح</span><strong>طرح ودیعه مسکن</strong></article><article><span>شریک ارائه‌دهنده</span><strong>بانک توسعه مسکن</strong></article><article><span>قاعده ماشین‌حساب</span><strong>CAL-1405-02</strong></article><article><span>وضعیت انتشار</span><strong>فعال</strong></article><article><span>حداقل مبلغ</span><strong>۵۰ میلیون تومان</strong></article><article><span>حداکثر مبلغ</span><strong>۵۰۰ میلیون تومان</strong></article><article><span>مدت</span><strong>۱۲ ماه</strong></article><article><span>کارمزد</span><strong>۱٫۵٪</strong></article></div></section>
  </section>;
}
