"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import styles from "./page.module.css";
import { UserPanelSidebar } from "@/components/user/UserPanelSidebar";
import { demoFinance, demoFinanceNote } from "@/lib/demo-financing";

type MembershipPlanId = "once" | "twice" | "twice-high";

type MembershipPlan = {
  id: MembershipPlanId;
  uses: string;
  cap: string;
  price: string;
  recommended?: boolean;
};

const membershipPlans: readonly MembershipPlan[] = [
  { id: "once", uses: "۱ بار استفاده", cap: "تا ۵۰۰٬۰۰۰٬۰۰۰ تومان", price: "۲٬۵۰۰٬۰۰۰ تومان (نمونه)", recommended: true },
  { id: "twice", uses: "۲ بار استفاده", cap: "تا ۵۰۰٬۰۰۰٬۰۰۰ تومان", price: "۴٬۰۰۰٬۰۰۰ تومان (نمونه)" },
  { id: "twice-high", uses: "۲ بار استفاده", cap: "تا ۱٬۰۰۰٬۰۰۰٬۰۰۰ تومان", price: "۶٬۵۰۰٬۰۰۰ تومان (نمونه)" },
] as const;

function PlanCard({ plan, selected, onSelect }: {
  plan: MembershipPlan;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <label className={`${styles.planCard} ${selected ? styles.planSelected : ""}`}>
      <input className={styles.planInput} type="radio" name="membership-plan"
        value={plan.id} checked={selected} onChange={onSelect}
        aria-label={`انتخاب ${plan.uses} با سقف ${plan.cap}`} />
      <div className={styles.planTop}>
        {selected ? <span className={styles.radioActive} aria-hidden="true" /> : <span className={styles.radio} aria-hidden="true" />}
        <div className={styles.planTitle}>{plan.recommended ? <span className={styles.recommended}>مناسب برای این قرارداد</span> : null}<h3>{plan.uses}</h3></div>
      </div>
      <div className={styles.divider} />
      <div className={styles.planMetric}><strong>{plan.cap}</strong><span>سقف تأمین مالی</span></div>
      <div className={styles.planMetric}><strong className={selected ? styles.emphasis : ""}>{plan.price}</strong><span>حق عضویت</span></div>
    </label>
  );
}

export default function MembershipPage() {
  // This is client-side preview selection, not a bank or payment transaction.
  const [selectedPlan, setSelectedPlan] = useState<MembershipPlanId>("once");
  const [financingPlan, setFinancingPlan] = useState<"staff" | "general">("staff");
  useEffect(() => {
    setFinancingPlan(new URLSearchParams(window.location.search).get("financing") === "general" ? "general" : "staff");
  }, []);

  return (
    <main className={styles.page} data-node-id="195:322" data-name="Web App / Tenant Membership">
      <section className={styles.mainContent} data-node-id="195:323">
        <header className={styles.headerBar} data-node-id="195:324">
          <Link href={`/user/contracts/register/plans/approved?plan=${financingPlan}`} className={styles.backButton} aria-label="بازگشت">‹</Link>
          <div className={styles.headerRight}><h1 data-node-id="195:329">انتخاب طرح عضویت</h1><p data-node-id="195:330">سلام، علی رضایی</p></div>
        </header>
        <p className={styles.breadcrumb} data-node-id="195:332">قراردادها / عضویت چارخونه</p>

        <div className={styles.columns} data-node-id="195:333">
          <section className={styles.plansColumn} data-node-id="195:334">
            <div className={styles.intro}><h2 data-node-id="195:336">طرح‌های عضویت در دسترس</h2><p data-node-id="195:337">حق عضویت بر اساس سقف تأمین مالی مورد نیاز و تعداد دفعات استفاده محاسبه شده است.</p></div>
            <div className={styles.planStack} data-node-id="195:338">{membershipPlans.map((plan) => <PlanCard key={plan.id} plan={plan}
              selected={selectedPlan === plan.id} onSelect={() => setSelectedPlan(plan.id)} />)}</div>
            <div className={styles.actions} data-node-id="195:379"><Link href={`/user/contracts/register/plans/membership/result?plan=${selectedPlan}&financing=${financingPlan}`} className={styles.primaryAction} data-node-id="195:380">پرداخت (نمونه)</Link><Link href={`/user/contracts/register/plans/approved?plan=${financingPlan}`} className={styles.secondaryAction} data-node-id="195:382">انصراف و بازگشت</Link></div>
          </section>

          <aside className={styles.contextColumn} data-node-id="195:383">
            <section className={styles.contextCard} data-node-id="195:384">
              <div className={styles.contextTitle}><span className={styles.tenantBadge}>مستأجر</span><h2 data-node-id="195:388">قرارداد سعادت‌آباد</h2></div>
              <div className={styles.divider} />
              <div className={styles.contextMetric}><strong>۵۰۰٬۰۰۰٬۰۰۰ تومان</strong><span>مبلغ رهن</span></div>
              <div className={styles.contextMetric}><strong className={styles.emphasis}>{demoFinance.loanText}</strong><span>تأمین مالی موردنیاز</span></div>
            </section>

            <section className={styles.contextCard} data-node-id="195:397">
              <div className={styles.contextTitle}><span className={styles.activeBadge}>عضویت نمونه فعال</span><h2 data-node-id="195:401">وضعیت عضویت فعلی شما</h2></div>
              <div className={styles.divider} />
              <div className={styles.contextMetric}><strong>۵۰۰٬۰۰۰٬۰۰۰ تومان</strong><span>سقف تأمین مالی</span></div>
              <div className={styles.contextMetric}><strong>۱ بار</strong><span>دفعات باقی‌مانده استفاده</span></div>
              <p className={styles.availableText} data-node-id="204:96">در سناریوی C3 نمونه، سقف این عضویت از وام ۳۵۰ میلیونی بیشتر است.</p>
              <Link href={`/user/contracts/register/plans/contribution?plan=${financingPlan}`} className={styles.outlineAction} data-node-id="195:410">استفاده از عضویت و ادامه</Link>
            </section>

            <section className={styles.warningCard} data-node-id="204:97"><strong data-node-id="204:98">این سقف و قیمت‌ها نمونه‌اند.</strong><p data-node-id="204:99">عضویت، تأمین مالی و نرخ نهایی فقط پس از اتصال سرویس‌های واقعی قابل اعلام‌اند.</p></section>
          </aside>
        </div>
        <p role="note" style={{fontSize:12,lineHeight:2,color:"var(--ch-color-muted)"}}>{demoFinanceNote}</p>
      </section>

      <UserPanelSidebar nodeId="142:2422" />
    </main>
  );
}
