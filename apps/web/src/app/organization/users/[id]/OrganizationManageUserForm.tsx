"use client";

import Link from "next/link";
import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { OrganizationUsersOverview, ORGANIZATION_USER_OVERRIDES_KEY, type OrganizationUser } from "@/components/organization/OrganizationUsersOverview";

type RoleId = "admin" | "finance" | "hr" | "viewer";
const roleMap: Record<RoleId,{title:string;access:string}> = {
  admin:{title:"مدیر پنل",access:"دسترسی کامل"},
  finance:{title:"مالی",access:"پرداخت‌ها و پرونده‌ها"},
  hr:{title:"منابع انسانی",access:"پرسنل و پرونده‌ها"},
  viewer:{title:"مشاهده‌گر",access:"فقط مشاهده"},
};
const titleToRole:Record<string,RoleId> = {"مدیر پنل":"admin","مالی":"finance","منابع انسانی":"hr","مشاهده‌گر":"viewer"};

export function OrganizationManageUserForm({ id, initial }: { id:string; initial:OrganizationUser }) {
  const router=useRouter();
  const [role,setRole]=useState<RoleId>(titleToRole[initial.role]??"finance");
  const [active,setActive]=useState(initial.active);
  const [user,setUser]=useState(initial);

  useEffect(()=>{
    try{
      const raw=window.localStorage.getItem(ORGANIZATION_USER_OVERRIDES_KEY);
      const all=raw?JSON.parse(raw):{};
      const override=all&&typeof all==="object"?all[id]:undefined;
      if(override&&typeof override==="object"){
        const merged={...initial,...override} as OrganizationUser;
        setUser(merged);
        setRole(titleToRole[merged.role]??"finance");
        setActive(merged.active);
      }
    }catch{setUser(initial);}
  },[id,initial]);

  function save(event:FormEvent<HTMLFormElement>){
    event.preventDefault();
    const selected=roleMap[role];
    let all:Record<string,Partial<OrganizationUser>>={};
    try{
      const raw=window.localStorage.getItem(ORGANIZATION_USER_OVERRIDES_KEY);
      const parsed=raw?JSON.parse(raw):{};
      all=parsed&&typeof parsed==="object"?parsed:{};
    }catch{all={};}
    all[id]={...(all[id]??{}),role:selected.title,access:selected.access,active,invited:false};
    window.localStorage.setItem(ORGANIZATION_USER_OVERRIDES_KEY,JSON.stringify(all));
    router.push("/organization/users");
  }

  return <div className="org-user-manage-page" data-node-id="548:33">
    <OrganizationUsersOverview/>
    <div className="org-user-manage__backdrop"/>
    <section className="org-user-manage" role="dialog" aria-modal="true" aria-labelledby="manage-user-title">
      <header className="org-user-manage__header"><Link href="/organization/users" aria-label="بستن">×</Link><div><h2 id="manage-user-title">مدیریت کاربر سازمان</h2><p>نقش، سطح دسترسی و وضعیت این کاربر را مدیریت کنید.</p></div></header>
      <div className="org-user-manage__divider"/>
      <div className="org-user-manage__summary"><div><strong>{user.name}</strong><span>نام و نام خانوادگی</span></div><div><strong>{user.email}</strong><span>ایمیل سازمانی</span></div></div>
      <form onSubmit={save}>
        <label className="org-user-manage__field"><span>نقش</span><select value={role} onChange={e=>setRole(e.target.value as RoleId)}><option value="admin">مدیر پنل</option><option value="finance">مالی</option><option value="hr">منابع انسانی</option><option value="viewer">مشاهده‌گر</option></select><small>سطح دسترسی براساس نقش انتخاب‌شده تعیین می‌شود.</small></label>
        <div className="org-user-manage__field"><span>وضعیت دسترسی</span><div className="org-user-manage__status-actions"><button className={active?"is-active":undefined} type="button" onClick={()=>setActive(true)}>فعال</button><button className={!active?"is-active":undefined} type="button" onClick={()=>setActive(false)}>غیرفعال</button></div></div>
        <div className="org-user-manage__access"><strong>دسترسی‌های نقش {roleMap[role].title}</strong><span>{roleMap[role].access}</span></div>
        <div className="org-user-manage__note">غیرفعال‌کردن دسترسی، سوابق فعالیت و اقدامات ثبت‌شده این کاربر را حذف نمی‌کند.</div>
        <div className="org-user-manage__divider"/>
        <footer className="org-user-manage__footer"><Link className="org-user-form__button" href="/organization/users">انصراف</Link><button className="org-user-form__button org-user-form__button--primary" type="submit">ذخیره تغییرات</button></footer>
      </form>
    </section>
  </div>;
}
