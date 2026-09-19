import { BrandLogo } from "@/components/marketing/BrandLogo";
import { ButtonLink } from "@/components/marketing/ButtonLink";

export default function AppDownloadPage() {
  return (
    <main className="ch-download-page" data-node-id="1002:8">
      <header className="ch-download-header" data-node-id="1002:9">
        <BrandLogo source="download" className="ch-download-header__logo" />
        <ButtonLink variant="surface" href="/" data-node-id="1002:10">
          بازگشت به صفحه اصلی
        </ButtonLink>
      </header>

      <section className="ch-download-main" data-node-id="1002:13">
        <div className="ch-download-content" data-node-id="1002:23">
          <span className="ch-eyebrow" data-node-id="1002:24">اپلیکیشن چارخونه</span>
          <h1 data-node-id="1002:26">دانلود اپلیکیشن چارخونه</h1>
          <p className="ch-download-content__lead" data-node-id="1002:27">
            برای استفاده سریع‌تر از خدمات چارخونه، نسخه مناسب دستگاه خود را انتخاب کنید.
          </p>

          <div className="ch-download-option" data-node-id="1002:28">
            <div className="ch-download-option__info" data-node-id="1002:31">
              <strong data-node-id="1002:32">نسخه اندروید</strong>
              <span data-node-id="1002:33">آماده نصب روی گوشی‌های اندرویدی</span>
            </div>
            <button className="ch-download-option__button" type="button" data-node-id="1002:29">
              دانلود نسخه اندروید
            </button>
          </div>

          <div className="ch-download-option" data-node-id="1002:34">
            <div className="ch-download-option__info" data-node-id="1002:37">
              <strong data-node-id="1002:38">نسخه iOS</strong>
              <span data-node-id="1002:39">نسخه آیفون در حال آماده‌سازی است</span>
            </div>
            <span className="ch-coming-soon" data-node-id="1002:35">به‌زودی</span>
          </div>

          <p className="ch-download-content__note" data-node-id="1002:40">
            بعد از نصب، با همان شماره موبایل وارد حساب چارخونه شوید.
          </p>
        </div>

        <div className="ch-app-visual" data-node-id="1002:14">
          <div className="ch-phone-mockup" data-node-id="1002:15">
            <div className="ch-phone-screen" data-node-id="1002:17">
              <BrandLogo source="download-phone" className="ch-phone-screen__logo" />
              <strong data-node-id="1002:19">همراه شما در مسیر قرارداد</strong>
              <span data-node-id="1002:20">اپلیکیشن چارخونه</span>
              <ButtonLink variant="accent" href="/login" className="ch-phone-screen__cta" data-node-id="1002:21">
                شروع با چارخونه
              </ButtonLink>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
