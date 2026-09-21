"use client";

import { useState } from "react";
import Link from "next/link";
import styles from "./page.module.css";
import { UserPanelSidebar } from "@/components/user/UserPanelSidebar";

// Share the stable, same-origin Figma exports used by the approved home sidebar.
type Tone = "tenant" | "owner" | "active" | "attention" | "ended";

function Badge({ children, tone }: { children: React.ReactNode; tone: Tone }) {
  return <span className={`${styles.badge} ${styles[`badge_${tone}`]}`}>{children}</span>;
}

const contracts = [
  { nodeId: "149:195", address: "تهران، سعادت‌آباد", role: "مستأجر", roleTone: "tenant" as const, status: "فعال", statusTone: "active" as const, detail: "پرداخت بعدی: ۶٬۷۰۸٬۳۳۳ تومان — ۱۵ آبان ۱۴۰۵", period: "۱۵ مهر ۱۴۰۵ تا ۱۵ مهر ۱۴۰۶", action: "مشاهده قرارداد", href: "/user/contracts/123456789012" },
  { nodeId: "149:209", address: "تهران، پونک", role: "مالک", roleTone: "owner" as const, status: "فعال", statusTone: "active" as const, detail: "دریافتی بعدی: ۱۴٬۹۲۵٬۰۰۰ تومان — ۱ آذر ۱۴۰۵", period: "۱ آبان ۱۴۰۵ تا ۱ آبان ۱۴۰۶", action: "مشاهده قرارداد (نمونه)", href: "/user/contracts/demo/pounak" },
  { nodeId: "149:223", address: "تهران، ونک", role: "مالک", roleTone: "owner" as const, status: "نیاز به اقدام", statusTone: "attention" as const, detail: "سناریوی نمونه در انتظار تأیید نهایی", period: "۲۰ مهر ۱۴۰۵ تا ۲۰ مهر ۱۴۰۶", action: "مشاهده وضعیت (نمونه)", href: "/user/contracts/demo/vanak" },
  { nodeId: "149:238", address: "تهران، جردن", role: "مستأجر", roleTone: "tenant" as const, status: "پایان‌یافته", statusTone: "ended" as const, detail: "قرارداد به پایان رسیده است", period: "۱ فروردین ۱۴۰۴ تا ۱ فروردین ۱۴۰۵", action: "مشاهده قرارداد (نمونه)", href: "/user/contracts/demo/jordan" },
];

type RoleFilter = "همه نقش‌ها" | "مالک" | "مستأجر";
type StatusFilter = "همه" | "فعال" | "نیاز به اقدام" | "پایان‌یافته" | "فسخ‌شده";

const roleFilters: RoleFilter[] = ["همه نقش‌ها", "مستأجر", "مالک"];
const statusFilters: StatusFilter[] = ["همه", "فعال", "نیاز به اقدام", "پایان‌یافته", "فسخ‌شده"];

export default function ContractsPage() {
  const [roleFilter, setRoleFilter] = useState<RoleFilter>("همه نقش‌ها");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("همه");
  const visibleContracts = contracts.filter(
    (contract) =>
      (roleFilter === "همه نقش‌ها" || contract.role === roleFilter) &&
      (statusFilter === "همه" || contract.status === statusFilter)
  );

  return (
    <main className={styles.page} data-node-id="149:150" data-name="Web App / Contracts">
      <section className={styles.mainContent} data-node-id="149:151" data-name="Main Content">
        <header className={styles.headerBar} data-node-id="149:152" data-name="Header Bar"><div className={styles.headerText} data-node-id="149:153"><h1 data-node-id="149:154">قراردادها</h1><p data-node-id="149:155">سلام، علی رضایی</p></div></header>
        <section className={styles.pageHeader} data-node-id="149:156"><Link href="/user/contracts/register" className={styles.trackingButton} data-node-id="149:157"><span data-node-id="149:158">ثبت کد رهگیری</span></Link><div className={styles.pageTitle} data-node-id="149:159"><h2 data-node-id="149:160">قراردادها</h2><p data-node-id="149:161">قراردادهای متصل به حساب شما</p></div></section>
        <section className={styles.summaryGrid} data-node-id="149:162"><article className={styles.summaryCard} data-node-id="149:171"><p>قراردادهای فعال</p><strong className={styles.primaryValue}>۲ قرارداد</strong><small>۱ قرارداد به عنوان مستأجر، ۱ قرارداد به عنوان مالک</small></article><article className={styles.summaryCard} data-node-id="149:167"><p>نیاز به اقدام</p><strong className={styles.dangerValue}>۱ مورد</strong><small>یک قرارداد نیاز به تایید دارد</small></article><article className={styles.summaryCard} data-node-id="149:163"><p>قراردادهای پایان‌یافته</p><strong>۱ قرارداد</strong><small>قراردادهای منقضی شده شما</small></article></section>
        <section className={styles.filterRow} data-node-id="149:175" aria-label="فیلتر قراردادها">
          <div className={styles.filterGroup} data-node-id="149:176" role="group" aria-label="فیلتر نقش">
            {roleFilters.map((role) => <button key={role} type="button" aria-pressed={roleFilter === role} onClick={() => setRoleFilter(role)} className={`${styles.filterPill} ${roleFilter === role ? styles.filterPillActive : ""}`}>{role}</button>)}
          </div>
          <div className={styles.filterGroup} data-node-id="149:183" role="group" aria-label="فیلتر وضعیت">
            {statusFilters.map((status) => <button key={status} type="button" aria-pressed={statusFilter === status} onClick={() => setStatusFilter(status)} className={`${styles.filterPill} ${statusFilter === status ? styles.filterPillActive : ""}`}>{status}</button>)}
          </div>
        </section>
        <section className={styles.contractList} data-node-id="149:194">
          {visibleContracts.map((contract) => <article key={contract.nodeId} className={styles.contractCard} data-node-id={contract.nodeId}><div className={styles.contractHeader}><strong>{contract.address}</strong><div className={styles.badgeRow}><Badge tone={contract.roleTone}>{contract.role}</Badge><Badge tone={contract.statusTone}>{contract.status}</Badge></div></div><div className={styles.divider} /><div className={styles.contractBottom}><span className={styles.period}>{contract.period}</span><div className={styles.contractActionRow}><Link href={contract.href} className={contract.statusTone === "attention" ? styles.reviewButton : styles.detailButton}>{contract.action}</Link><span className={styles.contractDetail}>{contract.detail}</span></div></div></article>)}
          {visibleContracts.length === 0 && <p className={styles.emptyState} role="status">قراردادی با فیلترهای انتخاب‌شده پیدا نشد.</p>}
        </section>
      </section>
      <UserPanelSidebar nodeId="142:1983" />
    </main>
  );
}
