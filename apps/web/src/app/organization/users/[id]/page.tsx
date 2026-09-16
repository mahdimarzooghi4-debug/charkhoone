import Link from "next/link";
import { OrganizationUsersOverview } from "@/components/organization/OrganizationUsersOverview";

export default function OrganizationManageUserPage() {
  return (
    <div className="org-user-manage-page" data-node-id="548:33">
      <OrganizationUsersOverview />
      <div className="org-user-manage__backdrop" />
      <section className="org-user-manage" role="dialog" aria-modal="true" aria-labelledby="manage-user-title">
        <header className="org-user-manage__header">
          <Link href="/organization/users" aria-label="بستن">×</Link>
          <div>
            <h2 id="manage-user-title">مدیریت کاربر سازمان</h2>
            <p>نقش، سطح دسترسی و وضعیت این کاربر را مدیریت کنید.</p>
          </div>
        </header>

        <div className="org-user-manage__divider" />

        <div className="org-user-manage__summary">
          <div><strong>علی رضایی</strong><span>نام و نام خانوادگی</span></div>
          <div><strong>ali@org.ir</strong><span>ایمیل سازمانی</span></div>
        </div>

        <label className="org-user-manage__field">
          <span>نقش</span>
          <select defaultValue="finance">
            <option value="admin">مدیر پنل</option>
            <option value="finance">مالی</option>
            <option value="hr">منابع انسانی</option>
            <option value="viewer">مشاهده‌گر</option>
          </select>
          <small>سطح دسترسی براساس نقش انتخاب‌شده تعیین می‌شود.</small>
        </label>

        <div className="org-user-manage__field">
          <span>وضعیت دسترسی</span>
          <div className="org-user-manage__status-actions">
            <button className="is-active" type="button">فعال</button>
            <button type="button">غیرفعال</button>
          </div>
        </div>

        <div className="org-user-manage__access">
          <strong>دسترسی‌های نقش مالی</strong>
          <span>پرداخت‌ها • پرونده‌ها • مشاهده طرح‌های بانکی مرتبط</span>
        </div>

        <div className="org-user-manage__note">
          غیرفعال‌کردن دسترسی، سوابق فعالیت و اقدامات ثبت‌شده این کاربر را حذف نمی‌کند.
        </div>

        <div className="org-user-manage__divider" />

        <footer className="org-user-manage__footer">
          <Link className="org-user-form__button" href="/organization/users">انصراف</Link>
          <Link className="org-user-form__button org-user-form__button--primary" href="/organization/users">ذخیره تغییرات</Link>
        </footer>
      </section>
    </div>
  );
}
