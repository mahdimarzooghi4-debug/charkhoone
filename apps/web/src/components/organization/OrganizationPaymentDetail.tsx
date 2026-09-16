import Link from "next/link";

type PaymentDetailViewProps = {
  confirmHref?: string;
};

const summary = [
  { label: "وضعیت", value: "نیازمند پرداخت", note: "تا ۱۴۰۵/۰۶/۱۸" },
  { label: "مبلغ پرداخت", value: "۲۴٬۰۰۰٬۰۰۰ تومان", note: "برای این سررسید" },
  { label: "نوع پرداخت", value: "پرداخت ماهانه", note: "بر عهده سازمان" },
  { label: "پرسنل", value: "علی رضایی", note: "طرح حمایتی کارکنان" },
] as const;

const obligationRows = [
  { label: "پرداخت‌کننده", value: "سازمان", badge: "طبق طرح", tone: "success" },
  { label: "دوره پرداخت", value: "شهریور ۱۴۰۵", badge: "ماهانه", tone: "success" },
  { label: "سررسید", value: "۱۴۰۵/۰۷/۱۸", badge: "۳ روز مانده", tone: "muted" },
] as const;

const statusRows = [
  { label: "نیازمند پرداخت", value: "در انتظار", badge: "وضعیت", tone: "success" },
  { label: "۲۴٬۰۰۰٬۰۰۰ تومان", value: "قطعی", badge: "مبلغ", tone: "success" },
  { label: "درگاه پرداخت سازمان", value: "آماده", badge: "روش پرداخت", tone: "muted" },
] as const;

const relatedRows = [
  ["شماره پرونده", "۱۴۰۵-۱۲۸"],
  ["پرسنل", "علی رضایی — ۱۳۳۴"],
  ["طرح", "طرح حمایتی کارکنان"],
  ["بانک", "بانک نمونه"],
] as const;

const events = [
  { date: "۱۴۰۵/۰۶/۰۱", title: "طبق شرایط طرح سازمانی", note: "تعهد پرداخت ایجاد شد" },
  { date: "۱۴۰۵/۰۶/۱۲", title: "برای واحد مالی سازمان", note: "یادآوری سررسید ارسال شد" },
  { date: "۱۴۰۵/۰۶/۱۵", title: "پرونده فعال و واجد ادامه طرح است", note: "وضعیت پرسنل بررسی شد" },
  { date: "۱۴۰۵/۰۶/۱۸", title: "پرداخت تا پایان روز قابل انجام است", note: "سررسید پرداخت" },
] as const;

export function OrganizationPaymentDetail({ confirmHref = "/organization/payments/1405-06-18/confirm" }: PaymentDetailViewProps) {
  return (
    <section className="org-payment-detail" data-node-id="517:29">
      <header className="org-payment-detail__header">
        <Link href="/organization/payments" className="org-action-button org-action-button--surface">بازگشت به پرداخت‌ها</Link>
        <div>
          <h1>جزئیات پرداخت</h1>
          <p>پرداخت ۱۴۰۵-۰۶-۱۸ — علی رضایی</p>
        </div>
      </header>

      <section className="org-payment-card org-payment-detail__summary">
        <div className="org-payment-section-head">
          <h2>خلاصه پرداخت</h2>
          <p>این پرداخت طبق شرایط طرح برای تعهد مالی سازمان ایجاد شده است.</p>
        </div>
        <div className="org-payment-summary-grid">
          {summary.map((item) => (
            <article key={item.label}>
              <span>{item.label}</span><strong>{item.value}</strong><small>{item.note}</small>
            </article>
          ))}
        </div>
      </section>

      <div className="org-payment-two-column">
        <section className="org-payment-card org-payment-panel">
          <div className="org-payment-section-head"><h2>جزئیات تعهد سازمان</h2><p>این مبلغ طبق شرایط طرح، در این سررسید بر عهده سازمان است.</p></div>
          {obligationRows.map((row) => (
            <div className="org-payment-detail-row" key={row.label}>
              <span className={`org-payment-badge org-payment-badge--${row.tone}`}>{row.badge}</span>
              <div><span>{row.label}</span><strong>{row.value}</strong></div>
            </div>
          ))}
        </section>

        <section className="org-payment-card org-payment-panel">
          <div className="org-payment-section-head"><h2>وضعیت پرداخت</h2><p>آخرین وضعیت این تعهد در سیستم چارخونه.</p></div>
          {statusRows.map((row) => (
            <div className="org-payment-detail-row" key={row.label}>
              <span className={`org-payment-badge org-payment-badge--${row.tone}`}>{row.badge}</span>
              <div><span>{row.label}</span><strong>{row.value}</strong></div>
            </div>
          ))}
        </section>
      </div>

      <div className="org-payment-two-column org-payment-two-column--lower">
        <section className="org-payment-card org-payment-panel">
          <div className="org-payment-section-head"><h2>اطلاعات مرتبط</h2><p>اطلاعات پرونده و طرح مرتبط با این پرداخت.</p></div>
          {relatedRows.map(([label, value]) => (
            <div className="org-payment-info-row" key={label}><span>{label}</span><strong>{value}</strong></div>
          ))}
        </section>

        <section className="org-payment-card org-payment-panel">
          <div className="org-payment-section-head"><h2>آخرین رویدادها</h2><p>رویدادهای مرتبط با این تعهد به ترتیب جدیدترین مورد.</p></div>
          <div className="org-payment-timeline">
            {events.map((event) => (
              <div className="org-payment-timeline__row" key={event.date}>
                <span>{event.note}</span>
                <div><strong>{event.title}</strong><small>{event.date}</small></div>
              </div>
            ))}
          </div>
        </section>
      </div>

      <section className="org-payment-card org-payment-detail__action">
        <Link href={confirmHref} className="org-payment-primary-button">پرداخت ۲۴٬۰۰۰٬۰۰۰ تومان</Link>
        <div><strong>پرداخت این تعهد</strong><small>پس از پرداخت، وضعیت این سررسید در پنل سازمان و پرونده پرسنل به‌روزرسانی می‌شود.</small></div>
      </section>
    </section>
  );
}
