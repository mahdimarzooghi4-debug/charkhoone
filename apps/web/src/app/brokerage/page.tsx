import Link from "next/link";

const brokerageAvatar =
  "https://www.figma.com/api/mcp/asset/0338039d-5cd3-4d2c-b6e5-38e6a7607ba2.png";

const kpis = [
  {
    label: "پرونده‌های مالی فعال",
    badge: "پرونده‌های فعال",
    value: "۲۴۶ پرونده",
    tone: "success",
  },
  {
    label: "سود تجمیعی ایجادشده",
    badge: "این ماه",
    value: "۲٬۴۶۰٬۰۰۰٬۰۰۰ تومان",
    tone: "success",
  },
  {
    label: "سود آماده انتقال به چارخونه",
    badge: "نیازمند انتقال",
    value: "۲٬۴۶۰٬۰۰۰٬۰۰۰ تومان",
    tone: "warning",
  },
] as const;

const actions = [
  {
    reference: "۱۴۰۵-۸۳۲۱",
    operation: "دریافت منابع پرونده",
    amount: "۶۵۰٬۰۰۰٬۰۰۰ تومان",
    due: "۱۴۰۵/۰۶/۰۸",
    status: "در انتظار تأیید",
    href: "/brokerage/cases/1405-8321",
  },
  {
    reference: "دوره شهریور ۱۴۰۵",
    operation: "انتقال سود تجمیعی به چارخونه",
    amount: "۲٬۴۶۰٬۰۰۰٬۰۰۰ تومان",
    due: "۱۴۰۵/۰۶/۰۹",
    status: "آماده انتقال",
    href: "/brokerage/receive-transfer",
  },
  {
    reference: "۱۴۰۵-۷۹۴۲",
    operation: "منابع تا سررسید مالک",
    amount: "۴۸۰٬۰۰۰٬۰۰۰ تومان",
    due: "۱۴۰۵/۰۶/۱۸",
    status: "در حال مدیریت",
    href: "/brokerage/cases/1405-7942",
  },
  {
    reference: "دوره شهریور ۱۴۰۵",
    operation: "سهم چارخونه از درآمد کارگزاری",
    amount: "۳۵٬۵۰۰٬۰۰۰ تومان",
    due: "۱۴۰۵/۰۷/۰۱",
    status: "در انتظار تسویه",
    href: "/brokerage/receive-transfer",
  },
] as const;

const financialSummary = [
  {
    label: "سود منتقل‌شده به چارخونه",
    value: "۰ تومان",
    note: "کل سود منتقل‌شده در دوره جاری",
  },
  {
    label: "سود تجمیعی ایجادشده",
    value: "۲٬۴۶۰٬۰۰۰٬۰۰۰ تومان",
    note: "کل بازده ساخته‌شده روی منابع",
  },
  {
    label: "اصل منابع تحت مدیریت",
    value: "۱۲۵٬۰۰۰٬۰۰۰٬۰۰۰ تومان",
    note: "اصل منابع پرونده‌ها با تفکیک دفتری",
  },
] as const;

export default function BrokerageDashboardPage() {
  return (
    <section className="brokerage-dashboard" data-node-id="347:3" data-name="Brokerage / Dashboard">
      <header className="brokerage-dashboard__header">
        <div className="brokerage-operator">
          <div className="brokerage-operator__copy">
            <strong>مرکز عملیات</strong>
            <span>تیم چارخونه کارگزاری</span>
          </div>
          <img className="brokerage-operator__avatar" src={brokerageAvatar} alt="مرکز عملیات" width={40} height={40} />
        </div>
        <div className="brokerage-dashboard__copy">
          <h1>خانه</h1>
          <p>نمای کلی منابع، سود و عملیات کارگزاری در چارخونه</p>
        </div>
      </header>

      <div className="brokerage-kpis">
        {kpis.map((item) => (
          <article className="brokerage-kpi" key={item.label}>
            <div className="brokerage-kpi__top">
              <span className={`brokerage-badge brokerage-badge--${item.tone}`}>{item.badge}</span>
              <span>{item.label}</span>
            </div>
            <strong>{item.value}</strong>
          </article>
        ))}
      </div>

      <section className="brokerage-section">
        <h2>نیازمند اقدام</h2>
        <div className="brokerage-table-wrap">
          <div className="brokerage-action-table" role="table" aria-label="عملیات نیازمند اقدام">
            <div className="brokerage-action-table__row brokerage-action-table__head" role="row">
              <span role="columnheader">اقدام</span>
              <span role="columnheader">وضعیت</span>
              <span role="columnheader">سررسید</span>
              <span role="columnheader">مبلغ</span>
              <span role="columnheader">نوع عملیات</span>
              <span role="columnheader">پرونده / دوره</span>
            </div>
            {actions.map((item) => (
              <div className="brokerage-action-table__row" role="row" key={`${item.reference}-${item.operation}`}>
                <span className="brokerage-action-table__action" role="cell">
                  <Link href={item.href}>مشاهده</Link>
                </span>
                <span role="cell">
                  <span className="brokerage-badge brokerage-badge--warning">{item.status}</span>
                </span>
                <span role="cell">{item.due}</span>
                <strong role="cell">{item.amount}</strong>
                <span role="cell">{item.operation}</span>
                <strong role="cell">{item.reference}</strong>
              </div>
            ))}
          </div>
        </div>
        <Link className="brokerage-view-all" href="/brokerage/receive-transfer">
          مشاهده همه عملیات ‹
        </Link>
      </section>

      <section className="brokerage-section brokerage-financial">
        <h2>خلاصه منابع و سود</h2>
        <div className="brokerage-financial__grid">
          {financialSummary.map((item) => (
            <article className="brokerage-financial-card" key={item.label}>
              <span>{item.label}</span>
              <strong>{item.value}</strong>
              <small>{item.note}</small>
            </article>
          ))}
        </div>
      </section>
    </section>
  );
}
