import Link from "next/link";

const summary = [
  { label: "طرح انتخاب‌شده", value: "طرح حمایتی کارکنان", note: "بانک نمونه" },
  { label: "پرسنل انتخاب‌شده", value: "۶ نفر", note: "همه واجد شرایط فعلی" },
  { label: "پرداخت‌کننده", value: "سازمان", note: "پرداخت ماهانه بر عهده سازمان" },
  { label: "سقف تأمین مالی", value: "۳۵۰ میلیون تومان", note: "برای هر فرد واجد شرایط" },
] as const;

const people = [
  { name: "علی رضایی", unit: "فناوری" },
  { name: "مریم محمدی", unit: "مالی" },
  { name: "رضا کریمی", unit: "عملیات" },
  { name: "امیر حسینی", unit: "فروش" },
  { name: "نگار موسوی", unit: "حقوقی" },
  { name: "حسین جعفری", unit: "پشتیبانی" },
] as const;

export default function OrganizationPlanActivationReviewPage() {
  return (
    <section className="org-plan-review" data-node-id="484:29">
      <header className="org-plan-flow__header">
        <Link href="/organization/bank-plans/supportive-employees/activate" className="org-action-button org-action-button--surface">بازگشت به انتخاب پرسنل</Link>
        <div>
          <h1>بررسی و تأیید فعال‌سازی</h1>
          <p>پیش از فعال‌سازی، طرح، پرسنل و تعهد پرداخت سازمان را یک‌بار بررسی کنید.</p>
        </div>
      </header>

      <article className="org-plan-card org-plan-review__summary">
        <h2>خلاصه فعال‌سازی</h2>
        <div className="org-plan-review__summary-grid">
          {summary.map((item) => (
            <div key={item.label}>
              <span>{item.label}</span>
              <strong>{item.value}</strong>
              <small>{item.note}</small>
            </div>
          ))}
        </div>
      </article>

      <div className="org-plan-review__two-column">
        <article className="org-plan-card org-plan-review__detail-card">
          <h2>تعهد سازمان در این طرح</h2>
          <p>تعهدها فقط بعد از فعال‌شدن پرونده هر پرسنل به پرداخت واقعی تبدیل می‌شوند.</p>
          <div className="org-plan-review__info-row"><span>پرداخت ماهانه</span><div><strong>بر عهده سازمان</strong><small>طبق مبلغ تأمین مالی هر پرونده</small></div></div>
          <div className="org-plan-review__info-row"><span>مبلغ اولیه</span><div><strong>بر عهده مستأجر</strong><small>طبق شرایط همین طرح</small></div></div>
        </article>

        <article className="org-plan-card org-plan-review__detail-card">
          <h2>شرایط فعال‌سازی</h2>
          <p>موارد زیر قبل از ثبت نهایی توسط چارخونه بررسی شده‌اند.</p>
          <div className="org-plan-review__check-row"><span className="org-plan-review__check">✓</span><div><strong>۶ پرسنل انتخاب شده‌اند</strong><small>همه در وضعیت واجد شرایط هستند</small></div></div>
          <div className="org-plan-review__check-row"><span className="org-plan-review__check">✓</span><div><strong>مدل پرداخت سازمان تأیید شده</strong><small>پرداخت ماهانه به نام سازمان ثبت می‌شود</small></div></div>
        </article>
      </div>

      <article className="org-plan-card org-plan-review__people">
        <h2>پرسنل انتخاب‌شده</h2>
        <p>۶ نفر پس از فعال‌سازی این طرح را در مسیر خود خواهند دید.</p>
        <div className="org-plan-review__people-grid">
          {people.map((person) => (
            <div key={person.name}><strong>{person.name}</strong><span>{person.unit}</span></div>
          ))}
        </div>
      </article>

      <footer className="org-plan-review__confirmation">
        <div className="org-plan-flow__actions">
          <Link href="/organization/bank-plans/supportive-employees/activate/success" className="org-action-button org-action-button--primary">تأیید و فعال‌سازی</Link>
          <Link href="/organization/bank-plans/supportive-employees/activate" className="org-action-button org-action-button--surface">بازگشت</Link>
        </div>
        <div>
          <h2>تأیید نهایی</h2>
          <p>با تأیید، طرح برای ۶ نفر فعال می‌شود و تعهدهای پرداخت سازمان طبق پرونده‌های فعال ایجاد خواهند شد.</p>
        </div>
      </footer>
    </section>
  );
}
