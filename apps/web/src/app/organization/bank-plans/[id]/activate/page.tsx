import Link from "next/link";

type SelectionRow = {
  name: string;
  employeeCode: string;
  unit: string;
  charkhooneStatus: string;
  note: string;
  eligibility: "واجد شرایط" | "نیازمند تکمیل" | "غیرقابل انتخاب";
  selected: boolean;
};

const summary = [
  { label: "پرداخت‌کننده", value: "سازمان", note: "پرداخت ماهانه بر عهده سازمان" },
  { label: "سقف تأمین مالی", value: "۳۵۰ میلیون تومان", note: "برای هر فرد واجد شرایط" },
  { label: "پرسنل قابل انتخاب", value: "۲۲۰ نفر", note: "از فهرست فعال سازمان" },
  { label: "تعداد انتخاب‌شده", value: "۶ نفر", note: "برای این فعال‌سازی" },
] as const;

const rows: SelectionRow[] = [
  { name: "علی رضایی", employeeCode: "۱۲۳۴", unit: "فناوری", charkhooneStatus: "فعال", note: "آماده انتخاب", eligibility: "واجد شرایط", selected: true },
  { name: "رضا کریمی", employeeCode: "۱۴۰۲", unit: "عملیات", charkhooneStatus: "فعال", note: "آماده انتخاب", eligibility: "واجد شرایط", selected: true },
  { name: "سارا احمدی", employeeCode: "۱۲۱۰", unit: "منابع انسانی", charkhooneStatus: "دعوت‌شده", note: "تکمیل اطلاعات لازم است", eligibility: "نیازمند تکمیل", selected: false },
  { name: "مریم محمدی", employeeCode: "۱۰۸۸", unit: "مالی", charkhooneStatus: "فعال", note: "آماده انتخاب", eligibility: "واجد شرایط", selected: true },
  { name: "امیر حسینی", employeeCode: "۱۳۰۹", unit: "فروش", charkhooneStatus: "فعال", note: "آماده انتخاب", eligibility: "واجد شرایط", selected: true },
  { name: "نگار موسوی", employeeCode: "۱۱۹۵", unit: "حقوقی", charkhooneStatus: "فعال", note: "آماده انتخاب", eligibility: "واجد شرایط", selected: true },
  { name: "حسین جعفری", employeeCode: "۱۴۴۰", unit: "پشتیبانی", charkhooneStatus: "فعال", note: "آماده انتخاب", eligibility: "واجد شرایط", selected: true },
  { name: "زهرا یوسفی", employeeCode: "۱۳۷۲", unit: "مالی", charkhooneStatus: "فعال", note: "طرح فعال دیگری دارد", eligibility: "غیرقابل انتخاب", selected: false },
];

function eligibilityTone(value: SelectionRow["eligibility"]) {
  return value === "واجد شرایط" ? "active" : "muted";
}
function param(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] ?? "" : value ?? "";
}

export default async function OrganizationPlanActivationPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const q = param(params.q).trim();
  const eligibleOnly = param(params.eligible) === "1";
  const unit = param(params.unit) || "همه";
  const units = ["همه", ...Array.from(new Set(rows.map((row) => row.unit)))];
  const visible = rows.filter((row) => {
    const matchesQuery = !q || `${row.name} ${row.employeeCode}`.includes(q);
    const matchesEligible = !eligibleOnly || row.eligibility === "واجد شرایط";
    const matchesUnit = unit === "همه" || row.unit === unit;
    return matchesQuery && matchesEligible && matchesUnit;
  });

  return (
    <section className="org-plan-activation" data-node-id="480:19">
      <header className="org-plan-flow__header">
        <Link href="/organization/bank-plans/supportive-employees" className="org-action-button org-action-button--surface">بازگشت به جزئیات طرح</Link>
        <div><h1>انتخاب پرسنل و فعال‌سازی طرح</h1><p>طرح حمایتی کارکنان — بانک نمونه</p></div>
      </header>

      <article className="org-plan-card org-plan-activation__summary">
        <div className="org-plan-detail__section-head"><span className="org-plan-status org-plan-status--active">قابل فعال‌سازی</span><div><h2>خلاصه طرح انتخاب‌شده</h2></div></div>
        <div className="org-plan-activation__summary-grid">{summary.map((item) => <div key={item.label}><span>{item.label}</span><strong>{item.value}</strong><small>{item.note}</small></div>)}</div>
      </article>

      <form className="org-plan-activation__controls" method="get">
        <div>
          <label className="org-bank-plans__filter"><input type="checkbox" name="eligible" value="1" defaultChecked={eligibleOnly} /> فقط واجد شرایط</label>
          <select className="org-bank-plans__filter" name="unit" defaultValue={unit} aria-label="فیلتر واحد سازمانی">
            {units.map((item) => <option key={item} value={item}>{item === "همه" ? "همه واحدها" : item}</option>)}
          </select>
          <span className="org-plan-status org-plan-status--available">۶ انتخاب</span>
        </div>
        <label className="org-bank-plans__search"><span className="sr-only">جستجوی پرسنل</span><input name="q" type="search" defaultValue={q} placeholder="جستجو با نام، کد ملی یا کد پرسنلی" /></label>
        <button type="submit" className="org-action-button org-action-button--surface">اعمال</button>
      </form>

      <div className="org-plan-selection-table-wrap">
        <table className="org-plan-selection-table">
          <thead><tr><th>انتخاب</th><th>نام و نام خانوادگی</th><th>کد پرسنلی</th><th>واحد سازمانی</th><th>وضعیت در چارخونه</th><th>توضیح</th><th>وضعیت شرایط طرح</th></tr></thead>
          <tbody>
            {visible.map((row) => {
              const disabled = row.eligibility !== "واجد شرایط";
              return <tr className={disabled ? "org-plan-selection-table__disabled" : ""} key={row.employeeCode}>
                <td><input className="org-plan-selection-checkbox" type="checkbox" defaultChecked={row.selected} disabled={disabled} aria-label={`انتخاب ${row.name}`} /></td>
                <td><strong>{row.name}</strong></td><td>{row.employeeCode}</td><td>{row.unit}</td><td>{row.charkhooneStatus}</td><td>{row.note}</td>
                <td><span className={`org-plan-status org-plan-status--${eligibilityTone(row.eligibility)}`}>{row.eligibility}</span></td>
              </tr>;
            })}
            {visible.length === 0 && <tr><td colSpan={7}>پرسنلی مطابق فیلتر پیدا نشد.</td></tr>}
          </tbody>
        </table>
      </div>

      <article className="org-plan-activation__selection-summary"><div><strong>۶ نفر انتخاب شده‌اند</strong><span>افراد نیازمند تکمیل یا دارای طرح فعال انتخاب نمی‌شوند.</span></div><div><strong>بعد از فعال‌سازی چه می‌شود؟</strong><span>طرح برای افراد انتخاب‌شده فعال می‌شود و تعهدهای پرداخت سازمان طبق شرایط همین طرح ساخته می‌شود.</span></div></article>
      <footer className="org-plan-flow__actions"><Link href="/organization/bank-plans/supportive-employees/activate/review" className="org-action-button org-action-button--primary">ادامه و بررسی فعال‌سازی</Link><Link href="/organization/bank-plans/supportive-employees" className="org-action-button org-action-button--surface">انصراف</Link></footer>
    </section>
  );
}
