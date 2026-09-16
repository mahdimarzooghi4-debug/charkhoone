import Link from "next/link";

export default function AdminManualPaymentPage() {
  return (
    <section className="admin-manual-payment" data-node-id="730:12" data-name="Admin / Manual Payment">
      <header className="admin-manual-payment__header">
        <Link className="admin-manual-payment__back" href="/admin/payments">بازگشت به پرداخت‌ها</Link>
        <div><h1>ثبت پرداخت دستی</h1><p>ثبت تراکنش خارج از مسیر خودکار و اتصال آن به پرونده یا شریک مالی</p></div>
      </header>
      <section className="admin-manual-payment__card" aria-label="فرم نمایشی ثبت پرداخت دستی">
        <div className="admin-manual-payment__intro"><h2>اطلاعات پرداخت</h2><p>برای ثبت دستی، شناسه بانکی و دلیل ثبت باید قابل پیگیری باشد.</p></div>
        <div className="admin-manual-payment__grid">
          <label><span>نوع پرداخت</span><select defaultValue=""><option value="" disabled>پرداخت مستأجر / تسویه مالک / تسویه شریک</option><option>پرداخت مستأجر</option><option>تسویه مالک</option><option>تسویه شریک</option></select></label>
          <label><span>کاربر / پرونده</span><input placeholder="مثلاً CS-1405-1182 — علی رضایی" /></label>
          <label><span>تاریخ و زمان</span><input defaultValue="۱۴۰۵/۰۶/۰۸ — ۱۴:۳۲" /></label>
          <label><span>مبلغ</span><input inputMode="numeric" placeholder="مبلغ به تومان" /></label>
          <label><span>طرف مالی</span><select defaultValue=""><option value="" disabled>بانک / شریک / مالک / کاربر</option><option>بانک</option><option>شریک</option><option>مالک</option><option>کاربر</option></select></label>
          <label><span>شناسه پیگیری بانکی</span><input dir="ltr" placeholder="شماره مرجع یا Trace ID" /></label>
          <label><span>وضعیت اولیه</span><select defaultValue=""><option value="" disabled>موفق / در انتظار بررسی</option><option>موفق</option><option>در انتظار بررسی</option></select></label>
          <label><span>روش ثبت</span><select defaultValue=""><option value="" disabled>واریز بانکی / پایا / ساتنا / نقدی</option><option>واریز بانکی</option><option>پایا</option><option>ساتنا</option><option>نقدی</option></select></label>
        </div>
        <label className="admin-manual-payment__notes"><span>توضیحات و دلیل ثبت دستی</span><textarea placeholder="مثلاً پرداخت خارج از درگاه انجام شده و رسید بانکی توسط تیم مالی بررسی شده است." /></label>
        <div className="admin-manual-payment__footer"><p>ثبت دستی باید دارای شناسه مرجع یا مستند مالی قابل پیگیری باشد.</p><div><Link href="/admin/payments">انصراف</Link><span className="admin-manual-payment__submit" aria-disabled="true">ثبت پرداخت</span></div></div>
      </section>
    </section>
  );
}
