"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import styles from "./page.module.css";

/** Confirmation is a local preview only; this does not submit a financing request. */
export function PlanConfirmationConsent({ plan }: { plan: "general" | "staff" }) {
  const [agreed, setAgreed] = useState(false);
  const router = useRouter();

  return (
    <>
      <label className={styles.confirmationRow} data-node-id="150:1084">
        <input
          className={styles.consentInput}
          type="checkbox"
          checked={agreed}
          onChange={(event) => setAgreed(event.target.checked)}
        />
        <span className={styles.confirmationText} data-node-id="150:1085">
          شرایط طرح و مبالغ نمایش‌داده‌شده را بررسی کرده‌ام و صحت آن‌ها را تأیید می‌کنم.
        </span>
      </label>
      <div className={styles.summaryActions}>
        <button
          type="button"
          className={styles.primaryAction}
          data-node-id="150:1089"
          disabled={!agreed}
          onClick={() => router.push(`/user/contracts/register/plans/review?plan=${plan}`)}
        >
          ارسال درخواست تأمین مالی
        </button>
        <Link href="/user/contracts/register/plans" className={styles.secondaryAction} data-node-id="150:1091">
          تغییر طرح انتخاب‌شده
        </Link>
      </div>
    </>
  );
}
