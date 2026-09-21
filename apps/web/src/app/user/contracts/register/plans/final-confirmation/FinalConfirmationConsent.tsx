"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import styles from "./page.module.css";

/** Illustrative approval flow only; nothing is submitted to a real financial service. */
export function FinalConfirmationConsent({ plan }: { plan: "general" | "staff" }) {
  const [confirmed, setConfirmed] = useState(false);
  const router = useRouter();

  return (
    <>
      <label className={styles.confirmationRow} data-node-id="150:1648">
        <input
          type="checkbox"
          className={styles.confirmationCheckbox}
          checked={confirmed}
          onChange={(event) => setConfirmed(event.target.checked)}
        />
        <span className={styles.confirmationText} data-node-id="150:1652">
          اطلاعات قرارداد و شرایط تأمین مالی را بررسی کرده‌ام و تأیید نهایی آن را می‌پذیرم.
        </span>
      </label>
      <button
        type="button"
        className={styles.primaryAction}
        data-node-id="150:1653"
        disabled={!confirmed}
        onClick={() => router.push(`/user/contracts/register/plans/waiting-owner?plan=${plan}`)}
      >
        تأیید نهایی و ادامه
      </button>
    </>
  );
}
