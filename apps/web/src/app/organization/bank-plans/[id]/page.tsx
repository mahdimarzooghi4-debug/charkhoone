import Link from "next/link";

const summaryStats = [
  { label: "بانک", value: "بانک نمونه", note: "بانک همکار سازمان" },
  { label: "مدت طرح", value: "۱۲ ماه", note: "هم‌راستا با دوره قرارداد" },
  { label: "سقف تأمین مالی", value: "۳۵۰ میلیون تومان", note: "برای هر فرد واجد شرایط" },
  { label: "پرسنل قابل استفاده", value: "۲۲۰ نفر", note: "براساس فهرست سازمان" },
] as const;

const financialStats = [
  { label: "نرخ سود", value: "۱۷٪", note: "طبق تعریف بانک" },
  { label: "رتبه اعتباری", value: "طبق قواعد طرح", note: "ارزیابی توسط چارخونه" },
  { label: "مبلغ اولیه", value: "۱۵۰ میلیون تومان", note: "سهم موردنیاز پرونده" },
] as const;

const obligationStats = [
  { label: "پرداخت ماهانه", value: "بر عهده سازمان", note: "برای کارکنان مشمول" },
  { label: "مبلغ اولیه", value: "بر عهده مستأجر", note: "در این نمونه طرح" },
  { label: "وضعیت فعلی", value: "هنوز فعال نشده", note: "بدون بدهی سازمان" },
] as const;

const eligibilityStats = [
  { label: "پرسنل قابل انتخاب", value: "۲۲۰ نفر", note: "از فهرست فعلی سازمان" },
  { label: "بدون طرح", value: "۱۲ نفر", note: "اولویت برای تخصیص" },
  { label: "روش انتخاب", value: "گروهی یا تکی", note: "پس از فعال‌سازی" },
] as const;

function StatGrid({ items }: { items: ReadonlyArray<{ label: string; value: string; note: string }> }) {
  return (
    <div className="org-plan-detail__stat-grid">
      {items.map((item) => (
        <div className="org-plan-detail__stat" key={item.label}>
          <span>{item.label}</span>
          <strong>{item.value}</strong>
          <small>{item.note}</small>
        </div>
      ))}
    </div>
  );
}

export default function OrganizationBankPlanDetailPage() {
  return (
    <section className="org-plan-detail" data-node-id="464:18">
      <header className="org-plan-detail__header">
        <Link href="/organization/bank-plans" className="org-action-button org-action-button--surface">بازگشت به طرح‌ها</Link>
        <div>
          <h1>جزئیات طرح بانکی</h1>
          <p>طرح حمایتی کارکنان — بانک نمونه</p>
        </div>
      </header>

      <article className="org-plan-card org-plan-detail__summary">
        <div className="org-plan-detail__section-head">
          <span className="org-plan-status org-plan-status--active">فعال</span>
          <div>
            <h2>خلاصه طرح</h2>
            <p>شرایط طرح توسط بانک تعریف شده و سازمان فقط آن را برای پرسنل خود فعال می‌کند.</p>
          </div>
        </div>
        <StatGrid items={summaryStats} />
      </article>

      <div className="org-plan-detail__two-column">
        <article className="org-plan-card">
          <div className="org-plan-detail__section-head org-plan-detail__section-head--plain">
            <div>
              <h2>شرایط مالی طرح</h2>
              <p>جزئیات مالی از طرح بانک خوانده می‌شود و توسط سازمان قابل ویرایش نیست.</p>
            </div>
          </div>
          <StatGrid items={financialStats} />
          <p className="org-plan-detail__emphasis">تأیید نهایی تأمین مالی همچنان با بانک است.</p>
        </article>

        <article className="org-plan-card">
          <div className="org-plan-detail__section-head org-plan-detail__section-head--plain">
            <div>
              <h2>پرداخت‌کننده طرح</h2>
              <p>بانک مشخص می‌کند پرداخت‌های مرتبط با طرح بر عهده چه کسی باشد.</p>
            </div>
          </div>
          <div className="org-plan-detail__payer-options">
            <div><strong>مستأجر</strong><span>پرداخت‌ها توسط خود مستأجر انجام می‌شود.</span></div>
            <div className="org-plan-detail__payer-options--selected"><strong>سازمان</strong><span>پرداخت‌های تعریف‌شده این طرح بر عهده سازمان است.</span></div>
            <div><strong>مشترک</strong><span>سهم سازمان و مستأجر طبق قاعده بانک تفکیک می‌شود.</span></div>
          </div>
          <p className="org-plan-detail__emphasis">مدل این طرح: پرداخت کامل سازمان</p>
        </article>
      </div>

      <div className="org-plan-detail__two-column">
        <article className="org-plan-card">
          <div className="org-plan-detail__section-head org-plan-detail__section-head--plain">
            <div>
              <h2>تعهد سازمان در این طرح</h2>
              <p>در صورت فعال‌سازی، سررسیدها در بخش پرداخت‌های سازمان ساخته می‌شوند.</p>
            </div>
          </div>
          <StatGrid items={obligationStats} />
        </article>

        <article className="org-plan-card">
          <div className="org-plan-detail__section-head org-plan-detail__section-head--plain">
            <div>
              <h2>پرسنل مشمول</h2>
              <p>پس از فعال‌کردن طرح، سازمان می‌تواند افراد واجد شرایط را انتخاب کند.</p>
            </div>
          </div>
          <StatGrid items={eligibilityStats} />
        </article>
      </div>

      <footer className="org-plan-detail__activation">
        <div className="org-plan-detail__activation-actions">
          <Link href="/organization/bank-plans/supportive-employees/activate" className="org-action-button org-action-button--primary">انتخاب و فعال‌سازی طرح</Link>
          <Link href="/organization/bank-plans" className="org-action-button org-action-button--surface">بازگشت</Link>
        </div>
        <div>
          <h2>فعال‌سازی برای سازمان</h2>
          <p>بعد از فعال‌سازی، تعهدهای سازمان و انتخاب پرسنل براساس همین شرایط ایجاد می‌شود.</p>
        </div>
      </footer>
    </section>
  );
}
