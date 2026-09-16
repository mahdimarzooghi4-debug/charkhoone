import Link from "next/link";

type PaymentTone = "success" | "warning" | "neutral" | "danger";

type PaymentDetail = {
  routeId: string;
  paymentId: string;
  user: string;
  role: string;
  caseId: string;
  type: string;
  amount: string;
  status: string;
  statusTone: PaymentTone;
  time: string;
  partner: string;
};

const payments: Record<string, PaymentDetail> = {
  "payment-1182": {
    routeId: "payment-1182",
    paymentId: "PAY-1405-8421",
    user: "علی رضایی",
    role: "مستأجر",
    caseId: "CS-1405-1182",
    type: "تسویه مالک",
    amount: "۲۴٬۰۰۰٬۰۰۰ تومان",
    status: "موفق",
    statusTone: "success",
    time: "امروز ۱۴:۳۲",
    partner: "بانک نمونه",
  },
  "payment-1181": { routeId: "payment-1181", paymentId: "—", user: "مریم احمدی", role: "مستأجر", caseId: "CS-1405-1181", type: "پرداخت مستأجر", amount: "۱۸٬۰۰۰٬۰۰۰ تومان", status: "در انتظار", statusTone: "warning", time: "امروز ۱۳:۰۵", partner: "بانک نمونه" },
  "payment-1178": { routeId: "payment-1178", paymentId: "—", user: "رضا کاظمی", role: "کاربر", caseId: "CS-1405-1178", type: "تأمین مالی", amount: "۳۵٬۰۰۰٬۰۰۰ تومان", status: "موفق", statusTone: "success", time: "امروز ۱۲:۴۰", partner: "بانک نمونه" },
  "payment-1176": { routeId: "payment-1176", paymentId: "—", user: "سارا محمدی", role: "کاربر", caseId: "CS-1405-1176", type: "تسویه مالک", amount: "۲۲٬۰۰۰٬۰۰۰ تومان", status: "ناموفق", statusTone: "danger", time: "امروز ۱۱:۲۲", partner: "بانک نمونه" },
  "payment-1170": { routeId: "payment-1170", paymentId: "—", user: "نگار کریمی", role: "مستأجر", caseId: "CS-1405-1170", type: "پرداخت مستأجر", amount: "۱۶٬۰۰۰٬۰۰۰ تومان", status: "موفق", statusTone: "success", time: "امروز ۱۰:۴۸", partner: "بانک نمونه" },
  "payment-1168": { routeId: "payment-1168", paymentId: "—", user: "حسین جعفری", role: "کاربر", caseId: "CS-1405-1168", type: "تسویه مالک", amount: "۲۱٬۰۰۰٬۰۰۰ تومان", status: "موفق", statusTone: "success", time: "دیروز", partner: "بانک نمونه" },
  "payment-1163": { routeId: "payment-1163", paymentId: "—", user: "محمد مرادی", role: "کاربر", caseId: "CS-1405-1163", type: "تطبیق مالی", amount: "۴۵٬۰۰۰٬۰۰۰ تومان", status: "نیازمند بررسی", statusTone: "warning", time: "دیروز", partner: "بانک نمونه" },
  "payment-1159": { routeId: "payment-1159", paymentId: "—", user: "زهرا یوسفی", role: "مستأجر", caseId: "CS-1405-1159", type: "پرداخت مستأجر", amount: "۱۹٬۰۰۰٬۰۰۰ تومان", status: "موفق", statusTone: "success", time: "۲ روز پیش", partner: "بانک نمونه" },
  "payment-1156": { routeId: "payment-1156", paymentId: "—", user: "الهام یوسفی", role: "کاربر", caseId: "CS-1405-1156", type: "تسویه مالک", amount: "۲۰٬۰۰۰٬۰۰۰ تومان", status: "در انتظار", statusTone: "warning", time: "۲ روز پیش", partner: "بانک نمونه" },
  "payment-1150": { routeId: "payment-1150", paymentId: "—", user: "نرگس اکبری", role: "مستأجر", caseId: "CS-1405-1150", type: "پرداخت مستأجر", amount: "۲۳٬۰۰۰٬۰۰۰ تومان", status: "موفق", statusTone: "success", time: "۳ روز پیش", partner: "بانک نمونه" },
};

type PageProps = {
  params: Promise<{ id: string }>;
};

function Badge({ children, tone = "neutral" }: { children: React.ReactNode; tone?: PaymentTone }) {
  return <span className={`admin-payment-detail__badge admin-payment-detail__badge--${tone}`}>{children}</span>;
}

export default async function AdminPaymentDetailPage({ params }: PageProps) {
  const { id } = await params;
  const item = payments[id] ?? payments["payment-1182"];
  const isReferencePayment = item.routeId === "payment-1182";
  const displayPaymentId = item.paymentId === "—" ? item.routeId : item.paymentId;

  return (
    <section className="admin-payment-detail" data-node-id="712:12" data-name="Admin / Payment Detail">
      <header className="admin-payment-detail__header">
        <Link className="admin-payment-detail__back" href="/admin/payments">بازگشت به پرداخت‌ها</Link>
        <div className="admin-payment-detail__heading">
          <h1>جزئیات پرداخت</h1>
          <p>{displayPaymentId} — {item.user}</p>
        </div>
      </header>

      <section className="admin-payment-detail__panel admin-payment-detail__summary">
        <div className="admin-payment-detail__section-heading">
          <h2>خلاصه پرداخت</h2>
          <p>نمای مدیریتی تراکنش، وضعیت تسویه، تطبیق مالی و ارتباط آن با پرونده و کاربر در چارخونه.</p>
        </div>
        <div className="admin-payment-detail__summary-grid">
          <article><span>وضعیت</span><strong>{item.status}</strong><small>{item.time}</small></article>
          <article><span>مبلغ پرداخت</span><strong>{item.amount}</strong><small>تراکنش ثبت‌شده</small></article>
          <article><span>نوع پرداخت</span><strong>{item.type}</strong><small>{item.type === "تسویه مالک" ? "واریز به مالک" : "تراکنش مالی"}</small></article>
          <article><span>کاربر</span><strong>{item.user}</strong><small>{item.role} • پرونده فعال</small></article>
        </div>
      </section>

      <div className="admin-payment-detail__columns">
        <section className="admin-payment-detail__panel admin-payment-detail__detail-panel">
          <div className="admin-payment-detail__section-heading">
            <h2>جزئیات تراکنش و تسویه</h2>
            <p>مشخصات عملیاتی تراکنش و اطلاعات لازم برای پیگیری تسویه و تطبیق مالی.</p>
          </div>
          <div className="admin-payment-detail__detail-list">
            <div className="admin-payment-detail__detail-row">
              <Badge tone="success">مبدأ</Badge>
              <div><span>مبدأ تراکنش</span><strong>چارخونه</strong></div>
            </div>
            <div className="admin-payment-detail__detail-row">
              <Badge tone="success">شبا</Badge>
              <div><span>روش تسویه</span><strong>{item.type === "تسویه مالک" ? "انتقال به شماره شبا" : "انتقال بانکی"}</strong></div>
            </div>
            <div className="admin-payment-detail__detail-row">
              <Badge tone="neutral">بانکی</Badge>
              <div><span>شناسه پیگیری بانکی</span><strong>{isReferencePayment ? "••••۸۴۲۱" : "—"}</strong></div>
            </div>
          </div>
        </section>

        <section className="admin-payment-detail__panel admin-payment-detail__detail-panel">
          <div className="admin-payment-detail__section-heading">
            <h2>وضعیت، تطبیق و کنترل پرداخت</h2>
            <p>آخرین وضعیت پرداخت، نتیجه تطبیق مالی و وضعیت تسویه این تراکنش.</p>
          </div>
          <div className="admin-payment-detail__detail-list">
            <div className="admin-payment-detail__detail-row">
              <Badge tone={item.statusTone}>{item.status}</Badge>
              <div><span>وضعیت پرداخت</span><strong>{item.status === "موفق" ? "موفق و تأیید‌شده" : item.status}</strong></div>
            </div>
            <div className="admin-payment-detail__detail-row">
              <Badge tone={item.status === "ناموفق" || item.status === "نیازمند بررسی" ? "warning" : "success"}>تطبیق</Badge>
              <div><span>تطبیق مالی</span><strong>{item.status === "موفق" ? "تطبیق‌شده • بدون مغایرت" : "نیازمند بررسی"}</strong></div>
            </div>
            <div className="admin-payment-detail__detail-row">
              <Badge tone="neutral">تسویه</Badge>
              <div><span>وضعیت تسویه</span><strong>{item.status === "موفق" ? "تسویه‌شده" : item.status === "در انتظار" ? "در انتظار تسویه" : "نیازمند بررسی"}</strong></div>
            </div>
          </div>
        </section>
      </div>

      <div className="admin-payment-detail__columns admin-payment-detail__columns--lower">
        <section className="admin-payment-detail__panel">
          <div className="admin-payment-detail__section-heading">
            <h2>اطلاعات مرتبط</h2>
            <p>شناسه‌ها و اطلاعات مرتبط برای پیگیری مدیریتی این تراکنش.</p>
          </div>
          <dl className="admin-payment-detail__facts">
            <div><dt>شماره پرونده</dt><dd><Link href={`/admin/cases/${item.caseId}`}>{item.caseId}</Link></dd></div>
            <div><dt>کاربر</dt><dd>{item.user} — {item.role}</dd></div>
            <div><dt>شریک مالی</dt><dd>{item.partner}</dd></div>
            <div><dt>شناسه پرداخت</dt><dd>{displayPaymentId}</dd></div>
          </dl>
        </section>

        <section className="admin-payment-detail__panel">
          <div className="admin-payment-detail__section-heading">
            <h2>آخرین رویدادها</h2>
            <p>رویدادهای عملیاتی و مالی این تراکنش به ترتیب جدیدترین مورد.</p>
          </div>
          {isReferencePayment ? (
            <div className="admin-payment-detail__timeline">
              <div><span>تسویه</span><p><strong>پرونده آماده ورود به جریان پرداخت شد</strong><time>امروز ۱۴:۲۶</time></p></div>
              <div><span>شبکه پرداخت</span><p><strong>تسویه مالک به شبکه پرداخت ارسال شد</strong><time>امروز ۱۴:۳۰</time></p></div>
              <div><span>تراکنش</span><p><strong>تراکنش با موفقیت ثبت و تأیید شد</strong><time>امروز ۱۴:۳۲</time></p></div>
              <div><span>تطبیق مالی</span><p><strong>تراکنش با گزارش شبکه پرداخت تطبیق شد</strong><time>امروز ۱۴:۳۴</time></p></div>
            </div>
          ) : (
            <div className="admin-payment-detail__timeline admin-payment-detail__timeline--empty">
              <p>جزئیات رویدادهای این تراکنش در داده نمونه Figma مشخص نشده است.</p>
            </div>
          )}
        </section>
      </div>

      <section className="admin-payment-detail__management" aria-label="مدیریت پرداخت">
        <div className="admin-payment-detail__actions">
          <button className="admin-payment-detail__action" type="button">ثبت یادداشت</button>
          <Link className="admin-payment-detail__action" href="/admin/payments/settlements">مدیریت تسویه</Link>
          <Link className="admin-payment-detail__action admin-payment-detail__action--warning" href="/admin/payments/reconciliation">تطبیق مالی</Link>
          <button className="admin-payment-detail__action admin-payment-detail__action--primary" type="button">اصلاح وضعیت</button>
        </div>
        <div className="admin-payment-detail__management-copy">
          <h2>مدیریت پرداخت</h2>
          <p>اصلاح وضعیت، تطبیق مالی و تغییرات تسویه با دلیل و زمان در تاریخچه تراکنش ثبت می‌شوند.</p>
        </div>
      </section>
    </section>
  );
}
