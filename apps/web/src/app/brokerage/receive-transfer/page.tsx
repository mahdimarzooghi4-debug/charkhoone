"use client";

import { useState } from "react";
import Link from "next/link";

const metrics = [
  { label: "منابع دریافتی امروز", value: "۶٬۸۵۰٬۰۰۰٬۰۰۰ تومان", note: "۱۲ تراکنش ثبت‌شده" },
  { label: "در انتظار تطبیق", value: "۳ تراکنش", note: "نیازمند بررسی شناسه پرونده" },
  { label: "سود آماده انتقال", value: "۲٬۴۶۰٬۰۰۰٬۰۰۰ تومان", note: "تسویه دوره شهریور" },
  { label: "انتقال‌های ناموفق", value: "۱ تراکنش", note: "نیازمند پیگیری عملیاتی" },
] as const;

type TransactionTone = "success" | "warning" | "danger";

type Transaction = {
  id: string;
  flow: string;
  caseRef: string;
  route: string;
  amount: string;
  date: string;
  status: string;
  tone: TransactionTone;
  slug: string;
};

const transactions: Transaction[] = [
  {
    id: "TRX-۸۴۲۷۱",
    flow: "وجه مستأجر",
    caseRef: "۱۴۰۵-۸۳۲۱",
    route: "چارخونه ← کارگزاری",
    amount: "۱۵۰٬۰۰۰٬۰۰۰ تومان",
    date: "۱۴۰۵/۰۶/۰۸",
    status: "ثبت‌شده",
    tone: "success",
    slug: "TRX-A4271",
  },
  {
    id: "TRX-۸۴۲۶۴",
    flow: "اصل تأمین مالی",
    caseRef: "۱۴۰۵-۸۳۲۱",
    route: "بانک نمونه ← کارگزاری",
    amount: "۵۰۰٬۰۰۰٬۰۰۰ تومان",
    date: "۱۴۰۵/۰۶/۰۸",
    status: "ثبت‌شده",
    tone: "success",
    slug: "TRX-A4264",
  },
  {
    id: "TRX-۸۴۲۳۸",
    flow: "سود تجمیعی",
    caseRef: "دوره شهریور",
    route: "کارگزاری ← چارخونه",
    amount: "۲٬۴۶۰٬۰۰۰٬۰۰۰ تومان",
    date: "۱۴۰۵/۰۶/۰۸",
    status: "آماده انتقال",
    tone: "warning",
    slug: "TRX-A4238",
  },
  {
    id: "TRX-۸۴۱۹۶",
    flow: "وجه مستأجر",
    caseRef: "—",
    route: "چارخونه ← کارگزاری",
    amount: "۲۲۰٬۰۰۰٬۰۰۰ تومان",
    date: "۱۴۰۵/۰۶/۰۷",
    status: "نیازمند تطبیق",
    tone: "warning",
    slug: "TRX-A4196",
  },
  {
    id: "TRX-۸۴۱۶۳",
    flow: "اصل منبع صندوق",
    caseRef: "۱۴۰۵-۸۱۹۴",
    route: "صندوق نمونه ← کارگزاری",
    amount: "۷۵۰٬۰۰۰٬۰۰۰ تومان",
    date: "۱۴۰۵/۰۶/۰۷",
    status: "ثبت‌شده",
    tone: "success",
    slug: "TRX-A4163",
  },
  {
    id: "TRX-۸۴۰۸۸",
    flow: "سهم چارخونه از درآمد",
    caseRef: "تسویه همکاری",
    route: "کارگزاری ← چارخونه",
    amount: "۳۵٬۵۰۰٬۰۰۰ تومان",
    date: "۱۴۰۵/۰۶/۰۶",
    status: "ناموفق",
    tone: "danger",
    slug: "TRX-A4088",
  },
  {
    id: "TRX-۸۴۰۵۱",
    flow: "وجه مستأجر",
    caseRef: "۱۴۰۵-۸۰۷۷",
    route: "چارخونه ← کارگزاری",
    amount: "۱۸۰٬۰۰۰٬۰۰۰ تومان",
    date: "۱۴۰۵/۰۶/۰۶",
    status: "ثبت‌شده",
    tone: "success",
    slug: "TRX-A4051",
  },
  {
    id: "TRX-۸۳۹۷۴",
    flow: "اصل تأمین مالی",
    caseRef: "۱۴۰۵-۷۹۶۳",
    route: "بانک نمونه ← کارگزاری",
    amount: "۶۲۰٬۰۰۰٬۰۰۰ تومان",
    date: "۱۴۰۵/۰۶/۰۵",
    status: "ثبت‌شده",
    tone: "success",
    slug: "TRX-A3974",
  },
];

type TransferFilter = "all" | "received" | "transferred" | "review";

const transferFilters: { value: TransferFilter; label: string }[] = [
  { value: "review", label: "نیازمند بررسی" },
  { value: "transferred", label: "انتقالی" },
  { value: "received", label: "دریافتی" },
  { value: "all", label: "همه" },
];

function normalizeSearch(value: string) {
  const digits = "۰۱۲۳۴۵۶۷۸۹٠١٢٣٤٥٦٧٨٩";
  return value
    .toLocaleLowerCase("fa")
    .replace(/[۰-۹٠-٩]/g, (digit) => String(digits.indexOf(digit) % 10))
    .replace(/ي/g, "ی")
    .replace(/ك/g, "ک")
    .replace(/\s+/g, " ")
    .trim();
}

function matchesTransferFilter(transaction: Transaction, filter: TransferFilter) {
  switch (filter) {
    case "received":
      return transaction.route.endsWith("→ کارگزاری");
    case "transferred":
      return transaction.route.startsWith("کارگزاری →");
    case "review":
      return transaction.status === "نیازمند تطبیق" || transaction.tone === "danger";
    default:
      return true;
  }
}

function quoteCsvCell(value: string) {
  // Escape CSV and prevent a spreadsheet from treating user-facing text as a formula.
  const safe = /^[=+@\-\t\r]/.test(value) ? "'" + value : value;
  return '"' + safe.replace(/"/g, '""') + '"';
}

export default function BrokerageReceiveTransferPage() {
  const [filter, setFilter] = useState<TransferFilter>("all");
  const [query, setQuery] = useState("");
  const [exportOpen, setExportOpen] = useState(false);
  const normalizedQuery = normalizeSearch(query);
  const visibleTransactions = transactions.filter((transaction) => {
    if (!matchesTransferFilter(transaction, filter)) return false;
    if (!normalizedQuery) return true;
    return normalizeSearch([
      transaction.id,
      transaction.slug,
      transaction.flow,
      transaction.caseRef,
      transaction.route,
      transaction.amount,
      transaction.date,
      transaction.status,
    ].join(" ")).includes(normalizedQuery);
  });

  function exportCsv() {
    if (visibleTransactions.length === 0) return;
    const header = ["شناسه تراکنش", "نوع جریان", "پرونده", "مبدأ / مقصد", "مبلغ", "تاریخ", "وضعیت"];
    const rows = visibleTransactions.map((transaction) => [
      transaction.id, transaction.flow, transaction.caseRef, transaction.route,
      transaction.amount, transaction.date, transaction.status,
    ]);
    const csv = "\uFEFF" + [header, ...rows]
      .map((row) => row.map(quoteCsvCell).join(","))
      .join("\r\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8;" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = "brokerage-transactions.csv";
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 0);
    setExportOpen(false);
  }

  return (
    <section className="brokerage-transfer" data-node-id="392:2" data-name="Brokerage / Receive & Transfer">
      <header className="brokerage-transfer__header">
        <h1>دریافت و انتقال</h1>
        <p>کنترل ورود منابع، انتقال سود و تطبیق گردش‌های مالی همگام‌شده با سیستم کارگزاری</p>
      </header>

      <div className="brokerage-transfer__metrics">
        {metrics.map((metric) => (
          <article className="brokerage-transfer__metric" key={metric.label}>
            <span>{metric.label}</span>
            <strong>{metric.value}</strong>
            <small>{metric.note}</small>
          </article>
        ))}
      </div>

      <div className="brokerage-transfer__controls">
        <div className="brokerage-transfer__filters" role="group" aria-label="فیلتر تراکنش‌ها">
          <div
            className="brokerage-transfer__export"
            onKeyDown={(event) => { if (event.key === "Escape") setExportOpen(false); }}
          >
            <button
              type="button"
              aria-expanded={exportOpen}
              aria-controls="brokerage-transfer-export-menu"
              aria-haspopup="true"
              onClick={() => setExportOpen((open) => !open)}
            >
              خروجی ▾
            </button>
            {exportOpen && (
              <div className="brokerage-transfer__export-menu" id="brokerage-transfer-export-menu">
                <button type="button" onClick={exportCsv} disabled={visibleTransactions.length === 0}>
                  دانلود CSV نتایج فعلی
                </button>
              </div>
            )}
          </div>
          {transferFilters.map((item) => (
            <button
              type="button"
              key={item.value}
              className={filter === item.value ? "brokerage-transfer__filter--active" : undefined}
              aria-pressed={filter === item.value}
              onClick={() => { setFilter(item.value); setExportOpen(false); }}
            >
              {item.label}
            </button>
          ))}
        </div>
        <label className="brokerage-transfer__search">
          <span className="sr-only">جستجو در تراکنش‌ها</span>
          <input
            type="search"
            placeholder="جستجو با شناسه تراکنش یا پرونده"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
        </label>
      </div>

      <div className="brokerage-transfer__table-wrap">
        <div className="brokerage-transfer-table" role="table" aria-label="گردش‌های مالی">
          <div className="brokerage-transfer-table__row brokerage-transfer-table__head" role="row">
            <span role="columnheader">شناسه تراکنش</span>
            <span role="columnheader">نوع جریان</span>
            <span role="columnheader">پرونده</span>
            <span role="columnheader">مبدأ / مقصد</span>
            <span role="columnheader">مبلغ</span>
            <span role="columnheader">تاریخ</span>
            <span role="columnheader">وضعیت</span>
            <span role="columnheader">اقدام</span>
          </div>
          {visibleTransactions.map((transaction) => (
            <div className="brokerage-transfer-table__row" role="row" key={transaction.id}>
              <strong role="cell" dir="ltr">{transaction.id}</strong>
              <span role="cell">{transaction.flow}</span>
              <span role="cell">{transaction.caseRef}</span>
              <span className="brokerage-transfer-table__route" role="cell">{transaction.route}</span>
              <span role="cell">{transaction.amount}</span>
              <span role="cell">{transaction.date}</span>
              <span role="cell">
                <span className={`brokerage-transfer__status brokerage-transfer__status--${transaction.tone}`}>
                  {transaction.status}
                </span>
              </span>
              <span className="brokerage-transfer-table__action" role="cell">
                <Link href={`/brokerage/receive-transfer/${transaction.slug}`}>مشاهده</Link>
              </span>
            </div>
          ))}
          {visibleTransactions.length === 0 && (
            <div className="brokerage-transfer-table__row brokerage-transfer-table__empty" role="row">
              <span role="cell">تراکنشی مطابق فیلتر یا جستجوی شما پیدا نشد.</span>
            </div>
          )}
        </div>
      </div>

      <div className="brokerage-transfer__bottom">
        <article className="brokerage-transfer__summary-card">
          <h2>تسویه‌های دوره‌ای با چارخونه</h2>
          <p>انتقال سود منابع و سهم قراردادی کارگزاری، جدا از اصل منابع پرونده‌ها.</p>
          <div className="brokerage-transfer__summary-grid">
            <div><span>سود آماده انتقال</span><strong>۲٬۴۶۰٬۰۰۰٬۰۰۰ تومان</strong></div>
            <div><span>سهم درآمد کارگزاری</span><strong>۳۵٬۵۰۰٬۰۰۰ تومان</strong></div>
            <div><span>وضعیت دوره</span><strong className="brokerage-transfer__warning-text">آماده تسویه</strong></div>
          </div>
        </article>

        <article className="brokerage-transfer__summary-card">
          <h2>همگام‌سازی سیستم کارگزاری</h2>
          <p>گردش‌ها از پنل داخلی کارگزاری دریافت می‌شوند و ورود دستی مبلغ غیرفعال است.</p>
          <div className="brokerage-transfer__summary-grid">
            <div><span>وضعیت اتصال</span><strong className="brokerage-transfer__success-text">متصل</strong></div>
            <div><span>آخرین همگام‌سازی</span><strong>۱۴۰۵/۰۶/۰۸ — ۱۴:۱۰</strong></div>
            <div><span>خطای تطبیق</span><strong className="brokerage-transfer__warning-text">۳ رکورد</strong></div>
          </div>
        </article>
      </div>
    </section>
  );
}
