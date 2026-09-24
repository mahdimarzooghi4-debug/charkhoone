import { BrandLogo } from "@/components/marketing/BrandLogo";

export const metadata = {
  title: "حریم خصوصی | چارخونه",
  description: "سیاست حریم خصوصی و حفاظت از اطلاعات کاربران چارخونه",
};

export default function PrivacyPage() {
  return (
    <main className="ch-legal-page">
      <header className="ch-legal-header">
        <a href="/" aria-label="صفحه اصلی چارخونه">
          <BrandLogo className="ch-legal-header__logo" />
        </a>
        <a className="ch-legal-header__back" href="/">بازگشت به صفحه اصلی</a>
      </header>

      <article className="ch-legal-main">
        <h1>حریم خصوصی</h1>
        <p className="ch-legal-updated">آخرین به‌روزرسانی: مهر ۱۴۰۵</p>

        <section className="ch-legal-section">
          <h2>۱. اطلاعاتی که دریافت می‌شود</h2>
          <p>
            بسته به نوع خدمت، اطلاعاتی مانند مشخصات هویتی و تماس، اطلاعات قرارداد و درخواست، سوابق فرآیندی و داده‌های فنی لازم برای
            ارائه امن و صحیح خدمت دریافت می‌شود.
          </p>
        </section>

        <section className="ch-legal-section">
          <h2>۲. هدف استفاده از اطلاعات</h2>
          <ul>
            <li>ایجاد و مدیریت حساب کاربری و احراز هویت.</li>
            <li>بررسی و پردازش درخواست‌ها و ارائه خدمات مرتبط با چارخونه.</li>
            <li>پیشگیری از سوءاستفاده، تقلب و دسترسی غیرمجاز.</li>
            <li>پشتیبانی، اطلاع‌رسانی و بهبود کیفیت خدمات.</li>
          </ul>
        </section>

        <section className="ch-legal-section">
          <h2>۳. اشتراک‌گذاری اطلاعات</h2>
          <p>
            اطلاعات فقط در حد لازم برای ارائه خدمت، اجرای تعهدات قراردادی یا رعایت الزامات قانونی با ارائه‌دهندگان خدمت و شرکای
            مرتبط به اشتراک گذاشته می‌شود.
          </p>
        </section>

        <section className="ch-legal-section">
          <h2>۴. امنیت و نگهداری</h2>
          <p>
            چارخونه برای حفاظت از اطلاعات از کنترل‌های فنی و سازمانی متناسب استفاده می‌کند و اطلاعات را فقط تا زمانی که برای ارائه
            خدمت، الزامات قراردادی یا تکالیف قانونی لازم باشد نگهداری می‌کند.
          </p>
        </section>

        <section className="ch-legal-section">
          <h2>۵. درخواست‌های مرتبط با اطلاعات شخصی</h2>
          <p>
            کاربران می‌توانند برای پرسش درباره اطلاعات ثبت‌شده یا درخواست بررسی و اصلاح اطلاعات خود از راه‌های تماس رسمی چارخونه
            اقدام کنند؛ رسیدگی به درخواست‌ها تابع الزامات قانونی و قراردادی خواهد بود.
          </p>
        </section>

        <section className="ch-legal-section">
          <h2>۶. تماس</h2>
          <p>
            برای موضوعات مرتبط با حریم خصوصی با <a className="ch-legal-contact" href="mailto:info@char-khoone.ir">info@char-khoone.ir</a> یا
            شماره <a className="ch-legal-contact" href="tel:+982166485374" dir="ltr">۰۲۱۶۶۴۸۵۳۷۴</a> تماس بگیرید.
          </p>
        </section>
      </article>
    </main>
  );
}
