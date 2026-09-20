"use client";
import { useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import styles from "./PreviewAction.module.css";

/** Give an honest demo response instead of an inert button or a fake save. */
export function PreviewAction({ label, title, message, className, children }: {
  label: string; title: string; message: string; className?: string; children?: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const trigger = useRef<HTMLButtonElement>(null);
  const close = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (!open) return;
    close.current?.focus();
    const escape = (event: KeyboardEvent) => { if (event.key === "Escape") setOpen(false); };
    document.addEventListener("keydown", escape);
    return () => document.removeEventListener("keydown", escape);
  }, [open]);
  function dismiss() { setOpen(false); requestAnimationFrame(() => trigger.current?.focus()); }
  return <>
    <button ref={trigger} type="button" className={className} aria-label={label}
      onClick={() => setOpen(true)}>{children ?? label}</button>
    {open && <div className={styles.backdrop} onMouseDown={event => {
      if (event.target === event.currentTarget) dismiss();
    }}>
      <section role="dialog" aria-modal="true" aria-labelledby="preview-action-title"
        aria-describedby="preview-action-message" className={styles.dialog} dir="rtl">
        <span className={styles.badge}>پیش‌نمایش پنل کاربر</span>
        <h2 id="preview-action-title">{title}</h2>
        <p id="preview-action-message">{message}</p>
        <p className={styles.note}>هیچ اطلاعاتی ارسال یا ذخیره نشده و هیچ عملیات بانکی انجام نشده است.</p>
        <button ref={close} type="button" className={styles.close} onClick={dismiss}>متوجه شدم</button>
      </section>
    </div>}
  </>;
}
