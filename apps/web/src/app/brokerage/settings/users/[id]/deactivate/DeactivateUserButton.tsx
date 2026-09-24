"use client";

import { useRouter } from "next/navigation";

const OVERRIDES_KEY = "charkhoone.brokerage.preview.user-overrides";

export function DeactivateUserButton({ id }: { id: string }) {
  const router = useRouter();

  function deactivate() {
    let overrides: Record<string, unknown> = {};
    try {
      const raw = window.localStorage.getItem(OVERRIDES_KEY);
      const parsed = raw ? JSON.parse(raw) : {};
      overrides = parsed && typeof parsed === "object" ? parsed : {};
    } catch {
      overrides = {};
    }

    const current = overrides[id];
    overrides[id] = {
      ...(current && typeof current === "object" ? current : {}),
      status: "غیرفعال",
    };

    window.localStorage.setItem(OVERRIDES_KEY, JSON.stringify(overrides));
    router.push("/brokerage/settings");
  }

  return (
    <button
      className="brokerage-deactivate-user__button brokerage-deactivate-user__button--danger"
      type="button"
      onClick={deactivate}
    >
      غیرفعال کردن
    </button>
  );
}
