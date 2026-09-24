"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { ORGANIZATION_USERS_KEY, type OrganizationUser } from "@/components/organization/OrganizationUsersOverview";

const roles = [
  { id:"admin", title:"مدیر پنل", description:"دسترسی کامل به کاربران، پرسنل، طرح‌ها، پرونده‌ها، پرداخت‌ها و تنظیمات", access:"دسترسی کامل" },
  { id:"finance", title:"مالی", description:"دسترسی به پرداخت‌ها، تعهدات سازمان و پرونده‌های مرتبط", access:"پرداخت‌ها و پرونده‌ها" },
  { id:"hr", title:"منابع انسانی", description:"دسترسی به پرسنل، طرح‌های تخصیص‌یافته و وضعیت پرونده کارکنان", access:"پرسنل و پرونده‌ها" },
  { id:"viewer", title:"مشاهده‌گر", description:"فقط مشاهده بخش‌های مجاز، بدون امکان ثبت یا تغییر", access:"فقط مشاهده" },
] as const;

export default function OrganizationAddUserPage() {
  const router=useRouter();
  const [name,setName]=useState("");
  const [email,setEmail]=useState("");
  const [roleId,setRoleId]=useState<(typeof roles)[number]["id"]>("admin");
  const [error,setError]=useState("");
  const selected=roles.find(r=>r.id===roleId)??roles[0];

  function submit(event:FormEvent<HTMLFormElement>){
    event.preventDefault();
    if(name.trim().length<3||!email.includes("@")){setError("نام و ایمیل سازمانی معتبر را وارد کنید.");return;}
    const user:OrganizationUser={id:`preview-${Date.now()}`,name:name.trim(),email:email.trim(),role:selected.title,access:selected.access,lastLogin:"هنوز وارد نشده",twoFactor:"غیرفعال",active:true,invited:true};
    try{
      const raw=window.localStorage.getItem(ORGANIZATION_USERS_KEY);
      const current=raw?JSON.parse(raw):[];
      window.localStorage.setItem(ORGANIZATION_USERS_KEY,JSON.stringify(Array.isArray(current)?[user,...current]:[user]));
    }catch{window.localStorage.setItem(ORGANIZATION_USERS_KEY,JSON.stringify([user]));}
    router.push("/organization/users");
  }

  return <section className="org-user-form" data-node-id="542:33">
    <header className="org-user-form__header"><Link href="/organization/users">بازگشت به مدیریت کاربران</Link><div><h1>افزودن کاربر سازمان</h1><p>ایجاد دسترسی جدید به پنل سازمان و تعیین نقش و سطح دسترسی</p></div></header>
    <form className="org-user-form__card" onSubmit={submit}>
      <h2>مشخصات کاربر جدید</h2><div className="org-user-form__divider"/>
      <div className="org-user-form__grid"><label><span>ایمیل سازمانی</span><input type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="name@org.ir"/></label><label><span>نام و نام خانوادگی</span><input type="text" value={name} onChange={e=>setName(e.target.value)} placeholder="مثلاً سارا احمدی"/></label></div>
      <fieldset className="org-role-group"><legend>نقش کاربر</legend><div className="org-role-grid">{roles.map(role=><label className="org-role-option" key={role.id}><input checked={roleId===role.id} onChange={()=>setRoleId(role.id)} name="role" type="radio" value={role.id}/><span className="org-role-option__control" aria-hidden="true"/><span className="org-role-option__copy"><strong>{role.title}</strong><small>{role.description}</small></span></label>)}</div><p>سطح دسترسی براساس نقش انتخاب‌شده به‌صورت خودکار تنظیم می‌شود.</p></fieldset>
      <div className="org-role-preview"><strong>دسترسی‌های نقش انتخاب‌شده</strong><div><span>{selected.access}</span></div></div>
      {error&&<p className="org-form-help" role="alert" style={{color:"#b42318"}}>{error}</p>}
      <div className="org-user-form__actions"><Link className="org-user-form__button" href="/organization/users">انصراف</Link><button className="org-user-form__button org-user-form__button--primary" type="submit">افزودن کاربر</button></div>
    </form>
  </section>;
}
