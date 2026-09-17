import Link from "next/link";

type PaymentResultProps = {
  status: "success" | "failed";
};

const summary = [
  { label: "پرسنل", value: "علی رضایی", note: "طرح حمایتی کارکنان" },
  { label: "نوع پرداخت", value: "پرداخت ماهانه", note: "تعهد سازمان" },
  { label: "مبلغ", value: "۲۴٬۰۰۰٬۰۰۰ تومان", note: "پرداخت کامل" },
  { label: "کد پیگیری", value: "CH-۱۴۰۵-۶۱۲۸۴", note: "ثبت‌شده در چارخونه" },
] as const;

const successSteps = [
  ["تعهد این دوره سازمان تسویه شد", "این پرداخت دیگر در فهرست موارد نیازمند پرداخت نمایش داده نمی‌شود."],
  ["پرونده پرسنل به‌روزرسانی می‌شود", "وضعیت پرداخت در پرونده و مسیر چارخونه قابل پیگیری است."],
  ["پرداخت بعدی طبق طرح ساخته می‌شود", "اگر طرح تعهد دوره‌ای داشته باشد، سررسید بعدی در بخش پرداخت‌ها نمایش داده می‌شود."],
] as const;

const failedSteps = [
  ["تعهد این دوره هنوز پرداخت نشده", "این مورد همچنان در فهرست پرداخت‌های نیازمند اقدام نمایش داده می‌شود."],
  ["وضعیت پرونده تغییری نمی‌کند", "وضعیت پرداخت در پرونده و مسیر چارخونه قابل پیگیری است."],
  ["پس از رفع مشکل دوباره پرداخت کنید", "تا زمان پرداخت موفق، این تعهد همچنان نیازمند پرداخت باقی می‌ماند."],
] as const;

export function OrganizationPaymentResult({ status }: PaymentResultProps) {
  const successful = status === "success";
  const steps = successful ? successSteps : failedSteps;
  const items = summary.map((item) => item.label === "مبلغ" && !successful ? { ...item, note: "پرداخت انجام نشده" } : item.label === "کد پیگیری" && !successful ? { ...item, note: "ثبت ناموفق در چارخونه" } : item);

  return (
    <section className={`org-payment-result org-payment-result--${status}`} data-node-id={successful ? "523:29" : "526:29"}>
      <header className="org-payment-result__header">
        <Link href="/organization/payments" className="org-action-button org-action-button--surface">بازگشت به پرداخت‌ها</Link>
        <div><h1>نتیجه پرداخت</h1><p>بازگشت از درگاه پرداخت سازمان</p></div>
      </header>

      <section className="org-payment-card org-payment-result__hero">
        <div className="org-payment-result__icon" aria-hidden="true">{successful ? "✓" : "×"}</div>
        <h2>{successful ? "پرداخت با موفقیت انجام شد" : "پرداخت انجام نشد"}</h2>
        <p>{successful ? "مبلغ ۲۴٬۰۰۰٬۰۰۰ تومان برای تعهد سازمان ثبت شد و وضعیت پرونده پرسنل به‌روزرسانی می‌شود." : "پرداخت ۲۴٬۰۰۰٬۰۰۰ تومان ثبت نشد و هیچ مبلغی از تعهد سازمان تسویه نشده است."}</p>
        <span className="org-payment-result__status">{successful ? "پرداخت‌شده" : "ناموفق"}</span>
      </section>

      <section className="org-payment-card org-payment-result__summary">
        <h2>خلاصه پرداخت</h2><p>{successful ? "اطلاعات ثبت‌شده این تراکنش" : "اطلاعات این تلاش برای پرداخت"}</p>
        <div className="org-payment-result__summary-grid">
          {items.map((item) => <article key={item.label}><span>{item.label}</span><strong>{item.value}</strong><small>{item.note}</small></article>)}
        </div>
      </section>

      <section className="org-payment-card org-payment-result__next">
        <h2>{successful ? "بعد از پرداخت چه می‌شود؟" : "حالا چه کاری انجام دهید؟"}</h2>
        <p>{successful ? "پرداخت در سوابق سازمان و پرونده این پرسنل ثبت شده است." : "می‌توانید دوباره تلاش کنید؛ تا زمان پرداخت موفق، این تعهد همچنان نیازمند پرداخت باقی می‌ماند."}</p>
        <div className="org-payment-result__steps">
          {steps.map(([title, note], index) => <div className="org-payment-result__step" key={title}><div><strong>{title}</strong><small>{note}</small></div><span>{index + 1}</span></div>)}
        </div>
      </section>

      <footer className="org-payment-result__actions">
        <Link href="/organization/payments" className="org-action-button org-action-button--surface">بازگشت به پرداخت‌ها</Link>
        <Link href={successful ? "/organization/payments/1405-06-18" : "/organization/payments/1405-06-18/confirm"} className="org-payment-primary-button">{successful ? "مشاهده جزئیات پرداخت" : "تلاش دوباره برای پرداخت"}</Link>
      </footer>
    </section>
  );
}
