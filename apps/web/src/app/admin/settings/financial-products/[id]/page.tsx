import Link from "next/link";

const tabs = [["عمومی","/admin/settings"],["ماشین‌حساب","/admin/settings/calculator"],["سایت","/admin/settings/website"],["پیامک","/admin/settings/sms"],["API","/admin/settings/integrations"],["طرح‌های مالی","/admin/settings/financial-products"],["طرح‌های عضویت","/admin/settings/membership-plans"]] as const;
const productMap = {
  "deposit-housing": { name:"طرح ودیعه مسکن", partner:"بانک توسعه مسکن", rule:"CAL-1405-02", status:"فعال", min:"۵۰ میلیون تومان", max:"۵۰۰ میلیون تومان", duration:"۱۲ ماه", fee:"۱٫۵٪" },
  "corporate-rent": { name:"طرح اجاره سازمانی", partner:"سازمان رفاه کارکنان", rule:"CAL-1405-01", status:"فعال", min:"—", max:"۳۰۰ میلیون تومان", duration:"—", fee:"توافقی" },
  "atiye-financing": { name:"طرح تأمین مالی آتیه", partner:"صندوق مسکن آتیه", rule:"CAL-1405-03", status:"فعال", min:"—", max:"۷۰۰ میلیون تومان", duration:"—", fee:"۱٫۲٪" },
  "brokerage-pilot": { name:"طرح آزمایشی کارگزاری", partner:"کارگزاری سرمایه ایرانیان", rule:"CAL-1405-04", status:"پیش‌نویس", min:"—", max:"۲۵۰ میلیون تومان", duration:"—", fee:"۱٫۸٪" },
  "urban-housing": { name:"طرح مسکن شهری", partner:"بانک شهر نمونه", rule:"CAL-1405-02", status:"نیازمند بررسی", min:"—", max:"۴۰۰ میلیون تومان", duration:"—", fee:"۱٫۴٪" },
} as const;
type PageProps={params:Promise<{id:string}>};

export default async function AdminFinancialProductManagePage({params}:PageProps){
 const {id}=await params; const product=productMap[id as keyof typeof productMap]??productMap["deposit-housing"];
 return <section className="admin-settings admin-financial-products" data-node-id="872:899" data-name="Admin / Settings / Financial Products / Manage">
  <header className="admin-settings__header"><h1>تنظیمات</h1><p>مدیریت طرح‌ها و محصولات مالی، شرایط هر طرح، شریک ارائه‌دهنده و وضعیت انتشار</p></header>
  <nav className="admin-settings__tabs">{tabs.map(([label,href])=><Link className={`admin-settings__tab${href==="/admin/settings/financial-products"?" admin-settings__tab--active":""}`} href={href} key={href}>{label}</Link>)}</nav>
  <section className="admin-settings__panel admin-financial-products__editor admin-financial-products__editor--only"><div className="admin-financial-products__editor-head"><div><h2>ویرایش طرح مالی منتخب</h2><p>{product.name} — شرایط مالی و اتصال به ماشین‌حساب را از همین فرم مدیریت کنید.</p></div><div><button className="admin-settings__primary" type="button">ذخیره و انتشار</button><button className="admin-financial-products__draft" type="button">ذخیره پیش‌نویس</button></div></div><div className="admin-financial-products__field-grid"><article><span>نام طرح</span><input defaultValue={product.name} /></article><article><span>شریک ارائه‌دهنده</span><input defaultValue={product.partner} /></article><article><span>قاعده ماشین‌حساب</span><input dir="ltr" defaultValue={product.rule} /></article><article><span>وضعیت انتشار</span><input defaultValue={product.status} /></article><article><span>حداقل مبلغ</span><input defaultValue={product.min} /></article><article><span>حداکثر مبلغ</span><input defaultValue={product.max} /></article><article><span>مدت</span><input defaultValue={product.duration} /></article><article><span>کارمزد</span><input defaultValue={product.fee} /></article></div></section>
 </section>;
}
