import { BrandLogo } from "@/components/marketing/BrandLogo";

function resolveOidcLoginUrl() {
  const configured = process.env.CHARKHOONE_ADMIN_OIDC_LOGIN_URL?.trim();
  if (!configured) return null;

  try {
    const url = new URL(configured);
    const developmentHttp =
      process.env.NODE_ENV !== "production" &&
      url.protocol === "http:" &&
      (url.hostname === "localhost" || url.hostname === "127.0.0.1");

    if (
      (url.protocol !== "https:" && !developmentHttp) ||
      url.username ||
      url.password
    ) {
      return null;
    }

    return url.toString();
  } catch {
    return null;
  }
}

export function AdminLoginView({ failed = false }: { failed?: boolean }) {
  const oidcLoginUrl = resolveOidcLoginUrl();

  return (
    <section
      className={`admin-login${failed ? " admin-login--failed" : ""}`}
      data-name={failed ? "Admin / OIDC Login / Failed" : "Admin / OIDC Login"}
    >
      <aside className="admin-login__identity">
        <BrandLogo className="admin-login__logo" />
        <div className="admin-login__identity-copy">
          <h1>پنل عملیات پایلوت چارخونه</h1>
          <strong>دسترسی فقط با OIDC واقعی</strong>
          <p>
            backend فقط subject دقیق allowlist‌شده را می‌پذیرد. این وب هیچ رمز عبور محلی، role fallback یا impersonation ایجاد نمی‌کند.
          </p>
        </div>
        <div className="admin-login__security-note">
          <strong>مرز امنیتی</strong>
          <p>bearer دریافتی از مرز OIDC فقط سمت سرور به /api/v1/pilot پاس داده می‌شود.</p>
        </div>
      </aside>

      <main className="admin-login__main">
        <section className="admin-login__card" aria-label="ورود OIDC اپراتور">
          <header>
            <h2>ورود اپراتور</h2>
            <p>احراز هویت باید توسط provider واقعی OIDC انجام شود؛ فرم password محلی وجود ندارد.</p>
          </header>

          <div className="admin-login__form admin-login__form--oidc">
            {failed ? (
              <p className="admin-login__error" role="alert">
                ورود OIDC یا authorization اپراتور پذیرفته نشد. subject باید دقیقاً در allowlist PilotOperations باشد.
              </p>
            ) : (
              <p className="admin-login__hint">
                پس از ورود موفق، reverse proxy یا OIDC gateway باید Authorization: Bearer را برای درخواست پنل حفظ کند.
              </p>
            )}

            {oidcLoginUrl ? (
              <a className="admin-login__submit" href={oidcLoginUrl}>
                ادامه با OIDC
              </a>
            ) : (
              <button className="admin-login__submit" type="button" disabled>
                OIDC هنوز پیکربندی نشده است
              </button>
            )}
          </div>

          <div className="admin-login__divider" />
          <p className="admin-login__account-note">
            متغیر CHARKHOONE_ADMIN_OIDC_LOGIN_URL فقط مقصد login provider را تعیین می‌کند؛ credential یا token در repo ذخیره نمی‌شود.
          </p>
        </section>
        <p className="admin-login__footer">چارخونه — پنل عملیات پایلوت</p>
      </main>
    </section>
  );
}
