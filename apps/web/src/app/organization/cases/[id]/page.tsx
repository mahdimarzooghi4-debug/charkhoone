import Link from "next/link";

const summary = [
  { label: "وضعیت چارخونه", value: "فعال", note: "پرونده در مسیر جاری" },
  { label: "وضعیت بانک", value: "تأیید بانک", note: "تأمین مالی فعال" },
  { label: "طرح", value: "طرح حمایتی کارکنان", note: "بانک نمونه" },
  { label: "پرسنل", value: "علی رضایی", note: "کد پرسنلی ۱۳۳۴ — فناوری" },
] as const;

const timeline = [
  { date: "۱۴۰۵/۰۶/۰۸", title: "پرداخت سازمان ثبت شد", note: "دوره جاری طرح تسویه شد" },
  { date: "۱۴۰۵/۰۶/۰۶", title: "تأیید بانک ثبت شد", note: "پرونده وارد مرحله فعال شد" },
  { date: "۱۴۰۵/۰۶/۰۵", title: "بررسی چارخونه تکمیل شد", note: "پرونده برای بانک ارسال شد" },
  { date: "۱۴۰۵/۰۶/۰۳", title: "طرح برای پرسنل فعال شد", note: "فعال‌سازی توسط سازمان" },
] as const;

function DetailRow({ label, value, badge, tone = "success" }: { label: string; value: string; badge?: string; tone?: "success" | "muted" }) {
  return (
    <div className="org-case-detail-row">
      {badge ? <span className={`org-case-detail-badge org-case-detail-badge--${tone}`}>{badge}</span> : null}
      <div>
        <span>{label}</span>
        <strong>{value}</strong>
      </div>
    </div>
  );
}

export default function OrganizationCaseDetailPage() {
  return (
    <section className="org-case-detail" data-node-id="503:29">
      <header className="org-case-detail__header">
        <Link href="/organization/cases" className="org-action-button org-action-button--surface">بازگشت به پرونده‌ها</Link>
        <div>
          <h1>جزئیات پرونده</h1>
          <p>پرونده ۱۴۰۵-۱۲۸ — علی رضایی</p>
        </div>
      </header>

      <section className="org-case-detail__summary">
        <div className="org-case-detail__section-head">
          <h2>خلاصه پرونده</h2>
          <p>وضعیت این پرونده از نگاه سازمان؛ اطلاعات اعتبارسنجی داخلی بانک در این پنل نمایش داده نمی‌شود.</p>
        </div>
        <div className="org-case-detail__summary-grid">
          {summary.map((item) => (
            <article key={item.label}>
              <span>{item.label}</span>
              <strong>{item.value}</strong>
              <small>{item.note}</small>
            </article>
          ))}
        </div>
      </section>

      <div className="org-case-detail__two-column">
        <section className="org-case-detail__panel">
          <div className="org-case-detail__section-head">
            <h2>تعهد و پرداخت سازمان</h2>
            <p>فقط پرداخت‌هایی که طبق شرایط همین طرح بر عهده سازمان است.</p>
          </div>
          <DetailRow label="مدل پرداخت" value="پرداخت ماهانه توسط سازمان" badge="فعال" />
          <DetailRow label="وضعیت دوره جاری" value="پرداخت‌شده" badge="تسویه شده" />
          <DetailRow label="سررسید بعدی" value="۱۴۰۵/۰۷/۱۸" badge="طبق طرح" tone="muted" />
        </section>

        <section className="org-case-detail__panel">
          <div className="org-case-detail__section-head">
            <h2>وضعیت پرونده</h2>
            <p>مرحله فعلی فرد در چارخونه و بانک.</p>
          </div>
          <DetailRow label="چارخونه" value="فعال" badge="فعال" />
          <DetailRow label="بانک" value="تأیید شده" badge="تأیید بانک" />
          <DetailRow label="اقدام سازمان" value="اقدامی لازم نیست" badge="بدون اقدام" tone="muted" />
        </section>
      </div>

      <div className="org-case-detail__two-column org-case-detail__two-column--lower">
        <section className="org-case-detail__panel">
          <div className="org-case-detail__section-head">
            <h2>اطلاعات مرتبط</h2>
            <p>اطلاعات موردنیاز سازمان برای پیگیری این پرونده.</p>
          </div>
          <DetailRow label="شماره پرونده" value="۱۴۰۵-۱۲۸" />
          <DetailRow label="پرسنل" value="علی رضایی — ۱۳۳۴" />
          <DetailRow label="واحد سازمانی" value="فناوری" />
          <DetailRow label="آخرین به‌روزرسانی" value="۱۴۰۵/۰۶/۰۸" />
        </section>

        <section className="org-case-detail__panel">
          <div className="org-case-detail__section-head">
            <h2>آخرین رویدادها</h2>
            <p>تغییرات اصلی پرونده به ترتیب جدیدترین رویداد.</p>
          </div>
          <div className="org-case-timeline">
            {timeline.map((event) => (
              <div className="org-case-timeline__row" key={`${event.date}-${event.title}`}>
                <span>{event.date}</span>
                <div>
                  <strong>{event.title}</strong>
                  <small>{event.note}</small>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>

      <section className="org-case-detail__privacy-note">
        <span className="org-case-detail-badge org-case-detail-badge--success">قابل پیگیری</span>
        <div>
          <strong>دسترسی سازمان محدود به اطلاعات مرتبط با همکاری خودش است</strong>
          <small>جزئیات رتبه اعتباری و ارزیابی داخلی بانک برای سازمان نمایش داده نمی‌شود.</small>
        </div>
      </section>
    </section>
  );
}
