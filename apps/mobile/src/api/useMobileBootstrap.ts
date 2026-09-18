import { useEffect, useState } from "react";
import { useMobileAuth } from "@/auth/MobileAuthProvider";
import {
  getMobileBootstrap,
  type MobileBootstrapResponse,
} from "@/api/mobileApi";

export function useMobileBootstrap() {
  const { status, apiRequest } = useMobileAuth();
  const [data, setData] = useState<MobileBootstrapResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (status !== "authenticated") {
      if (status === "unauthenticated" || status === "config-error") {
        setData(null);
      }
      return;
    }

    let active = true;
    getMobileBootstrap(apiRequest)
      .then((value) => {
        if (!active) return;
        setData(value);
        setError(null);
      })
      .catch((reason: unknown) => {
        if (!active) return;
        setError(reason instanceof Error ? reason.message : "mobile_bootstrap_failed");
      });

    return () => {
      active = false;
    };
  }, [apiRequest, status]);

  return {
    status,
    data,
    error,
    loading: status === "loading" || (status === "authenticated" && !data && !error),
  };
}
