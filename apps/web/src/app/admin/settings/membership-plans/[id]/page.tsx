import Link from "next/link";

const tabs = [["عمومی","/admin/settings"],["ماشین‌حساب","/admin/settings/calculator"],["سایت","/admin/settings/website"],["پیامک","/admin/settings/sms"],["API","/admin/settings/integrations"],["طرح‌های مالی","/admin/settings/financial-products"],["طرح‌های عضویت","/admin/settings/membership-plans"]] as const;
const planMap={
 "mem-01":{name:"طرح ۱ بار استفاده",uses:"۱ بار",ceiling:"۵۰۰ میلیون تومان",price:"۲٬۵۰۰٬۰۰۰ تومان"},
 "mem-02":{name:"طرح ۲ بار استفاده",uses:"۲ بار",ceiling:"۷۵۰ میلیون تومان",price:"۴٬۰۰۰٬۰۰۰ تومان"},
 "mem-03":{name:"طرح ۳ بار استفاده",uses:"۳ بار",ceiling:"۱٬۰۰۰ میلیون تومان",price:"۵٬۵۰۰٬۰۰۰ تومان"},
} as const;
type PageProps={params:Promise<{id:string}>};

export default async function AdminMembershipPlanManagePage({params}:PageProps){const {id}=await params;const plan=planMap[id as keyof typeof planMap]??planMap["mem-01"];return <section className="admin-settings admin-membership" data-node-id="945:179" data-name="Admin / Settings / Membership Plans / Manage">
 <header className="admin-settings__header"><h1>تنظیمات</h1><p>مدیریت طرح‌های عضویت چارخونه، سقف تأمین مالی، تعداد استفاده، مبلغ حق عضویت و وضعیت انتشار</p></header>
 <nav className="admin-settings__tabs">{tabs.map(([label,href])=><Link className={`admin-settings__tab${href==="/admin/settings/membership-plans"?" admin-settings__tab--active":""}`} href={href} key={href}>{label}</Link>)}</nav>
 <section className="admin-settings__panel admin-membership__form admin-membership__form--only"><div className="admin-membership__form-head"><div><h2>ویرایش طرح عضویت</h2><p>{plan.name} — سقف تأمین، تعداد استفاده و مبلغ حق عضویت را مدیریت کنید.</p></div><div><button className="admin-settings__primary" type="button">ذخیره و انتشار</button><button className="admin-membership__draft" type="button">ذخیره پیش‌نویس</button></div></div><div className="admin-membership__field-grid"><article><span>حق عضویت</span><input defaultValue={plan.price} /></article><article><span>سقف تأمین مالی</span><input defaultValue={plan.ceiling} /></article><article><span>تعداد استفاده</span><input defaultValue={plan.uses} /></article><article><span>نام طرح</span><input defaultValue={plan.name} /></article><article><span>وضعیت انتشار</span><input defaultValue="فعال" /></article></div></section>
 </section>}
