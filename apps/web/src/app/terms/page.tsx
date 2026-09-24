import { BrandLogo } from "@/components/marketing/BrandLogo";

export const metadata = {
  title: "قوانین و مقررات | چارخونه",
  description: "قوانین و مقررات استفاده از خدمات چارخونه",
};

export default function TermsPage() {
  return (
    <main className="ch-legal-page">
      <header className="ch-legal-header">
        <a href="/" aria-label="صفحه اصلی چارخونه">
          <BrandLogo className="ch-legal-header__logo" />
        </a>
        <a className="ch-legal-header__back" href="/">بازگشت به صفحه اصلی</a>
      </header>

      <article className="ch-legal-main">
        <h1>قوانین و مقررات استفاده از چارخونه</h1>
        <p className="ch-legal-updated">آخرین به‌روزرسانی: مهر ۱۴۰۵</p>

        <section className="ch-legal-section">
          <h2>۱. دامنه استفاده</h2>
          <p>
            استفاده از وب‌سایت، پنل‌ها و خدمات چارخونه به معنی پذیرش این شرایط و همچنین شرایط اختصاصی هر خدمت است.
          </p>
        </section>

        <section className="ch-legal-section">
          <h2>۲. حساب کاربری و اطلاعات</h2>
          <ul>
            <li>کاربر مسئول صحت اطلاعاتی است که برای ثبت‌نام، احراز هویت و دریافت خدمت ارائه می‌کند.</li>
            <li>حفظ محرمانگی اطلاعات ورود و جلوگیری از استفاده غیرمجاز از حساب بر عهده صاحب حساب است.</li>
            <li>در صورت مشاهده فعالیت مشکوک، موضوع باید در اولین فرصت به چارخونه اعلام شود.</li>
          </ul>
        </section>

        <section className="ch-legal-section">
          <h2>۳. استفاده مجاز</h2>
          <p>
            استفاده از خدمات برای تقلب، جعل اطلاعات، دسترسی غیرمجاز، اختلال در سامانه یا هر فعالیت مغایر قوانین جاری مجاز نیست.
          </p>
        </section>

        <section className="ch-legal-section">
          <h2>۴. خدمات مالی و قراردادها</h2>
          <p>
            جزئیات اعتبار، تسهیلات، پرداخت، کارمزد و تعهدات طرفین در قرارداد یا شرایط اختصاصی همان خدمت مشخص می‌شود. در صورت تعارض،
            متن قرارداد اختصاصی خدمت ملاک خواهد بود.
          </p>
        </section>

        <section className="ch-legal-section">
          <h2>۵. تغییرات خدمات و شرایط</h2>
          <p>
            چارخونه ممکن است برای بهبود خدمات یا رعایت الزامات قانونی، بخش‌هایی از سامانه یا این شرایط را به‌روزرسانی کند. نسخه جاری
            همواره در همین صفحه منتشر می‌شود.
          </p>
        </section>

        <section className="ch-legal-section">
          <h2>۶. تماس</h2>
          <p>
            برای پرسش‌های مربوط به این شرایط با <a className="ch-legal-contact" href="mailto:info@char-khoone.ir">info@char-khoone.ir</a> یا
            شماره <a className="ch-legal-contact" href="tel:+982166485374" dir="ltr">۰۲۱۶۶۴۸۵۳۷۴</a> تماس بگیرید.
          </p>
        </section>
      </article>
    </main>
  );
}
