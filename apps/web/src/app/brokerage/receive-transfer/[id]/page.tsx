import Link from "next/link";

const transactionInfo = [
  { label: "شناسه تراکنش", value: "TRX-A4271" },
  { label: "نوع تراکنش", value: "وجه مستأجر" },
  { label: "پرونده", value: "۱۴۰۵-۸۳۲۱" },
  { label: "مبدأ", value: "چارخونه" },
  { label: "مقصد", value: "کارگزاری" },
  { label: "وضعیت", value: "ثبت‌شده" },
] as const;

const syncInfo = [
  { label: "دریافت از", value: "سیستم داخلی کارگزاری" },
  { label: "کد کارگزاری", value: "BRK-14050608-7712" },
  { label: "آخرین دریافت", value: "۱۴۰۵/۰۶/۰۸ — ۱۴:۲۶" },
  { label: "نتیجه بررسی", value: "موفق" },
] as const;

const effects = [
  { label: "نوع مبلغ", value: "وجه مستأجر", note: "جزو منابع پرونده" },
  { label: "تغییر منابع پرونده", value: "+۱۵۰٬۰۰۰٬۰۰۰ تومان", note: "برای همین پرونده ثبت شده" },
  { label: "تأثیر روی سود", value: "ندارد", note: "سود بعداً جدا محاسبه می‌شود" },
  { label: "تقسیم بین مالکان", value: "با چارخونه", note: "تقسیم مبلغ بین مالکان با چارخونه است" },
] as const;

const history = [
  { status: "دریافت شد", time: "۱۴:۲۵", title: "دریافت از سیستم کارگزاری", note: "اطلاعات تراکنش با کد کارگزاری دریافت شد." },
  { status: "بررسی موفق", time: "۱۴:۲۶", title: "بررسی با پرونده ۱۴۰۵-۸۳۲۱", note: "شماره پرونده و مبلغ با اطلاعات چارخونه بررسی شد." },
  { status: "ثبت شد", time: "۱۴:۲۶", title: "ثبت در منابع پرونده", note: "مبلغ مستأجر در منابع این پرونده ثبت شد." },
] as const;

export default function BrokerageTransactionDetailPage() {
  return (
    <section className="brokerage-transaction-detail" data-node-id="417:2" data-name="Brokerage / Transaction Detail">
      <header className="brokerage-transaction-detail__header">
        <Link href="/brokerage/receive-transfer">بازگشت به دریافت و انتقال</Link>
        <div>
          <h1>جزئیات تراکنش</h1>
          <p>جزئیات ساده و کامل این تراکنش از سیستم کارگزاری</p>
        </div>
      </header>

      <section className="brokerage-transaction-detail__summary">
        <div className="brokerage-transaction-detail__summary-top">
          <span className="brokerage-transfer__status brokerage-transfer__status--success">ثبت‌شده</span>
          <div>
            <h2>وجه مستأجر — TRX-A4271</h2>
            <p>مبلغ مستأجر از چارخونه به حساب چارخونه در کارگزاری منتقل شده است</p>
          </div>
        </div>
        <div className="brokerage-transaction-detail__divider" />
        <div className="brokerage-transaction-detail__summary-grid">
          <article><span>مسیر انتقال</span><strong>چارخونه ← کارگزاری</strong><small>ثبت در حساب چارخونه در کارگزاری</small></article>
          <article><span>مبلغ</span><strong>۱۵۰٬۰۰۰٬۰۰۰ تومان</strong><small>مبلغ مستأجر</small></article>
          <article><span>زمان ثبت</span><strong>۱۴۰۵/۰۶/۰۸ — ۱۴:۲۵</strong><small>دریافت موفق</small></article>
        </div>
      </section>

      <div className="brokerage-transaction-detail__middle">
        <section className="brokerage-transaction-detail__panel">
          <div className="brokerage-transaction-detail__section-title">
            <h2>اطلاعات تراکنش</h2>
            <p>اطلاعات ثبت‌شده برای این تراکنش</p>
          </div>
          <div className="brokerage-transaction-detail__info-grid brokerage-transaction-detail__info-grid--three">
            {transactionInfo.map((item, index) => (
              <article className={index >= 3 ? "brokerage-transaction-detail__info--second-row" : ""} key={item.label}>
                <span>{item.label}</span>
                <strong>{item.value}</strong>
              </article>
            ))}
          </div>
        </section>

        <section className="brokerage-transaction-detail__panel">
          <div className="brokerage-transaction-detail__section-title">
            <h2>دریافت و بررسی</h2>
            <p>این تراکنش از سیستم داخلی کارگزاری دریافت شده است.</p>
          </div>
          <div className="brokerage-transaction-detail__info-grid brokerage-transaction-detail__info-grid--two">
            {syncInfo.map((item, index) => (
              <article className={index >= 2 ? "brokerage-transaction-detail__info--second-row" : ""} key={item.label}>
                <span>{item.label}</span>
                <strong>{item.value}</strong>
              </article>
            ))}
          </div>
          <p className="brokerage-transaction-detail__note">مبلغ و کد تراکنش از سیستم کارگزاری می‌آید و اینجا قابل تغییر نیست.</p>
        </section>
      </div>

      <section className="brokerage-transaction-detail__panel brokerage-transaction-detail__effect">
        <div className="brokerage-transaction-detail__section-title">
          <h2>تأثیر این تراکنش</h2>
          <p>این تراکنش چه تغییری در پرونده ایجاد کرده</p>
        </div>
        <div className="brokerage-transaction-detail__effect-grid">
          {effects.map((item) => (
            <article key={item.label}>
              <span>{item.label}</span>
              <strong>{item.value}</strong>
              <small>{item.note}</small>
            </article>
          ))}
        </div>
      </section>

      <section className="brokerage-transaction-detail__panel brokerage-transaction-detail__history">
        <div className="brokerage-transaction-detail__section-title">
          <h2>سوابق تراکنش</h2>
          <p>مراحل ثبت و بررسی این تراکنش</p>
        </div>
        <div className="brokerage-transaction-history">
          {history.map((event) => (
            <div className="brokerage-transaction-history__row" key={`${event.time}-${event.status}`}>
              <div className="brokerage-transaction-history__meta">
                <span className="brokerage-transfer__status brokerage-transfer__status--success">{event.status}</span>
                <small>{event.time}</small>
              </div>
              <div className="brokerage-transaction-history__copy">
                <strong>{event.title}</strong>
                <small>{event.note}</small>
              </div>
            </div>
          ))}
        </div>
      </section>
    </section>
  );
}
