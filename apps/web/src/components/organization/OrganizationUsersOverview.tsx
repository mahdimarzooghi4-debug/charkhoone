"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { OrganizationCsvButton } from "@/components/organization/OrganizationCsvButton";

export type OrganizationUser = {
  id: string;
  name: string;
  email: string;
  role: string;
  access: string;
  lastLogin: string;
  twoFactor: string;
  active: boolean;
  invited?: boolean;
};

export const ORGANIZATION_USERS_KEY = "charkhoone.organization.preview.users";
export const ORGANIZATION_USER_OVERRIDES_KEY = "charkhoone.organization.preview.user-overrides";

const baseUsers: OrganizationUser[] = [
  { id:"maryam", name:"مریم محمدی", email:"maryam@org.ir", role:"مدیر پنل", access:"دسترسی کامل", lastLogin:"امروز، ۱۶:۴۲", twoFactor:"فعال", active:true },
  { id:"ali", name:"علی رضایی", email:"ali@org.ir", role:"مالی", access:"پرداخت‌ها و پرونده‌ها", lastLogin:"امروز، ۱۱:۰۵", twoFactor:"فعال", active:true },
  { id:"sara", name:"سارا کریمی", email:"sara@org.ir", role:"منابع انسانی", access:"پرسنل و پرونده‌ها", lastLogin:"۱۴۰۵/۰۶/۰۷", twoFactor:"فعال", active:true },
  { id:"reza", name:"رضا حسینی", email:"reza@org.ir", role:"مشاهده‌گر", access:"فقط مشاهده", lastLogin:"۱۴۰۵/۰۶/۰۵", twoFactor:"غیرفعال", active:true },
];

function readAdded(): OrganizationUser[] {
  try {
    const raw=window.localStorage.getItem(ORGANIZATION_USERS_KEY);
    const value=raw?JSON.parse(raw):[];
    return Array.isArray(value)?value as OrganizationUser[]:[];
  } catch { return []; }
}
function readOverrides():Record<string,Partial<OrganizationUser>>{
  try{
    const raw=window.localStorage.getItem(ORGANIZATION_USER_OVERRIDES_KEY);
    const value=raw?JSON.parse(raw):{};
    return value&&typeof value==="object"?value as Record<string,Partial<OrganizationUser>>:{};
  }catch{return{};}
}

export function OrganizationUsersOverview() {
  const [added,setAdded]=useState<OrganizationUser[]>([]);
  const [overrides,setOverrides]=useState<Record<string,Partial<OrganizationUser>>>({});
  const [query,setQuery]=useState("");
  const [filter,setFilter]=useState<"all"|"active"|"invited"|"inactive">("all");

  useEffect(()=>{
    setAdded(readAdded());
    setOverrides(readOverrides());
  },[]);

  const users=useMemo(()=>[...added,...baseUsers].map(user=>({...user,...(overrides[user.id]??{})})),[added,overrides]);
  const visible=users.filter(user=>{
    const mq=!query.trim()||`${user.name} ${user.email}`.includes(query.trim());
    const mf=filter==="all"||(filter==="active"&&user.active&&!user.invited)||(filter==="inactive"&&!user.active)||(filter==="invited"&&Boolean(user.invited));
    return mq&&mf;
  });
  const activeCount=users.filter(user=>user.active&&!user.invited).length;
  const invitedCount=users.filter(user=>user.invited).length;
  const securityCount=users.filter(user=>user.twoFactor==="غیرفعال").length;

  return <section className="org-users" data-node-id="533:29">
    <header className="org-users__header">
      <div className="org-users__actions">
        <OrganizationCsvButton className="org-action-button org-action-button--surface" filename="organization-users.csv" rows={[["نام","ایمیل","نقش","سطح دسترسی","آخرین ورود","ورود دومرحله‌ای","وضعیت"],...visible.map(u=>[u.name,u.email,u.role,u.access,u.lastLogin,u.twoFactor,u.invited?"دعوت‌شده":u.active?"فعال":"غیرفعال"])]}>خروجی CSV</OrganizationCsvButton>
        <Link className="org-action-button org-action-button--surface" href="/organization/settings">بازگشت به تنظیمات</Link>
        <Link className="org-action-button org-action-button--primary" href="/organization/users/new">افزودن کاربر</Link>
      </div>
      <div className="org-users__copy"><h1>مدیریت کاربران</h1><p>تعریف کاربران پنل سازمان و مدیریت نقش و سطح دسترسی هر کاربر</p></div>
    </header>
    <div className="org-users__metrics">
      {[
        {label:"نیازمند اقدام امنیتی",value:`${securityCount.toLocaleString("fa-IR")} کاربر`,note:"ورود دومرحله‌ای غیرفعال است"},
        {label:"دعوت‌شده",value:`${invitedCount.toLocaleString("fa-IR")} کاربر`,note:"دعوت در انتظار پذیرش"},
        {label:"کاربران فعال",value:`${activeCount.toLocaleString("fa-IR")} کاربر`,note:"دارای دسترسی فعال به پنل"},
        {label:"کل کاربران پنل",value:`${users.length.toLocaleString("fa-IR")} کاربر`,note:"همه کاربران ثبت‌شده"},
      ].map(metric=><article className="org-user-metric" key={metric.label}><span>{metric.label}</span><strong>{metric.value}</strong><small>{metric.note}</small></article>)}
    </div>
    <div className="org-users__controls">
      <div className="org-users__filters" aria-label="فیلتر کاربران">
        <button type="button" className={filter==="active"?"is-active":undefined} onClick={()=>setFilter("active")}>فعال</button>
        <button type="button" className={filter==="invited"?"is-active":undefined} onClick={()=>setFilter("invited")}>دعوت‌شده</button>
        <button type="button" className={filter==="inactive"?"is-active":undefined} onClick={()=>setFilter("inactive")}>غیرفعال</button>
        <button type="button" className={filter==="all"?"is-active":undefined} onClick={()=>setFilter("all")}>همه</button>
      </div>
      <label className="org-users__search"><span className="sr-only">جستجو با نام یا ایمیل کاربر</span><input type="search" value={query} onChange={e=>setQuery(e.target.value)} placeholder="جستجو با نام یا ایمیل کاربر"/></label>
    </div>
    <div className="org-users__security-strip"><div><strong>سطوح دسترسی بر اساس نقش</strong><span>هر کاربر فقط بخش‌هایی را می‌بیند که برای نقش او مجاز شده است</span></div><div><strong>ورود دومرحله‌ای</strong><span>برای کاربران دارای دسترسی مالی و مدیریتی پیشنهاد می‌شود فعال باشد</span></div></div>
    <div className="org-users-table-wrap"><table className="org-users-table"><thead><tr><th>کاربر</th><th>نقش</th><th>سطح دسترسی</th><th>آخرین ورود</th><th>ورود دومرحله‌ای</th><th>وضعیت</th><th>اقدام</th></tr></thead><tbody>
      {visible.map(user=><tr key={user.id}><td><div className="org-user-cell"><strong>{user.name}</strong><span>{user.email}</span></div></td><td><strong>{user.role}</strong></td><td>{user.access}</td><td>{user.lastLogin}</td><td className={user.twoFactor==="غیرفعال"?"org-user-security--off":""}>{user.twoFactor}</td><td><span className="org-user-status">{user.invited?"دعوت‌شده":user.active?"فعال":"غیرفعال"}</span></td><td><Link className="org-user-manage-link" href={`/organization/users/${user.id}`}>مدیریت</Link></td></tr>)}
      {visible.length===0&&<tr><td colSpan={7}>کاربری مطابق فیلتر پیدا نشد.</td></tr>}
    </tbody></table></div>
    <div className="org-users__footer">نمایش {visible.length.toLocaleString("fa-IR")} کاربر از {users.length.toLocaleString("fa-IR")} کاربر</div>
  </section>;
}
