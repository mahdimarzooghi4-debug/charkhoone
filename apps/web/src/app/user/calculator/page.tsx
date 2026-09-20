"use client";

import { useState } from "react";
import Link from "next/link";
import styles from "./page.module.css";
import { UserPanelSidebar } from "@/components/user/UserPanelSidebar";

// Only an interactive illustration of the ratios already shown in Figma at
// 500m deposit (350m–450m illustrative financing and 18.5m / 20.5m comparison).
// Not a lending, credit scoring, repayment-rate or eligibility calculation.
const EXAMPLE_DEPOSIT = 500_000_000;
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
  // Scale the published design *example*, not a bank's unknown financial rule.
  const minFinancing = Math.round(deposit * 0.7);
  const maxFinancing = Math.round(deposit * 0.9);
  const contribution = deposit - maxFinancing;
  const monthly = Math.round((18_500_000 * deposit) / EXAMPLE_DEPOSIT);
  const generalMonthly = Math.round((20_500_000 * deposit) / EXAMPLE_DEPOSIT);
  const saving = generalMonthly - monthly;
  const financingMillion = Math.round(maxFinancing / 1_000_000).toLocaleString("fa-IR");
  const gaugeFill = (maxFinancing / MAX_DEPOSIT) * 100;
  const metrics = [
    ["حداقل قابل تأمین (نمونه)", money(minFinancing), false],
    ["حداکثر قابل تأمین (نمونه)", money(maxFinancing), false],
    ["آورده موردنیاز شما (نمونه)", money(contribution), false],
    ["اجاره ماهانه قرارداد", money(rent), false],
    ["پرداخت ماهانه تأمین مالی (نمونه)", money(monthly), false],
    ["تفاوت با مثال شرایط عمومی", money(saving) + " کمتر", true],
  ] as const;

  return (
    <main className={styles.page} data-node-id="150:588" data-name="Web App / Calculator">
      <section className={styles.mainContent} data-node-id="150:589">
        <header className={styles.header} data-node-id="150:590"><h1 data-node-id="150:592">ماشین‌حساب</h1><p data-node-id="150:593">سلام، علی رضایی</p></header>
        <section className={styles.pageHeader} data-node-id="150:594"><h2 data-node-id="150:595">محاسبه شرایط تأمین مالی مسکن</h2><p data-node-id="150:596">با تغییر مبلغ رهن و اجاره ماهانه، برآورد نمایشی را مشاهده کنید.</p></section>

        <div className={styles.columns} data-node-id="150:597">
          <section className={styles.resultsCard} data-node-id="150:598" aria-live="polite">
            <div className={styles.cardHeader} data-node-id="150:599"><h2 data-node-id="150:600">برآورد شرایط تأمین مالی</h2><p data-node-id="150:601">براساس اعداد نمونه فیگما و مبالغ واردشده</p></div>
            <div className={styles.gaugeArea} data-node-id="150:602">
              <div className={styles.gauge} data-node-id="150:603" role="img" aria-label={"حداکثر تأمین مالی نمونه: " + money(maxFinancing)}>
                <div className={styles.gaugeTrack} />
                <div className={styles.gaugeFill} style={{ clipPath: "inset(0 " + (100 - gaugeFill) + "% 0 0)" }} />
                <div className={styles.gaugeText}><strong data-node-id="150:607">{financingMillion} میلیون</strong><span data-node-id="150:608">تومان</span></div>
              </div>
              <div className={styles.gaugeLimits} data-node-id="150:609"><span>{money(maxFinancing)} (حداکثر نمونه)</span><span>{money(minFinancing)} (حداقل نمونه)</span></div>
            </div>
            <div className={styles.divider} />
            <div className={styles.metricsGrid} data-node-id="150:613">
              {metrics.map(([label, value, highlight]) => <article key={label} className={[styles.metric, highlight ? styles.metricHighlight : ""].join(" ")}><span>{label}</span><strong>{value}</strong></article>)}
            </div>
            <section className={styles.comparison} data-node-id="150:632">
              <h3 data-node-id="150:633">مقایسه نمایشی شرایط</h3>
              <div className={styles.comparisonRows}>
                <div className={styles.generalRow}><strong>{money(generalMonthly)} در ماه</strong><span>مثال شرایط عمومی:</span></div>
                <div className={styles.userRow}><strong>{money(monthly)} در ماه</strong><span>مثال شرایط قابل استفاده شما:</span></div>
              </div>
              <span className={styles.savingBadge} data-node-id="150:641">{money(saving)} کمتر در ماه (نمونه)</span>
            </section>
            <p className={styles.disclaimer} data-node-id="150:643">این ماشین‌حساب صرفاً پیش‌نمایش تعاملی طراحی است. مبالغ با مقیاس‌دهی نسبت‌های مثال فیگما (۷۰٪ تا ۹۰٪ مبلغ رهن و پرداخت ماهانه متناسب با مبلغ رهن) تغییر می‌کنند؛ این نسبت‌ها فرمول بانک، نرخ سود، تعیین صلاحیت یا پیشنهاد مالی واقعی نیستند. اجاره ماهانه فقط به‌عنوان اطلاعات قرارداد نشان داده می‌شود. هیچ درخواست یا پرداختی ثبت نمی‌شود.</p>
          </section>

          <section className={styles.inputsCard} data-node-id="150:644">
            <div className={styles.cardHeader} data-node-id="150:645"><h2 data-node-id="150:646">اطلاعات قرارداد</h2><p data-node-id="150:647">مبالغ تقریبی قرارداد موردنظر را وارد کنید.</p></div>
            <AmountSlider label="مبلغ رهن" amount={deposit} setAmount={setDeposit} minLabel="۰ میلیون تومان" maxLabel="۱ میلیارد تومان" max={MAX_DEPOSIT} step={1_000_000} />
            <AmountSlider label="اجاره ماهانه" amount={rent} setAmount={setRent} minLabel="بدون اجاره" maxLabel="۵۰ میلیون تومان" max={MAX_RENT} step={500_000} />
            <div className={styles.divider} />
            <section className={styles.estimate} data-node-id="150:671"><span data-node-id="150:672">پرداخت ماهانه تقریبی تأمین مالی (نمونه)</span><strong data-node-id="150:673">{money(monthly)}</strong><small data-node-id="150:674">این خروجی صرفاً متناسب با مثال طراحی تغییر می‌کند و مبلغ پیشنهادی بانک نیست.</small></section>
            <Link href="/user/contracts/register/plans" className={styles.planLink}>مشاهده طرح‌های تأمین مالی (نمونه)</Link>
          </section>
        </div>
      </section>
      <UserPanelSidebar nodeId="142:1913" />
    </main>
  );
}
