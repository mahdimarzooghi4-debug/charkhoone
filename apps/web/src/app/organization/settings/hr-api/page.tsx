"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";

const statusRows = [
  { label: "وضعیت اتصال", value: "متصل", badge: true },
  { label: "سیستم متصل", value: "سامانه HR سازمان نمونه", badge: false },
  { label: "آخرین همگام‌سازی", value: "۱۴۰۵/۰۶/۰۸ — ۱۵:۳۲", badge: false },
  { label: "پرسنل همگام‌شده", value: "۱٬۲۵۳ نفر", badge: false },
  { label: "خطاهای آخرین همگام‌سازی", value: "۰ مورد", badge: false },
] as const;

const mappings = [
  { label: "مسیر دریافت پرسنل", value: "GET /employees" },
  { label: "کد ملی", value: "national_id" },
  { label: "کد پرسنلی", value: "employee_code" },
  { label: "نام و نام خانوادگی", value: "full_name" },
  { label: "شماره موبایل", value: "mobile" },
  { label: "واحد سازمانی", value: "department" },
  { label: "وضعیت همکاری", value: "employment_status" },
] as const;

const STORAGE_KEY = "charkhoone.organization.preview.hr-api";

export default function OrganizationHrApiPage() {
  const router = useRouter();
  const [systemName, setSystemName] = useState("سامانه HR سازمان نمونه");
  const [apiUrl, setApiUrl] = useState("https://hr.example.ir/api/v1");
  const [token, setToken] = useState("charkhoone-hr-api-token");
  const [connectionState, setConnectionState] = useState<"connected" | "disconnected">("connected");
  const [testState, setTestState] = useState<"idle" | "success" | "error">("idle");

  function validUrl() {
    try {
      const url = new URL(apiUrl);
      return url.protocol === "https:";
    } catch {
      return false;
    }
  }

  function testConnection() {
    setTestState(validUrl() && token.trim() ? "success" : "error");
  }

  function disconnect() {
    setConnectionState("disconnected");
    setTestState("idle");
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ connected: false }));
  }

  function saveAndConnect() {
    if (!validUrl() || !token.trim()) {
      setTestState("error");
      return;
    }
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ systemName, apiUrl, connected: true, savedAt: new Date().toISOString() }));
    setConnectionState("connected");
    router.push("/organization/settings");
  }

  return (
    <section className="org-hr-api" data-node-id="550:195">
      <header className="org-hr-api__header">
        <Link className="org-settings-back" href="/organization/settings">← بازگشت به تنظیمات</Link>
        <h1>تنظیم اتصال API منابع انسانی</h1>
        <p>اتصال سیستم منابع انسانی سازمان برای ثبت و به‌روزرسانی خودکار پرسنل</p>
      </header>

      <article className="org-hr-api__card">
        <h2>وضعیت اتصال</h2>
        <div className="org-hr-api__rows">
          {statusRows.map((row) => (
            <div className="org-hr-api__row" key={row.label}>
              {row.badge ? <span className="org-hr-api__badge">{connectionState === "connected" ? "متصل" : "قطع‌شده"}</span> : <strong>{row.value}</strong>}
              <span>{row.label}</span>
            </div>
          ))}
        </div>
        <div className="org-hr-api__actions"><Link className="org-hr-api__button" href="/organization/settings/hr-api/sync-success">همگام‌سازی الآن</Link></div>
      </article>

      <article className="org-hr-api__card">
        <h2>اطلاعات اتصال</h2>
        <div className="org-hr-api__form">
          <div className="org-hr-api__field"><label htmlFor="system-name">نام سیستم</label><input id="system-name" value={systemName} onChange={(e) => setSystemName(e.target.value)} /></div>
          <div className="org-hr-api__field"><label htmlFor="api-url">آدرس API</label><input id="api-url" value={apiUrl} onChange={(e) => {setApiUrl(e.target.value); setTestState("idle");}} dir="ltr" /></div>
          <div className="org-hr-api__field"><label htmlFor="auth-method">روش احراز هویت</label><select id="auth-method" defaultValue="bearer"><option value="bearer">Bearer Token</option></select></div>
          <div className="org-hr-api__field"><label htmlFor="token">توکن دسترسی</label><input id="token" type="password" value={token} onChange={(e) => setToken(e.target.value)} /></div>
        </div>
        <p className="org-hr-api__hint">{testState === "success" ? "تست اتصال موفق بود." : testState === "error" ? "آدرس API یا توکن معتبر نیست." : "اطلاعات امنیتی پس از ذخیره به‌صورت کامل نمایش داده نمی‌شوند."}</p>
        <div className="org-hr-api__actions"><button className="org-hr-api__button" type="button" onClick={testConnection}>تست اتصال</button></div>
      </article>

      <article className="org-hr-api__card org-hr-api__mapping">
        <h2>دریافت اطلاعات پرسنل</h2>
        <div className="org-hr-api__rows">{mappings.map((row) => <div className="org-hr-api__row" key={row.label}><code>{row.value}</code><span>{row.label}</span></div>)}</div>
        <p className="org-hr-api__copy">چارخونه از این اطلاعات برای ایجاد یا به‌روزرسانی پرسنل استفاده می‌کند.</p>
      </article>

      <article className="org-hr-api__card">
        <h2>تنظیمات همگام‌سازی</h2>
        <div className="org-hr-api__toggle-row"><span className="org-switch" aria-hidden="true" /><span>همگام‌سازی خودکار</span></div>
        <div className="org-hr-api__toggle-row"><select className="org-hr-api__select" defaultValue="6h" aria-label="فاصله همگام‌سازی"><option value="6h">هر ۶ ساعت</option></select><span>فاصله همگام‌سازی</span></div>
        <div className="org-hr-api__toggle-row"><span className="org-switch" aria-hidden="true" /><span>به‌روزرسانی اطلاعات پرسنل موجود</span></div>
        <div className="org-hr-api__toggle-row"><span className="org-switch" aria-hidden="true" /><span>ثبت خودکار پرسنل جدید</span></div>
        <div className="org-hr-api__notice">حذف یا غیرفعال‌شدن پرسنل در سیستم منابع انسانی، اطلاعات سوابق و پرونده‌های قبلی او را در چارخونه حذف نمی‌کند.</div>
      </article>

      <footer className="org-hr-api__footer">
        <button className="org-hr-api__disconnect" type="button" onClick={disconnect}>{connectionState === "connected" ? "قطع اتصال" : "اتصال قطع است"}</button>
        <div className="org-hr-api__actions"><Link className="org-hr-api__button" href="/organization/settings">انصراف</Link><button className="org-hr-api__button org-hr-api__button--primary" type="button" onClick={saveAndConnect}>ذخیره و اتصال</button></div>
      </footer>
    </section>
  );
}
