import Link from "next/link";

const summary = [
  ["نام و نام خانوادگی", "علی رضایی"],
  ["کد ملی", "۱۲۳*****۴۵"],
  ["کد پرسنلی", "۱۲۳۴"],
  ["واحد سازمانی", "فناوری"],
  ["روش ثبت", "API منابع انسانی"],
] as const;

const organizationMetrics = [
  { label: "وضعیت همکاری", value: "فعال", note: "در فهرست پرسنل سازمان" },
  { label: "تأیید اطلاعات سازمان", value: "تأیید شده", note: "اطلاعات پرسنلی بررسی شده" },
  { label: "تعهد پرداخت سازمان", value: "بدون بدهی", note: "پرداخت سررسیدشده ندارد" },
] as const;

const events = [
  { title: "ثبت و دعوت پرسنل", note: "اطلاعات از API منابع انسانی دریافت شد.", date: "۱۴۰۵/۰۵/۱۰", status: "ثبت شد", tone: "neutral" },
  { title: "اختصاص طرح بانکی", note: "طرح کارکنان سازمانی برای پرسنل فعال شد.", date: "۱۴۰۵/۰۵/۱۲", status: "فعال", tone: "success" },
  { title: "فعال شدن پرونده", note: "فرآیند بانکی تکمیل و پرونده فعال شد.", date: "۱۴۰۵/۰۵/۲۸", status: "فعال", tone: "success" },
] as const;

function DetailMetric({ label, value, note }: { label: string; value: string; note?: string }) {
  return (
    <div className="org-detail-metric">
      <span>{label}</span>
      <strong>{value}</strong>
      {note ? <small>{note}</small> : null}
    </div>
  );
}

export default function OrganizationPersonnelDetailPage() {
  return (
    <section className="org-personnel-detail" data-node-id="448:6">
      <header className="org-personnel-detail__header">
        <Link className="org-action-button org-action-button--surface" href="/organization/personnel">بازگشت به پرسنل</Link>
        <div>
          <h1>جزئیات پرسنل</h1>
          <p>علی رضایی — کد پرسنلی ۱۲۳۴</p>
        </div>
      </header>

      <article className="org-detail-card org-personnel-detail__summary">
        <div className="org-detail-card__heading">
          <span className="org-status org-status--success">فعال</span>
          <h2>اطلاعات پرسنلی</h2>
        </div>
        <div className="org-personnel-detail__summary-grid">
          {summary.map(([label, value]) => <DetailMetric key={label} label={label} value={value} />)}
        </div>
      </article>

      <div className="org-personnel-detail__two-column">
        <article className="org-detail-card">
          <div className="org-detail-card__heading">
            <span className="org-status org-status--success">فعال</span>
            <h2>طرح بانکی</h2>
          </div>
          <h3>طرح کارکنان سازمانی</h3>
          <p className="org-detail-card__description">بانک نمونه • سقف استفاده تا ۵۰۰ میلیون تومان</p>
          <div className="org-detail-card__metrics org-detail-card__metrics--two">
            <DetailMetric label="تاریخ تخصیص" value="۱۴۰۵/۰۵/۱۲" />
            <DetailMetric label="وضعیت طرح" value="فعال برای این پرسنل" />
          </div>
          <button className="org-detail-card__button" type="button">تغییر طرح</button>
        </article>

        <article className="org-detail-card">
          <div className="org-detail-card__heading">
            <span className="org-status org-status--success">فعال</span>
            <h2>وضعیت در چارخونه</h2>
          </div>
          <h3>پرونده ۱۴۰۵-۰۱۲۸</h3>
          <p className="org-detail-card__description">فرآیند تکمیل شده و تأمین مالی این پرسنل فعال است.</p>
          <div className="org-detail-card__metrics org-detail-card__metrics--two">
            <DetailMetric label="آخرین مرحله" value="تأمین مالی فعال" />
            <DetailMetric label="تاریخ دعوت" value="۱۴۰۵/۰۵/۱۰" />
          </div>
          <button className="org-detail-card__button" type="button">مشاهده پرونده</button>
        </article>
      </div>

      <article className="org-detail-card">
        <div className="org-detail-card__heading org-detail-card__heading--stacked">
          <h2>وضعیت سازمان و پرداخت</h2>
          <p>فقط وضعیت‌هایی که به نقش سازمان مربوط است نمایش داده می‌شود.</p>
        </div>
        <div className="org-detail-card__metrics org-detail-card__metrics--three">
          {organizationMetrics.map((metric) => <DetailMetric key={metric.label} {...metric} />)}
        </div>
      </article>

      <article className="org-detail-card org-personnel-events">
        <div className="org-detail-card__heading org-detail-card__heading--stacked">
          <h2>آخرین رویدادها</h2>
          <p>سوابق مهم این پرسنل در مسیر سازمان و چارخونه</p>
        </div>
        <div className="org-personnel-events__list">
          {events.map((event) => (
            <div className="org-personnel-event" key={event.date}>
              <div className="org-personnel-event__meta">
                <time>{event.date}</time>
                <span className={`org-status org-status--${event.tone}`}>{event.status}</span>
              </div>
              <div>
                <strong>{event.title}</strong>
                <span>{event.note}</span>
              </div>
            </div>
          ))}
        </div>
      </article>
    </section>
  );
}
