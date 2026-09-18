import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type PropsWithChildren,
} from "react";
import * as AuthSession from "expo-auth-session";
import * as SecureStore from "expo-secure-store";
import * as WebBrowser from "expo-web-browser";
import {
  MobileRuntimeConfigError,
  readMobileRuntimeConfig,
  type MobileRuntimeConfig,
} from "@/auth/runtimeConfig";

WebBrowser.maybeCompleteAuthSession();

const TOKEN_STORAGE_KEY = "charkhoone.oidc.token";
const TOKEN_STORAGE_OPTIONS: SecureStore.SecureStoreOptions = {
  keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
};

type AuthStatus = "loading" | "unauthenticated" | "authenticated" | "config-error";
type StoredToken = AuthSession.TokenResponseConfig;

type MobileAuthContextValue = {
  status: AuthStatus;
  error: string | null;
  signIn: () => Promise<void>;
  signOut: () => Promise<void>;
  apiRequest: <T>(path: string, init?: RequestInit) => Promise<T>;
};

const MobileAuthContext = createContext<MobileAuthContextValue | null>(null);

function loadRuntimeConfig(): { config: MobileRuntimeConfig | null; error: string | null } {
  try {
    return { config: readMobileRuntimeConfig(), error: null };
  } catch (error) {
    const message =
      error instanceof MobileRuntimeConfigError
        ? `${error.code}: ${error.message}`
        : "mobile_runtime_config_unexpected_error";
    return { config: null, error: message };
  }
}

function isStoredToken(value: unknown): value is StoredToken {
  if (!value || typeof value !== "object") return false;
  const token = value as Partial<StoredToken>;
  return (
    typeof token.accessToken === "string" &&
    token.accessToken.length > 0 &&
    typeof token.issuedAt === "number"
  );
}

export function MobileAuthProvider({ children }: PropsWithChildren) {
  const runtime = useMemo(loadRuntimeConfig, []);
  const config = runtime.config;
  const redirectUri = useMemo(
    () => AuthSession.makeRedirectUri({ scheme: "charkhoone", path: "auth/callback" }),
    [],
  );
  const [discovery, setDiscovery] = useState<AuthSession.DiscoveryDocument | null>(null);
  const [token, setToken] = useState<StoredToken | null>(null);
  const [status, setStatus] = useState<AuthStatus>(
    runtime.error ? "config-error" : "loading",
  );
  const [error, setError] = useState<string | null>(runtime.error);

  useEffect(() => {
    if (!config) return;

    let active = true;
    AuthSession.resolveDiscoveryAsync(config.oidcIssuer.toString())
      .then((document) => {
        if (active) setDiscovery(document);
      })
      .catch(() => {
        if (!active) return;
        setError("mobile_oidc_discovery_failed");
        setStatus("config-error");
      });

    return () => {
      active = false;
    };
  }, [config]);

  const authRequestConfig = useMemo<AuthSession.AuthRequestConfig>(
    () => ({
      clientId: config?.oidcClientId ?? "unconfigured",
      redirectUri,
      responseType: AuthSession.ResponseType.Code,
      scopes: ["openid", "profile", "offline_access"],
      usePKCE: true,
      extraParams: config?.oidcAudience ? { audience: config.oidcAudience } : {},
    }),
    [config, redirectUri],
  );

  const [request, response, promptAsync] = AuthSession.useAuthRequest(
    authRequestConfig,
    discovery,
  );

  const persistToken = useCallback(async (next: AuthSession.TokenResponse) => {
    const serialized = next.getRequestConfig();
    await SecureStore.setItemAsync(
      TOKEN_STORAGE_KEY,
      JSON.stringify(serialized),
      TOKEN_STORAGE_OPTIONS,
    );
    setToken(serialized);
    setError(null);
    setStatus("authenticated");
  }, []);

  const clearToken = useCallback(async () => {
    await SecureStore.deleteItemAsync(TOKEN_STORAGE_KEY, TOKEN_STORAGE_OPTIONS);
    setToken(null);
    setStatus(config ? "unauthenticated" : "config-error");
  }, [config]);

  useEffect(() => {
    if (!config || runtime.error) return;

    let active = true;
    (async () => {
      try {
        if (!(await SecureStore.isAvailableAsync())) {
          throw new Error("secure_store_unavailable");
        }

        const raw = await SecureStore.getItemAsync(TOKEN_STORAGE_KEY, TOKEN_STORAGE_OPTIONS);
        if (!active) return;

        if (!raw) {
          setStatus("unauthenticated");
          return;
        }

        const parsed: unknown = JSON.parse(raw);
        if (!isStoredToken(parsed)) {
          await SecureStore.deleteItemAsync(TOKEN_STORAGE_KEY, TOKEN_STORAGE_OPTIONS);
          if (active) setStatus("unauthenticated");
          return;
        }

        const restored = new AuthSession.TokenResponse(parsed);
        if (AuthSession.TokenResponse.isTokenFresh(restored) || parsed.refreshToken) {
          setToken(restored.getRequestConfig());
          setStatus("authenticated");
        } else {
          await SecureStore.deleteItemAsync(TOKEN_STORAGE_KEY, TOKEN_STORAGE_OPTIONS);
          setStatus("unauthenticated");
        }
      } catch {
        if (!active) return;
        setError("mobile_secure_session_restore_failed");
        setStatus("unauthenticated");
      }
    })();

    return () => {
      active = false;
    };
  }, [config, runtime.error]);

  useEffect(() => {
    if (!config || !discovery || !request || !response) return;

    if (response.type === "error") {
      setError(response.error?.code ?? "mobile_oidc_authorization_failed");
      setStatus("unauthenticated");
      return;
    }

    if (response.type !== "success") return;

    const code = response.params.code;
    if (!code || !request.codeVerifier) {
      setError("mobile_oidc_code_exchange_invalid");
      setStatus("unauthenticated");
      return;
    }

    let active = true;
    setStatus("loading");
    AuthSession.exchangeCodeAsync(
      {
        clientId: config.oidcClientId,
        code,
        redirectUri,
        scopes: ["openid", "profile", "offline_access"],
        extraParams: { code_verifier: request.codeVerifier },
      },
      discovery,
    )
      .then((next) => {
        if (active) return persistToken(next);
      })
      .catch(() => {
        if (!active) return;
        setError("mobile_oidc_code_exchange_failed");
        setStatus("unauthenticated");
      });

    return () => {
      active = false;
    };
  }, [config, discovery, persistToken, redirectUri, request, response]);

  const signIn = useCallback(async () => {
    if (!config || !discovery || !request) {
      setError("mobile_oidc_not_ready");
      return;
    }

    setError(null);
    await promptAsync();
  }, [config, discovery, promptAsync, request]);

  const signOut = useCallback(async () => {
    setError(null);
    await clearToken();
  }, [clearToken]);

  const getFreshAccessToken = useCallback(async () => {
    if (!config || !token) {
      throw new Error("mobile_authentication_required");
    }

    const current = new AuthSession.TokenResponse(token);
    if (AuthSession.TokenResponse.isTokenFresh(current)) {
      return current.accessToken;
    }

    if (!token.refreshToken || !discovery) {
      await clearToken();
      throw new Error("mobile_session_expired");
    }

    try {
      const refreshed = await AuthSession.refreshAsync(
        {
          clientId: config.oidcClientId,
          refreshToken: token.refreshToken,
          scopes: ["openid", "profile", "offline_access"],
        },
        discovery,
      );
      await persistToken(refreshed);
      return refreshed.accessToken;
    } catch {
      await clearToken();
      throw new Error("mobile_session_refresh_failed");
    }
  }, [clearToken, config, discovery, persistToken, token]);

  const apiRequest = useCallback(
    async <T,>(path: string, init: RequestInit = {}): Promise<T> => {
      if (!config || !path.startsWith("/api/v1/")) {
        throw new Error("mobile_api_path_invalid");
      }

      const accessToken = await getFreshAccessToken();
      const target = new URL(path, config.apiBaseUrl);
      if (target.origin !== config.apiBaseUrl.origin) {
        throw new Error("mobile_api_origin_invalid");
      }

      const headers = new Headers(init.headers);
      headers.set("authorization", `Bearer ${accessToken}`);
      headers.set("accept", "application/json");

      const result = await fetch(target, {
        ...init,
        headers,
        redirect: "error",
      });

      if (result.status === 401) {
        await clearToken();
        throw new Error("mobile_authentication_required");
      }

      if (!result.ok) {
        let code = "mobile_api_request_failed";
        try {
          const problem = (await result.json()) as { code?: string };
          if (problem.code) code = problem.code;
        } catch {
          // Keep the generic code when the API body is not JSON.
        }
        throw new Error(`${code}:${result.status}`);
      }

      if (result.status === 204) return undefined as T;
      return (await result.json()) as T;
    },
    [clearToken, config, getFreshAccessToken],
  );

  const value = useMemo<MobileAuthContextValue>(
    () => ({ status, error, signIn, signOut, apiRequest }),
    [apiRequest, error, signIn, signOut, status],
  );

  return <MobileAuthContext.Provider value={value}>{children}</MobileAuthContext.Provider>;
}

export function useMobileAuth() {
  const value = useContext(MobileAuthContext);
  if (!value) {
    throw new Error("useMobileAuth must be used inside MobileAuthProvider.");
  }
  return value;
}
