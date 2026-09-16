import Link from "next/link";

type PanelUser = {
  name: string;
  role: string;
  access: string;
  lastActive: string;
  status: "فعال" | "غیرفعال";
  slug: string;
};

const users: PanelUser[] = [
  {
    name: "علی رضایی",
    role: "مدیر پنل",
    access: "کامل",
    lastActive: "امروز، ۱۳:۴۵",
    status: "فعال",
    slug: "ali-rezaei",
  },
  {
    name: "مریم احمدی",
    role: "عملیات مالی",
    access: "مالی و انتقال",
    lastActive: "امروز، ۱۲:۲۰",
    status: "فعال",
    slug: "maryam-ahmadi",
  },
  {
    name: "رضا کاظمی",
    role: "کارشناس عملیات",
    access: "پرونده‌ها و منابع",
    lastActive: "دیروز، ۱۷:۱۰",
    status: "فعال",
    slug: "reza-kazemi",
  },
  {
    name: "سارا محمدی",
    role: "ناظر",
    access: "فقط مشاهده",
    lastActive: "۱۴۰۵/۰۵/۲۹",
    status: "غیرفعال",
    slug: "sara-mohammadi",
  },
];

const connectionMetrics = [
  { label: "آخرین همگام‌سازی", value: "۱۴۰۵/۰۶/۰۸ — ۱۴:۱۰", note: "موفق" },
  { label: "آخرین داده مالی", value: "دوره شهریور ۱۴۰۵", note: "دریافت‌شده" },
  { label: "خطاهای تطبیق", value: "۳ رکورد", note: "نیازمند بررسی" },
  { label: "روش دریافت", value: "API سیستم کارگزاری", note: "ورود دستی غیرفعال" },
] as const;

const policies = [
  { label: "سود واقعی", value: "فقط از سیستم کارگزاری" },
  { label: "ورود دستی مبلغ", value: "غیرفعال" },
  { label: "رکوردهای نامنطبق", value: "نیازمند بررسی اپراتور" },
] as const;

export default function BrokerageSettingsPage() {
  return (
    <section className="brokerage-settings" data-node-id="396:2" data-name="Brokerage / Settings">
      <header className="brokerage-settings__header">
        <div>
          <h1>تنظیمات</h1>
          <p>مدیریت کاربران پنل و اتصال به سیستم داخلی کارگزاری</p>
        </div>
      </header>

      <div className="brokerage-settings__top">
        <article className="brokerage-settings__users-summary">
          <div className="brokerage-settings__section-copy">
            <h2>دسترسی و کاربران</h2>
            <p>مدیریت افرادی که به پنل کارگزاری چارخونه دسترسی دارند.</p>
          </div>

          <div className="brokerage-settings__user-metrics">
            <div>
              <span>کاربران فعال</span>
              <strong>۸ کاربر</strong>
            </div>
            <div>
              <span>مدیران پنل</span>
              <strong>۲ کاربر</strong>
            </div>
          </div>

          <p className="brokerage-settings__note">دسترسی‌ها براساس نقش عملیاتی هر کاربر کنترل می‌شود.</p>

          <div className="brokerage-settings__actions">
            <Link className="brokerage-settings__button brokerage-settings__button--primary" href="/brokerage/settings/users/new">
              افزودن کاربر
            </Link>
          </div>
        </article>

        <article className="brokerage-settings__connection">
          <div className="brokerage-settings__connection-header">
            <span className="brokerage-settings__status brokerage-settings__status--connected">متصل</span>
            <div className="brokerage-settings__section-copy">
              <h2>اتصال به سیستم داخلی کارگزاری</h2>
              <p>داده‌های منابع، گردش‌ها و سود واقعی از پنل داخلی کارگزاری همگام می‌شوند.</p>
            </div>
          </div>

          <div className="brokerage-settings__connection-metrics">
            {connectionMetrics.map((metric) => (
              <div key={metric.label}>
                <span>{metric.label}</span>
                <strong>{metric.value}</strong>
                <small>{metric.note}</small>
              </div>
            ))}
          </div>

          <div className="brokerage-settings__connection-footer">
            <div className="brokerage-settings__connection-actions">
              <Link className="brokerage-settings__button brokerage-settings__button--secondary" href="/brokerage/settings/sync-errors">
                مشاهده خطاها
              </Link>
              <Link className="brokerage-settings__button brokerage-settings__button--secondary" href="/brokerage/settings/api-connection">
                اتصال API
              </Link>
            </div>
            <p className="brokerage-settings__note brokerage-settings__note--wide">
              سود واقعی فقط از سیستم کارگزاری دریافت می‌شود و قابل ورود دستی نیست.
            </p>
          </div>
        </article>
      </div>

      <article className="brokerage-settings__panel-users">
        <div className="brokerage-settings__panel-users-header">
          <button className="brokerage-settings__button brokerage-settings__button--secondary" type="button">
            همه کاربران
          </button>
          <div className="brokerage-settings__section-copy">
            <h2>کاربران پنل</h2>
            <p>سطح دسترسی، وضعیت و آخرین فعالیت کاربران کارگزاری.</p>
          </div>
        </div>

        <div className="brokerage-settings-table" role="table" aria-label="کاربران پنل کارگزاری">
          <div className="brokerage-settings-table__row brokerage-settings-table__head" role="row">
            <span role="columnheader">اقدام</span>
            <span role="columnheader">وضعیت</span>
            <span role="columnheader">آخرین فعالیت</span>
            <span role="columnheader">سطح دسترسی</span>
            <span role="columnheader">نقش</span>
            <span role="columnheader">کاربر</span>
          </div>

          {users.map((user) => (
            <div className="brokerage-settings-table__row" role="row" key={user.slug}>
              <span className="brokerage-settings-table__action" role="cell">
                <Link href={`/brokerage/settings/users/${user.slug}`}>مدیریت</Link>
              </span>
              <span role="cell">
                <span
                  className={[
                    "brokerage-settings__status",
                    user.status === "فعال"
                      ? "brokerage-settings__status--connected"
                      : "brokerage-settings__status--inactive",
                  ]
                    .filter(Boolean)
                    .join(" ")}
                >
                  {user.status}
                </span>
              </span>
              <span role="cell">{user.lastActive}</span>
              <span role="cell">{user.access}</span>
              <span role="cell">{user.role}</span>
              <strong role="cell">{user.name}</strong>
            </div>
          ))}
        </div>
      </article>

      <article className="brokerage-settings__policy">
        <div className="brokerage-settings__section-copy">
          <h2>کنترل داده‌های مالی</h2>
          <p>قاعده‌ها در داده سازمانی مشخص داخل کارگزاری.</p>
        </div>
        <div className="brokerage-settings__policy-grid">
          {policies.map((policy) => (
            <div key={policy.label}>
              <span>{policy.label}</span>
              <strong>{policy.value}</strong>
            </div>
          ))}
        </div>
      </article>
    </section>
  );
}
