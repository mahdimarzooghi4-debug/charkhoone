"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import { OrganizationCsvButton } from "@/components/organization/OrganizationCsvButton";

const requiredColumns = ["نام و نام خانوادگی", "کد ملی", "شماره موبایل", "کد پرسنلی", "واحد سازمانی", "وضعیت همکاری"];
const rules = [
  "کد ملی باید ۱۰ رقم باشد.",
  "شماره موبایل باید با ۰۹ شروع شود.",
  "کد پرسنلی برای هر پرسنل سازمان الزامی است.",
  "وضعیت همکاری فقط فعال یا غیرفعال باشد.",
  "اگر کد ملی قبلاً برای همین سازمان ثبت شده باشد، رکورد به‌عنوان تکراری مشخص می‌شود.",
  "در این مرحله طرح بانکی برای پرسنل انتخاب نمی‌شود.",
];

export default function OrganizationPersonnelImportPage() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [fileName, setFileName] = useState("personnel-shahrivar.xlsx");
  const [fileSize, setFileSize] = useState("۲.۴ مگابایت");

  function chooseFile() {
    inputRef.current?.click();
  }

  function onFile(file: File | undefined) {
    if (!file) return;
    setFileName(file.name);
    setFileSize(`${(file.size / 1024 / 1024).toLocaleString("fa-IR", { maximumFractionDigits: 1 })} مگابایت`);
  }

  function removeFile() {
    setFileName("");
    setFileSize("");
    if (inputRef.current) inputRef.current.value = "";
  }

  return (
    <section className="org-import" data-node-id="554:887">
      <header className="org-import__header">
        <Link href="/organization/personnel" className="org-import__back">بازگشت به پرسنل ←</Link>
        <h1>ورود گروهی پرسنل</h1>
        <p>فایل اطلاعات پرسنل را بارگذاری کنید تا قبل از ثبت بررسی شود.</p>
      </header>

      <div className="org-import__columns">
        <article className="org-import-card org-import-card--upload">
          <div className="org-import-card__heading"><h2>بارگذاری فایل پرسنل</h2><p>فایل Excel یا CSV شامل اطلاعات پرسنل سازمان را انتخاب کنید.</p></div>

          <label className="org-upload-zone">
            <span className="org-upload-zone__icon" aria-hidden="true">⇧</span>
            <strong>فایل را اینجا بکشید یا انتخاب کنید</strong>
            <span>فرمت‌های مجاز: XLSX، XLS، CSV — حداکثر ۱۰ مگابایت</span>
            <input ref={inputRef} type="file" accept=".xlsx,.xls,.csv" onChange={(event) => onFile(event.target.files?.[0])} />
            <span className="org-form-button org-form-button--secondary">انتخاب فایل</span>
          </label>

          {fileName ? (
            <div className="org-selected-file">
              <div className="org-selected-file__actions">
                <button type="button" onClick={removeFile}>حذف فایل</button>
                <button type="button" onClick={chooseFile}>تغییر فایل</button>
              </div>
              <div className="org-selected-file__meta">
                <span className="org-status org-status--success">آماده بررسی</span>
                <div><strong>{fileName}</strong><small>{fileSize}</small></div>
                <span className="org-selected-file__icon" aria-hidden="true">▤</span>
              </div>
            </div>
          ) : (
            <p className="org-form-help">فایلی انتخاب نشده است.</p>
          )}
        </article>

        <aside className="org-import__aside">
          <article className="org-import-card">
            <div className="org-import-card__heading"><h2>قالب فایل</h2><p>برای جلوگیری از خطا، اطلاعات را مطابق قالب استاندارد چارخونه وارد کنید.</p></div>
            <OrganizationCsvButton
              className="org-form-button org-form-button--secondary org-form-button--block"
              filename="charkhoone-personnel-template.csv"
              rows={[
                requiredColumns,
                ["علی رضایی", "۰۰۱۲۳۴۵۶۷۸", "۰۹۱۲۱۲۳۴۵۶۷", "۱۲۳۴", "فناوری", "فعال"],
              ]}
            >
              دانلود فایل نمونه CSV
            </OrganizationCsvButton>
            <p className="org-import-card__warning">نام ستون‌ها را در فایل نمونه تغییر ندهید.</p>
            <div className="org-chip-list">{requiredColumns.map((column) => <span key={column}>{column}</span>)}</div>
            <p className="org-form-help">هر ردیف باید مربوط به یک پرسنل باشد.</p>
          </article>

          <article className="org-import-card"><h2>نکات ورود اطلاعات</h2><ul className="org-import-rules">{rules.map((rule) => <li key={rule}>{rule}</li>)}</ul></article>
        </aside>
      </div>

      <footer className="org-import__actions">
        <Link href="/organization/personnel" className="org-form-button org-form-button--secondary">انصراف</Link>
        <Link href="/organization/personnel/import/review" className="org-form-button org-form-button--primary">بررسی فایل</Link>
      </footer>
    </section>
  );
}
