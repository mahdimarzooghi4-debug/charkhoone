import { BrandLogo } from "@/components/marketing/BrandLogo";

type OrganizationLoginViewProps = {
  failed?: boolean;
};

export function OrganizationLoginView({ failed = false }: OrganizationLoginViewProps) {
  return (
    <section
      className={["org-login", failed ? "org-login--failed" : ""].filter(Boolean).join(" ")}
      data-node-id={failed ? "793:124" : "792:42"}
      data-name={failed ? "Organization / Login — Failed" : "Organization / Login"}
    >
      <div className="org-login__content">
        <div className="org-login__card">
          <header className="org-login__header">
            <h1>ورود به پنل سازمان</h1>
            <p>برای ادامه، اطلاعات دسترسی پنل سازمان را وارد کنید.</p>
          </header>

          <form className="org-login__form" action="/organization" method="get">
            <label className="org-login__field">
              <span>ایمیل یا شماره موبایل سازمانی</span>
              <input
                name="identity"
                type="text"
                autoComplete="username"
                placeholder="user@organization.ir"
                aria-invalid={failed || undefined}
              />
            </label>

            <label className="org-login__field">
              <span>رمز عبور</span>
              <input
                name="password"
                type="password"
                autoComplete="current-password"
                placeholder="••••••••••••"
                aria-invalid={failed || undefined}
              />
            </label>

            <p className="org-login__message" role={failed ? "alert" : undefined}>
              {failed
                ? "ایمیل/شماره موبایل یا رمز عبور نادرست است. دوباره تلاش کنید."
                : "برای بازنشانی رمز، از مدیر دسترسی سازمان یا پشتیبانی چارخونه درخواست دهید."}
            </p>

            <button className="org-login__submit" type="submit">
              ورود به پنل سازمان
            </button>
          </form>

          <div className="org-login__divider" />
          <p className="org-login__activation-note">
            دسترسی پنل توسط چارخونه برای مسئول معرفی‌شده سازمان فعال می‌شود.
          </p>
        </div>

        <p className="org-login__footer">چارخونه — پنل سازمان</p>
      </div>

      <aside className="org-login__identity" aria-label="معرفی پنل سازمان">
        <BrandLogo className="org-login__logo" />
        <h2>پنل سازمان چارخونه</h2>
        <strong>مدیریت پرونده‌ها، کارکنان و عملیات سازمان</strong>
        <p>دسترسی این بخش فقط برای کاربران مجاز سازمان فعال است.</p>

        <div className="org-login__security-note">
          <h3>دسترسی امن</h3>
          <p>اطلاعات ورود سازمانی خود را در اختیار دیگران قرار ندهید.</p>
        </div>
      </aside>
    </section>
  );
}
