"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import BankSettingsPage from "../page";
import styles from "./page.module.css";

const API_STORAGE_KEY = "charkhoone.bank.preview.api";

export default function BankApiConnectionPage() {
  const router = useRouter();
  const [endpoint, setEndpoint] = useState("https://api.bank.example/v1");
  const [apiKey, setApiKey] = useState("");
  const [secret, setSecret] = useState("");
  const [testState, setTestState] = useState<"idle" | "success" | "error">("idle");

  function testConnection() {
    const valid = /^https:\/\//i.test(endpoint.trim()) && endpoint.trim().length > 12;
    setTestState(valid ? "success" : "error");
  }

  function saveConnection() {
    if (!/^https:\/\//i.test(endpoint.trim())) {
      setTestState("error");
      return;
    }

    window.localStorage.setItem(API_STORAGE_KEY, JSON.stringify({
      endpoint: endpoint.trim(),
      connected: true,
      savedAt: new Date().toISOString(),
    }));
    router.push("/bank/settings");
  }

  return (
    <div className={styles.wrap} data-node-id="430:4" data-name="Bank / Settings / API Connection">
      <BankSettingsPage />
      <div className={styles.backdrop} aria-hidden="true" />
      <section className={styles.modal} role="dialog" aria-modal="true" aria-labelledby="api-title">
        <div className={styles.header}><Link href="/bank/settings" className={styles.close} aria-label="بستن">×</Link><div className={styles.headerCopy}><h1 id="api-title">اتصال API بانک</h1><p>آدرس سرویس و اطلاعات دسترسی سیستم داخلی بانک را وارد کنید.</p></div></div>
        <div className={styles.status}><strong>{testState === "success" ? "تست اتصال موفق بود" : testState === "error" ? "آدرس API معتبر نیست" : "آماده تست اتصال"}</strong><span>API سیستم بانک</span></div>
        <label className={styles.field}><span>آدرس API</span><input className={styles.input} dir="ltr" value={endpoint} onChange={(e) => { setEndpoint(e.target.value); setTestState("idle"); }} /></label>
        <label className={styles.field}><span>کلید API</span><input className={styles.input} dir="ltr" value={apiKey} onChange={(e) => setApiKey(e.target.value)} placeholder="bank_live_••••••••••" /></label>
        <label className={styles.field}><span>توکن / Secret</span><input className={styles.input} dir="ltr" type="password" value={secret} onChange={(e) => setSecret(e.target.value)} placeholder="••••••••••••••••" /></label>
        <div className={styles.note}>در این پیش‌نمایش فقط وضعیت اتصال و آدرس سرویس ذخیره می‌شود؛ کلید و Secret در مرورگر نگهداری نمی‌شوند.</div>
        <div className={styles.actions}><Link href="/bank/settings" className={`${styles.action} ${styles.cancel}`}>انصراف</Link><button type="button" className={`${styles.action} ${styles.test}`} onClick={testConnection}>تست اتصال</button><button type="button" className={`${styles.action} ${styles.save}`} onClick={saveConnection}>ذخیره و اتصال</button></div>
      </section>
    </div>
  );
}
