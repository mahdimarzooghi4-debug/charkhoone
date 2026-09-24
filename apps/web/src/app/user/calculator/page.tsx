"use client";

import { useState } from "react";
import Link from "next/link";
import styles from "./page.module.css";
import { UserPanelSidebar } from "@/components/user/UserPanelSidebar";
import { calculateFinancing } from "../../../../../../packages/finance/calculator";

// Preview only: use the backend's contractual 3% rent-to-full-deposit
// equivalence BEFORE applying the external credit sub-grade percentage.
// A real tenant's grade and bank decision must come from trusted services.
// C3 is a conspicuously labeled MOCK response only (C1/C2 = 40%; C3 = 30%).
const EXAMPLE_DEPOSIT = 500_000_000;
const EXAMPLE_RENT = 20_000_000;
const MIN_FINANCING_PERCENT = 30;
const MAX_FINANCING_PERCENT = 55;
const MAX_DEPOSIT = 1_000_000_000;
const MAX_RENT = 50_000_000;
const SAMPLE_BANK_ANNUAL_RATE = "23";
const DEMO_EXTERNAL_SUBGRADE = "C3";
const FINANCING_BY_SUBGRADE: Readonly<Record<string, number>> = {
  A1: 55, A2: 55, A3: 55,
  B1: 45, B2: 45, B3: 45,
  C1: 40, C2: 40, C3: 30,
  D1: 35, D2: 35, D3: 35,
  E1: 30, E2: 30, E3: 30,
};
const SAMPLE_FINANCING_PERCENT = FINANCING_BY_SUBGRADE[DEMO_EXTERNAL_SUBGRADE];
const money = (value: number) => Math.round(value).toLocaleString("fa-IR") + " تومان";
const formatMoneyInput = (value: number) => Math.round(value).toLocaleString("fa-IR");
const digitsFa = (value: string) => value.replace(/[0-9]/g, (digit) => "۰۱۲۳۴۵۶۷۸۹"[Number(digit)]);
const normalizeDigits = (value: string) => value
  .replace(/[۰-۹]/g, (digit) => String("۰۱۲۳۴۵۶۷۸۹".indexOf(digit)))
  .replace(/[٠-٩]/g, (digit) => String("٠١٢٣٤٥٦٧٨٩".indexOf(digit)))
  .replace(/[٫]/g, ".")
  .replace(/[٬,،\s]/g, "");
const clamp = (value: number, max: number) => Math.min(max, Math.max(0, Number.isFinite(value) ? value : 0));
const parseMoneyInput = (text: string, max: number): number | null => {
  const normalized = normalizeDigits(text);
  if (normalized === "") return 0;
  if (!/^\d+$/.test(normalized)) return null;
  return clamp(Number(normalized), max);
};

function AmountSlider({
  label, amount, setAmount, max, step, minLabel, maxLabel,
}: {
  label: string; amount: number; setAmount: (value: number) => void;
  max: number; step: number; minLabel: string; maxLabel: string;
}) {
  return (
    <div className={styles.sliderWidget}>
      <div className={styles.sliderHeader}>
        <label className={styles.sliderNumber}>
          <input
            className={styles.numberInput}
            type="text"
            inputMode="numeric"
            value={formatMoneyInput(amount)}
            aria-label={label + " به تومان"}
            onChange={(event) => {
              const input = event.currentTarget;
              const digitsBeforeCaret = (input.value.slice(0, input.selectionStart ?? 0).match(/[0-9۰-۹٠-٩]/g) ?? []).length;
              const parsed = parseMoneyInput(input.value, max);
              if (parsed === null) return;
              setAmount(parsed);
              // Preserve the digit position when grouping separators are inserted.
              requestAnimationFrame(() => {
                if (!input.isConnected || document.activeElement !== input) return;
                const formatted = input.value;
                let digitCount = 0;
                let cursor = 0;
                while (cursor < formatted.length && digitCount < digitsBeforeCaret) {
                  if (/[0-9۰-۹٠-٩]/.test(formatted[cursor])) digitCount += 1;
                  cursor += 1;
                }
                input.setSelectionRange(cursor, cursor);
              });
            }}
          />
          <span>تومان</span>
        </label>
        <strong>{label}</strong>
      </div>
      <input
        type="range"
        className={styles.rangeInput}
        aria-label={"تنظیم " + label}
        min={0}
        max={max}
        step={step}
        value={amount}
        onChange={(event) => setAmount(Number(event.target.value))}
        style={{ background: "linear-gradient(to left, var(--ch-color-primary) " + (amount / max) * 100 + "%, var(--ch-color-border) " + (amount / max) * 100 + "%)" }}
      />
      <div className={styles.sliderLabels}><span>{maxLabel}</span><span>{minLabel}</span></div>
    </div>
  );
}

export default function CalculatorPage() {
  const [deposit, setDeposit] = useState(EXAMPLE_DEPOSIT);
  const [rent, setRent] = useState(EXAMPLE_RENT);
  const financingPercent = SAMPLE_FINANCING_PERCENT;
  const [bankRateInput, setBankRateInput] = useState(SAMPLE_BANK_ANNUAL_RATE);
  const bankAnnualRate = bankRateInput.trim() === "" ? null : Number(bankRateInput);
  const rateValid = bankAnnualRate !== null && Number.isFinite(bankAnnualRate) && bankAnnualRate >= 0 && bankAnnualRate <= 100;
  // Convert monthly rent to the equivalent full deposit before applying grade.
  // E.g. 500m cash + 20m rent / 0.03 = 1,166,666,667 toman equivalent.
  // For accounting the backend uses whole rials and floors only at boundaries.
  const { rentEquivalentDeposit, fullDeposit: fullDepositEquivalent, financing: selectedFinancing, contribution, monthlyInterest } = calculateFinancing({ cashDeposit: deposit, monthlyRent: rent, financingPercent, bankAnnualRate: rateValid ? bankAnnualRate : null });
  const minFinancing = calculateFinancing({ cashDeposit: deposit, monthlyRent: rent, financingPercent: MIN_FINANCING_PERCENT }).financing;
  const maxFinancing = calculateFinancing({ cashDeposit: deposit, monthlyRent: rent, financingPercent: MAX_FINANCING_PERCENT }).financing;
  const rentDifference = monthlyInterest === null ? null : rent - monthlyInterest;
  const belowRent = rentDifference !== null && rentDifference > 0;
  const financingMillion = Math.round(selectedFinancing / 1_000_000).toLocaleString("fa-IR");
  const gaugeFill = financingPercent;
  const calculationDetails = [
    ["رهن نقدی قرارداد", money(deposit)],
    ["اجاره ماهانه قرارداد", money(rent)],
    ["معادل رهنِ اجاره ماهانه (نسبت ۳٪)", money(rentEquivalentDeposit)],
    ["رهن کامل معادل قرارداد", money(fullDepositEquivalent)],
    ["حداقل تأمین مالی (۳۰٪ رهن معادل)", money(minFinancing)],
    ["حداکثر تأمین مالی (۵۵٪ رهن معادل)", money(maxFinancing)],
    ["مبلغ تأمین مالی براساس رتبه نمونه " + DEMO_EXTERNAL_SUBGRADE, money(selectedFinancing)],
    ["آورده مستأجر از رهن کامل معادل (نمونه)", money(contribution)],
  ] as const;

  return (
    <main className={styles.page} data-node-id="150:588" data-name="Web App / Calculator">
      <section className={styles.mainContent} data-node-id="150:589">
        <header className={styles.header} data-node-id="150:590"><h1 data-node-id="150:592">ماشین‌حساب</h1><p data-node-id="150:593">سلام، علی رضایی</p></header>
        <section className={styles.pageHeader} data-node-id="150:594"><h2 data-node-id="150:595">محاسبه شرایط تأمین مالی مسکن</h2><p data-node-id="150:596">با تغییر مبلغ رهن و اجاره ماهانه، برآورد نمایشی را مشاهده کنید.</p></section>

        <div className={styles.columns} data-node-id="150:597">
          <section className={styles.resultsCard} data-node-id="150:598" aria-live="polite">
            <div className={styles.cardHeader} data-node-id="150:599"><h2 data-node-id="150:600">برآورد شرایط تأمین مالی</h2><p data-node-id="150:601">ابتدا اجاره با نسبت ۳٪ به رهن تبدیل و با رهن نقدی جمع می‌شود؛ سپس نسبت رتبه اعتباری اعمال می‌شود.</p></div>
            <div className={styles.gaugeArea} data-node-id="150:602">
              <div className={styles.gauge} data-node-id="150:603" role="img" aria-label={"مبلغ تأمین مالی انتخابی: " + money(selectedFinancing)}>
                <div className={styles.gaugeTrack} />
                <div className={styles.gaugeFill} style={{ clipPath: "inset(0 " + (100 - gaugeFill) + "% 0 0)" }} />
                <div className={styles.gaugeText}><strong data-node-id="150:607">{financingMillion} میلیون</strong><span data-node-id="150:608">تومان تأمین مالی (نمونه)</span></div>
              </div>
              <div className={styles.gaugeLimits} data-node-id="150:609"><span>{money(maxFinancing)} (۵۵٪ رهن معادل)</span><span>{money(minFinancing)} (۳۰٪ رهن معادل)</span></div>
            </div>
            <div className={styles.contributionSummary} aria-label="آورده مستأجر از رهن کامل معادل">
              <span>آورده مستأجر از رهن کامل معادل (نمونه)</span>
              <strong>{money(contribution)}</strong>
              <small>در مدل فعلی چارخونه، این مانده رهن کامل معادل سهمی است که مستأجر تأمین می‌کند.</small>
            </div>
            <div className={styles.divider} />
            <section className={styles.comparison} data-node-id="150:632">
              <h3 data-node-id="150:633">مقایسه پرداختی ماهانه مستأجر با اجاره</h3>
              <div className={styles.comparisonRows}>
                <div className={styles.generalRow}><strong>{money(rent)}</strong><span>اجاره ماهانه قرارداد:</span></div>
                <div className={styles.userRow}><strong>{monthlyInterest === null ? "نرخ بانک وارد نشده" : money(monthlyInterest)}</strong><span>پرداختی ماهانه مستأجر:</span></div>
              </div>
              <p className={styles.comparisonNotice} role="status" data-node-id="150:641">
                {rentDifference === null
                  ? "نرخ سود سالانه اسمی اعلامی بانک را وارد کنید تا امکان مقایسه فراهم شود."
                  : belowRent
                    ? "در این برآورد، پرداختی ماهانه مستأجر " + money(rentDifference) + " کمتر از اجاره است."
                    : "با این ورودی‌ها، پرداختی ماهانه مستأجر از اجاره کمتر نیست؛ شرایط را با بانک بررسی کنید."}
              </p>
            </section>
            <details className={styles.calculationDetails} data-node-id="150:613">
              <summary>جزئیات محاسبه وام و تبدیل اجاره به رهن</summary>
              <dl className={styles.calculationRows}>
                {calculationDetails.map(([label, value]) => (
                  <div className={styles.calculationRow} key={label}>
                    <dt>{label}</dt>
                    <dd>{value}</dd>
                  </div>
                ))}
              </dl>
              <p className={styles.calculationExplanation}>
                رهن کامل معادل = رهن نقدی + (اجاره ماهانه ÷ ۰٫۰۳). درصد تأمین مالی براساس رتبه اعتباری روی کل رهن معادل اعمال می‌شود. در مدل فعلی، مانده رهن کامل معادل پس از کسر وام، آورده مستأجر است.
              </p>
            </details>
            <p className={styles.disclaimer} data-node-id="150:643">C3 و نرخ ۲۳٪ صرفاً نمونه‌اند؛ رتبه واقعی و نرخ قطعی از سامانه بیرونی و بانک دریافت می‌شوند. سود ماهانه بدون اصل وام محاسبه شده است؛ شرایط بازپرداخت اصل باید در قرارداد بانک تعیین شود. هیچ درخواست یا پرداختی ثبت نمی‌شود.</p>
          </section>

          <section className={styles.inputsCard} data-node-id="150:644">
            <div className={styles.cardHeader} data-node-id="150:645"><h2 data-node-id="150:646">اطلاعات قرارداد</h2><p data-node-id="150:647">مبالغ تقریبی قرارداد موردنظر را وارد کنید.</p></div>
            <AmountSlider label="مبلغ رهن" amount={deposit} setAmount={setDeposit} minLabel="۰ میلیون تومان" maxLabel="۱ میلیارد تومان" max={MAX_DEPOSIT} step={1_000_000} />
            <AmountSlider label="اجاره ماهانه" amount={rent} setAmount={setRent} minLabel="بدون اجاره" maxLabel="۵۰ میلیون تومان" max={MAX_RENT} step={500_000} />
            <div className={styles.financingChoice} aria-label="نتیجه نمونه اعتبارسنجی">
              <strong>سناریوی نمونه اعتبارسنجی: رتبه {DEMO_EXTERNAL_SUBGRADE}</strong>
              <p>درصد تأمین مالی این نمونه: {digitsFa(String(financingPercent))}٪ رهن کامل معادل قرارداد</p>
              <small>رتبه واقعی مستأجر فقط از سامانه بیرونی استعلام می‌شود. این رتبه C3 نتیجه استعلام واقعی نیست و قابل انتخاب توسط کاربر نیست.</small>
              <small>جزئیات نسبت‌ها و تبدیل اجاره به رهن را در «جزئیات محاسبه وام» ببینید.</small>
            </div>
            <label className={styles.bankRateField} htmlFor="bank-annual-rate">
              <span>نرخ سود سالانه اسمی بانک (نمونه: ۲۳٪)</span>
              <input
                id="bank-annual-rate"
                type="text"
                className={styles.numberInput}
                inputMode="decimal"
                value={digitsFa(bankRateInput)}
                onChange={(event) => {
                  const normalized = normalizeDigits(event.target.value);
                  if (/^\d{0,3}(\.\d{0,2})?$/.test(normalized)) setBankRateInput(normalized);
                }}
                placeholder="۲۳"
                aria-describedby="rate-guidance"
              />
              <small id="rate-guidance">۲۳٪ صرفاً نرخ نمونه برای پیش‌نمایش است؛ نرخ واقعی باید از بانک دریافت و تأیید شود. پرداخت ماهانه فقط سود است، نه اصل وام.</small>
              {bankRateInput.trim() !== "" && !rateValid && <small className={styles.inputError} role="alert">نرخ باید عددی بین صفر تا صد درصد باشد.</small>}
            </label>
            <div className={styles.divider} />
            <section className={styles.estimate} data-node-id="150:671"><span data-node-id="150:672">پرداختی ماهانه مستأجر</span><strong data-node-id="150:673">{monthlyInterest === null ? "نرخ سود بانک را وارد کنید" : money(monthlyInterest)}</strong><small data-node-id="150:674">اصل وام در این پرداخت ماهانه محاسبه نشده است؛ نرخ و نحوه محاسبه باید توسط بانک تأیید شود.</small></section>
            <Link href="/user/contracts/register/plans" className={styles.planLink}>مشاهده طرح‌های تأمین مالی (نمونه)</Link>
          </section>
        </div>
      </section>
      <UserPanelSidebar nodeId="142:1913" />
    </main>
  );
}
