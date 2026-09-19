"use client";

import { useState } from "react";
import Link from "next/link";
import styles from "./page.module.css";
import { UserPanelSidebar } from "@/components/user/UserPanelSidebar";

// Stable same-origin Figma sidebar exports already reviewed on the home page.
type ContractRole = "owner" | "tenant";

const contractRows = [
  ["کد رهگیری", "۱۲۳۴۵۶۷۸۹۰۱۲", true],
  ["مبلغ رهن", "۵۰۰٬۰۰۰٬۰۰۰ تومان", false],
  ["اجاره ماهانه", "۲۰٬۰۰۰٬۰۰۰ تومان", false],
  ["تاریخ شروع", "۱۵ مهر ۱۴۰۵", false],
  ["تاریخ پایان", "۱۵ مهر ۱۴۰۶", false],
] as const;

const propertyRows = [
  ["آدرس", "تهران، سعادت‌آباد، خیابان نمونه، پلاک ۲۴، واحد ۳"],
  ["کدپستی", "۱۹۹۸۷۶۵۴۳۲"],
  ["پلاک", "۲۴"],
  ["واحد", "۳"],
] as const;

function DetailCard({ title, rows }: { title: string; rows: readonly (readonly [string, string, boolean?])[] }) {
  return (
    <section className={styles.detailCard}>
      <h2>{title}</h2>
      <div className={styles.detailList}>{rows.map(([label, value, strong], index) => <div key={label} className={`${styles.detailRow} ${index === rows.length - 1 ? styles.lastRow : ""}`}>{strong ? <strong>{value}</strong> : <span>{value}</span>}<span className={styles.detailLabel}>{label}</span></div>)}</div>
    </section>
  );
}

export default function ContractLookupResultPage() {
  // This is a client-only Figma preview choice, not a persisted role assignment.
  const [selectedRole, setSelectedRole] = useState<ContractRole>("tenant");
  const nextHref = selectedRole === "owner"
    ? "/user/contracts/123456789012/owner/connected"
    : "/user/contracts/register/plans";

  return (
    <main className={styles.page} data-node-id="150:761" data-name="Web App / Contract Lookup Result">
      <section className={styles.mainContent} data-node-id="150:762">
        <header className={styles.headerBar} data-node-id="150:763"><Link href="/user/contracts/register" className={styles.backButton} aria-label="بازگشت">‹</Link><div className={styles.headerRight}><h1 data-node-id="150:768">استعلام قرارداد</h1><p data-node-id="150:769">سلام، علی رضایی</p></div></header>
        <section className={styles.pageHeader} data-node-id="150:770"><p data-node-id="150:771">قراردادها / استعلام قرارداد</p><h2 data-node-id="150:773">اطلاعات قرارداد یافت شد</h2><p data-node-id="150:776">اطلاعات قرارداد را بررسی کرده و نقش خود را در این قرارداد انتخاب کنید.</p></section>

        <div className={styles.columns} data-node-id="150:777">
          <div className={styles.mainColumn} data-node-id="150:778">
            <DetailCard title="اطلاعات قرارداد" rows={contractRows} />
            <DetailCard title="اطلاعات ملک" rows={propertyRows} />
            <div className={styles.officialNotice} data-node-id="150:819" role="note"><span className={styles.noticeIcon} aria-hidden="true">ⓘ</span><span className={styles.noticeText}>اطلاعات این قرارداد نمونهٔ نمایشی است و از سامانهٔ خودنویس استعلام نشده است.</span></div>
          </div>

          <aside className={styles.roleCard} data-node-id="150:824">
            <div className={styles.roleHeader} data-node-id="150:825"><h2 data-node-id="150:826">نقش خود را انتخاب کنید</h2><p data-node-id="150:827">مشخص کنید در این قرارداد مالک هستید یا مستأجر.</p></div>
            <div className={styles.roleStack} data-node-id="150:828" role="radiogroup" aria-label="نقش شما در این قرارداد">
              <label className={`${styles.roleOption} ${selectedRole === "owner" ? styles.roleSelected : ""}`} data-node-id="150:829">
                <span className={styles.roleOptionTop}><input type="radio" name="contract-role" value="owner" checked={selectedRole === "owner"} onChange={() => setSelectedRole("owner")} /><strong data-node-id="150:831">مالک (موجر)</strong></span>
                <span className={styles.partyInfo} dir="rtl"><span>محمد رضایی</span><small>کد ملی: ۰۰۲•••••۴۵۶</small></span>
              </label>
              <label className={`${styles.roleOption} ${selectedRole === "tenant" ? styles.roleSelected : ""}`} data-node-id="150:836">
                <span className={styles.roleOptionTop}><input type="radio" name="contract-role" value="tenant" checked={selectedRole === "tenant"} onChange={() => setSelectedRole("tenant")} /><strong data-node-id="150:838">مستأجر</strong></span>
                <span className={styles.partyInfo} dir="rtl"><strong>علی رضایی</strong><small>کد ملی: ۰۰۱•••••۷۸۹</small></span>
              </label>
            </div>
            <div className={styles.nextNotice} data-node-id="203:242">{selectedRole === "tenant" ? "در مرحله بعد، طرح‌های تأمین مالی واجد شرایط این قرارداد نمایش داده می‌شوند." : "در مرحله بعد، پیش‌نمایش وضعیت اتصال قرارداد با نقش مالک نمایش داده می‌شود."}</div>
            <div className={styles.actions} data-node-id="150:845"><Link href={nextHref} className={styles.primaryAction} data-node-id="150:846">تأیید نقش و ادامه</Link><Link href="/user/contracts/register" className={styles.secondaryAction} data-node-id="150:850">استعلام کد دیگری</Link></div>
          </aside>
        </div>
      </section>

      <UserPanelSidebar nodeId="142:1843" />
    </main>
  );
}
