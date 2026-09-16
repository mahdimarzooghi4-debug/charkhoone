import Link from "next/link";

type PersonnelStatus = "فعال" | "در حال تکمیل" | "بدون طرح" | "بررسی بانک" | "دعوت‌شده" | "نیازمند بررسی";

type PersonnelRow = {
  name: string;
  nationalCode: string;
  employeeCode: string;
  unit: string;
  source: "API" | "دستی";
  plan: string;
  status: PersonnelStatus;
};

const metrics = [
  { label: "نیازمند اقدام سازمان", value: "۱۹ نفر", note: "اطلاعات یا طرح نیاز به بررسی دارد" },
  { label: "بدون طرح بانکی", value: "۱۲ نفر", note: "هنوز طرحی برایشان انتخاب نشده" },
  { label: "فعال در چارخونه", value: "۳۴۲ نفر", note: "دارای فرایند یا پرونده فعال" },
  { label: "کل پرسنل ثبت‌شده", value: "۱٬۲۸۰ نفر", note: "API و ثبت دستی" },
] as const;

const personnel: PersonnelRow[] = [
  { name: "علی رضایی", nationalCode: "***۱۲۳۴", employeeCode: "۱۲۳۴", unit: "فناوری", source: "API", plan: "طرح کارکنان سازمانی", status: "فعال" },
  { name: "مریم احمدی", nationalCode: "***۴۸۱۲", employeeCode: "۱۲۸۱", unit: "مالی", source: "API", plan: "طرح کارکنان سازمانی", status: "در حال تکمیل" },
  { name: "رضا کاظمی", nationalCode: "***۹۰۲۱", employeeCode: "۱۳۰۲", unit: "عملیات", source: "دستی", plan: "—", status: "بدون طرح" },
  { name: "سارا محمدی", nationalCode: "***۳۷۷۰", employeeCode: "۱۳۲۷", unit: "منابع انسانی", source: "API", plan: "طرح مسکن کارکنان", status: "بررسی بانک" },
  { name: "امیر حسینی", nationalCode: "***۷۱۴۳", employeeCode: "۱۳۴۱", unit: "فروش", source: "API", plan: "طرح کارکنان سازمانی", status: "دعوت‌شده" },
  { name: "نگار کریمی", nationalCode: "***۵۵۲۹", employeeCode: "۱۳۶۸", unit: "حقوقی", source: "دستی", plan: "طرح مسکن کارکنان", status: "فعال" },
  { name: "محمد مرادی", nationalCode: "***۸۲۱۰", employeeCode: "۱۳۹۰", unit: "پشتیبانی", source: "API", plan: "—", status: "نیازمند بررسی" },
  { name: "زهرا اکبری", nationalCode: "***۴۴۱۶", employeeCode: "۱۴۰۴", unit: "بازاریابی", source: "API", plan: "طرح کارکنان سازمانی", status: "در حال تکمیل" },
  { name: "حسین عباسی", nationalCode: "***۲۱۹۸", employeeCode: "۱۴۲۲", unit: "تدارکات", source: "دستی", plan: "طرح مسکن کارکنان", status: "فعال" },
  { name: "الهام یوسفی", nationalCode: "***۶۰۳۱", employeeCode: "۱۴۴۰", unit: "فناوری", source: "API", plan: "طرح کارکنان سازمانی", status: "بررسی بانک" },
];

function statusTone(status: PersonnelStatus) {
  return status === "فعال" || status === "بررسی بانک" || status === "دعوت‌شده" ? "success" : "warning";
}

export default function OrganizationPersonnelPage() {
  return (
    <section className="org-personnel" data-node-id="443:2">
      <header className="org-personnel__header">
        <div className="org-personnel__actions" aria-label="عملیات پرسنل">
          <button className="org-action-button org-action-button--surface" type="button">خروجی</button>
          <Link className="org-action-button org-action-button--surface" href="/organization/personnel/import">ورود گروهی</Link>
          <button className="org-action-button org-action-button--surface" type="button">همگام‌سازی API</button>
          <Link className="org-action-button org-action-button--primary" href="/organization/personnel/new">افزودن دستی</Link>
        </div>
        <div className="org-personnel__title">
          <h1>پرسنل</h1>
          <p>ثبت و پیگیری کارکنان سازمان در چارخونه؛ از API منابع انسانی یا ثبت دستی</p>
        </div>
      </header>

      <div className="org-personnel__metrics">
        {metrics.map((metric) => (
          <article className="org-personnel-metric" key={metric.label}>
            <span>{metric.label}</span>
            <strong>{metric.value}</strong>
            <small>{metric.note}</small>
          </article>
        ))}
      </div>

      <div className="org-personnel__controls">
        <div className="org-personnel__filters" aria-label="فیلتر پرسنل">
          <button type="button" className="org-filter">فعال</button>
          <button type="button" className="org-filter">نیازمند اقدام</button>
          <button type="button" className="org-filter">بدون طرح</button>
          <button type="button" className="org-filter org-filter--active">همه</button>
        </div>
        <label className="org-personnel__search">
          <span className="sr-only">جستجوی پرسنل</span>
          <input type="search" placeholder="جستجو با نام، کد ملی یا کد پرسنلی" />
        </label>
      </div>

      <div className="org-personnel__source-strip">
        <div>
          <strong>ثبت دستی این ماه: ۲۷ نفر</strong>
          <span>پرسنل دستی و API در یک لیست نمایش داده می‌شوند</span>
        </div>
        <div>
          <strong className="org-personnel__connected">اتصال منابع انسانی: متصل</strong>
          <span>آخرین بروزرسانی امروز ۱۴:۱۰ — ۱٬۲۵۳ پرسنل از API</span>
        </div>
      </div>

      <div className="org-personnel-table-wrap">
        <table className="org-personnel-table">
          <thead>
            <tr>
              <th>پرسنل</th>
              <th>کد پرسنلی</th>
              <th>واحد سازمانی</th>
              <th>روش ثبت</th>
              <th>طرح بانکی</th>
              <th>وضعیت</th>
              <th>اقدام</th>
            </tr>
          </thead>
          <tbody>
            {personnel.map((person) => (
              <tr key={person.employeeCode}>
                <td>
                  <div className="org-personnel-table__person">
                    <strong>{person.name}</strong>
                    <span>کد ملی {person.nationalCode}</span>
                  </div>
                </td>
                <td><strong>{person.employeeCode}</strong></td>
                <td>{person.unit}</td>
                <td>{person.source}</td>
                <td className={person.plan === "—" ? "org-personnel-table__muted" : "org-personnel-table__plan"}>{person.plan}</td>
                <td>
                  <span className={`org-status org-status--${statusTone(person.status)}`}>{person.status}</span>
                </td>
                <td>
                  <Link className="org-personnel-table__view" href={`/organization/personnel/${person.employeeCode}`}>مشاهده</Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <footer className="org-personnel__footer">
        <div className="org-pagination" aria-label="صفحه‌بندی">
          <button type="button">قبلی</button>
          <button type="button" className="org-pagination__active">۱</button>
          <button type="button">۲</button>
          <button type="button">۳</button>
          <button type="button">…</button>
          <button type="button">۱۲۸</button>
          <button type="button">بعدی</button>
        </div>
        <span>نمایش ۱۰ نفر از ۱٬۲۸۰ پرسنل</span>
      </footer>
    </section>
  );
}
