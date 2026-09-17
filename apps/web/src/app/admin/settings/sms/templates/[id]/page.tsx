import Link from "next/link";

const tabs = [["عمومی","/admin/settings"],["ماشین‌حساب","/admin/settings/calculator"],["سایت","/admin/settings/website"],["پیامک","/admin/settings/sms"],["API","/admin/settings/integrations"],["طرح‌های مالی","/admin/settings/financial-products"],["طرح‌های عضویت","/admin/settings/membership-plans"]] as const;
type PageProps = { params: Promise<{ id: string }> };

export default async function AdminSmsTemplateEditorPage({ params }: PageProps) {
  const { id } = await params;
  const title = id === "otp-login" ? "OTP ورود" : decodeURIComponent(id).replaceAll("-", " ");
  return <section className="admin-settings admin-sms" data-node-id="872:560" data-name="Admin / Settings / SMS / Template Editor">
    <header className="admin-settings__header"><h1>تنظیمات</h1><p>مدیریت اتصال سامانه پیامکی، قالب‌ها، سلامت ارسال و پیامک‌های آزمایشی</p></header>
    <nav className="admin-settings__tabs" aria-label="بخش‌های تنظیمات">{tabs.map(([label,href]) => <Link className={`admin-settings__tab${href === "/admin/settings/sms" ? " admin-settings__tab--active" : ""}`} href={href} key={href}>{label}</Link>)}</nav>
    <section className="admin-settings__panel admin-sms__editor admin-sms__editor-page"><div className="admin-settings__panel-heading"><h2>ویرایش قالب منتخب</h2><p>نمونه: {title}</p></div><div className="admin-settings__fields"><div className="admin-sms__two"><label><span>کد قالب</span><input dir="ltr" defaultValue="OTP_LOGIN" /></label><label><span>وضعیت</span><input defaultValue="فعال" /></label></div><label><span>متن پیام</span><textarea defaultValue={"کد ورود شما به چارخونه: {{code}}\nاین کد تا {{ttl}} دقیقه معتبر است."} /></label></div><div className="admin-sms__actions"><button className="admin-settings__secondary" type="button">ذخیره پیش‌نویس</button><button className="admin-settings__primary" type="button">ذخیره و فعال‌سازی</button></div></section>
    <section className="admin-settings__panel admin-sms__test"><div className="admin-settings__panel-heading"><h2>ارسال پیامک آزمایشی</h2><p>قبل از فعال‌سازی قالب یا تغییر Provider، پیام آزمایشی ارسال و نتیجه Delivery را بررسی کنید.</p></div><div className="admin-sms__test-grid"><label><span>شماره مقصد آزمایشی</span><input defaultValue="۰۹۱۲•••••۶۷" /></label><label><span>قالب</span><input defaultValue={title} /></label><label><span>متغیرهای نمونه</span><input dir="ltr" defaultValue="code=482931 / ttl=2" /></label><button className="admin-settings__primary" type="button">ارسال آزمایشی</button></div><div className="admin-sms__test-result"><b className="admin-settings__badge admin-settings__badge--success">آخرین تست: تحویل‌شده</b><span>شناسه ارسال TEST-SMS-1405-231 • تحویل در ۳٫۲ ثانیه</span></div></section>
  </section>;
}
