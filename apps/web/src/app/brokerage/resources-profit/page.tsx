const metrics = [
  {
    label: "کل اصل منابع تحت مدیریت",
    value: "۱۲۵٬۰۰۰٬۰۰۰٬۰۰۰ تومان",
    note: "۲۴۶ پرونده فعال",
  },
  {
    label: "حداقل سود مورد انتظار این ماه",
    value: "۲٬۱۰۰٬۰۰۰٬۰۰۰ تومان",
    note: "کف دوره؛ سقف ندارد",
  },
  {
    label: "سود ایجادشده این ماه",
    value: "۲٬۴۶۰٬۰۰۰٬۰۰۰ تومان",
    note: "۳۶۰٬۰۰۰٬۰۰۰ تومان بالاتر از کف",
    emphasis: true,
  },
  {
    label: "سود آماده انتقال به چارخونه",
    value: "۲٬۴۶۰٬۰۰۰٬۰۰۰ تومان",
    note: "کل سود دوره به چارخونه منتقل می‌شود",
  },
] as const;

const profitPeriods = [
  { period: "تیر ۱۴۰۵", minimum: "۱٬۸۲۰٬۰۰۰٬۰۰۰", actual: "۲٬۰۵۰٬۰۰۰٬۰۰۰", surplus: "۲۳۰٬۰۰۰٬۰۰۰", transfer: "۲٬۰۵۰٬۰۰۰٬۰۰۰", status: "انجام‌شده" },
  { period: "مرداد ۱۴۰۵", minimum: "۱٬۹۵۰٬۰۰۰٬۰۰۰", actual: "۲٬۲۸۰٬۰۰۰٬۰۰۰", surplus: "۳۳۰٬۰۰۰٬۰۰۰", transfer: "۲٬۲۸۰٬۰۰۰٬۰۰۰", status: "انجام‌شده" },
  { period: "شهریور ۱۴۰۵", minimum: "۲٬۱۰۰٬۰۰۰٬۰۰۰", actual: "۲٬۴۶۰٬۰۰۰٬۰۰۰", surplus: "۳۶۰٬۰۰۰٬۰۰۰", transfer: "۲٬۴۶۰٬۰۰۰٬۰۰۰", status: "آماده انتقال" },
  { period: "خرداد ۱۴۰۵", minimum: "۱٬۷۴۰٬۰۰۰٬۰۰۰", actual: "۱٬۸۹۰٬۰۰۰٬۰۰۰", surplus: "۱۵۰٬۰۰۰٬۰۰۰", transfer: "۱٬۸۹۰٬۰۰۰٬۰۰۰", status: "انجام‌شده" },
] as const;

export default function BrokerageResourcesProfitPage() {
  return (
    <section className="brokerage-resources" data-node-id="379:2" data-name="Brokerage / Resources & Profit">
      <header className="brokerage-resources__header">
        <button type="button" className="brokerage-export-button" aria-label="دریافت خروجی منابع و سود">
          خروجی&nbsp;&nbsp;⌄
        </button>
        <div>
          <h1>منابع و سود</h1>
          <p>کنترل اصل منابع، سود ایجادشده و تسویه‌های چارخونه</p>
        </div>
      </header>

      <div className="brokerage-resources__metrics">
        {metrics.map((item) => (
          <article key={item.label} className={["brokerage-resources__metric", item.emphasis ? "brokerage-resources__metric--emphasis" : ""].filter(Boolean).join(" ")}>
            <span>{item.label}</span>
            <strong>{item.value}</strong>
            <small>{item.note}</small>
          </article>
        ))}
      </div>

      <div className="brokerage-resources__split">
        <section className="brokerage-resources__panel">
          <div className="brokerage-resources__section-heading">
            <h2>اصل منابع تحت مدیریت</h2>
            <p>همه وجوه در حساب چارخونه نزد کارگزاری هستند؛ اصل منابع به‌صورت دفتری و پرونده‌محور تفکیک می‌شود.</p>
          </div>

          <div className="brokerage-resource-row">
            <strong>۳۲٬۰۰۰٬۰۰۰٬۰۰۰ تومان</strong>
            <div>
              <span>وجه مستأجران</span>
              <small>۹۶ پرونده</small>
            </div>
          </div>
          <div className="brokerage-resource-row">
            <strong>۹۳٬۰۰۰٬۰۰۰٬۰۰۰ تومان</strong>
            <div>
              <span>اصل تأمین مالی</span>
              <small>۱۵۰ پرونده</small>
            </div>
          </div>
          <div className="brokerage-resource-total">
            <strong>۱۲۵٬۰۰۰٬۰۰۰٬۰۰۰ تومان</strong>
            <span>جمع اصل منابع تفکیک‌شده</span>
          </div>
        </section>

        <section className="brokerage-resources__panel">
          <div className="brokerage-resources__section-heading">
            <h2>سود تجمیعی منابع</h2>
            <p>سود هر پرونده محاسبه و گزارش می‌شود؛ اما انتقال سود به چارخونه به‌صورت تجمیعی انجام می‌شود.</p>
          </div>

          <div className="brokerage-profit-grid">
            <article>
              <span>حداقل دوره</span>
              <strong>۲٬۱۰۰٬۰۰۰٬۰۰۰</strong>
              <small>تومان</small>
            </article>
            <article className="brokerage-profit-grid__actual">
              <span>سود واقعی</span>
              <strong>۲٬۴۶۰٬۰۰۰٬۰۰۰</strong>
              <small>تومان</small>
            </article>
          </div>

          <div className="brokerage-profit-note">۳۶۰٬۰۰۰٬۰۰۰ تومان مازاد نیز همراه کل سود به چارخونه منتقل می‌شود و متعلق به چارخونه است.</div>
        </section>
      </div>

      <section className="brokerage-periods">
        <div className="brokerage-periods__header">
          <button type="button" className="brokerage-export-button" aria-label="دریافت خروجی دوره‌های سود">
            خروجی&nbsp;&nbsp;⌄
          </button>
          <div className="brokerage-resources__section-heading">
            <h2>دوره‌های سود و انتقال</h2>
            <p>حداقل سود، سود واقعی و مبلغ انتقالی هر دوره به چارخونه.</p>
          </div>
        </div>

        <div className="brokerage-periods__table-wrap">
          <div className="brokerage-periods__table" role="table" aria-label="دوره‌های سود و انتقال">
            <div className="brokerage-periods__row brokerage-periods__head" role="row">
              <span role="columnheader">وضعیت</span>
              <span role="columnheader">انتقال به چارخونه</span>
              <span role="columnheader">مازاد</span>
              <span role="columnheader">سود واقعی</span>
              <span role="columnheader">حداقل سود</span>
              <span role="columnheader">دوره</span>
            </div>
            {profitPeriods.map((item) => (
              <div className="brokerage-periods__row" role="row" key={item.period}>
                <span role="cell" className={item.status === "آماده انتقال" ? "brokerage-periods__status brokerage-periods__status--ready" : "brokerage-periods__status"}>{item.status}</span>
                <span role="cell">{item.transfer}</span>
                <span role="cell">{item.surplus}</span>
                <span role="cell">{item.actual}</span>
                <span role="cell">{item.minimum}</span>
                <strong role="cell">{item.period}</strong>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="brokerage-resources__split brokerage-resources__split--bottom">
        <section className="brokerage-resources__panel brokerage-resources__panel--compact">
          <div className="brokerage-resources__section-heading">
            <h2>سهم چارخونه از درآمد کارگزاری</h2>
            <p>این جریان جدا از سود منابع است و براساس قرارداد همکاری محاسبه می‌شود.</p>
          </div>
          <div className="brokerage-info-grid">
            <div><span>درآمد مشمول سهم</span><strong>۱٬۴۲۰٬۰۰۰٬۰۰۰ تومان</strong></div>
            <div><span>سهم محاسبه‌شده چارخونه</span><strong>۳۵٬۵۰۰٬۰۰۰ تومان</strong></div>
          </div>
          <div className="brokerage-info-strip">
            <span className="brokerage-resources-chip">در انتظار تسویه</span>
            <small>نرخ سهم: طبق قرارداد همکاری</small>
          </div>
        </section>

        <section className="brokerage-resources__panel brokerage-resources__panel--compact">
          <div className="brokerage-resources__section-heading">
            <h2>نیاز نقدشوندگی براساس سررسید مالکان</h2>
            <p>مدل دریافتی مالکان مشخص می‌کند چه میزان منابع باید تا سررسیدهای آینده آماده پرداخت باشد.</p>
          </div>
          <div className="brokerage-info-grid">
            <div><span>سررسید ۳۰ روز آینده</span><strong>۳۸ پرونده</strong></div>
            <div><span>مبلغ موردنیاز</span><strong>۱۸٬۴۰۰٬۰۰۰٬۰۰۰ تومان</strong></div>
          </div>
          <div className="brokerage-info-strip brokerage-info-strip--warning">
            <span className="brokerage-resources-chip">نیازمند آماده‌سازی</span>
            <small>۱٬۵۰۰٬۰۰۰٬۰۰۰ تومان تا سررسید باید نقدشونده شود</small>
          </div>
        </section>
      </div>
    </section>
  );
}
