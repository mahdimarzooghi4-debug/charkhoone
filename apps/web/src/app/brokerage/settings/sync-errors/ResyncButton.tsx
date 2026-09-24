"use client";

import { useState } from "react";

type ResyncButtonProps = {
  variant: "list" | "detail";
};

export function ResyncButton({ variant }: ResyncButtonProps) {
  const [done, setDone] = useState(false);
  const className =
    variant === "detail"
      ? "brokerage-sync-error-detail__button brokerage-sync-error-detail__button--primary"
      : "brokerage-sync-errors__button brokerage-sync-errors__button--primary";

  return (
    <button
      className={className}
      type="button"
      onClick={() => setDone(true)}
      aria-live="polite"
    >
      {done ? "بررسی مجدد انجام شد ✓" : "همگام‌سازی مجدد"}
    </button>
  );
}
