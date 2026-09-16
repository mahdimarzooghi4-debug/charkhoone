import { BrandLogo } from "@/components/marketing/BrandLogo";

export function AdminLoginView({ failed = false }: { failed?: boolean }) {
  return (
    <section className={`admin-login${failed ? " admin-login--failed" : ""}`} data-node-id={failed ? "793:12" : "788:19"} data-name={failed ? "Admin / Login / Failed" : "Admin / Login"}>
      <aside className="admin-login__identity">
        <BrandLogo className="admin-login__logo" />
        <div className="admin-login__identity-copy">
          <h1>پنل مدیریت چارخونه</h1>
          <strong>مدیریت امن و یکپارچه پلتفرم</strong>
          <p>دسترسی این بخش فقط برای مدیران مجاز چارخونه فعال است.</p>
        </div>
        <div className="admin-login__security-note"><strong>ورود امن</strong><p>اطلاعات ورود خود را در اختیار دیگران قرار ندهید.</p></div>
      </aside>

      <main className="admin-login__main">
        <section className="admin-login__card" aria-label="ورود مدیران">
          <header><h2>ورود به پنل مدیریت</h2><p>برای ادامه، اطلاعات حساب مدیریتی خود را وارد کنید.</p></header>
          <div className="admin-login__form">
            <label><span>شماره موبایل یا ایمیل</span><input className={failed ? "admin-login__input--error" : ""} type="text" placeholder="admin@charkhooneh.ir" aria-invalid={failed || undefined} /></label>
            <label><span>رمز عبور</span><input className={failed ? "admin-login__input--error" : ""} type="password" placeholder="••••••••••••" aria-invalid={failed || undefined} /></label>
            {failed ? <p className="admin-login__error" role="alert">ایمیل/شماره موبایل یا رمز عبور نادرست است. دوباره تلاش کنید.</p> : <p className="admin-login__hint">بازیابی رمز از طریق مدیر ارشد سامانه انجام می‌شود.</p>}
            <button type="button" className="admin-login__submit">ورود به پنل مدیریت</button>
          </div>
          <div className="admin-login__divider" />
          <p className="admin-login__account-note">حساب‌های مدیریتی از طریق مدیر ارشد چارخونه ایجاد و فعال می‌شوند.</p>
        </section>
        <p className="admin-login__footer">چارخونه — پنل مدیریت پلتفرم</p>
      </main>
    </section>
  );
}
