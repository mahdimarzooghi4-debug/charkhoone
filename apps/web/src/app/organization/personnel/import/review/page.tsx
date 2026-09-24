"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { OrganizationCsvButton } from "@/components/organization/OrganizationCsvButton";

type ReviewStatus = "آماده ثبت" | "تکراری" | "دارای خطا";
type ReviewRow = { name:string; nationalCode:string; mobile:string; employeeCode:string; unit:string; employment:string; note:string; status:ReviewStatus };

const rows: ReviewRow[] = [
  { name:"علی رضایی", nationalCode:"۰۰۱۲۳۴۵۶۷۸", mobile:"۰۹۱۲۱۲۳۴۵۶۷", employeeCode:"۱۲۳۴", unit:"فناوری", employment:"فعال", note:"—", status:"آماده ثبت" },
  { name:"رضا کاظمی", nationalCode:"۰۰۳۴۵۶۷۸۹۰", mobile:"۰۹۱۲۵۵۵۶۶۷۷", employeeCode:"۱۳۰۲", unit:"عملیات", employment:"فعال", note:"این کد ملی قبلاً ثبت شده", status:"تکراری" },
  { name:"سارا محمدی", nationalCode:"۰۰۲۲۳۳۴۴۵۵", mobile:"۰۹۱۵۱۱۱۲۲۳۳", employeeCode:"۱۴۰۵", unit:"منابع انسانی", employment:"فعال", note:"—", status:"آماده ثبت" },
  { name:"حسین عباسی", nationalCode:"۰۰۵۵۶۶۷۷۸۸", mobile:"۰۹۳۳۲۲۲۱۱۱", employeeCode:"—", unit:"فروش", employment:"فعال", note:"کد پرسنلی وارد نشده است", status:"دارای خطا" },
  { name:"نگار کریمی", nationalCode:"۰۰۴۴۵۵۶۶۷۷", mobile:"۰۹۱۲۸۸۸۷۷۶۶", employeeCode:"۱۵۲۰", unit:"فناوری", employment:"فعال", note:"—", status:"آماده ثبت" },
  { name:"محمد مرادی", nationalCode:"۰۰۶۶۷۷۸۸۹۹", mobile:"۰۹۱۲۴۴۴۵۵۶۶", employeeCode:"۱۶۳۱", unit:"مالی", employment:"فعال", note:"—", status:"آماده ثبت" },
  { name:"مریم احمدی", nationalCode:"۱۲۳۴۵", mobile:"۰۹۱۲۳۳۳۴۴۴۴", employeeCode:"۱۲۸۱", unit:"مالی", employment:"فعال", note:"کد ملی باید ۱۰ رقم باشد", status:"دارای خطا" },
  { name:"زهرا اکبری", nationalCode:"۰۰۷۷۸۸۹۹۰۰", mobile:"۰۹۱۲ABC", employeeCode:"۱۷۴۲", unit:"عملیات", employment:"فعال", note:"شماره موبایل معتبر نیست", status:"دارای خطا" },
  { name:"الهام پویشی", nationalCode:"۰۰۸۸۹۹۰۰۱۱", mobile:"۰۹۱۵۷۷۷۸۸۹۹", employeeCode:"۱۸۵۳", unit:"سایر", employment:"فعال", note:"—", status:"آماده ثبت" },
  { name:"امیر حسینی", nationalCode:"۰۰۹۹۰۰۱۱۲۲", mobile:"۰۹۱۲۶۶۶۵۵۴۴", employeeCode:"۱۹۶۴", unit:"خدمات", employment:"غیرفعال", note:"وضعیت همکاری نامعتبر است", status:"دارای خطا" },
];

function tone(status: ReviewStatus) {
  if (status === "دارای خطا") return "danger";
  if (status === "تکراری") return "warning";
  return "success";
}

export default function OrganizationPersonnelImportReviewPage() {
  const [filter, setFilter] = useState<"همه" | ReviewStatus>("همه");
  const [page, setPage] = useState(1);
  const pageSize = 4;
  const filtered = useMemo(() => rows.filter((row) => filter === "همه" || row.status === filter), [filter]);
  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage = Math.min(page, pageCount);
  const visible = filtered.slice((safePage - 1) * pageSize, safePage * pageSize);
  const errors = rows.filter((row) => row.status !== "آماده ثبت");

  function chooseFilter(next: "همه" | ReviewStatus) {
    setFilter(next);
    setPage(1);
  }

  return (
    <section className="org-import-review" data-node-id="554:1031">
      <header className="org-import-review__header">
        <Link href="/organization/personnel/import" className="org-import__back">← بازگشت به بارگذاری فایل</Link>
        <div><h1>بررسی فایل پرسنل</h1><p>اطلاعات فایل را قبل از ثبت نهایی بررسی کنید.</p></div>
      </header>

      <div className="org-import-review__file-summary"><Link href="/organization/personnel/import">تغییر فایل</Link><span>۲۵۰ ردیف</span><strong>personnel-shahrivar.xlsx <small>(۲.۴ مگابایت)</small></strong></div>

      <div className="org-import-review__metrics">
        {[
          { label:"تکراری", value:"۳ نفر", note:"اطلاعات در سامانه موجود است", tone:"warning" },
          { label:"دارای خطا", value:"۹ نفر", note:"نیازمند اصلاح در فایل", tone:"danger" },
          { label:"آماده ثبت", value:"۲۳۸ نفر", note:"بدون اشکال ساختاری", tone:"success" },
          { label:"کل ردیف‌ها", value:"۲۵۰ نفر", note:"کل پرسنل موجود در فایل", tone:"default" },
        ].map(metric => <article className={`org-review-metric org-review-metric--${metric.tone}`} key={metric.label}><span>{metric.label}</span><strong>{metric.value}</strong><small>{metric.note}</small></article>)}
      </div>

      <p className="org-import-review__note">فقط ردیف‌های بدون خطا ثبت می‌شوند. ردیف‌های دارای خطا یا تکراری در این مرحله ثبت نخواهند شد.</p>

      <div className="org-import-review__toolbar">
        <div>
          <Link href="/organization/personnel/import" className="org-form-button org-form-button--primary org-form-button--small">بارگذاری فایل اصلاح‌شده</Link>
          <OrganizationCsvButton
            className="org-form-button org-form-button--secondary org-form-button--small"
            filename="organization-personnel-import-errors.csv"
            rows={[["نام","کد ملی","شماره موبایل","کد پرسنلی","واحد","وضعیت همکاری","خطا","وضعیت"], ...errors.map(row => [row.name,row.nationalCode,row.mobile,row.employeeCode,row.unit,row.employment,row.note,row.status])]}
          >
            دانلود گزارش خطاها
          </OrganizationCsvButton>
        </div>
        <div className="org-import-review__filters">
          {(["تکراری","دارای خطا","آماده ثبت","همه"] as const).map(item => <button key={item} type="button" className={filter === item ? "org-import-review__filter-active" : undefined} onClick={() => chooseFilter(item)}>{item}{item === "تکراری" ? " (۳)" : item === "دارای خطا" ? " (۹)" : item === "آماده ثبت" ? " (۲۳۸)" : ""}</button>)}
        </div>
      </div>

      <div className="org-review-table-wrap">
        <table className="org-review-table">
          <thead><tr><th>نام و نام خانوادگی</th><th>کد ملی</th><th>شماره موبایل</th><th>کد پرسنلی</th><th>واحد سازمانی</th><th>وضعیت همکاری</th><th>توضیح</th><th>وضعیت</th></tr></thead>
          <tbody>
            {visible.map((row,index)=><tr key={`${row.name}-${index}`}><td><strong>{row.name}</strong></td><td>{row.nationalCode}</td><td>{row.mobile}</td><td><strong>{row.employeeCode}</strong></td><td>{row.unit}</td><td>{row.employment}</td><td className={`org-review-table__note org-review-table__note--${tone(row.status)}`}>{row.note}</td><td><span className={`org-status org-status--${tone(row.status)}`}>{row.status}</span></td></tr>)}
          </tbody>
        </table>
      </div>

      <div className="org-import-review__pagination">
        <span>نمایش {visible.length.toLocaleString("fa-IR")} ردیف از {filtered.length.toLocaleString("fa-IR")} ردیف نمونه</span>
        <div className="org-pagination">
          {safePage > 1 && <button type="button" onClick={() => setPage(value => Math.max(1, value - 1))}>قبلی</button>}
          {Array.from({ length: pageCount }, (_, index) => index + 1).map(number => <button key={number} type="button" className={safePage === number ? "org-pagination__active" : undefined} onClick={() => setPage(number)}>{number.toLocaleString("fa-IR")}</button>)}
          {safePage < pageCount && <button type="button" onClick={() => setPage(value => Math.min(pageCount, value + 1))}>بعدی</button>}
        </div>
      </div>

      <footer className="org-import-review__actions">
        <Link href="/organization/personnel" className="org-form-button org-form-button--secondary">انصراف</Link>
        <div><span><strong>۲۳۸ پرسنل آماده ثبت هستند.</strong><small>۹ ردیف دارای خطا و ۳ ردیف تکراری ثبت نمی‌شوند.</small></span><Link href="/organization/personnel/import/success" className="org-form-button org-form-button--primary">ثبت ۲۳۸ پرسنل</Link></div>
      </footer>
    </section>
  );
}
