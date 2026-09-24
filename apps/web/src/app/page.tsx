import { BrandLogo } from "@/components/marketing/BrandLogo";
import { ButtonLink } from "@/components/marketing/ButtonLink";

const benefitIcons = {
  secure: "/brand/benefit-secure.svg",
  smart: "/brand/benefit-smart.svg",
  transparent: "/brand/benefit-transparent.svg",
} as const;

const footerIcons = {
  map: "/brand/footer-map.svg",
  phone: "/brand/footer-phone.svg",
  mail: "/brand/footer-mail.svg",
  instagram: "/brand/footer-instagram.svg",
  linkedin: "/brand/footer-linkedin.svg",
} as const;

const audiences = [
  {
    title: "برای مستأجر",
    body: "تأمین بخشی از نقدینگی موردنیاز برای ودیعه و مدیریت بازپرداخت در یک مسیر دیجیتال و شفاف.",
    featured: true,
  },
  {
    title: "برای مالک",
    body: "جریان پرداخت منظم‌تر، کاهش ریسک بدحسابی و امکان پیگیری شفاف وضعیت قرارداد.",
  },
  {
    title: "برای بانک‌ها و صندوق‌ها",
    body: "اتصال ساختاریافته به تقاضای اعتبار مسکن با امکان مدیریت و پایش بهتر منابع و ریسک.",
  },
  {
    title: "برای سازمان‌ها",
    body: "تخصیص هدفمند اعتبار و تسهیلات رفاهی کارکنان با داشبوردهای شفاف و قابل رصد.",
  },
];

const steps = [
  {
    number: "۱",
    eyebrow: "نقطه شروع",
    title: "ثبت درخواست",
    body: "مستأجر درخواست استفاده از خدمات چارخونه و اطلاعات قرارداد خود را ثبت می‌کند.",
    featured: true,
  },
  {
    number: "۲",
    eyebrow: "فرآیند هوشمند",
    title: "اعتبارسنجی و بررسی",
    body: "اطلاعات متقاضی و قرارداد در یک فرآیند دیجیتال بررسی و اعتبارسنجی می‌شود.",
  },
  {
    number: "۳",
    eyebrow: "پشتیبانی مالی",
    title: "تأمین و مدیریت منابع",
    body: "اعتبار از طریق شرکای مالی تأمین و منابع موردنیاز در ساختار چارخونه مدیریت می‌شوند.",
  },
  {
    number: "۴",
    eyebrow: "مرحله پایانی",
    title: "پرداخت و پیگیری",
    body: "جریان پرداخت و وضعیت قرارداد برای طرفین از طریق پنل‌های چارخونه قابل پیگیری است.",
  },
];

const benefits = [
  {
    title: "شفاف",
    body: "وضعیت درخواست، قرارداد و پرداخت‌ها در طول فرآیند قابل پیگیری است.",
    icon: benefitIcons.transparent,
  },
  {
    title: "هوشمند",
    body: "اعتبارسنجی و مدیریت فرآیندها با استفاده از زیرساخت دیجیتال انجام می‌شود.",
    icon: benefitIcons.smart,
  },
  {
    title: "مطمئن",
    body: "ساختار چارخونه با تمرکز بر کاهش ریسک پرداخت و ایجاد جریان مالی پایدار طراحی شده است.",
    icon: benefitIcons.secure,
  },
];

function EcosystemCard({ title, body, emphasized = false }: { title: string; body: string; emphasized?: boolean }) {
  return (
    <div className={["ch-ecosystem-card", emphasized ? "ch-ecosystem-card--emphasized" : ""].filter(Boolean).join(" ")}>
      <strong>{title}</strong>
      <span>{body}</span>
    </div>
  );
}

export default function HomePage() {
  return (
    <main className="ch-landing" data-node-id="631:474">
      <header className="ch-site-header" data-node-id="631:475">
        <BrandLogo className="ch-site-header__logo" />

        <nav className="ch-site-header__nav" aria-label="ناوبری اصلی" data-node-id="631:481">
          <a href="#about">چارخونه چیست؟</a>
          <a href="#how-it-works">چطور کار می‌کند؟</a>
          <a href="#audiences">برای چه کسانی است؟</a>
        </nav>

        <div className="ch-site-header__actions" data-node-id="631:476">
          <ButtonLink variant="surface" href="/login" data-node-id="631:477">
            ورود / ثبت‌نام
          </ButtonLink>
        </div>
      </header>

      <section className="ch-hero" id="about" data-node-id="631:494">
        <div className="ch-hero__content" data-node-id="631:523">
          <span className="ch-eyebrow" data-node-id="631:524">
            پلتفرم یکپارچه خدمات مالی مسکن
          </span>
          <h1 data-node-id="631:526">همراه مستأجر، حامی مالک</h1>
          <p data-node-id="631:527">
            چارخونه، مسیر تأمین اعتبار ودیعه، مدیریت پرداخت و ارتباط میان مستأجر، مالک و شرکای مالی را در یک بستر شفاف و یکپارچه ساده‌تر می‌کند.
          </p>
          <div className="ch-hero__buttons" data-node-id="631:528">
            <ButtonLink variant="accent" href="/login" data-node-id="631:531">
              شروع با چارخونه
            </ButtonLink>
            <ButtonLink variant="outline" href="/app-download" data-node-id="631:529">
              دانلود اپلیکیشن
            </ButtonLink>
          </div>
        </div>

        <div className="ch-ecosystem" aria-label="اکوسیستم چارخونه" data-node-id="631:495">
          <div className="ch-ecosystem__row">
            <EcosystemCard title="مستأجر" body="تأمین اعتبار ودیعه" emphasized />
            <EcosystemCard title="مالک" body="تضمین تسویه منظم" emphasized />
          </div>
          <div className="ch-ecosystem__hub-row">
            <span className="ch-ecosystem__line" aria-hidden="true" />
            <div className="ch-ecosystem__hub" data-node-id="631:505">
              <BrandLogo source="hub" />
            </div>
            <span className="ch-ecosystem__line" aria-hidden="true" />
          </div>
          <div className="ch-ecosystem__row">
            <EcosystemCard title="بانک‌ها و صندوق‌ها" body="تخصیص هدفمند اعتبار" />
            <EcosystemCard title="سازمان‌ها" body="تسهیلات رفاهی کارکنان" />
          </div>
        </div>
      </section>

      <section className="ch-dark-section" id="audiences" data-node-id="631:534">
        <div className="ch-section-heading ch-section-heading--light">
          <h2 data-node-id="631:536">چارخونه برای چه کسانی است؟</h2>
          <p data-node-id="631:537">یک زیرساخت مشترک برای بازیگران اصلی زنجیره مالی مسکن.</p>
        </div>
        <div className="ch-audience-grid" data-node-id="631:538">
          {audiences.map((audience) => (
            <article
              key={audience.title}
              className={["ch-audience-card", audience.featured ? "ch-audience-card--featured" : ""].filter(Boolean).join(" ")}
            >
              <h3>{audience.title}</h3>
              <p>{audience.body}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="ch-light-section" id="how-it-works" data-node-id="631:551">
        <div className="ch-section-heading">
          <h2 data-node-id="631:553">چارخونه چطور کار می‌کند؟</h2>
          <p data-node-id="631:554">از ثبت درخواست تا مدیریت منابع و پرداخت، همه‌چیز در یک مسیر یکپارچه انجام می‌شود.</p>
        </div>
        <div className="ch-step-grid" data-node-id="631:555">
          {steps.map((step) => (
            <article
              key={step.number}
              className={["ch-step-card", step.featured ? "ch-step-card--featured" : ""].filter(Boolean).join(" ")}
            >
              <div className="ch-step-card__topline">
                <span className="ch-step-card__number">{step.number}</span>
                <span className="ch-step-card__eyebrow">{step.eyebrow}</span>
              </div>
              <h3>{step.title}</h3>
              <p>{step.body}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="ch-dark-section ch-why" data-node-id="631:584">
        <h2 data-node-id="631:585">چرا چارخونه؟</h2>
        <div className="ch-benefit-grid" data-node-id="631:586">
          {benefits.map((benefit) => (
            <article className="ch-benefit-card" key={benefit.title}>
              <span className="ch-benefit-card__icon" aria-hidden="true">
                <img src={benefit.icon} alt="" width={24} height={24} />
              </span>
              <h3>{benefit.title}</h3>
              <p>{benefit.body}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="ch-final-cta" data-node-id="631:608">
        <h2 data-node-id="631:609">خانه، با یک مسیر مالی مطمئن‌تر</h2>
        <p data-node-id="631:610">برای شروع، وارد حساب چارخونه شوید یا با شماره موبایل ثبت‌نام کنید.</p>
        <ButtonLink variant="accent" href="/login" data-node-id="631:612">
          ورود / ثبت‌نام
        </ButtonLink>
      </section>

      <footer className="ch-site-footer" id="partners" data-node-id="631:615">
        <div className="ch-footer-columns" data-node-id="643:10">
          <div className="ch-footer-column ch-footer-brand" data-node-id="643:11">
            <BrandLogo source="footer" className="ch-footer-brand__logo" />
            <p data-node-id="643:13">راهکاری یکپارچه برای ارتباط میان مستأجر، مالک و شرکای مالی.</p>
          </div>

          <div className="ch-footer-column" data-node-id="643:20">
            <h3>چارخونه</h3>
            <a href="/terms">قوانین و مقررات</a>
            <a href="/privacy">حریم خصوصی</a>
          </div>

          <div className="ch-footer-column" data-node-id="643:225">
            <h3>همکاران چارخونه</h3>
            <a href="/bank/login">بانک‌ها و مؤسسات مالی</a>
            <a href="/brokerage/login">کارگزاری‌ها و صندوق‌ها</a>
            <a href="/organization/login">سازمان‌ها و نهادهای همکار</a>
          </div>

          <div className="ch-footer-column" data-node-id="643:14">
            <h3>دسترسی سریع</h3>
            <a href="#about">چارخونه چیست؟</a>
            <a href="#audiences">برای چه کسانی است؟</a>
            <a href="#how-it-works">چطور کار می‌کند؟</a>
          </div>

          <div className="ch-footer-column ch-footer-contact" data-node-id="685:10">
            <h3>تماس با ما</h3>
            <span><img src={footerIcons.map} alt="" width={16} height={16} />تهران، خیابان انقلاب، خیابان رازی، کوچه شهبازیان، پلاک ۲۲</span>
            <span><img src={footerIcons.phone} alt="" width={16} height={16} /><a href="tel:+982166485374" dir="ltr">۰۲۱۶۶۴۸۵۳۷۴</a></span>
            <span><img src={footerIcons.mail} alt="" width={16} height={16} /><a href="mailto:info@char-khoone.ir" dir="ltr">info@char-khoone.ir</a></span>
            <div className="ch-footer-social" aria-label="شبکه‌های اجتماعی">
              <a href="#" aria-label="لینکدین"><img src={footerIcons.linkedin} alt="" width={16} height={16} /></a>
              <a href="#" aria-label="اینستاگرام"><img src={footerIcons.instagram} alt="" width={16} height={16} /></a>
            </div>
          </div>
        </div>

        <div className="ch-footer-divider" role="separator" />
        <div className="ch-footer-bottom" data-node-id="643:26">
          <p data-node-id="643:27">
            این سامانه برای تحقق عدالت اجتماعی توسعه داده شده است
            <br />
            کلیه حقوق متعلق به چارخونه می باشد
          </p>
        </div>
      </footer>
    </main>
  );
}
