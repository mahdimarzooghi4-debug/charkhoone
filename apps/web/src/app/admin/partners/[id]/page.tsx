import Link from "next/link";

type Partner = {
  id: string;
  name: string;
  type: string;
  connection: string;
  settlement: string;
};

const partners: Record<string, Partner> = {
  "bank-tosee-maskan": { id: "PRT-۱۴۰۵-۰۰۱", name: "بانک توسعه مسکن", type: "بانک", connection: "API", settlement: "ماهانه" },
  "fund-maskane-atiye": { id: "—", name: "صندوق مسکن آتیه", type: "صندوق", connection: "API", settlement: "هفتگی" },
  "brokerage-sarmaye-iranian": { id: "—", name: "کارگزاری سرمایه ایرانیان", type: "کارگزاری", connection: "Webhook", settlement: "هفتگی" },
  "org-refah-karkonan": { id: "—", name: "سازمان رفاه کارکنان", type: "سازمان", connection: "API", settlement: "ماهانه" },
  "bank-shahr-nemune": { id: "—", name: "بانک شهر نمونه", type: "بانک", connection: "API", settlement: "روزانه" },
  "fund-sarmayegozari-omid": { id: "—", name: "صندوق سرمایه‌گذاری امید", type: "صندوق", connection: "فایل", settlement: "ماهانه" },
  "brokerage-tosee-bazar": { id: "—", name: "کارگزاری توسعه بازار", type: "کارگزاری", connection: "Webhook", settlement: "هفتگی" },
  "org-nemune": { id: "—", name: "سازمان نمونه", type: "سازمان", connection: "API", settlement: "ماهانه" },
  "bank-taavon-nemune": { id: "—", name: "بانک تعاون نمونه", type: "بانک", connection: "API", settlement: "ماهانه" },
  "nahad-hemayati-maskan": { id: "—", name: "نهاد حمایتی مسکن", type: "سازمان", connection: "دستی", settlement: "ماهانه" },
};

type PageProps = { params: Promise<{ id: string }> };

function Field({ label, children, ltr = false }: Readonly<{ label: string; children: React.ReactNode; ltr?: boolean }>) {
  return (
    <div className="admin-partner-manage__field">
      <span>{label}</span>
      <div className={ltr ? "admin-partner-manage__value admin-partner-manage__value--ltr" : "admin-partner-manage__value"}>{children}</div>
    </div>
  );
}

export default async function AdminManagePartnerPage({ params }: PageProps) {
  const { id } = await params;
  const partner = partners[id] ?? partners["bank-tosee-maskan"];
  const isReferencePartner = id === "bank-tosee-maskan" || !partners[id];

  return (
    <section className="admin-partner-manage" data-node-id="725:137" data-name="Admin / Partners / Manage Partner">
      <header className="admin-partner-manage__header">
        <Link className="admin-partner-manage__back" href="/admin/partners">بازگشت به همکاران</Link>
        <div className="admin-partner-manage__heading">
          <h1>مدیریت همکار</h1>
          <p>اطلاعات اتصال، قرارداد، مانده حساب و روابط مالی {partner.name} را مدیریت کنید.</p>
        </div>
      </header>

      <section className="admin-partner-manage__card" aria-labelledby="partner-contract-heading">
        <h2 id="partner-contract-heading">اطلاعات پایه، اتصال و شرایط قرارداد</h2>
        <div className="admin-partner-manage__divider" aria-hidden="true" />
        <div className="admin-partner-manage__grid">
          <Field label="نام همکار">{partner.name}</Field>
          <Field label="شناسه همکار">{partner.id}</Field>
          <Field label="نوع اتصال">{partner.connection}</Field>
          <Field label="نوع همکار">{partner.type}</Field>
          <Field label="دوره تسویه">{partner.settlement}</Field>
          <Field label="مدل مالی همکاری">{isReferencePartner ? "درصدی" : "—"}</Field>
          <Field label="سهم چارخونه">{isReferencePartner ? "۱.۵٪" : "—"}</Field>
          <Field label="شماره شبا تسویه" ltr>{isReferencePartner ? "IR12 3456 7890 1234 5678 9012 34" : "—"}</Field>
          <Field label="پایان قرارداد">{isReferencePartner ? "۱۴۰۶/۰۱/۰۱" : "—"}</Field>
          <Field label="شروع قرارداد">{isReferencePartner ? "۱۴۰۵/۰۱/۰۱" : "—"}</Field>
        </div>
        <div className="admin-partner-manage__actions">
          <Link className="admin-partner-manage__cancel" href="/admin/partners">انصراف</Link>
          <button className="admin-partner-manage__primary" type="button">ذخیره تغییرات</button>
        </div>
      </section>

      <section className="admin-partner-manage__card admin-partner-manage__access" aria-labelledby="partner-access-heading">
        <div className="admin-partner-manage__section-copy">
          <h2 id="partner-access-heading">دسترسی پنل</h2>
          <p>دسترسی مسئول پنل شریک را مدیریت کنید؛ رمز عبور توسط خود کاربر تعیین می‌شود و در پنل ادمین نمایش داده نمی‌شود.</p>
        </div>
        <div className="admin-partner-manage__access-grid">
          <Field label="مسئول پنل">{isReferencePartner ? "مهدی احمدی" : "—"}</Field>
          <Field label="موبایل / ایمیل" ltr>{isReferencePartner ? "۰۹۱۲•••••۶۷ | contact@partner.ir" : "—"}</Field>
          <div className="admin-partner-manage__field">
            <span>وضعیت دسترسی</span>
            <div className="admin-partner-manage__value"><span className="admin-partner-manage__badge admin-partner-manage__badge--success">فعال</span></div>
          </div>
          <Field label="آخرین ورود">{isReferencePartner ? "امروز ۱۱:۲۰" : "—"}</Field>
        </div>
        <div className="admin-partner-manage__access-actions">
          <button type="button">ارسال مجدد دعوت</button>
          <button type="button">بازنشانی رمز</button>
          <button className="admin-partner-manage__warning" type="button">غیرفعال کردن</button>
        </div>
      </section>

      <div className="admin-partner-manage__financial-columns">
        <section className="admin-partner-manage__card admin-partner-manage__finance-card">
          <div className="admin-partner-manage__section-copy">
            <h2>حساب مالی و تسویه شریک</h2>
            <p>مانده، سهم مالی و برنامه تسویه این شریک را از همین بخش کنترل کنید.</p>
          </div>
          <div className="admin-partner-manage__mini-metrics">
            <article><span>مانده قابل تسویه</span><strong>{isReferencePartner ? "۴۶۰ میلیون" : "—"}</strong><small>بدهی چارخونه به شریک</small></article>
            <article><span>صورتحساب باز</span><strong>{isReferencePartner ? "۱ مورد" : "—"}</strong><small>{isReferencePartner ? "INV-1405-058" : "—"}</small></article>
            <article><span>تسویه بعدی</span><strong>{isReferencePartner ? "۱۴۰۵/۰۶/۳۱" : "—"}</strong><small>دوره {partner.settlement}</small></article>
          </div>
          <div className="admin-partner-manage__finance-actions">
            <Link className="admin-partner-manage__primary admin-partner-manage__small" href="/admin/payments/settlements">ثبت تسویه</Link>
            <button className="admin-partner-manage__warning admin-partner-manage__small" type="button">اصلاحیه مالی</button>
            <Link className="admin-partner-manage__secondary admin-partner-manage__small" href="/admin/payments/reconciliation">مغایرت‌ها</Link>
          </div>
        </section>

        <section className="admin-partner-manage__card admin-partner-manage__finance-card">
          <div className="admin-partner-manage__section-copy">
            <h2>صورتحساب‌ها و گردش مالی</h2>
            <p>آخرین صورتحساب و تسویه ثبت‌شده برای این شریک.</p>
          </div>
          <div className="admin-partner-manage__history">
            <div><span className="admin-partner-manage__badge admin-partner-manage__badge--warning">در انتظار تسویه</span><p><small>صورتحساب جاری</small><strong>{isReferencePartner ? "INV-1405-058 • ۴۶۰ میلیون تومان" : "—"}</strong></p></div>
            <div><span className="admin-partner-manage__badge admin-partner-manage__badge--success">انجام‌شده</span><p><small>آخرین تسویه</small><strong>{isReferencePartner ? "STL-1405-431 • ۱.۲ میلیارد تومان" : "—"}</strong></p></div>
            <div><span className="admin-partner-manage__badge admin-partner-manage__badge--success">فعال</span><p><small>مدل کارمزد</small><strong>{isReferencePartner ? "۱.۵٪ از مبلغ تأمین مالی" : "—"}</strong></p></div>
          </div>
          <div className="admin-partner-manage__finance-actions">
            <button className="admin-partner-manage__secondary admin-partner-manage__small" type="button">ثبت صورتحساب</button>
            <Link className="admin-partner-manage__secondary admin-partner-manage__small" href="/admin/payments/settlements">مشاهده تسویه‌ها</Link>
          </div>
        </section>
      </div>
    </section>
  );
}
