import { BrandLogo } from "@/components/marketing/BrandLogo";

export function BrokerageLoginView() {
  return (
    <section className="brokerage-login" data-node-id="791:2" data-name="Brokerage / Login">
      <div className="brokerage-login__content">
        <div className="brokerage-login__card">
          <header className="brokerage-login__header">
            <h1>ورود به پنل کارگزاری</h1>
            <p>برای ادامه، اطلاعات دسترسی پنل کارگزاری را وارد کنید.</p>
          </header>

          <form className="brokerage-login__form" action="/brokerage" method="get">
            <label className="brokerage-login__field">
              <span>ایمیل یا شماره موبایل سازمانی</span>
              <input
                name="identity"
                type="text"
                autoComplete="username"
                placeholder="user@broker.ir"
              />
            </label>

            <label className="brokerage-login__field">
              <span>رمز عبور</span>
              <input
                name="password"
                type="password"
                autoComplete="current-password"
                placeholder="••••••••••••"
              />
            </label>

            <p className="brokerage-login__message">
              برای بازنشانی رمز، از مدیر دسترسی کارگزاری یا پشتیبانی چارخونه درخواست دهید.
            </p>

            <button className="brokerage-login__submit" type="submit">
              ورود به پنل کارگزاری
            </button>
          </form>

          <div className="brokerage-login__divider" />
          <p className="brokerage-login__activation-note">
            دسترسی پنل توسط چارخونه برای مسئول معرفی‌شده کارگزاری فعال می‌شود.
          </p>
        </div>

        <p className="brokerage-login__footer">چارخونه — پنل کارگزاری</p>
      </div>

      <aside className="brokerage-login__identity" aria-label="معرفی پنل کارگزاری">
        <BrandLogo className="brokerage-login__logo" />
        <h2>پنل کارگزاری چارخونه</h2>
        <strong>مدیریت منابع، سود و عملیات کارگزاری</strong>
        <p>دسترسی این بخش فقط برای کاربران مجاز کارگزاری فعال است.</p>

        <div className="brokerage-login__security-note">
          <h3>دسترسی امن</h3>
          <p>اطلاعات ورود سازمانی خود را در اختیار دیگران قرار ندهید.</p>
        </div>
      </aside>
    </section>
  );
}
