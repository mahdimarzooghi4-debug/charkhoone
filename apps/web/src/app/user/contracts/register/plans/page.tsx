"use client";

import { useState } from "react";
import Link from "next/link";
import styles from "./page.module.css";
import { UserPanelSidebar } from "@/components/user/UserPanelSidebar";

type PlanId = "general" | "staff";

type Plan = {
  id: PlanId;
  title: string;
  bank: string;
  badges: readonly { label: string; tone: "eligible" | "public" | "special" }[];
  rows: readonly (readonly [string, string, boolean?])[];
  note: string;
};

const plans: readonly Plan[] = [
  {
    id: "general",
    title: "طرح عمومی",
    bank: "بانک نمونه",
    badges: [
      { label: "واجد شرایط", tone: "eligible" },
      { label: "عمومی", tone: "public" },
    ],
    rows: [
      ["مبلغ تأمین مالی", "۴۰۰٬۰۰۰٬۰۰۰ تومان"],
      ["آورده موردنیاز", "۱۰۰٬۰۰۰٬۰۰۰ تومان"],
      ["پرداخت ماهانه تأمین مالی", "۲۰٬۵۰۰٬۰۰۰ تومان"],
      ["مدت بازپرداخت", "۱۲ ماه"],
    ],
    note: "برای کاربران واجد شرایط عمومی",
  },
  {
    id: "staff",
    title: "طرح ویژه کارکنان",
    bank: "بانک نمونه",
    badges: [
      { label: "واجد شرایط", tone: "eligible" },
      { label: "ویژه", tone: "special" },
    ],
    rows: [
      ["مبلغ تأمین مالی", "۴۵۰٬۰۰۰٬۰۰۰ تومان"],
      ["آورده موردنیاز", "۵۰٬۰۰۰٬۰۰۰ تومان", true],
      ["پرداخت ماهانه تأمین مالی", "۱۸٬۵۰۰٬۰۰۰ تومان", true],
      ["مدت بازپرداخت", "۱۲ ماه"],
    ],
    note: "شرایط بهتر نسبت به طرح عمومی",
  },
] as const;

function PlanCard({ plan, selected, onSelect }: { plan: Plan; selected: boolean; onSelect: () => void }) {
  return (
    <label className={`${styles.planCard} ${selected ? styles.planCardSelected : ""}`}>
      <input className={styles.planRadio} type="radio" name="financing-plan" value={plan.id}
        checked={selected} onChange={onSelect} aria-label={`انتخاب ${plan.title}`} />
      <div className={styles.cardHeader}>
        {selected ? (
          <span className={styles.selectedMark} aria-hidden="true">✓</span>
        ) : (
          <span className={styles.selectionSpacer} aria-hidden="true" />
        )}
        <div className={styles.titleGroup}>
          <div className={styles.badges}>
            {plan.badges.map((badge) => (
              <span key={badge.label} className={`${styles.badge} ${styles[badge.tone]}`}>
                {badge.label}
              </span>
            ))}
          </div>
          <div className={styles.planTitle}>
            <h3>{plan.title}</h3>
            <p>{plan.bank}</p>
          </div>
        </div>
      </div>

      <div className={styles.divider} />
      <div className={styles.metrics}>
        {plan.rows.map(([label, value, emphasized], index) => (
          <div key={label} className={`${styles.metricRow} ${index === plan.rows.length - 1 ? styles.lastMetric : ""}`}>
            <strong className={emphasized ? styles.emphasized : ""}>{value}</strong>
            <span>{label}</span>
          </div>
        ))}
      </div>
      <div className={styles.divider} />

      <p className={selected ? styles.specialNote : styles.generalNote}>{plan.note}</p>
    </label>
  );
}

export default function EligibleFinancingPlansPage() {
  // Client-only illustrative plan choice; no bank request is submitted.
  const [selectedPlan, setSelectedPlan] = useState<PlanId>("staff");

  return (
    <main className={styles.page} data-node-id="150:904" data-name="Web App / Eligible Financing Plans">
      <section className={styles.mainContent} data-node-id="150:905">
        <header className={styles.headerBar} data-node-id="150:906">
          <Link href="/user/contracts/register/result" className={styles.backButton} aria-label="بازگشت به اطلاعات قرارداد">‹</Link>
          <div className={styles.headerRight} data-node-id="150:910">
            <h1 data-node-id="150:911">انتخاب طرح</h1>
            <p data-node-id="150:912">سلام، علی رضایی</p>
          </div>
        </header>

        <section className={styles.pageHeader} data-node-id="150:913">
          <p data-node-id="150:914">قراردادها / انتخاب طرح تأمین مالی</p>
          <h2 data-node-id="150:915">طرح‌های قابل استفاده برای شما</h2>
          <p data-node-id="150:916">براساس شرایط شما و این قرارداد، طرح‌های زیر قابل انتخاب هستند.</p>
        </section>

        <section className={styles.contractContext} data-node-id="150:917">
          <div><span>مبلغ موردنیاز:</span><strong>۴۵۰٬۰۰۰٬۰۰۰ تومان</strong></div>
          <div><span>اجاره ماهانه:</span><strong className={styles.contextRegular}>۲۰٬۰۰۰٬۰۰۰ تومان</strong></div>
          <div><span>مبلغ رهن:</span><strong className={styles.contextRegular}>۵۰۰٬۰۰۰٬۰۰۰ تومان</strong></div>
          <div><span>قرارداد:</span><strong>سعادت‌آباد</strong></div>
        </section>

        <section className={styles.planRow} data-node-id="150:930">
          {plans.map((plan) => <PlanCard key={plan.id} plan={plan}
            selected={selectedPlan === plan.id} onSelect={() => setSelectedPlan(plan.id)} />)}
        </section>

        <section className={styles.actions} data-node-id="150:995">
          <Link href={`/user/contracts/register/plans/confirmation?plan=${selectedPlan}`} className={styles.primaryAction} data-node-id="150:996">انتخاب طرح و ادامه</Link>
          <Link href="/user/contracts/register/result" className={styles.secondaryAction} data-node-id="150:998">بازگشت به اطلاعات قرارداد</Link>
          <Link href="/user/calculator" className={styles.secondaryAction}>ماشین‌حساب (پیش‌نمایش)</Link>
        </section>

        <div className={styles.informationNote} data-node-id="150:999">
          <span className={styles.noticeIcon} aria-hidden="true">ⓘ</span>
          <p data-node-id="150:1000">مبالغ و طرح‌ها نمونهٔ طراحی‌اند؛ انتخاب طرح به‌معنای ثبت درخواست یا تأیید واقعی بانک نیست.</p>
        </div>
      </section>

      <UserPanelSidebar nodeId="142:1808" />
    </main>
  );
}
