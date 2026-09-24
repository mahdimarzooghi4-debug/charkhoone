"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import BrokerageSettingsPage from "../page";

const API_KEY = "charkhoone.brokerage.preview.api";

export default function BrokerageSettingsApiConnectionPage() {
  const router = useRouter();
  const [apiUrl, setApiUrl] = useState("https://api.brokerage.ir/v1");
  const [apiKey, setApiKey] = useState("");
  const [apiSecret, setApiSecret] = useState("");
  const [state, setState] = useState<"idle" | "success" | "error">("idle");

  function validUrl() {
    try {
      const url = new URL(apiUrl);
      return url.protocol === "https:";
    } catch {
      return false;
    }
  }

  function testConnection() {
    setState(validUrl() ? "success" : "error");
  }

  function saveConnection() {
    if (!validUrl()) {
      setState("error");
      return;
    }
    window.localStorage.setItem(API_KEY, JSON.stringify({
      apiUrl,
      connected: true,
      savedAt: new Date().toISOString(),
    }));
    setState("success");
    router.push("/brokerage/settings");
  }

  return (
    <div className="brokerage-api-connection" data-node-id="427:2" data-name="Brokerage / Settings / API Connection">
      <BrokerageSettingsPage />
      <div className="brokerage-api-connection__backdrop" aria-hidden="true" />
      <section className="brokerage-api-connection__modal" role="dialog" aria-modal="true" aria-labelledby="brokerage-api-connection-title">
        <header className="brokerage-api-connection__header">
          <Link className="brokerage-api-connection__close" href="/brokerage/settings" aria-label="بستن اتصال API">×</Link>
          <div className="brokerage-api-connection__header-copy"><h1 id="brokerage-api-connection-title">اتصال API کارگزاری</h1><p>آدرس سرویس و اطلاعات دسترسی سیستم داخلی کارگزاری را وارد کنید.</p></div>
        </header>

        <div className="brokerage-api-connection__status" role="status">
          <strong>{state === "success" ? "تست اتصال موفق بود" : state === "error" ? "آدرس API معتبر نیست" : "اتصال فعلی فعال است"}</strong>
          <span>API سیستم کارگزاری</span>
        </div>

        <form className="brokerage-api-connection__form" onSubmit={(event) => event.preventDefault()}>
          <label className="brokerage-api-connection__field"><span>آدرس API</span><input dir="ltr" type="url" name="apiUrl" value={apiUrl} onChange={(event) => { setApiUrl(event.target.value); setState("idle"); }} autoComplete="url" /></label>
          <label className="brokerage-api-connection__field"><span>کلید API</span><input dir="ltr" type="text" name="apiKey" value={apiKey} onChange={(event) => setApiKey(event.target.value)} placeholder="brk_live_••••••••••" autoComplete="off" spellCheck={false} /></label>
          <label className="brokerage-api-connection__field"><span>توکن / Secret</span><input dir="ltr" type="password" name="apiSecret" value={apiSecret} onChange={(event) => setApiSecret(event.target.value)} placeholder="••••••••••••••••" autoComplete="off" spellCheck={false} /></label>

          <p className="brokerage-api-connection__security-note">در این پیش‌نمایش فقط وضعیت اتصال و آدرس سرویس ذخیره می‌شود؛ کلید و Secret در مرورگر ذخیره نمی‌شوند.</p>

          <div className="brokerage-api-connection__actions">
            <Link className="brokerage-api-connection__button brokerage-api-connection__button--secondary brokerage-api-connection__button--cancel" href="/brokerage/settings">انصراف</Link>
            <button className="brokerage-api-connection__button brokerage-api-connection__button--secondary brokerage-api-connection__button--test" type="button" onClick={testConnection}>تست اتصال</button>
            <button className="brokerage-api-connection__button brokerage-api-connection__button--secondary brokerage-api-connection__button--save" type="button" onClick={saveConnection}>ذخیره و اتصال</button>
          </div>
        </form>
      </section>
    </div>
  );
}
