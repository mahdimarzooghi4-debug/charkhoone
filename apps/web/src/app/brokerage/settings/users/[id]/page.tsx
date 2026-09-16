import Link from "next/link";
import BrokerageSettingsPage from "../../page";

type PanelUser = {
  name: string;
  mobile: string;
  role: string;
  access: string;
  status: "فعال" | "غیرفعال";
};

const users: Record<string, PanelUser> = {
  "ali-rezaei": {
    name: "علی رضایی",
    mobile: "۰۹۱۲۳۴۵۶۷۸۹",
    role: "operations-specialist",
    access: "cases-resources",
    status: "فعال",
  },
  "maryam-ahmadi": {
    name: "مریم احمدی",
    mobile: "—",
    role: "finance-operations",
    access: "finance-transfer",
    status: "فعال",
  },
  "reza-kazemi": {
    name: "رضا کاظمی",
    mobile: "—",
    role: "panel-manager",
    access: "full",
    status: "فعال",
  },
  "sara-mohammadi": {
    name: "سارا محمدی",
    mobile: "—",
    role: "observer",
    access: "read-only",
    status: "غیرفعال",
  },
};

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function BrokerageSettingsManageUserPage({ params }: PageProps) {
  const { id } = await params;
  const user = users[id] ?? users["ali-rezaei"];

  return (
    <div className="brokerage-manage-user" data-node-id="405:2" data-name="Brokerage / Settings / Manage User">
      <BrokerageSettingsPage />

      <div className="brokerage-manage-user__backdrop" aria-hidden="true" />

      <section
        className="brokerage-manage-user__modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="brokerage-manage-user-title"
      >
        <header className="brokerage-manage-user__header">
          <Link
            className="brokerage-manage-user__close"
            href="/brokerage/settings"
            aria-label="بستن پنجره مدیریت کاربر"
          >
            ×
          </Link>

          <div className="brokerage-manage-user__header-copy">
            <h1 id="brokerage-manage-user-title">ذخیره تغییرات</h1>
            <p>ویرایش نقش، سطح دسترسی و وضعیت کاربر</p>
          </div>
        </header>

        <form className="brokerage-manage-user__form">
          <label className="brokerage-manage-user__field">
            <span>نام و نام خانوادگی</span>
            <input type="text" value={user.name} readOnly aria-readonly="true" />
          </label>

          <label className="brokerage-manage-user__field">
            <span>شماره موبایل</span>
            <input type="text" value={user.mobile} readOnly aria-readonly="true" dir="rtl" />
          </label>

          <label className="brokerage-manage-user__field">
            <span>نقش</span>
            <select name="role" defaultValue={user.role}>
              <option value="panel-manager">مدیر پنل</option>
              <option value="finance-operations">عملیات مالی</option>
              <option value="operations-specialist">کارشناس عملیات</option>
              <option value="observer">ناظر</option>
            </select>
          </label>

          <label className="brokerage-manage-user__field">
            <span>سطح دسترسی</span>
            <select name="access" defaultValue={user.access}>
              <option value="full">کامل</option>
              <option value="finance-transfer">مالی و انتقال</option>
              <option value="cases-resources">پرونده‌ها و منابع</option>
              <option value="read-only">فقط مشاهده</option>
            </select>
          </label>

          <p className="brokerage-manage-user__note">
            وضعیت کاربر {user.status} است؛ تغییر نقش و سطح دسترسی پس از ذخیره اعمال می‌شود.
          </p>

          <div className="brokerage-manage-user__actions">
            <Link
              className="brokerage-manage-user__button brokerage-manage-user__button--secondary"
              href={`/brokerage/settings/users/${id}/deactivate`}
            >
              غیرفعال کردن
            </Link>
            <button className="brokerage-manage-user__button brokerage-manage-user__button--primary" type="button">
              ذخیره تغییرات
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
