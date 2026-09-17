import Link from "next/link";

const tabs = [["عمومی","/admin/settings"],["ماشین‌حساب","/admin/settings/calculator"],["سایت","/admin/settings/website"],["پیامک","/admin/settings/sms"],["API","/admin/settings/integrations"],["طرح‌های مالی","/admin/settings/financial-products"],["طرح‌های عضویت","/admin/settings/membership-plans"]] as const;
const metrics = [{label:"طرح‌های فعال",value:"۳ طرح",note:"قابل انتخاب در مرحله عضویت مستأجر"},{label:"پیش‌نویس",value:"۰ طرح",note:"در حال حاضر پیش‌نویسی وجود ندارد"},{label:"تعداد استفاده",value:"۱ تا ۳ بار",note:"بر اساس تعداد دفعات استفاده"},{label:"نیازمند بازبینی",value:"۰ طرح",note:"همه طرح‌های فعال منتشر شده‌اند"}] as const;
const plans = [
  {id:"MEM-01",slug:"mem-01",name:"طرح ۱ بار استفاده",uses:"۱ بار",ceiling:"۵۰۰ میلیون",price:"۲٬۵۰۰٬۰۰۰ تومان"},
  {id:"MEM-02",slug:"mem-02",name:"طرح ۲ بار استفاده",uses:"۲ بار",ceiling:"۷۵۰ میلیون",price:"۴٬۰۰۰٬۰۰۰ تومان"},
  {id:"MEM-03",slug:"mem-03",name:"طرح ۳ بار استفاده",uses:"۳ بار",ceiling:"۱٬۰۰۰ میلیون",price:"۵٬۵۰۰٬۰۰۰ تومان"},
] as const;

export default function AdminMembershipPlansPage(){return <section className="admin-settings admin-membership" data-node-id="945:12" data-name="Admin / Settings / Membership Plans">
 <header className="admin-settings__header"><h1>تنظیمات</h1><p>مدیریت طرح‌های عضویت چارخونه، سقف تأمین مالی، تعداد استفاده، مبلغ حق عضویت و وضعیت انتشار</p></header>
 <nav className="admin-settings__tabs">{tabs.map(([label,href])=><Link className={`admin-settings__tab${href==="/admin/settings/membership-plans"?" admin-settings__tab--active":""}`} href={href} key={href}>{label}</Link>)}</nav>
 <section className="admin-settings__metrics">{metrics.map(item=><article key={item.label}><span>{item.label}</span><strong>{item.value}</strong><small>{item.note}</small></article>)}</section>
 <div className="admin-membership__title-row"><div><h2>طرح‌های عضویت</h2><p>سقف تأمین مالی، تعداد استفاده و مبلغ حق عضویت هر طرح را مدیریت کنید.</p></div><Link className="admin-settings__primary admin-membership__add" href="/admin/settings/membership-plans/new">افزودن طرح عضویت</Link></div>
 <section className="admin-settings__panel admin-membership__table-card"><div className="admin-membership__table"><div className="admin-membership__row admin-membership__row--head"><span>اقدام</span><span>وضعیت</span><span>شناسه</span><span>حق عضویت</span><span>سقف تأمین</span><span>تعداد استفاده</span><span>نام طرح</span></div>{plans.map(plan=><div className="admin-membership__row" key={plan.id}><span><Link className="admin-settings__secondary admin-membership__edit" href={`/admin/settings/membership-plans/${plan.slug}`}>ویرایش</Link></span><span><b className="admin-settings__badge admin-settings__badge--success">فعال</b></span><strong className="admin-membership__id">{plan.id}</strong><span>{plan.price}</span><span>{plan.ceiling}</span><span>{plan.uses}</span><strong>{plan.name}</strong></div>)}</div><p className="admin-membership__count">۳ طرح فعال</p></section>
 </section>}
