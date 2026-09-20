"use client";

import { useState } from "react";
import Link from "next/link";
import styles from "./page.module.css";
import { activities } from "./demo-transactions";

type KindFilter = "all" | "receipt" | "payment";
type StatusFilter = "all" | "overdue" | "waiting" | "future" | "success";

export function ReceivePayActivities({ method }: { method?: "fund" | "monthly" }) {
  const [kind, setKind] = useState<KindFilter>("all");
  const [status, setStatus] = useState<StatusFilter>("all");
  const visible = activities.filter(item =>
    (kind === "all" || item.kindTone === kind) &&
    (status === "all" || item.statusTone === status)
  );

  return (
    <>
      <section className={styles.filters} data-node-id="150:462">
        <select
          aria-label="فیلتر وضعیت تراکنش"
          className={styles.filterPill}
          value={status}
          onChange={event => setStatus(event.target.value as StatusFilter)}
        >
          <option value="all">همه وضعیت‌ها</option>
          <option value="overdue">معوق</option>
          <option value="waiting">در انتظار پرداخت</option>
          <option value="future">آینده</option>
          <option value="success">انجام‌شده / تسویه‌شده</option>
        </select>
        <div className={styles.filterGroup}>
          {([
            ["receipt", "دریافتی‌ها"],
            ["payment", "پرداخت‌ها"],
            ["all", "همه"],
          ] as const).map(([value, title]) =>
            <button type="button" key={value} aria-pressed={kind === value}
              onClick={() => setKind(value)}
              className={[styles.filterPill, kind === value ? styles.filterActive : ""].join(" ")}>
              {title}
            </button>
          )}
        </div>
      </section>
      <section className={styles.tableWrap} data-node-id="150:472">
        <div className={styles.tableScroller}>
          <div className={[styles.tableRow, styles.tableHeader].join(" ")}>
            <span>نوع</span><span>قرارداد</span><span>شرح</span><span>مبلغ</span>
            <span>تاریخ</span><span>وضعیت</span><span>عملیات</span>
          </div>
          {visible.length === 0 ?
            <p className={styles.emptyState} role="status">در این پیش‌نمایش، موردی با فیلترهای انتخاب‌شده وجود ندارد.</p> :
            visible.map(item =>
              <div className={styles.tableRow} data-node-id={item.nodeId} key={item.nodeId}>
                <span className={styles.badgeCell}><span className={[styles.badge, styles["badge_" + item.kindTone]].join(" ")}>{item.kind}</span></span>
                <span className={styles.contractCell}><strong>{item.contract}</strong><small>{item.role}</small></span>
                <span>{item.description}</span>
                <strong>{item.amount}</strong>
                <span className={styles.muted}>{item.date}</span>
                <span className={styles.badgeCell}><span className={[styles.badge, styles["badge_" + item.statusTone]].join(" ")}>{item.status}</span></span>
                <span className={styles.actionCell}>
                  <Link href={method && item.href.startsWith("/user/receive-pay/") ? item.href + "&method=" + method : item.href} className={item.primaryAction ? styles.primaryButton : styles.linkButton}>{item.action}</Link>
                </span>
              </div>
            )}
        </div>
      </section>
    </>
  );
}
