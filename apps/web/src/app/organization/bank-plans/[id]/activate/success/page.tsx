import Link from "next/link";

const summary = [
  { label: "طرح", value: "طرح حمایتی کارکنان", note: "بانک نمونه" },
  { label: "پرسنل فعال‌شده", value: "۶ نفر", note: "همه واجد شرایط" },
  { label: "پرداخت‌کننده", value: "سازمان", note: "پرداخت ماهانه" },
  { label: "سقف تأمین مالی", value: "۳۵۰ میلیون تومان", note: "برای هر فرد واجد شرایط" },
] as const;

const nextSteps = [
  { title: "پرسنل طرح را در چارخونه می‌بینند", note: "افراد انتخاب‌شده می‌توانند مراحل خود را ادامه دهند." },
  { title: "پرداخت‌های سازمان در بخش پرداخت‌ها ساخته می‌شود", note: "فقط برای پرونده‌هایی که طبق این طرح به مرحله پرداخت برسند." },
  { title: "وضعیت هر فرد از بخش پرونده‌ها قابل پیگیری است", note: "سازمان می‌تواند مرحله فعلی هر پرسنل را مشاهده کند." },
] as const;

export default function OrganizationPlanActivationSuccessPage() {
  return (
    <section className="org-plan-success" data-node-id="489:29">
      <header className="org-plan-success__header">
        <div>
          <h1>فعال‌سازی با موفقیت انجام شد</h1>
          <p>طرح حمایتی کارکنان برای پرسنل انتخاب‌شده فعال شد.</p>
        </div>
      </header>

      <article className="org-plan-card org-plan-success__hero">
        <span className="org-plan-success__icon" aria-hidden="true">✓</span>
        <h2>طرح برای ۶ نفر فعال شد</h2>
        <p>از این لحظه این پرسنل طرح را در مسیر خود می‌بینند و وضعیت استفاده آن‌ها از پنل سازمان قابل پیگیری است.</p>
        <span className="org-plan-status org-plan-status--active">فعال</span>
      </article>

      <article className="org-plan-card org-plan-success__summary">
        <h2>خلاصه فعال‌سازی</h2>
        <div className="org-plan-success__summary-grid">
          {summary.map((item) => (
            <div key={item.label}>
              <span>{item.label}</span>
              <strong>{item.value}</strong>
              <small>{item.note}</small>
            </div>
          ))}
        </div>
      </article>

      <article className="org-plan-card org-plan-success__next">
        <h2>بعد از فعال‌سازی چه می‌شود؟</h2>
        <p>از این مرحله به بعد وضعیت هر فرد و تعهدات سازمان در بخش‌های مربوطه قابل پیگیری است.</p>
        <div className="org-plan-success__steps">
          {nextSteps.map((step, index) => (
            <div key={step.title}>
              <span>{index + 1}</span>
              <div><strong>{step.title}</strong><small>{step.note}</small></div>
            </div>
          ))}
        </div>
      </article>

      <footer className="org-plan-flow__actions">
        <Link href="/organization/bank-plans/supportive-employees" className="org-action-button org-action-button--primary">مشاهده طرح فعال</Link>
        <Link href="/organization/bank-plans" className="org-action-button org-action-button--surface">بازگشت به طرح‌ها</Link>
      </footer>
    </section>
  );
}
