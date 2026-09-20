"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import styles from "./page.module.css";

const SAMPLE_CODE = "123456789012";
const asciiDigits = (value: string) => value
  .replace(/[۰-۹]/g, d => String("۰۱۲۳۴۵۶۷۸۹".indexOf(d)))
  .replace(/[٠-٩]/g, d => String("٠١٢٣٤٥٦٧٨٩".indexOf(d)))
  .replace(/[\s-]/g, "");

export function TrackingCodePreviewForm() {
  const [code, setCode] = useState("");
  const [message, setMessage] = useState("");
  const router = useRouter();
  return (
    <form className={styles.previewForm} onSubmit={event => {
      event.preventDefault();
      if (code !== SAMPLE_CODE) {
        setMessage("فقط کد نمونهٔ نمایش‌داده‌شده پشتیبانی می‌شود؛ استعلام واقعی متصل نیست.");
        return;
      }
      router.push("/user/contracts/register/result?scenario=sample");
    }}>
      <label htmlFor="tracking-code-preview">کد رهگیری ۱۲ رقمی (نمونه)</label>
      <input id="tracking-code-preview" className={styles.trackingInput} type="text"
        inputMode="numeric" maxLength={12} autoComplete="off"
        value={code.replace(/[0-9]/g, d => "۰۱۲۳۴۵۶۷۸۹"[Number(d)])}
        onChange={event => {
          const next = asciiDigits(event.target.value);
          if (/^\d{0,12}$/.test(next)) { setCode(next); setMessage(""); }
        }}
        aria-describedby="tracking-code-hint tracking-code-error"
        placeholder="۱۲۳۴۵۶۷۸۹۰۱۲" />
      <p id="tracking-code-hint" className={styles.previewHint}>
        برای مشاهده مسیر نمونه، کد ۱۲۳۴۵۶۷۸۹۰۱۲ را وارد کنید؛ هیچ استعلامی برای خودنویس ارسال نمی‌شود.
      </p>
      {message && <p id="tracking-code-error" role="alert" className={styles.previewError}>{message}</p>}
      <button type="submit" className={styles.primaryAction} disabled={code.length !== 12}>
        مشاهده نتیجه استعلام نمونه
      </button>
    </form>
  );
}
