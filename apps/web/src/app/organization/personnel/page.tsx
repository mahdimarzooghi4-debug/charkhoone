import Link from "next/link";
import { OrganizationCsvButton } from "@/components/organization/OrganizationCsvButton";

type PersonnelStatus = "فعال" | "در حال تکمیل" | "بدون طرح" | "بررسی بانک" | "دعوت‌شده" | "نیازمند بررسی";
type PersonnelRow = {name:string;nationalCode:string;employeeCode:string;unit:string;source:"API"|"دستی";plan:string;status:PersonnelStatus};

const metrics=[
  {label:"نیازمند اقدام سازمان",value:"۱۹ نفر",note:"اطلاعات یا طرح نیاز به بررسی دارد"},
  {label:"بدون طرح بانکی",value:"۱۲ نفر",note:"هنوز طرحی برایشان انتخاب نشده"},
  {label:"فعال در چارخونه",value:"۳۴۲ نفر",note:"دارای فرایند یا پرونده فعال"},
  {label:"کل پرسنل ثبت‌شده",value:"۱٬۲۸۰ نفر",note:"API و ثبت دستی"},
] as const;
const personnel:PersonnelRow[]=[
  {name:"علی رضایی",nationalCode:"***۱۲۳۴",employeeCode:"۱۲۳۴",unit:"فناوری",source:"API",plan:"طرح کارکنان سازمانی",status:"فعال"},
  {name:"مریم احمدی",nationalCode:"***۴۸۱۲",employeeCode:"۱۲۸۱",unit:"مالی",source:"API",plan:"طرح کارکنان سازمانی",status:"در حال تکمیل"},
  {name:"رضا کاظمی",nationalCode:"***۹۰۲۱",employeeCode:"۱۳۰۲",unit:"عملیات",source:"دستی",plan:"—",status:"بدون طرح"},
  {name:"سارا محمدی",nationalCode:"***۳۷۷۰",employeeCode:"۱۳۲۷",unit:"منابع انسانی",source:"API",plan:"طرح مسکن کارکنان",status:"بررسی بانک"},
  {name:"امیر حسینی",nationalCode:"***۷۱۴۳",employeeCode:"۱۳۴۱",unit:"فروش",source:"API",plan:"طرح کارکنان سازمانی",status:"دعوت‌شده"},
  {name:"نگار کریمی",nationalCode:"***۵۵۲۹",employeeCode:"۱۳۶۸",unit:"حقوقی",source:"دستی",plan:"طرح مسکن کارکنان",status:"فعال"},
  {name:"محمد مرادی",nationalCode:"***۸۲۱۰",employeeCode:"۱۳۹۰",unit:"پشتیبانی",source:"API",plan:"—",status:"نیازمند بررسی"},
  {name:"زهرا اکبری",nationalCode:"***۴۴۱۶",employeeCode:"۱۴۰۴",unit:"بازاریابی",source:"API",plan:"طرح کارکنان سازمانی",status:"در حال تکمیل"},
  {name:"حسین عباسی",nationalCode:"***۲۱۹۸",employeeCode:"۱۴۲۲",unit:"تدارکات",source:"دستی",plan:"طرح مسکن کارکنان",status:"فعال"},
  {name:"الهام یوسفی",nationalCode:"***۶۰۳۱",employeeCode:"۱۴۴۰",unit:"فناوری",source:"API",plan:"طرح کارکنان سازمانی",status:"بررسی بانک"},
];
function tone(s:PersonnelStatus){return s==="فعال"||s==="بررسی بانک"||s==="دعوت‌شده"?"success":"warning";}
function param(v:string|string[]|undefined){return Array.isArray(v)?v[0]??"":v??"";}
function hrefFor(q:string,filter:string,page:number){const p=new URLSearchParams();if(q)p.set("q",q);if(filter!=="all")p.set("filter",filter);if(page>1)p.set("page",String(page));const s=p.toString();return s?`/organization/personnel?${s}`:"/organization/personnel";}

export default async function OrganizationPersonnelPage({searchParams}:{searchParams:Promise<Record<string,string|string[]|undefined>>}) {
  const params=await searchParams, q=param(params.q).trim(), filter=param(params.filter)||"all";
  const requestedPage=Math.max(1,Number(param(params.page))||1);
  const filtered=personnel.filter(p=>{
    const mq=!q||`${p.name} ${p.nationalCode} ${p.employeeCode}`.includes(q);
    const mf=filter==="all"||(filter==="active"&&p.status==="فعال")||(filter==="action"&&["در حال تکمیل","نیازمند بررسی"].includes(p.status))||(filter==="noplan"&&p.plan==="—");
    return mq&&mf;
  });
  const pageSize=4,pageCount=Math.max(1,Math.ceil(filtered.length/pageSize)),currentPage=Math.min(requestedPage,pageCount),visible=filtered.slice((currentPage-1)*pageSize,currentPage*pageSize);
  return <section className="org-personnel" data-node-id="443:2">
    <header className="org-personnel__header">
      <div className="org-personnel__actions" aria-label="عملیات پرسنل">
        <OrganizationCsvButton className="org-action-button org-action-button--surface" filename="organization-personnel.csv" rows={[["نام","کد ملی","کد پرسنلی","واحد","روش ثبت","طرح","وضعیت"],...filtered.map(p=>[p.name,p.nationalCode,p.employeeCode,p.unit,p.source,p.plan,p.status])]}>خروجی CSV</OrganizationCsvButton>
        <Link className="org-action-button org-action-button--surface" href="/organization/personnel/import">ورود گروهی</Link>
        <Link className="org-action-button org-action-button--surface" href="/organization/settings/hr-api/sync-success">همگام‌سازی API</Link>
        <Link className="org-action-button org-action-button--primary" href="/organization/personnel/new">افزودن دستی</Link>
      </div>
      <div className="org-personnel__title"><h1>پرسنل</h1><p>ثبت و پیگیری کارکنان سازمان در چارخونه؛ از API منابع انسانی یا ثبت دستی</p></div>
    </header>
    <div className="org-personnel__metrics">{metrics.map(m=><article className="org-personnel-metric" key={m.label}><span>{m.label}</span><strong>{m.value}</strong><small>{m.note}</small></article>)}</div>
    <div className="org-personnel__controls">
      <div className="org-personnel__filters" aria-label="فیلتر پرسنل">
        <Link href={hrefFor(q,"active",1)} className={`org-filter ${filter==="active"?"org-filter--active":""}`}>فعال</Link>
        <Link href={hrefFor(q,"action",1)} className={`org-filter ${filter==="action"?"org-filter--active":""}`}>نیازمند اقدام</Link>
        <Link href={hrefFor(q,"noplan",1)} className={`org-filter ${filter==="noplan"?"org-filter--active":""}`}>بدون طرح</Link>
        <Link href={hrefFor(q,"all",1)} className={`org-filter ${filter==="all"?"org-filter--active":""}`}>همه</Link>
      </div>
      <form className="org-personnel__search" method="get">{filter!=="all"&&<input type="hidden" name="filter" value={filter}/>}<span className="sr-only">جستجوی پرسنل</span><input name="q" type="search" defaultValue={q} placeholder="جستجو با نام، کد ملی یا کد پرسنلی"/></form>
    </div>
    <div className="org-personnel__source-strip"><div><strong>ثبت دستی این ماه: ۲۷ نفر</strong><span>پرسنل دستی و API در یک لیست نمایش داده می‌شوند</span></div><div><strong className="org-personnel__connected">اتصال منابع انسانی: متصل</strong><span>آخرین بروزرسانی امروز ۱۴:۱۰ — ۱٬۲۵۳ پرسنل از API</span></div></div>
    <div className="org-personnel-table-wrap"><table className="org-personnel-table"><thead><tr><th>پرسنل</th><th>کد پرسنلی</th><th>واحد سازمانی</th><th>روش ثبت</th><th>طرح بانکی</th><th>وضعیت</th><th>اقدام</th></tr></thead><tbody>
      {visible.map(p=><tr key={p.employeeCode}><td><div className="org-personnel-table__person"><strong>{p.name}</strong><span>کد ملی {p.nationalCode}</span></div></td><td><strong>{p.employeeCode}</strong></td><td>{p.unit}</td><td>{p.source}</td><td className={p.plan==="—"?"org-personnel-table__muted":"org-personnel-table__plan"}>{p.plan}</td><td><span className={`org-status org-status--${tone(p.status)}`}>{p.status}</span></td><td><Link className="org-personnel-table__view" href={`/organization/personnel/${p.employeeCode}`}>مشاهده</Link></td></tr>)}
      {visible.length===0&&<tr><td colSpan={7}>پرسنلی مطابق فیلتر پیدا نشد.</td></tr>}
    </tbody></table></div>
    <footer className="org-personnel__footer"><div className="org-pagination">{currentPage>1&&<Link href={hrefFor(q,filter,currentPage-1)}>قبلی</Link>}{Array.from({length:pageCount},(_,i)=>i+1).map(n=><Link key={n} className={n===currentPage?"org-pagination__active":undefined} href={hrefFor(q,filter,n)}>{n.toLocaleString("fa-IR")}</Link>)}{currentPage<pageCount&&<Link href={hrefFor(q,filter,currentPage+1)}>بعدی</Link>}</div><span>نمایش {visible.length.toLocaleString("fa-IR")} نفر از {filtered.length.toLocaleString("fa-IR")} رکورد نمونه</span></footer>
  </section>;
}
