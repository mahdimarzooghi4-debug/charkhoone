"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import styles from "../flow.module.css";

/** Local demo navigation only; this does not submit or approve a real contract. */
export function OwnerFinalConfirmationConsent({ method }: { method: "monthly" | "fund" }) {
  const router = useRouter();
  const [accepted, setAccepted] = useState(false);

  return (
    <>
      <label className={styles.ownerFinalConsentRow} data-node-id="150:1895">
        <input
          type="checkbox"
          className={styles.ownerFinalConsentCheckbox}
          checked={accepted}
          onChange={(event) => setAccepted(event.target.checked)}
        />
        <span className={styles.ownerFinalConsentText} data-node-id="150:1896">
          اطلاعات قرارداد و روش دریافت انتخاب‌شده را بررسی کرده‌ام و تأیید نهایی آن را می‌پذیرم.
        </span>
      </label>
      <button
        type="button"
        className={styles.primaryButton}
        data-node-id="150:1899"
        disabled={!accepted}
        onClick={() => router.push(`/user/contracts/123456789012/owner?method=${method}`)}
      >
        تأیید نهایی قرارداد
      </button>
    </>
  );
}
