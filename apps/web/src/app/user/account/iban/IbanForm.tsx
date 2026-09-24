"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import styles from "./page.module.css";

const IBAN_KEY = "charkhoone.preview.iban";

function normalizeIban(value: string) {
  return value.toUpperCase().replace(/\s+/g, "").replace(/[^A-Z0-9]/g, "");
}

function isIranIban(value: string) {
  return /^IR\d{24}$/.test(normalizeIban(value));
}

function formatIban(value: string) {
  const clean = normalizeIban(value).slice(0, 26);
  return clean.replace(/(.{4})/g, "$1 ").trim();
}

export function IbanForm() {
  const router = useRouter();
  const [iban, setIban] = useState("IR");
  const normalized = useMemo(() => normalizeIban(iban), [iban]);
  const valid = isIranIban(normalized);

  useEffect(() => {
    const stored = window.localStorage.getItem(IBAN_KEY);
    if (stored) setIban(formatIban(stored));
  }, []);

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!valid) return;
    window.localStorage.setItem(IBAN_KEY, normalized);
    router.push("/user/account");
  }

  return (
    <form className={styles.modal} onSubmit={submit}>
      <header className={styles.modalHeader}>
        <Link href="/user/account" className={styles.closeButton} aria-label="بستن">×</Link>
        <h1>ثبت شماره شبا</h1>
      </header>

      <div className={styles.modalBody}>
        <p>شماره شبای بانکی متعلق به صاحب حساب را وارد کنید. شماره شبا با IR شروع می‌شود و ۲۴ رقم دارد.</p>
        <label className={styles.field}>
          <span>شماره شبا</span>
          <input
            dir="ltr"
            inputMode="numeric"
            autoComplete="off"
            value={iban}
            onChange={(event) => setIban(formatIban(event.target.value))}
            placeholder="IR00 0000 0000 0000 0000 0000 00"
            aria-invalid={normalized.length > 2 && !valid}
          />
        </label>
        {normalized.length > 2 && !valid && <p className={styles.error}>شماره شبا باید با IR شروع شود و شامل ۲۴ رقم باشد.</p>}
        <p className={styles.note}>در نسخه فعلی این اطلاعات فقط برای پیش‌نمایش حساب روی همین مرورگر نگهداری می‌شود؛ اعتبارسنجی بانکی واقعی پس از اتصال سرویس مربوط انجام خواهد شد.</p>
      </div>

      <div className={styles.actions}>
        <button type="submit" className={styles.primaryAction} disabled={!valid}>ثبت شماره شبا</button>
        <Link href="/user/account" className={styles.cancelAction}>انصراف</Link>
      </div>
    </form>
  );
}
