"use client";

import { useState } from "react";
import Link from "next/link";
import styles from "./page.module.css";
import { UserPanelSidebar } from "@/components/user/UserPanelSidebar";

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

  return (
    <main className={styles.page} data-node-id="195:322" data-name="Web App / Tenant Membership">
      <section className={styles.mainContent} data-node-id="195:323">
        <header className={styles.headerBar} data-node-id="195:324">
          <Link href="/user/contracts/register/plans/approved" className={styles.backButton} aria-label="بازگشت">‹</Link>
          <div className={styles.headerRight}><h1 data-node-id="195:329">انتخاب طرح عضویت</h1><p data-node-id="195:330">سلام، علی رضایی</p></div>
        </header>
        <p className={styles.breadcrumb} data-node-id="195:332">قراردادها / عضویت چارخونه</p>

        <div className={styles.columns} data-node-id="195:333">
          <section className={styles.plansColumn} data-node-id="195:334">
            <div className={styles.intro}><h2 data-node-id="195:336">طرح‌های عضویت در دسترس</h2><p data-node-id="195:337">حق عضویت بر اساس سقف تأمین مالی مورد نیاز و تعداد دفعات استفاده محاسبه شده است.</p></div>
            <div className={styles.planStack} data-node-id="195:338">{membershipPlans.map((plan) => <PlanCard key={plan.id} plan={plan}
              selected={selectedPlan === plan.id} onSelect={() => setSelectedPlan(plan.id)} />)}</div>
            <div className={styles.actions} data-node-id="195:379"><Link href={`/user/contracts/register/plans/membership/result?plan=${selectedPlan}`} className={styles.primaryAction} data-node-id="195:380">پرداخت (نمونه)</Link><Link href="/user/contracts/register/plans/approved" className={styles.secondaryAction} data-node-id="195:382">انصراف و بازگشت</Link></div>
          </section>

          <aside className={styles.contextColumn} data-node-id="195:383">
            <section className={styles.contextCard} data-node-id="195:384">
              <div className={styles.contextTitle}><span className={styles.tenantBadge}>مستأجر</span><h2 data-node-id="195:388">قرارداد سعادت‌آباد</h2></div>
              <div className={styles.divider} />
              <div className={styles.contextMetric}><strong>۱٬۱۶۶٬۶۶۶٬۶۶۷ تومان</strong><span>رهن کامل معادل</span></div>
              <div className={styles.contextMetric}><strong className={styles.emphasis}>۳۵۰٬۰۰۰٬۰۰۰ تومان</strong><span>تأمین مالی نمونه C3</span></div>
            </section>

            <section className={styles.contextCard} data-node-id="195:397">
              <div className={styles.contextTitle}><span className={styles.activeBadge}>عضویت فعال</span><h2 data-node-id="195:401">وضعیت عضویت فعلی شما</h2></div>
              <div className={styles.divider} />
              <div className={styles.contextMetric}><strong>۵۰۰٬۰۰۰٬۰۰۰ تومان</strong><span>سقف تأمین مالی</span></div>
              <div className={styles.contextMetric}><strong>۱ بار</strong><span>دفعات باقی‌مانده استفاده</span></div>
              <p className={styles.availableText} data-node-id="204:96">عضویت فعلی شما برای این قرارداد قابل استفاده است.</p>
              <Link href="/user/contracts/register/plans/contribution" className={styles.outlineAction} data-node-id="195:410">استفاده از عضویت و ادامه</Link>
            </section>

            
          </aside>
        </div>
      </section>

      <UserPanelSidebar nodeId="142:2422" />
    </main>
  );
}
