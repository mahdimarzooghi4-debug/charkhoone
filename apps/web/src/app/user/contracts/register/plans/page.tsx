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
      ["مبلغ تأمین مالی", "۳۵۰٬۰۰۰٬۰۰۰ تومان"],
      ["آورده مستأجر از رهن کامل معادل", "۸۱۶٬۶۶۶٬۶۶۷ تومان"],
      ["پرداختی ماهانه مستأجر (فقط سود وام)", "۶٬۷۰۸٬۳۳۳ تومان"],
      ["نحوه تسویه اصل وام", "طبق قرارداد بانک"],
    ],
    note: "پیش‌نمایش طرح عمومی با سناریوی مشترک C3؛ بدون تأیید واقعی بانک",
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
      ["مبلغ تأمین مالی", "۳۵۰٬۰۰۰٬۰۰۰ تومان"],
      ["آورده مستأجر از رهن کامل معادل", "۸۱۶٬۶۶۶٬۶۶۷ تومان", true],
      ["پرداختی ماهانه مستأجر (فقط سود وام)", "۶٬۷۰۸٬۳۳۳ تومان", true],
      ["نحوه تسویه اصل وام", "طبق قرارداد بانک"],
    ],
    note: "اعداد مالی فعلاً برای هر دو طرح یکسان و صرفاً نمونه رتبه C3 هستند",
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
  // Both presentation variants use the same C3 mock; real bank plan terms are unavailable.
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
          <p data-node-id="150:916">دو چیدمان نمایشی از طرح‌ها با اعداد مشترک نمونه C3 را ببینید؛ هنوز طرح واقعی از بانک دریافت نشده است.</p>
        </section>

        <section className={styles.contractContext} data-node-id="150:917">
          <div><span>تأمین مالی نمونه:</span><strong>۳۵۰٬۰۰۰٬۰۰۰ تومان</strong></div>
          <div><span>رهن کامل معادل:</span><strong>۱٬۱۶۶٬۶۶۶٬۶۶۷ تومان</strong></div>
          <div><span>اجاره ماهانه:</span><strong className={styles.contextRegular}>۲۰٬۰۰۰٬۰۰۰ تومان</strong></div>
          <div><span>رهن نقدی قرارداد:</span><strong className={styles.contextRegular}>۵۰۰٬۰۰۰٬۰۰۰ تومان</strong></div>
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
          <p data-node-id="150:1000">اعداد این مسیر با ماشین‌حساب یکسان‌اند: رتبه نمونه C3 با تأمین مالی ۳۰٪ و نرخ اسمی سالانه نمونه ۲۳٪. انتخاب طرح به‌معنای ثبت درخواست یا تأیید واقعی بانک نیست.</p>
        </div>
      </section>

      <UserPanelSidebar nodeId="142:1808" />
    </main>
  );
}
