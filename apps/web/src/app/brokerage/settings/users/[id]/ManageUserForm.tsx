"use client";

import Link from "next/link";
import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import BrokerageSettingsPage from "../../page";

const USERS_KEY = "charkhoone.brokerage.preview.users";
const OVERRIDES_KEY = "charkhoone.brokerage.preview.user-overrides";

type UserRecord = {
  name: string;
  mobile: string;
  role: string;
  access: string;
  status: "فعال" | "غیرفعال";
};

const roleToKey: Record<string,string> = {
  "مدیر پنل":"panel-manager",
  "عملیات مالی":"finance-operations",
  "کارشناس عملیات":"operations-specialist",
  "ناظر":"observer",
};
const roleToLabel: Record<string,string> = {
  "panel-manager":"مدیر پنل",
  "finance-operations":"عملیات مالی",
  "operations-specialist":"کارشناس عملیات",
  observer:"ناظر",
};
const accessToKey: Record<string,string> = {
  "کامل":"full",
  "مالی و انتقال":"finance-transfer",
  "پرونده‌ها و منابع":"cases-resources",
  "فقط مشاهده":"read-only",
};
const accessToLabel: Record<string,string> = {
  full:"کامل",
  "finance-transfer":"مالی و انتقال",
  "cases-resources":"پرونده‌ها و منابع",
  "read-only":"فقط مشاهده",
};

export function ManageUserForm({ id, initial }: { id: string; initial: UserRecord }) {
  const router = useRouter();
  const [user, setUser] = useState<UserRecord>(initial);
  const [role, setRole] = useState(roleToKey[initial.role] ?? initial.role);
  const [access, setAccess] = useState(accessToKey[initial.access] ?? initial.access);

  useEffect(() => {
    try {
      const rawUsers = window.localStorage.getItem(USERS_KEY);
      const added = rawUsers ? JSON.parse(rawUsers) : [];
      const found = Array.isArray(added) ? added.find((item) => item?.slug === id) : null;

      const rawOverrides = window.localStorage.getItem(OVERRIDES_KEY);
      const overrides = rawOverrides ? JSON.parse(rawOverrides) : {};
      const override = overrides && typeof overrides === "object" ? overrides[id] : undefined;

      const merged = {
        ...initial,
        ...(found ? {
          name: String(found.name ?? initial.name),
          mobile: String(found.mobile ?? "—"),
          role: String(found.role ?? initial.role),
          access: String(found.access ?? initial.access),
          status: found.status === "غیرفعال" ? "غیرفعال" as const : "فعال" as const,
        } : {}),
        ...(override ?? {}),
      };
      setUser(merged);
      setRole(roleToKey[merged.role] ?? merged.role);
      setAccess(accessToKey[merged.access] ?? merged.access);
    } catch {
      setUser(initial);
    }
  }, [id, initial]);

  function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const next = {
      role: roleToLabel[role] ?? user.role,
      access: accessToLabel[access] ?? user.access,
      status: user.status,
    };
    let overrides: Record<string, unknown> = {};
    try {
      const raw = window.localStorage.getItem(OVERRIDES_KEY);
      const parsed = raw ? JSON.parse(raw) : {};
      overrides = parsed && typeof parsed === "object" ? parsed : {};
    } catch {
      overrides = {};
    }
    overrides[id] = { ...(overrides[id] as object ?? {}), ...next };
    window.localStorage.setItem(OVERRIDES_KEY, JSON.stringify(overrides));
    router.push("/brokerage/settings");
  }

  function activate() {
    let overrides: Record<string, unknown> = {};
    try {
      const raw = window.localStorage.getItem(OVERRIDES_KEY);
      const parsed = raw ? JSON.parse(raw) : {};
      overrides = parsed && typeof parsed === "object" ? parsed : {};
    } catch {
      overrides = {};
    }
    overrides[id] = { ...(overrides[id] as object ?? {}), status: "فعال" };
    window.localStorage.setItem(OVERRIDES_KEY, JSON.stringify(overrides));
    router.push("/brokerage/settings");
  }

  return (
    <div className="brokerage-manage-user" data-node-id="405:2" data-name="Brokerage / Settings / Manage User">
      <BrokerageSettingsPage />
      <div className="brokerage-manage-user__backdrop" aria-hidden="true" />
      <section className="brokerage-manage-user__modal" role="dialog" aria-modal="true" aria-labelledby="brokerage-manage-user-title">
        <header className="brokerage-manage-user__header">
          <Link className="brokerage-manage-user__close" href="/brokerage/settings" aria-label="بستن پنجره مدیریت کاربر">×</Link>
          <div className="brokerage-manage-user__header-copy"><h1 id="brokerage-manage-user-title">ذخیره تغییرات</h1><p>ویرایش نقش، سطح دسترسی و وضعیت کاربر</p></div>
        </header>

        <form className="brokerage-manage-user__form" onSubmit={save}>
          <label className="brokerage-manage-user__field"><span>نام و نام خانوادگی</span><input type="text" value={user.name} readOnly aria-readonly="true" /></label>
          <label className="brokerage-manage-user__field"><span>شماره موبایل</span><input type="text" value={user.mobile} readOnly aria-readonly="true" dir="rtl" /></label>
          <label className="brokerage-manage-user__field"><span>نقش</span><select name="role" value={role} onChange={(event) => setRole(event.target.value)}><option value="panel-manager">مدیر پنل</option><option value="finance-operations">عملیات مالی</option><option value="operations-specialist">کارشناس عملیات</option><option value="observer">ناظر</option></select></label>
          <label className="brokerage-manage-user__field"><span>سطح دسترسی</span><select name="access" value={access} onChange={(event) => setAccess(event.target.value)}><option value="full">کامل</option><option value="finance-transfer">مالی و انتقال</option><option value="cases-resources">پرونده‌ها و منابع</option><option value="read-only">فقط مشاهده</option></select></label>

          <p className="brokerage-manage-user__note">وضعیت کاربر {user.status} است؛ تغییر نقش و سطح دسترسی پس از ذخیره اعمال می‌شود.</p>

          <div className="brokerage-manage-user__actions">
            {user.status === "فعال" ? (
              <Link className="brokerage-manage-user__button brokerage-manage-user__button--secondary" href={`/brokerage/settings/users/${id}/deactivate`}>غیرفعال کردن</Link>
            ) : (
              <button className="brokerage-manage-user__button brokerage-manage-user__button--secondary" type="button" onClick={activate}>فعال کردن</button>
            )}
            <button className="brokerage-manage-user__button brokerage-manage-user__button--primary" type="submit">ذخیره تغییرات</button>
          </div>
        </form>
      </section>
    </div>
  );
}
