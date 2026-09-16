import Link from "next/link";

const metrics = [
  { label: "پرسنل ثبت‌شده", value: "۱٬۲۸۰ نفر", note: "API و ثبت دستی" },
  { label: "پرسنل فعال در چارخونه", value: "۳۴۲ نفر", note: "دارای فرآیند فعال" },
  { label: "پرونده‌های فعال", value: "۱۱۸ پرونده", note: "در مراحل مختلف" },
  { label: "نیازمند اقدام سازمان", value: "۲۳ مورد", note: "اطلاعات، طرح یا پرداخت" },
] as const;

const requiredActions = [
  { title: "۱۲ نفر هنوز طرح ندارند", note: "پرسنل ثبت‌شده بدون طرح بانکی", action: "انتخاب طرح", tone: "warning" },
  { title: "۷ پرونده منتظر تأیید اطلاعات", note: "اطلاعات پرسنلی باید توسط سازمان بررسی شود", action: "بررسی", tone: "warning" },
  { title: "۴ پرداخت نزدیک سررسید", note: "پرداخت‌های مربوط به تعهد سازمان", action: "مشاهده", tone: "primary" },
] as const;

const activePlans = [
  { title: "طرح کارکنان سازمانی", note: "بانک نمونه • تا ۵۰۰ میلیون تومان" },
  { title: "طرح مسکن کارکنان", note: "بانک توسعه • تا ۷۵۰ میلیون تومان" },
] as const;

const staffStatus = [
  { label: "دعوت‌شده", value: "۸۴" },
  { label: "در حال تکمیل", value: "۵۱" },
  { label: "بررسی بانک", value: "۳۶" },
  { label: "فعال", value: "۱۷۱" },
] as const;

const employeeSources = [
  { label: "اتصال منابع انسانی", value: "متصل" },
  { label: "آخرین بروزرسانی", value: "امروز ۱۴:۱۰" },
  { label: "ثبت دستی این ماه", value: "۲۷ نفر" },
] as const;

const payments = [
  {
    status: "آماده پرداخت",
    amount: "۲۴۰٬۰۰۰٬۰۰۰ تومان",
    dueDate: "۱۴۰۵/۰۶/۱۵",
    plan: "طرح کارکنان سازمانی",
    description: "سهم سازمان در دوره شهریور",
  },
  {
    status: "در انتظار",
    amount: "۴۸٬۰۰۰٬۰۰۰ تومان",
    dueDate: "۱۴۰۵/۰۶/۲۲",
    plan: "طرح مسکن کارکنان",
    description: "هزینه خدمات طرح",
  },
] as const;

function SectionHeading({ title, description }: { title: string; description: string }) {
  return (
    <div className="org-section-heading">
      <h2>{title}</h2>
      <p>{description}</p>
    </div>
  );
}

export default function OrganizationDashboardPage() {
  return (
    <div className="org-dashboard" data-node-id="435:4">
      <header className="org-dashboard__header" data-node-id="435:131">
        <div className="org-dashboard__copy">
          <h1>خانه</h1>
          <p>مدیریت پرسنل، طرح‌های بانکی و وضعیت پرونده‌های سازمان</p>
        </div>
        <div className="org-dashboard__actions">
          <Link className="org-action-button org-action-button--primary" href="/organization/personnel/new">
            افزودن پرسنل
          </Link>
          <Link className="org-action-button org-action-button--surface" href="/organization/bank-plans">
            مشاهده طرح‌ها
          </Link>
        </div>
      </header>

      <section className="org-metrics" aria-label="شاخص‌های سازمان" data-node-id="435:140">
        {metrics.map((metric) => (
          <article className="org-metric-card" key={metric.label}>
            <span>{metric.label}</span>
            <strong>{metric.value}</strong>
            <small>{metric.note}</small>
          </article>
        ))}
      </section>

      <section className="org-two-column" data-node-id="435:157">
        <article className="org-panel">
          <SectionHeading title="اقدام‌های لازم" description="مواردی که نیاز به پیگیری سازمان دارند" />
          <div className="org-action-list">
            {requiredActions.map((item) => (
              <div className="org-action-row" key={item.title}>
                <div className="org-action-row__copy">
                  <strong>{item.title}</strong>
                  <span>{item.note}</span>
                </div>
                <span className={`org-pill org-pill--${item.tone}`}>{item.action}</span>
              </div>
            ))}
          </div>
        </article>

        <article className="org-panel">
          <SectionHeading title="طرح‌های فعال سازمان" description="طرح‌های بانکی انتخاب‌شده برای پرسنل" />
          <div className="org-plan-list">
            {activePlans.map((plan) => (
              <div className="org-plan-row" key={plan.title}>
                <div>
                  <strong>{plan.title}</strong>
                  <span>{plan.note}</span>
                </div>
                <span className="org-pill org-pill--primary">فعال</span>
              </div>
            ))}
          </div>
        </article>
      </section>

      <section className="org-two-column org-two-column--compact" data-node-id="435:196">
        <article className="org-panel">
          <SectionHeading title="وضعیت پرسنل" description="آخرین وضعیت افراد در مسیر چارخونه" />
          <div className="org-mini-grid org-mini-grid--four">
            {staffStatus.map((item) => (
              <div className="org-mini-metric" key={item.label}>
                <span>{item.label}</span>
                <strong>{item.value}</strong>
              </div>
            ))}
          </div>
        </article>

        <article className="org-panel">
          <SectionHeading title="ثبت و بروزرسانی پرسنل" description="پرسنل از API منابع انسانی یا به‌صورت دستی ثبت می‌شوند" />
          <div className="org-mini-grid org-mini-grid--three">
            {employeeSources.map((item) => (
              <div className="org-mini-metric" key={item.label}>
                <span>{item.label}</span>
                <strong>{item.value}</strong>
              </div>
            ))}
          </div>
        </article>
      </section>

      <section className="org-panel org-payments" data-node-id="435:228">
        <SectionHeading title="پرداخت‌های پیش‌رو" description="فقط پرداخت‌هایی که طبق طرح بر عهده سازمان است" />
        <div className="org-payment-table" role="table" aria-label="پرداخت‌های پیش‌رو">
          <div className="org-payment-table__row org-payment-table__head" role="row">
            <span role="columnheader">وضعیت</span>
            <span role="columnheader">مبلغ</span>
            <span role="columnheader">سررسید</span>
            <span role="columnheader">طرح</span>
            <span role="columnheader">شرح</span>
          </div>
          {payments.map((payment) => (
            <div className="org-payment-table__row" role="row" key={`${payment.plan}-${payment.dueDate}`}>
              <span className="org-payment-table__status" role="cell">{payment.status}</span>
              <span role="cell">{payment.amount}</span>
              <span role="cell">{payment.dueDate}</span>
              <span role="cell">{payment.plan}</span>
              <span role="cell">{payment.description}</span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
