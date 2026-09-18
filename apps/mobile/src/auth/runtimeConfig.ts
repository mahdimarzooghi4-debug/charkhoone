export type MobileRuntimeConfig = {
  apiBaseUrl: URL;
  oidcIssuer: URL;
  oidcClientId: string;
  oidcAudience?: string;
};

export class MobileRuntimeConfigError extends Error {
  constructor(public readonly code: string, message: string) {
    super(message);
    this.name = "MobileRuntimeConfigError";
  }
}

function requireUrl(
  raw: string | undefined,
  name: string,
  options: { originOnly: boolean },
): URL {
  const configured = raw?.trim();
  if (!configured) {
    throw new MobileRuntimeConfigError(
      "mobile_runtime_not_configured",
      `${name} is required.`,
    );
  }

  let url: URL;
  try {
    url = new URL(configured);
  } catch {
    throw new MobileRuntimeConfigError(
      "mobile_runtime_url_invalid",
      `${name} must be an absolute URL.`,
    );
  }

  const developmentHttp =
    __DEV__ &&
    url.protocol === "http:" &&
    (url.hostname === "localhost" || url.hostname === "127.0.0.1");

  if (
    (url.protocol !== "https:" && !developmentHttp) ||
    url.username ||
    url.password ||
    url.search ||
    url.hash ||
    (options.originOnly && url.pathname !== "/" && url.pathname !== "")
  ) {
    throw new MobileRuntimeConfigError(
      "mobile_runtime_url_invalid",
      `${name} must use HTTPS (localhost HTTP is development-only) and must not contain credentials, query, or fragment.`,
    );
  }

  return url;
}

export function readMobileRuntimeConfig(): MobileRuntimeConfig {
  const clientId = process.env.EXPO_PUBLIC_CHARKHOONE_OIDC_CLIENT_ID?.trim();
  if (!clientId || clientId.length > 200) {
    throw new MobileRuntimeConfigError(
      "mobile_oidc_client_id_invalid",
      "EXPO_PUBLIC_CHARKHOONE_OIDC_CLIENT_ID must contain the public OIDC client id.",
    );
  }

  const audience = process.env.EXPO_PUBLIC_CHARKHOONE_OIDC_AUDIENCE?.trim();
  if (audience && audience.length > 300) {
    throw new MobileRuntimeConfigError(
      "mobile_oidc_audience_invalid",
      "EXPO_PUBLIC_CHARKHOONE_OIDC_AUDIENCE is too long.",
    );
  }

  return {
    apiBaseUrl: requireUrl(
      process.env.EXPO_PUBLIC_CHARKHOONE_API_BASE_URL,
      "EXPO_PUBLIC_CHARKHOONE_API_BASE_URL",
      { originOnly: true },
    ),
    oidcIssuer: requireUrl(
      process.env.EXPO_PUBLIC_CHARKHOONE_OIDC_ISSUER,
      "EXPO_PUBLIC_CHARKHOONE_OIDC_ISSUER",
      { originOnly: false },
    ),
    oidcClientId: clientId,
    oidcAudience: audience || undefined,
  };
}
