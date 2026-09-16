import Link from "next/link";

type PaymentTone = "success" | "warning" | "muted";

type PaymentRow = {
  id: string;
  personnel: string;
  plan: string;
  type: string;
  amount: string;
  status: string;
  tone: PaymentTone;
  dueAt: string;
  action: "پرداخت" | "مشاهده";
};

const metrics = [
  { label: "سررسید این ماه", value: "۱۸ پرداخت", note: "۲۴۸٬۰۰۰٬۰۰۰ تومان" },
  { label: "نیازمند پرداخت", value: "۶ پرداخت", note: "۸۴٬۰۰۰٬۰۰۰ تومان" },
  { label: "پرداخت‌شده این ماه", value: "۱۲ پرداخت", note: "۱۶۴٬۰۰۰٬۰۰۰ تومان" },
  { label: "پرداخت بعدی", value: "۱۴۰۵/۰۶/۱۸", note: "۲۴٬۰۰۰٬۰۰۰ تومان" },
] as const;

const rows: PaymentRow[] = [
  { id: "1405-06-18", personnel: "علی رضایی", plan: "طرح حمایتی کارکنان", type: "پرداخت ماهانه", amount: "۲۴٬۰۰۰٬۰۰۰ تومان", status: "نیازمند پرداخت", tone: "warning", dueAt: "۱۴۰۵/۰۶/۱۸", action: "پرداخت" },
  { id: "1405-06-08", personnel: "مریم محمدی", plan: "طرح حمایتی کارکنان", type: "پرداخت ماهانه", amount: "۱۸٬۰۰۰٬۰۰۰ تومان", status: "پرداخت‌شده", tone: "success", dueAt: "۱۴۰۵/۰۶/۰۸", action: "مشاهده" },
  { id: "1405-06-07", personnel: "رضا کریمی", plan: "طرح حمایتی کارکنان", type: "سهم اولیه سازمان", amount: "۳۵٬۰۰۰٬۰۰۰ تومان", status: "پرداخت‌شده", tone: "success", dueAt: "۱۴۰۵/۰۶/۰۷", action: "مشاهده" },
  { id: "1405-06-20", personnel: "امیر حسینی", plan: "طرح حمایتی کارکنان", type: "پرداخت ماهانه", amount: "۲۲٬۰۰۰٬۰۰۰ تومان", status: "پیش‌رو", tone: "muted", dueAt: "۱۴۰۵/۰۶/۲۰", action: "مشاهده" },
  { id: "1405-06-18-2", personnel: "نگار موسوی", plan: "طرح حمایتی کارکنان", type: "پرداخت ماهانه", amount: "۱۶٬۰۰۰٬۰۰۰ تومان", status: "نیازمند پرداخت", tone: "warning", dueAt: "۱۴۰۵/۰۶/۱۸", action: "پرداخت" },
  { id: "1405-06-05", personnel: "حسین جعفری", plan: "طرح حمایتی کارکنان", type: "پرداخت ماهانه", amount: "۲۱٬۰۰۰٬۰۰۰ تومان", status: "پرداخت‌شده", tone: "success", dueAt: "۱۴۰۵/۰۶/۰۵", action: "مشاهده" },
  { id: "1405-06-19", personnel: "سارا احمدی", plan: "طرح مسکن کارکنان", type: "سهم اولیه سازمان", amount: "۴۵٬۰۰۰٬۰۰۰ تومان", status: "نیازمند پرداخت", tone: "warning", dueAt: "۱۴۰۵/۰۶/۱۹", action: "پرداخت" },
  { id: "1405-06-22", personnel: "زهرا یوسفی", plan: "طرح کارکنان سازمانی", type: "پرداخت ماهانه", amount: "۱۹٬۰۰۰٬۰۰۰ تومان", status: "پیش‌رو", tone: "muted", dueAt: "۱۴۰۵/۰۶/۲۲", action: "مشاهده" },
  { id: "1405-06-04", personnel: "محمد نادری", plan: "طرح مسکن کارکنان", type: "پرداخت ماهانه", amount: "۲۰٬۰۰۰٬۰۰۰ تومان", status: "پرداخت‌شده", tone: "success", dueAt: "۱۴۰۵/۰۶/۰۴", action: "مشاهده" },
  { id: "1405-06-18-3", personnel: "نرگس اکبری", plan: "طرح حمایتی کارکنان", type: "پرداخت ماهانه", amount: "۲۳٬۰۰۰٬۰۰۰ تومان", status: "نیازمند پرداخت", tone: "warning", dueAt: "۱۴۰۵/۰۶/۱۸", action: "پرداخت" },
];

export default function OrganizationPaymentsPage() {
  return (
    <section className="org-payments" data-node-id="510:29">
      <header className="org-payments__header">
        <button type="button" className="org-action-button org-action-button--surface">خروجی</button>
        <div><h1>پرداخت‌ها</h1><p>مدیریت تعهدات و پرداخت‌های سازمان برای طرح‌های بانکی</p></div>
      </header>

      <div className="org-payments__metrics">
        {metrics.map((metric) => <article className="org-payment-metric" key={metric.label}><span>{metric.label}</span><strong>{metric.value}</strong><small>{metric.note}</small></article>)}
      </div>

      <div className="org-payments__controls">
        <div className="org-payments__filters" aria-label="فیلتر پرداخت‌ها">
          <button type="button" className="org-payment-filter org-payment-filter--active">همه</button>
          <button type="button" className="org-payment-filter org-payment-filter--warning">نیازمند پرداخت</button>
          <button type="button" className="org-payment-filter">پرداخت‌شده</button>
          <button type="button" className="org-payment-filter">پیش‌رو</button>
        </div>
        <label className="org-payments__search"><span className="sr-only">جستجوی پرداخت</span><input type="search" placeholder="جستجو با نام پرسنل، شماره پرونده یا نام طرح" /></label>
      </div>

      <div className="org-payments-table-wrap">
        <table className="org-payments-table">
          <thead><tr><th>پرسنل</th><th>طرح</th><th>نوع پرداخت</th><th>مبلغ</th><th>وضعیت</th><th>سررسید</th><th>اقدام</th></tr></thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id}>
                <td><strong>{row.personnel}</strong></td><td><strong>{row.plan}</strong></td><td>{row.type}</td><td><strong>{row.amount}</strong></td>
                <td><span className={`org-payment-badge org-payment-badge--${row.tone}`}>{row.status}</span></td><td>{row.dueAt}</td>
                <td><Link href={`/organization/payments/${row.id}`} className={row.action === "پرداخت" ? "org-payment-table-action org-payment-table-action--primary" : "org-payment-table-action"}>{row.action}</Link></td>
              </tr>
            ))}
          </tbody>
        </table>
        <footer className="org-payments__footer"><div className="org-pagination"><button type="button">بعدی</button><button type="button" className="org-pagination__active">۱</button><button type="button">۲</button><button type="button">۳</button><button type="button">قبلی</button></div><span>نمایش ۱۰ پرداخت از ۷۴ پرداخت</span></footer>
      </div>
    </section>
  );
}
