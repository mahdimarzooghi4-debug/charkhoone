import Link from "next/link";

type CaseDetail = {
  id: string;
  user: string;
  role: string;
  nationalId: string;
  stage: string;
  stageTone: "success" | "warning" | "neutral" | "danger";
  partner: string;
  payment: string;
  paymentTone: "success" | "warning" | "neutral" | "danger";
  updated: string;
  created: string;
  financing: string;
  due: string;
};

const cases: Record<string, CaseDetail> = {
  "CS-1405-1182": {
    id: "CS-1405-1182",
    user: "علی رضایی",
    role: "مستأجر",
    nationalId: "۰۰۱•••••۷۸۹",
    stage: "فعال",
    stageTone: "success",
    partner: "بانک نمونه",
    payment: "پرداخت‌شده",
    paymentTone: "success",
    updated: "امروز ۱۴:۳۲",
    created: "۱۴۰۵/۰۶/۰۳",
    financing: "۳۵۰ میلیون تومان",
    due: "۱۴۰۵/۰۷/۱۸",
  },
  "CS-1405-1181": { id: "CS-1405-1181", user: "مریم احمدی", role: "کاربر", nationalId: "—", stage: "در بررسی", stageTone: "neutral", partner: "بانک توسعه", payment: "—", paymentTone: "neutral", updated: "امروز", created: "—", financing: "—", due: "—" },
  "CS-1405-1178": { id: "CS-1405-1178", user: "رضا کاظمی", role: "کاربر", nationalId: "—", stage: "ارسال‌شده به بانک", stageTone: "neutral", partner: "بانک نمونه", payment: "—", paymentTone: "neutral", updated: "امروز", created: "—", financing: "—", due: "—" },
  "CS-1405-1176": { id: "CS-1405-1176", user: "سارا محمدی", role: "کاربر", nationalId: "—", stage: "نیازمند تکمیل", stageTone: "warning", partner: "—", payment: "—", paymentTone: "neutral", updated: "دیروز", created: "—", financing: "—", due: "—" },
  "CS-1405-1170": { id: "CS-1405-1170", user: "امیر حسینی", role: "کاربر", nationalId: "—", stage: "تأیید شریک مالی", stageTone: "success", partner: "بانک توسعه", payment: "آماده پرداخت", paymentTone: "warning", updated: "دیروز", created: "—", financing: "—", due: "—" },
  "CS-1405-1168": { id: "CS-1405-1168", user: "نگار کریمی", role: "کاربر", nationalId: "—", stage: "فعال", stageTone: "success", partner: "بانک نمونه", payment: "پرداخت‌شده", paymentTone: "success", updated: "۲ روز پیش", created: "—", financing: "—", due: "—" },
  "CS-1405-1163": { id: "CS-1405-1163", user: "محمد مرادی", role: "کاربر", nationalId: "—", stage: "در انتظار تأیید", stageTone: "warning", partner: "صندوق مسکن", payment: "—", paymentTone: "neutral", updated: "۲ روز پیش", created: "—", financing: "—", due: "—" },
  "CS-1405-1159": { id: "CS-1405-1159", user: "زهرا اکبری", role: "کاربر", nationalId: "—", stage: "ردشده", stageTone: "danger", partner: "بانک توسعه", payment: "—", paymentTone: "neutral", updated: "۳ روز پیش", created: "—", financing: "—", due: "—" },
  "CS-1405-1156": { id: "CS-1405-1156", user: "حسین عباسی", role: "کاربر", nationalId: "—", stage: "در بررسی", stageTone: "neutral", partner: "صندوق مسکن", payment: "—", paymentTone: "neutral", updated: "۴ روز پیش", created: "—", financing: "—", due: "—" },
  "CS-1405-1150": { id: "CS-1405-1150", user: "الهام یوسفی", role: "کاربر", nationalId: "—", stage: "ارسال‌شده به بانک", stageTone: "neutral", partner: "بانک نمونه", payment: "—", paymentTone: "neutral", updated: "۵ روز پیش", created: "—", financing: "—", due: "—" },
};

type PageProps = {
  params: Promise<{ id: string }>;
};

function Badge({ children, tone }: { children: React.ReactNode; tone: CaseDetail["stageTone"] }) {
  return <span className={`admin-case-detail__badge admin-case-detail__badge--${tone}`}>{children}</span>;
}

export default async function AdminCaseDetailPage({ params }: PageProps) {
  const { id } = await params;
  const item = cases[id] ?? cases["CS-1405-1182"];
  const hasExactFinancialDetail = item.id === "CS-1405-1182";

  return (
    <section className="admin-case-detail" data-node-id="701:12" data-name="Admin / Case Detail">
      <header className="admin-case-detail__header">
        <Link className="admin-case-detail__back" href="/admin/cases">بازگشت به پرونده‌ها</Link>
        <div className="admin-case-detail__heading">
          <h1>جزئیات پرونده</h1>
          <p>{item.id} — {item.user}</p>
        </div>
      </header>

      <section className="admin-case-detail__panel admin-case-detail__summary">
        <div className="admin-case-detail__section-heading">
          <h2>خلاصه پرونده</h2>
          <p>نمای مدیریتی وضعیت پرونده، کاربر، شریک مالی و جریان پرداخت در چارخونه.</p>
        </div>
        <div className="admin-case-detail__summary-grid">
          <article><span>مرحله پرونده</span><strong>{item.stage}</strong><small>{item.stage === "فعال" ? "تأمین مالی در جریان" : "وضعیت جاری پرونده"}</small></article>
          <article><span>شریک مالی</span><strong>{item.partner}</strong><small>{item.partner === "—" ? "هنوز تعیین نشده" : "درگاه تأمین مالی"}</small></article>
          <article><span>شماره پرونده</span><strong>{item.id}</strong><small>{item.created === "—" ? "تاریخ ثبت در دسترس نیست" : `ثبت‌شده در ${item.created}`}</small></article>
          <article><span>کاربر</span><strong>{item.user}</strong><small>{item.role}{item.nationalId === "—" ? "" : ` • کد ملی ${item.nationalId}`}</small></article>
        </div>
      </section>

      <div className="admin-case-detail__columns">
        <section className="admin-case-detail__panel admin-case-detail__detail-panel">
          <div className="admin-case-detail__section-heading">
            <h2>وضعیت مالی و پرداخت</h2>
            <p>وضعیت جاری تعهدات و تراکنش‌های مرتبط با این پرونده.</p>
          </div>
          <div className="admin-case-detail__detail-list">
            <div className="admin-case-detail__detail-row">
              <Badge tone={item.paymentTone}>{item.payment === "—" ? "ثبت نشده" : item.payment === "پرداخت‌شده" ? "موفق" : item.payment}</Badge>
              <div><span>وضعیت پرداخت</span><strong>{item.payment}</strong></div>
            </div>
            <div className="admin-case-detail__detail-row">
              <Badge tone={item.financing === "—" ? "neutral" : "success"}>{item.financing === "—" ? "—" : "فعال"}</Badge>
              <div><span>مبلغ تأمین مالی</span><strong>{item.financing}</strong></div>
            </div>
            <div className="admin-case-detail__detail-row">
              <Badge tone="neutral">طبق برنامه</Badge>
              <div><span>سررسید بعدی</span><strong>{item.due}</strong></div>
            </div>
          </div>
        </section>

        <section className="admin-case-detail__panel admin-case-detail__detail-panel">
          <div className="admin-case-detail__section-heading">
            <h2>وضعیت و کنترل پرونده</h2>
            <p>مرحله جاری پرونده، وضعیت بررسی چارخونه و موقعیت آن نزد شریک مالی.</p>
          </div>
          <div className="admin-case-detail__detail-list">
            <div className="admin-case-detail__detail-row">
              <Badge tone={item.stageTone}>{item.stage}</Badge>
              <div><span>چارخونه</span><strong>{item.stage}</strong></div>
            </div>
            <div className="admin-case-detail__detail-row">
              <Badge tone={item.partner === "—" ? "neutral" : "success"}>{item.partner === "—" ? "تعیین نشده" : "تأیید شریک"}</Badge>
              <div><span>شریک مالی</span><strong>{item.partner === "—" ? "تعیین نشده" : "تأیید شده"}</strong></div>
            </div>
            <div className="admin-case-detail__detail-row">
              <Badge tone={item.stageTone === "warning" || item.stageTone === "danger" ? "warning" : "neutral"}>{item.stageTone === "warning" || item.stageTone === "danger" ? "نیازمند بررسی" : "بدون اقدام"}</Badge>
              <div><span>وضعیت بررسی</span><strong>{item.stageTone === "warning" || item.stageTone === "danger" ? "نیازمند بررسی" : "بدون اقدام"}</strong></div>
            </div>
          </div>
        </section>
      </div>

      <div className="admin-case-detail__columns admin-case-detail__columns--lower">
        <section className="admin-case-detail__panel">
          <div className="admin-case-detail__section-heading">
            <h2>اطلاعات مرتبط</h2>
            <p>شناسه‌ها و اطلاعات کلیدی برای پیگیری مدیریتی پرونده.</p>
          </div>
          <dl className="admin-case-detail__facts">
            <div><dt>شماره پرونده</dt><dd>{item.id}</dd></div>
            <div><dt>کاربر</dt><dd>{item.user} — {item.role}</dd></div>
            <div><dt>شریک مالی</dt><dd>{item.partner}</dd></div>
            <div><dt>آخرین به‌روزرسانی</dt><dd>{item.updated}</dd></div>
          </dl>
        </section>

        <section className="admin-case-detail__panel">
          <div className="admin-case-detail__section-heading">
            <h2>آخرین رویدادها</h2>
            <p>تغییرات اصلی پرونده به ترتیب جدیدترین رویداد ثبت‌شده.</p>
          </div>
          {hasExactFinancialDetail ? (
            <div className="admin-case-detail__timeline">
              <div><time>۱۴۰۵/۰۶/۰۸</time><p><strong>پرداخت موفق ثبت شد</strong><span>تراکنش دوره جاری تسویه شد</span></p></div>
              <div><time>۱۴۰۵/۰۶/۰۶</time><p><strong>تأیید شریک مالی ثبت شد</strong><span>پرونده وارد مرحله فعال شد</span></p></div>
              <div><time>۱۴۰۵/۰۶/۰۵</time><p><strong>بررسی چارخونه تکمیل شد</strong><span>پرونده برای شریک مالی ارسال شد</span></p></div>
              <div><time>۱۴۰۵/۰۶/۰۳</time><p><strong>پرونده ایجاد شد</strong><span>درخواست کاربر در چارخونه ثبت شد</span></p></div>
            </div>
          ) : (
            <div className="admin-case-detail__timeline admin-case-detail__timeline--empty">
              <p>جزئیات رویدادهای این پرونده در داده نمونه Figma مشخص نشده است.</p>
            </div>
          )}
        </section>
      </div>

      <section className="admin-case-detail__management" aria-label="مدیریت پرونده">
        <div className="admin-case-detail__management-copy">
          <h2>مدیریت پرونده</h2>
          <p>تغییرات مدیریتی همراه با دلیل و زمان در تاریخچه پرونده ثبت می‌شوند.</p>
        </div>
        <div className="admin-case-detail__actions">
          <button className="admin-case-detail__action admin-case-detail__action--danger" type="button">توقف پرونده</button>
          <button className="admin-case-detail__action admin-case-detail__action--warning" type="button">نیازمند بررسی</button>
          <Link className="admin-case-detail__action" href="/admin/partners">مدیریت شریک مالی</Link>
          <button className="admin-case-detail__action admin-case-detail__action--primary" type="button">تغییر مرحله</button>
        </div>
      </section>
    </section>
  );
}
