"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import BrokerageSettingsPage, { BROKERAGE_USERS_KEY, type PanelUser } from "../../page";

const roleLabels: Record<string, string> = {
  "panel-manager": "مدیر پنل",
  "finance-operations": "عملیات مالی",
  "operations-specialist": "کارشناس عملیات",
  observer: "ناظر",
};

const accessLabels: Record<string, string> = {
  full: "کامل",
  "finance-transfer": "مالی و انتقال",
  "cases-resources": "پرونده‌ها و منابع",
  "read-only": "فقط مشاهده",
};

function toLatinDigits(value: string) {
  return value
    .replace(/[۰-۹]/g, (digit) => String("۰۱۲۳۴۵۶۷۸۹".indexOf(digit)))
    .replace(/[٠-٩]/g, (digit) => String("٠١٢٣٤٥٦٧٨٩".indexOf(digit)));
}

export default function BrokerageSettingsAddUserPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [mobile, setMobile] = useState("");
  const [role, setRole] = useState("operations-specialist");
  const [access, setAccess] = useState("cases-resources");
  const [error, setError] = useState("");

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const normalizedMobile = toLatinDigits(mobile).replace(/\D/g, "");
    if (name.trim().length < 3 || normalizedMobile.length < 10) {
      setError("نام و شماره موبایل معتبر را وارد کنید.");
      return;
    }
    setError("");

    const user: PanelUser = {
      name: name.trim(),
      mobile,
      role: roleLabels[role] ?? roleLabels["operations-specialist"],
      access: accessLabels[access] ?? accessLabels["cases-resources"],
      lastActive: "همین حالا",
      status: "فعال",
      slug: `preview-${Date.now()}`,
    };

    try {
      const raw = window.localStorage.getItem(BROKERAGE_USERS_KEY);
      const current = raw ? JSON.parse(raw) : [];
      const next = Array.isArray(current) ? [user, ...current] : [user];
      window.localStorage.setItem(BROKERAGE_USERS_KEY, JSON.stringify(next));
    } catch {
      window.localStorage.setItem(BROKERAGE_USERS_KEY, JSON.stringify([user]));
    }
    router.push("/brokerage/settings");
  }

  return (
    <div className="brokerage-add-user" data-node-id="399:2" data-name="Brokerage / Settings / Add User">
      <BrokerageSettingsPage />
      <div className="brokerage-add-user__backdrop" aria-hidden="true" />
      <section className="brokerage-add-user__modal" role="dialog" aria-modal="true" aria-labelledby="brokerage-add-user-title">
        <header className="brokerage-add-user__header">
          <Link className="brokerage-add-user__close" href="/brokerage/settings" aria-label="بستن پنجره افزودن کاربر">×</Link>
          <div className="brokerage-add-user__header-copy"><h1 id="brokerage-add-user-title">افزودن کاربر</h1><p>تعریف دسترسی برای کاربر جدید پنل کارگزاری</p></div>
        </header>

        <form className="brokerage-add-user__form" onSubmit={submit}>
          <label className="brokerage-add-user__field"><span>نام و نام خانوادگی</span><input type="text" name="fullName" placeholder="مثلاً نیما احمدی" autoComplete="name" value={name} onChange={(event) => setName(event.target.value)} /></label>
          <label className="brokerage-add-user__field"><span>شماره موبایل</span><input type="tel" name="mobile" placeholder="۰۹۱۲۱۲۳۴۵۶۷" inputMode="tel" autoComplete="tel" dir="rtl" value={mobile} onChange={(event) => setMobile(event.target.value)} /></label>
          <label className="brokerage-add-user__field"><span>نقش</span><select name="role" value={role} onChange={(event) => setRole(event.target.value)}><option value="panel-manager">مدیر پنل</option><option value="finance-operations">عملیات مالی</option><option value="operations-specialist">کارشناس عملیات</option><option value="observer">ناظر</option></select></label>
          <label className="brokerage-add-user__field"><span>سطح دسترسی</span><select name="access" value={access} onChange={(event) => setAccess(event.target.value)}><option value="full">کامل</option><option value="finance-transfer">مالی و انتقال</option><option value="cases-resources">پرونده‌ها و منابع</option><option value="read-only">فقط مشاهده</option></select></label>

          <p className="brokerage-add-user__note">دسترسی‌ها براساس نقش انتخابی اعمال می‌شوند و بعداً از بخش مدیریت کاربر قابل تغییرند.</p>
          {error && <p className="brokerage-add-user__note" role="alert" style={{ color: "#b42318" }}>{error}</p>}

          <div className="brokerage-add-user__actions">
            <Link className="brokerage-add-user__button brokerage-add-user__button--secondary" href="/brokerage/settings">انصراف</Link>
            <button className="brokerage-add-user__button brokerage-add-user__button--primary" type="submit">افزودن کاربر</button>
          </div>
        </form>
      </section>
    </div>
  );
}
