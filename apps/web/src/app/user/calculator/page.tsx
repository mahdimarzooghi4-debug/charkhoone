"use client";

import { useState } from "react";
import Link from "next/link";
import styles from "./page.module.css";
import { UserPanelSidebar } from "@/components/user/UserPanelSidebar";

// Product model confirmed by the user: finance 30–55% of full refundable deposit.
// Monthly tenant payment is interest ONLY, based on a bank-provided nominal annual
// rate. No assumed bank rate, interest compounding or principal amortization.
const EXAMPLE_DEPOSIT = 500_000_000;
const MIN_FINANCING_PERCENT = 30;
const MAX_FINANCING_PERCENT = 55;
const MAX_DEPOSIT = 1_000_000_000;
const MAX_RENT = 50_000_000;
const money = (value: number) => Math.round(value).toLocaleString("fa-IR") + " تومان";
const clamp = (value: number, max: number) => Math.min(max, Math.max(0, Number.isFinite(value) ? value : 0));

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
            type="number"
            inputMode="numeric"
            min={0}
            max={max}
            step={step}
            value={amount}
            aria-label={label + " به تومان"}
            onChange={(event) => setAmount(clamp(Number(event.target.value), max))}
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
      <div className={styles.sliderLabels}><span>{minLabel}</span><span>{maxLabel}</span></div>
    </div>
  );
}

export default function CalculatorPage() {
  const [deposit, setDeposit] = useState(EXAMPLE_DEPOSIT);
  const [rent, setRent] = useState(20_000_000);
  const [financingPercent, setFinancingPercent] = useState(MAX_FINANCING_PERCENT);
  const [bankRateInput, setBankRateInput] = useState("");
  const bankAnnualRate = bankRateInput.trim() === "" ? null : Number(bankRateInput);
  const rateValid = bankAnnualRate !== null && Number.isFinite(bankAnnualRate) && bankAnnualRate >= 0 && bankAnnualRate <= 100;
  const minFinancing = Math.round(deposit * MIN_FINANCING_PERCENT / 100);
  const maxFinancing = Math.round(deposit * MAX_FINANCING_PERCENT / 100);
  const selectedFinancing = Math.round(deposit * financingPercent / 100);
  const contribution = deposit - selectedFinancing;
  // Annual nominal simple interest divided into 12 monthly payments. The
  // bank must confirm its quote and calculation convention; do not add principal.
  const monthlyInterest = rateValid && bankAnnualRate !== null ? Math.round(selectedFinancing * bankAnnualRate / 100 / 12) : null;
  const rentDifference = monthlyInterest === null ? null : rent - monthlyInterest;
  const belowRent = rentDifference !== null && rentDifference > 0;
  const financingMillion = Math.round(selectedFinancing / 1_000_000).toLocaleString("fa-IR");
  const gaugeFill = financingPercent;
  const metrics = [
    ["حداقل تأمین مالی (۳۰٪ رهن)", money(minFinancing), false],
    ["حداکثر تأمین مالی (۵۵٪ رهن)", money(maxFinancing), false],
    ["مبلغ تأمین مالی انتخابی", money(selectedFinancing), false],
    ["آورده مستأجر (مانده رهن)", money(contribution), false],
    ["اجاره ماهانه قرارداد", money(rent), false],
    ["سود ماهانه وام (بدون اصل)", monthlyInterest === null ? "نیازمند نرخ اعلامی بانک" : money(monthlyInterest), true],
  ] as const;

  return (
    <main className={styles.page} data-node-id="150:588" data-name="Web App / Calculator">
      <section className={styles.mainContent} data-node-id="150:589">
        <header className={styles.header} data-node-id="150:590"><h1 data-node-id="150:592">ماشین‌حساب</h1><p data-node-id="150:593">سلام، علی رضایی</p></header>
        <section className={styles.pageHeader} data-node-id="150:594"><h2 data-node-id="150:595">محاسبه شرایط تأمین مالی مسکن</h2><p data-node-id="150:596">با تغییر مبلغ رهن و اجاره ماهانه، برآورد نمایشی را مشاهده کنید.</p></section>

        <div className={styles.columns} data-node-id="150:597">
          <section className={styles.resultsCard} data-node-id="150:598" aria-live="polite">
            <div className={styles.cardHeader} data-node-id="150:599"><h2 data-node-id="150:600">برآورد شرایط تأمین مالی</h2><p data-node-id="150:601">۳۰٪ تا ۵۵٪ مبلغ رهن کامل؛ با انتخاب درصد تأمین مالی</p></div>
            <div className={styles.gaugeArea} data-node-id="150:602">
              <div className={styles.gauge} data-node-id="150:603" role="img" aria-label={"مبلغ تأمین مالی انتخابی: " + money(selectedFinancing)}>
                <div className={styles.gaugeTrack} />
                <div className={styles.gaugeFill} style={{ clipPath: "inset(0 " + (100 - gaugeFill) + "% 0 0)" }} />
                <div className={styles.gaugeText}><strong data-node-id="150:607">{financingMillion} میلیون</strong><span data-node-id="150:608">تومان</span></div>
              </div>
              <div className={styles.gaugeLimits} data-node-id="150:609"><span>{money(maxFinancing)} (۵۵٪ رهن)</span><span>{money(minFinancing)} (۳۰٪ رهن)</span></div>
            </div>
            <div className={styles.divider} />
            <div className={styles.metricsGrid} data-node-id="150:613">
              {metrics.map(([label, value, highlight]) => <article key={label} className={[styles.metric, highlight ? styles.metricHighlight : ""].join(" ")}><span>{label}</span><strong>{value}</strong></article>)}
            </div>
            <section className={styles.comparison} data-node-id="150:632">
              <h3 data-node-id="150:633">مقایسه سود وام با اجاره ماهانه</h3>
              <div className={styles.comparisonRows}>
                <div className={styles.generalRow}><strong>{money(rent)}</strong><span>اجاره ماهانه قرارداد:</span></div>
                <div className={styles.userRow}><strong>{monthlyInterest === null ? "نرخ بانک وارد نشده" : money(monthlyInterest)}</strong><span>فقط سود ماهانه وام:</span></div>
              </div>
              <p className={styles.comparisonNotice} role="status" data-node-id="150:641">
                {rentDifference === null
                  ? "نرخ سود سالانه اسمی اعلامی بانک را وارد کنید تا امکان مقایسه فراهم شود."
                  : belowRent
                    ? "در این برآورد، سود ماهانه " + money(rentDifference) + " کمتر از اجاره است."
                    : "با این ورودی‌ها، سود ماهانه از اجاره کمتر نیست؛ شرایط را با بانک بررسی کنید."}
              </p>
            </section>
            <p className={styles.disclaimer} data-node-id="150:643">تأمین مالی ۳۰ تا ۵۵ درصد رهن طبق مدل اعلام‌شده این محصول نمایش داده می‌شود. سود ماهانه تنها با نرخ سالانه اسمی واردشده توسط شما و فرض تقسیم سود سالانه ساده بر ۱۲ محاسبه می‌شود؛ اصل وام جزو قسط ماهانه این برآورد نیست و نحوه بازپرداخت اصل، نرخ قطعی و شرایط تأمین مالی باید از قرارداد و بانک مشخص شوند. کمتر بودن سود از اجاره به مبلغ و نرخ وابسته است و تضمین نمی‌شود. این صفحه پیش‌نمایش است و هیچ درخواست یا پرداختی ثبت نمی‌کند.</p>
          </section>

          <section className={styles.inputsCard} data-node-id="150:644">
            <div className={styles.cardHeader} data-node-id="150:645"><h2 data-node-id="150:646">اطلاعات قرارداد</h2><p data-node-id="150:647">مبالغ تقریبی قرارداد موردنظر را وارد کنید.</p></div>
            <AmountSlider label="مبلغ رهن" amount={deposit} setAmount={setDeposit} minLabel="۰ میلیون تومان" maxLabel="۱ میلیارد تومان" max={MAX_DEPOSIT} step={1_000_000} />
            <AmountSlider label="اجاره ماهانه" amount={rent} setAmount={setRent} minLabel="بدون اجاره" maxLabel="۵۰ میلیون تومان" max={MAX_RENT} step={500_000} />
            <div className={styles.financingChoice}>
              <label htmlFor="financing-percent">درصد تأمین مالی از رهن کامل: <strong>{financingPercent.toLocaleString("fa-IR")}٪</strong></label>
              <input
                id="financing-percent"
                type="range"
                className={styles.rangeInput}
                min={MIN_FINANCING_PERCENT}
                max={MAX_FINANCING_PERCENT}
                step={1}
                value={financingPercent}
                onChange={(event) => setFinancingPercent(Number(event.target.value))}
                aria-label="درصد تأمین مالی از رهن کامل"
              />
              <div className={styles.sliderLabels}><span>۳۰٪ رهن کامل</span><span>۵۵٪ رهن کامل</span></div>
            </div>
            <label className={styles.bankRateField} htmlFor="bank-annual-rate">
              <span>نرخ سود سالانه اسمی اعلام‌شده بانک (درصد)</span>
              <input
                id="bank-annual-rate"
                type="number"
                className={styles.numberInput}
                inputMode="decimal"
                min={0}
                max={100}
                step="0.1"
                value={bankRateInput}
                onChange={(event) => setBankRateInput(event.target.value)}
                placeholder="نرخ را وارد کنید"
                aria-describedby="rate-guidance"
              />
              <small id="rate-guidance">نرخ پیش‌فرض نداریم؛ این عدد باید مطابق اعلام بانک وارد شود. فقط سود ماهانه محاسبه می‌شود، نه اصل وام.</small>
              {bankRateInput.trim() !== "" && !rateValid && <small className={styles.inputError} role="alert">نرخ باید عددی بین صفر تا صد درصد باشد.</small>}
            </label>
            <div className={styles.divider} />
            <section className={styles.estimate} data-node-id="150:671"><span data-node-id="150:672">پرداخت ماهانه مستأجر: فقط سود وام</span><strong data-node-id="150:673">{monthlyInterest === null ? "نرخ سود بانک را وارد کنید" : money(monthlyInterest)}</strong><small data-node-id="150:674">اصل وام در این پرداخت ماهانه محاسبه نشده است؛ نرخ و نحوه محاسبه باید توسط بانک تأیید شود.</small></section>
            <Link href="/user/contracts/register/plans" className={styles.planLink}>مشاهده طرح‌های تأمین مالی (نمونه)</Link>
          </section>
        </div>
      </section>
      <UserPanelSidebar nodeId="142:1913" />
    </main>
  );
}
