"use client";

import { useMemo, useState } from "react";
import Link from "next/link";

const brokerageAvatar = "/brand/dashboard-avatar.png";

const caseRows = [
  { id: "1405-8321", displayId: "۱۴۰۵-۸۳۲۱", owner: "رضا کاظمی", principal: "۶۵۰٬۰۰۰٬۰۰۰ تومان", model: "ماهانه — سررسید قرارداد", due: "۱۴۰۵/۰۶/۱۸", minYield: "۲۰٪", attributedYield: "۱۸٬۴۰۰٬۰۰۰ تومان", status: "فعال", tone: "success" },
  { id: "1405-7942", displayId: "۱۴۰۵-۷۹۴۲", owner: "مریم احمدی", principal: "۴۸۰٬۰۰۰٬۰۰۰ تومان", model: "ماهانه — سررسید قرارداد", due: "۱۴۰۵/۰۶/۲۲", minYield: "۲۰٪", attributedYield: "۱۳٬۱۰۰٬۰۰۰ تومان", status: "نزدیک سررسید", tone: "warning" },
  { id: "1405-7810", displayId: "۱۴۰۵-۷۸۱۰", owner: "حسین محمدی", principal: "۷۲۰٬۰۰۰٬۰۰۰ تومان", model: "ماهانه — سررسید قرارداد", due: "۱۴۰۵/۰۷/۰۱", minYield: "۲۰٪", attributedYield: "۱۹٬۶۰۰٬۰۰۰ تومان", status: "فعال", tone: "success" },
  { id: "1405-7664", displayId: "۱۴۰۵-۷۶۶۴", owner: "نرگس کریمی", principal: "۳۹۰٬۰۰۰٬۰۰۰ تومان", model: "ماهانه — سررسید قرارداد", due: "۱۴۰۵/۰۷/۰۵", minYield: "۲۰٪", attributedYield: "۱۰٬۸۰۰٬۰۰۰ تومان", status: "فعال", tone: "success" },
  { id: "1405-7519", displayId: "۱۴۰۵-۷۵۱۹", owner: "امیر حسینی", principal: "۵۶۰٬۰۰۰٬۰۰۰ تومان", model: "ماهانه — سررسید قرارداد", due: "۱۴۰۵/۰۷/۱۲", minYield: "۲۰٪", attributedYield: "—", status: "در انتظار منبع", tone: "warning" },
  { id: "1405-6128", displayId: "۱۴۰۵-۶۱۲۸", owner: "نازنین اکبری", principal: "۵۹۰٬۰۰۰٬۰۰۰ تومان", model: "ماهانه — سررسید قرارداد", due: "۱۴۰۵/۰۷/۱۸", minYield: "۲۰٪", attributedYield: "۱۵٬۹۰۰٬۰۰۰ تومان", status: "فعال", tone: "success" },
  { id: "1405-4912", displayId: "۱۴۰۵-۴۹۱۲", owner: "مهدی حسینی", principal: "۷۸۰٬۰۰۰٬۰۰۰ تومان", model: "ماهانه — سررسید قرارداد", due: "۱۴۰۵/۰۷/۲۱", minYield: "۲۰٪", attributedYield: "۲۱٬۳۰۰٬۰۰۰ تومان", status: "نزدیک سررسید", tone: "warning" },
  { id: "1405-3874", displayId: "۱۴۰۵-۳۸۷۴", owner: "لیلا محمدی", principal: "۴۶۰٬۰۰۰٬۰۰۰ تومان", model: "ماهانه — سررسید قرارداد", due: "۱۴۰۵/۰۶/۲۹", minYield: "۲۰٪", attributedYield: "۱۲٬۷۰۰٬۰۰۰ تومان", status: "فعال", tone: "success" },
  { id: "1405-2756", displayId: "۱۴۰۵-۲۷۵۶", owner: "آرش مرادی", principal: "۶۲۰٬۰۰۰٬۰۰۰ تومان", model: "ماهانه — سررسید قرارداد", due: "۱۴۰۵/۰۷/۰۸", minYield: "۲۰٪", attributedYield: "۱۷٬۸۰۰٬۰۰۰ تومان", status: "فعال", tone: "success" },
  { id: "1405-1943", displayId: "۱۴۰۵-۱۹۴۳", owner: "الهام صادقی", principal: "۵۴۰٬۰۰۰٬۰۰۰ تومان", model: "ماهانه — سررسید قرارداد", due: "۱۴۰۵/۰۷/۱۵", minYield: "۲۰٪", attributedYield: "—", status: "در انتظار منبع", tone: "warning" },
] as const;

const kpis = [
  { label: "سررسید ۳۰ روز آینده", badge: "نزدیک سررسید", value: "۳۸ پرونده", note: "نیازمند برنامه‌ریزی نقدینگی", tone: "warning" },
  { label: "اصل منابع تحت مدیریت", badge: "فعال", value: "۱۲۵٬۰۰۰٬۰۰۰٬۰۰۰ تومان", note: "تفکیک‌شده در سطح پرونده", tone: "success" },
  { label: "پرونده‌های مالی فعال", badge: "فعال", value: "۲۴۶ پرونده", note: "منابع فعال تحت مدیریت", tone: "success" },
] as const;

type CaseFilter = "all" | "active" | "due";

function normalize(value: string) {
  return value
    .replace(/[۰-۹]/g, (digit) => String("۰۱۲۳۴۵۶۷۸۹".indexOf(digit)))
    .replace(/[٠-٩]/g, (digit) => String("٠١٢٣٤٥٦٧٨٩".indexOf(digit)))
    .replace(/ي/g, "ی")
    .replace(/ك/g, "ک")
    .toLocaleLowerCase("fa")
    .trim();
}

function csvCell(value: string) {
  const safe = /^[=+@\-\t\r]/.test(value) ? "'" + value : value;
  return '"' + safe.replace(/"/g, '""') + '"';
}

export default function BrokerageCasesPage() {
  const [filter, setFilter] = useState<CaseFilter>("all");
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const pageSize = 4;

  const filtered = useMemo(() => {
    const q = normalize(query);
    return caseRows.filter((item) => {
      const matchesFilter =
        filter === "all" ||
        (filter === "active" && item.status === "فعال") ||
        (filter === "due" && item.status === "نزدیک سررسید");
      const matchesQuery = !q || normalize(`${item.displayId} ${item.owner}`).includes(q);
      return matchesFilter && matchesQuery;
    });
  }, [filter, query]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage = Math.min(page, pageCount);
  const visible = filtered.slice((safePage - 1) * pageSize, safePage * pageSize);

  function chooseFilter(next: CaseFilter) {
    setFilter(next);
    setPage(1);
  }

  function exportCsv() {
    if (!filtered.length) return;
    const header = ["پرونده / مالک", "اصل منابع", "مدل دریافتی مالک", "سررسید مالک", "حداقل بازده", "بازده منتسب", "وضعیت"];
    const rows = filtered.map((item) => [
      `${item.displayId} — ${item.owner}`,
      item.principal,
      item.model,
      item.due,
      item.minYield,
      item.attributedYield,
      item.status,
    ]);
    const csv = "\uFEFF" + [header, ...rows].map((row) => row.map(csvCell).join(",")).join("\r\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8;" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = "brokerage-cases.csv";
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 0);
  }

  return (
    <section className="brokerage-cases" data-node-id="352:2" data-name="Brokerage / Cases">
      <header className="brokerage-cases__header">
        <div className="brokerage-operator">
          <div className="brokerage-operator__copy"><strong>مرکز عملیات</strong><span>تیم چارخونه کارگزاری</span></div>
          <img className="brokerage-operator__avatar" src={brokerageAvatar} alt="مرکز عملیات" width={40} height={40} />
        </div>
        <div className="brokerage-cases__copy"><h1>پرونده‌ها</h1><p>مدیریت منابع و سررسیدهای مالی هر پرونده</p></div>
      </header>

      <div className="brokerage-case-kpis">
        {kpis.map((item) => (
          <article className="brokerage-case-kpi" key={item.label}>
            <div className="brokerage-case-kpi__top"><span className={`brokerage-badge brokerage-badge--${item.tone}`}>{item.badge}</span><span>{item.label}</span></div>
            <strong>{item.value}</strong><small>{item.note}</small>
          </article>
        ))}
      </div>

      <div className="brokerage-case-controls">
        <div className="brokerage-case-filters">
          <button type="button" onClick={exportCsv}>خروجی CSV</button>
          <button type="button" className={filter === "due" ? "brokerage-case-filter--active" : undefined} onClick={() => chooseFilter("due")}>نزدیک سررسید</button>
          <button type="button" className={filter === "active" ? "brokerage-case-filter--active" : undefined} onClick={() => chooseFilter("active")}>فعال</button>
          <button type="button" className={filter === "all" ? "brokerage-case-filter--active" : undefined} onClick={() => chooseFilter("all")}>همه پرونده‌ها</button>
        </div>
        <label className="brokerage-case-search">
          <span className="sr-only">جستجوی پرونده</span>
          <input type="search" placeholder="جستجو با شماره پرونده یا نام مالک" value={query} onChange={(event) => { setQuery(event.target.value); setPage(1); }} />
        </label>
      </div>

      <div className="brokerage-cases-table-wrap">
        <div className="brokerage-cases-table" role="table" aria-label="پرونده‌های کارگزاری">
          <div className="brokerage-cases-table__row brokerage-cases-table__head" role="row">
            <span role="columnheader">اقدام</span><span role="columnheader">وضعیت</span><span role="columnheader">بازده منتسب</span><span role="columnheader">حداقل بازده</span><span role="columnheader">سررسید مالک</span><span role="columnheader">مدل دریافتی مالک</span><span role="columnheader">اصل منابع</span><span role="columnheader">پرونده / مالک</span>
          </div>
          {visible.map((item) => (
            <div className="brokerage-cases-table__row" role="row" key={item.id}>
              <span className="brokerage-cases-table__action" role="cell"><Link href={`/brokerage/cases/${item.id}`}>مشاهده</Link></span>
              <span className="brokerage-cases-table__status" role="cell"><span className={`brokerage-badge brokerage-badge--${item.tone}`}>{item.status}</span></span>
              <span role="cell">{item.attributedYield}</span><span role="cell">{item.minYield}</span><span role="cell">{item.due}</span><span role="cell">{item.model}</span><span role="cell">{item.principal}</span><strong role="cell">{item.displayId} — {item.owner}</strong>
            </div>
          ))}
          {visible.length === 0 && <div className="brokerage-cases-table__row" role="row"><span role="cell" style={{ gridColumn: "1 / -1", justifyContent: "center" }}>پرونده‌ای مطابق جستجو یا فیلتر پیدا نشد.</span></div>}
        </div>
      </div>

      <footer className="brokerage-cases__footer">
        <span>نمایش {visible.length.toLocaleString("fa-IR")} پرونده از {filtered.length.toLocaleString("fa-IR")} رکورد نمونه</span>
        <nav className="brokerage-pagination" aria-label="صفحه‌بندی پرونده‌ها">
          {safePage > 1 && <button type="button" onClick={() => setPage((value) => Math.max(1, value - 1))}>قبلی</button>}
          {Array.from({ length: pageCount }, (_, index) => index + 1).map((number) => (
            <button key={number} type="button" className={safePage === number ? "brokerage-pagination__active" : undefined} onClick={() => setPage(number)}>{number.toLocaleString("fa-IR")}</button>
          ))}
          {safePage < pageCount && <button type="button" onClick={() => setPage((value) => Math.min(pageCount, value + 1))}>بعدی</button>}
        </nav>
      </footer>
    </section>
  );
}
