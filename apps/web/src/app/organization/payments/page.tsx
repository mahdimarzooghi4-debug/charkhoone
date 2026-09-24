import Link from "next/link";
import { OrganizationCsvButton } from "@/components/organization/OrganizationCsvButton";

type PaymentTone = "success" | "warning" | "muted";
type PaymentRow = { id:string; personnel:string; plan:string; type:string; amount:string; status:string; tone:PaymentTone; dueAt:string; action:"پرداخت"|"مشاهده" };

const metrics = [
  { label: "سررسید این ماه", value: "۱۸ پرداخت", note: "۲۴۸٬۰۰۰٬۰۰۰ تومان" },
  { label: "نیازمند پرداخت", value: "۶ پرداخت", note: "۸۴٬۰۰۰٬۰۰۰ تومان" },
  { label: "پرداخت‌شده این ماه", value: "۱۲ پرداخت", note: "۱۶۴٬۰۰۰٬۰۰۰ تومان" },
  { label: "پرداخت بعدی", value: "۱۴۰۵/۰۶/۱۸", note: "۲۴٬۰۰۰٬۰۰۰ تومان" },
] as const;

const rows: PaymentRow[] = [
  { id:"1405-06-18", personnel:"علی رضایی", plan:"طرح حمایتی کارکنان", type:"پرداخت ماهانه", amount:"۲۴٬۰۰۰٬۰۰۰ تومان", status:"نیازمند پرداخت", tone:"warning", dueAt:"۱۴۰۵/۰۶/۱۸", action:"پرداخت" },
  { id:"1405-06-08", personnel:"مریم محمدی", plan:"طرح حمایتی کارکنان", type:"پرداخت ماهانه", amount:"۱۸٬۰۰۰٬۰۰۰ تومان", status:"پرداخت‌شده", tone:"success", dueAt:"۱۴۰۵/۰۶/۰۸", action:"مشاهده" },
  { id:"1405-06-07", personnel:"رضا کریمی", plan:"طرح حمایتی کارکنان", type:"سهم اولیه سازمان", amount:"۳۵٬۰۰۰٬۰۰۰ تومان", status:"پرداخت‌شده", tone:"success", dueAt:"۱۴۰۵/۰۶/۰۷", action:"مشاهده" },
  { id:"1405-06-20", personnel:"امیر حسینی", plan:"طرح حمایتی کارکنان", type:"پرداخت ماهانه", amount:"۲۲٬۰۰۰٬۰۰۰ تومان", status:"پیش‌رو", tone:"muted", dueAt:"۱۴۰۵/۰۶/۲۰", action:"مشاهده" },
  { id:"1405-06-18-2", personnel:"نگار موسوی", plan:"طرح حمایتی کارکنان", type:"پرداخت ماهانه", amount:"۱۶٬۰۰۰٬۰۰۰ تومان", status:"نیازمند پرداخت", tone:"warning", dueAt:"۱۴۰۵/۰۶/۱۸", action:"پرداخت" },
  { id:"1405-06-05", personnel:"حسین جعفری", plan:"طرح حمایتی کارکنان", type:"پرداخت ماهانه", amount:"۲۱٬۰۰۰٬۰۰۰ تومان", status:"پرداخت‌شده", tone:"success", dueAt:"۱۴۰۵/۰۶/۰۵", action:"مشاهده" },
  { id:"1405-06-19", personnel:"سارا احمدی", plan:"طرح مسکن کارکنان", type:"سهم اولیه سازمان", amount:"۴۵٬۰۰۰٬۰۰۰ تومان", status:"نیازمند پرداخت", tone:"warning", dueAt:"۱۴۰۵/۰۶/۱۹", action:"پرداخت" },
  { id:"1405-06-22", personnel:"زهرا یوسفی", plan:"طرح کارکنان سازمانی", type:"پرداخت ماهانه", amount:"۱۹٬۰۰۰٬۰۰۰ تومان", status:"پیش‌رو", tone:"muted", dueAt:"۱۴۰۵/۰۶/۲۲", action:"مشاهده" },
  { id:"1405-06-04", personnel:"محمد نادری", plan:"طرح مسکن کارکنان", type:"پرداخت ماهانه", amount:"۲۰٬۰۰۰٬۰۰۰ تومان", status:"پرداخت‌شده", tone:"success", dueAt:"۱۴۰۵/۰۶/۰۴", action:"مشاهده" },
  { id:"1405-06-18-3", personnel:"نرگس اکبری", plan:"طرح حمایتی کارکنان", type:"پرداخت ماهانه", amount:"۲۳٬۰۰۰٬۰۰۰ تومان", status:"نیازمند پرداخت", tone:"warning", dueAt:"۱۴۰۵/۰۶/۱۸", action:"پرداخت" },
];

function param(v:string|string[]|undefined){return Array.isArray(v)?v[0]??"":v??"";}
function hrefFor(q:string,filter:string,page:number){const p=new URLSearchParams(); if(q)p.set("q",q); if(filter!=="all")p.set("filter",filter); if(page>1)p.set("page",String(page)); const s=p.toString(); return s?`/organization/payments?${s}`:"/organization/payments";}

export default async function OrganizationPaymentsPage({searchParams}:{searchParams:Promise<Record<string,string|string[]|undefined>>}) {
  const params=await searchParams;
  const q=param(params.q).trim();
  const filter=param(params.filter)||"all";
  const requestedPage=Math.max(1,Number(param(params.page))||1);
  const filtered=rows.filter((row)=>{
    const mq=!q||`${row.personnel} ${row.plan} ${row.id}`.includes(q);
    const mf=filter==="all"||row.status===filter;
    return mq&&mf;
  });
  const pageSize=4, pageCount=Math.max(1,Math.ceil(filtered.length/pageSize)), currentPage=Math.min(requestedPage,pageCount);
  const visible=filtered.slice((currentPage-1)*pageSize,currentPage*pageSize);

  return <section className="org-payments" data-node-id="510:29">
    <header className="org-payments__header">
      <OrganizationCsvButton className="org-action-button org-action-button--surface" filename="organization-payments.csv" rows={[["پرسنل","طرح","نوع پرداخت","مبلغ","وضعیت","سررسید"],...filtered.map(r=>[r.personnel,r.plan,r.type,r.amount,r.status,r.dueAt])]}>خروجی CSV</OrganizationCsvButton>
      <div><h1>پرداخت‌ها</h1><p>مدیریت تعهدات و پرداخت‌های سازمان برای طرح‌های بانکی</p></div>
    </header>
    <div className="org-payments__metrics">{metrics.map(m=><article className="org-payment-metric" key={m.label}><span>{m.label}</span><strong>{m.value}</strong><small>{m.note}</small></article>)}</div>
    <div className="org-payments__controls">
      <div className="org-payments__filters" aria-label="فیلتر پرداخت‌ها">
        {["all","نیازمند پرداخت","پرداخت‌شده","پیش‌رو"].map(item=><Link key={item} href={hrefFor(q,item,1)} className={`org-payment-filter ${item==="نیازمند پرداخت"?"org-payment-filter--warning ":""}${filter===item?"org-payment-filter--active":""}`}>{item==="all"?"همه":item}</Link>)}
      </div>
      <form className="org-payments__search" method="get">{filter!=="all"&&<input type="hidden" name="filter" value={filter}/>}<span className="sr-only">جستجوی پرداخت</span><input name="q" type="search" defaultValue={q} placeholder="جستجو با نام پرسنل، شماره پرونده یا نام طرح"/></form>
    </div>
    <div className="org-payments-table-wrap">
      <table className="org-payments-table"><thead><tr><th>پرسنل</th><th>طرح</th><th>نوع پرداخت</th><th>مبلغ</th><th>وضعیت</th><th>سررسید</th><th>اقدام</th></tr></thead><tbody>
        {visible.map(row=><tr key={row.id}><td><strong>{row.personnel}</strong></td><td><strong>{row.plan}</strong></td><td>{row.type}</td><td><strong>{row.amount}</strong></td><td><span className={`org-payment-badge org-payment-badge--${row.tone}`}>{row.status}</span></td><td>{row.dueAt}</td><td><Link href={`/organization/payments/${row.id}`} className={row.action==="پرداخت"?"org-payment-table-action org-payment-table-action--primary":"org-payment-table-action"}>{row.action}</Link></td></tr>)}
        {visible.length===0&&<tr><td colSpan={7}>پرداختی مطابق فیلتر پیدا نشد.</td></tr>}
      </tbody></table>
      <footer className="org-payments__footer"><div className="org-pagination">{currentPage>1&&<Link href={hrefFor(q,filter,currentPage-1)}>قبلی</Link>}{Array.from({length:pageCount},(_,i)=>i+1).map(n=><Link key={n} className={n===currentPage?"org-pagination__active":undefined} href={hrefFor(q,filter,n)}>{n.toLocaleString("fa-IR")}</Link>)}{currentPage<pageCount&&<Link href={hrefFor(q,filter,currentPage+1)}>بعدی</Link>}</div><span>نمایش {visible.length.toLocaleString("fa-IR")} پرداخت از {filtered.length.toLocaleString("fa-IR")} پرداخت نمونه</span></footer>
    </div>
  </section>;
}
