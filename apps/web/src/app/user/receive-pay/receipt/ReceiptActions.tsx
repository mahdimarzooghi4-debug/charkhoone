"use client";

import { useState } from "react";
import type { Preview } from "../demo-transactions";
import styles from "./page.module.css";

export function ReceiptActions({ preview }: { preview: Preview }) {
  const [message, setMessage] = useState("");
  const summary = "رسید نمونه چارخونه\n" + preview.kind + " — " + preview.contract +
    "\nمبلغ: " + preview.amount + "\nبابت: " + preview.description +
    "\nتاریخ: " + preview.date + "\nشماره نمونه: " + preview.reference +
    "\nاین تصویر صرفاً نمونه طراحی است و گواه پرداخت/واریز واقعی نیست.";

  function saveImage() {
    const canvas = document.createElement("canvas");
    canvas.width = 960;
    canvas.height = 760;
    const ctx = canvas.getContext("2d");
    if (!ctx) { setMessage("ساخت تصویر در این مرورگر ممکن نشد."); return; }
    ctx.fillStyle = "#fff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "#12453d";
    ctx.textAlign = "right";
    ctx.direction = "rtl";
    ctx.font = 'bold 38px Tahoma, "Segoe UI", sans-serif';
    ctx.fillText("چارخونه — رسید نمونه", 880, 100);
    ctx.font = '26px Tahoma, "Segoe UI", sans-serif';
    const rows = [
      ["نوع", preview.kind], ["قرارداد", preview.contract], ["مبلغ", preview.amount],
      ["بابت", preview.description], ["تاریخ", preview.date], ["شماره نمونه", preview.reference],
    ];
    rows.forEach(([label, value], index) => {
      const y = 185 + index * 70;
      ctx.fillStyle = "#12453d";
      ctx.fillText(label + ": ", 880, y);
      ctx.fillStyle = "#343434";
      ctx.textAlign = "left";
      ctx.fillText(value, 70, y, 580);
      ctx.textAlign = "right";
      ctx.fillStyle = "#e6eeeb";
      ctx.fillRect(60, y + 16, 820, 1);
    });
    ctx.fillStyle = "#9e392f";
    ctx.font = 'bold 21px Tahoma, "Segoe UI", sans-serif';
    ctx.fillText("نمونه طراحی — فاقد اعتبار پرداخت یا دریافت واقعی", 880, 690);
    canvas.toBlob(blob => {
      if (!blob) { setMessage("ذخیره تصویر امکان‌پذیر نبود."); return; }
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "charkhoone-sample-receipt.png";
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 3000);
      setMessage("تصویر PNG نمونه برای ذخیره آماده شد.");
    }, "image/png");
  }

  async function share() {
    try {
      if (navigator.share) {
        await navigator.share({ title: "رسید نمونه چارخونه", text: summary });
        setMessage("متن رسید نمونه به پنجره اشتراک‌گذاری فرستاده شد.");
      } else if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(summary);
        setMessage("متن رسید نمونه کپی شد؛ می‌توانید آن را به اشتراک بگذارید.");
      } else {
        setMessage("اشتراک‌گذاری در این مرورگر در دسترس نیست؛ از چاپ یا ذخیره تصویر استفاده کنید.");
      }
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") return;
      setMessage("اشتراک‌گذاری یا کپی ممکن نشد؛ ذخیره تصویر را امتحان کنید.");
    }
  }

  return (
    <>
      <div className={styles.actions} data-node-id="173:600">
        <button type="button" className={styles.printAction} data-node-id="173:601" onClick={() => window.print()}>چاپ رسید</button>
        <button type="button" className={styles.primaryAction} data-node-id="173:603" onClick={saveImage}>ذخیره تصویر رسید</button>
        <button type="button" className={styles.primaryAction} data-node-id="173:606" onClick={share}>اشتراک‌گذاری رسید</button>
      </div>
      <p className={styles.receiptNotice} role="status" aria-live="polite">{message}</p>
    </>
  );
}
