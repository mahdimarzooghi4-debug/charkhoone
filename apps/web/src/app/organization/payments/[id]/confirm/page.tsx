import Link from "next/link";
import { OrganizationPaymentDetail } from "@/components/organization/OrganizationPaymentDetail";

const summary = [
  ["پرسنل", "علی رضایی"],
  ["طرح", "طرح حمایتی کارکنان"],
  ["نوع پرداخت", "پرداخت ماهانه"],
  ["سررسید", "۱۴۰۵/۰۶/۱۸"],
  ["مبلغ", "۲۴٬۰۰۰٬۰۰۰ تومان"],
] as const;

export default function OrganizationPaymentConfirmationPage() {
  return (
    <div className="org-payment-confirmation" data-node-id="522:29">
      <OrganizationPaymentDetail />
      <div className="org-payment-modal-backdrop" aria-hidden="true" />
      <section className="org-payment-modal" role="dialog" aria-modal="true" aria-labelledby="payment-confirm-title">
        <h1 id="payment-confirm-title">تأیید پرداخت</h1>
        <p>پیش از رفتن به درگاه، اطلاعات این پرداخت را بررسی کنید.</p>
        <div className="org-payment-modal__summary">
          {summary.map(([label, value]) => <div key={label}><strong>{value}</strong><span>{label}</span></div>)}
        </div>
        <div className="org-payment-modal__note"><strong>بعد از تأیید به درگاه پرداخت منتقل می‌شوید.</strong><span>پس از بازگشت از درگاه، نتیجه پرداخت به‌صورت خودکار در چارخونه ثبت می‌شود.</span></div>
        <div className="org-payment-modal__actions">
          <Link href="/organization/payments/1405-06-18" className="org-action-button org-action-button--surface">انصراف</Link>
          <Link href="/organization/payments/1405-06-18/success" className="org-payment-primary-button">ادامه به درگاه پرداخت</Link>
        </div>
      </section>
    </div>
  );
}
