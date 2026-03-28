/**
 * OAuth 2.0 Authorization Code Flow with PKCE.
 * Based on The Copenhagen Book:
 * https://thecopenhagenbook.com/oauth
 *
 * Production defaults:
 * - Authorization Code + PKCE
 * - State validation
 * - Safe same-origin post-auth redirects
 * - Verified-email checks before account linking
 */

export interface OAuthProviderConfig {
  clientId: string;
  clientSecret?: string;
  authorizationEndpoint: string;
  tokenEndpoint: string;
  redirectUri: string;
  scopes: string[];
  tokenEndpointAuthMethod?: "client_secret_basic" | "client_secret_post" | "none";
}

export interface AuthorizationRequest {
  url: string;
  state: string;
  codeVerifier: string;
}

export interface TokenResponse {
  accessToken: string;
  tokenType: string;
  expiresIn?: number;
  refreshToken?: string;
  scope?: string;
  idToken?: string;
}

export const GITHUB_CONFIG: Partial<OAuthProviderConfig> = {
  authorizationEndpoint: "https://github.com/login/oauth/authorize",
  tokenEndpoint: "https://github.com/login/oauth/access_token",
  scopes: ["read:user", "user:email"],
  tokenEndpointAuthMethod: "client_secret_post",
};

export const GOOGLE_CONFIG: Partial<OAuthProviderConfig> = {
  authorizationEndpoint: "https://accounts.google.com/o/oauth2/v2/auth",
  tokenEndpoint: "https://oauth2.googleapis.com/token",
  scopes: ["openid", "email", "profile"],
  tokenEndpointAuthMethod: "client_secret_post",
};

function encodeBase64(bytes: Uint8Array): string {
  const globalWithBuffer = globalThis as {
    Buffer?: {
      from(input: Uint8Array | string, encoding?: string): {
        toString(encoding: string): string;
      };
    };
  };

  if (globalWithBuffer.Buffer) {
    return globalWithBuffer.Buffer.from(bytes).toString("base64");
  }

  let binary = "";
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function encodeBase64Url(bytes: Uint8Array): string {
  return encodeBase64(bytes)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=/g, "");
}

function constantTimeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) {
    return false;
  }

  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
}

function generateSecureToken(byteLength: number = 32): string {
  const bytes = new Uint8Array(byteLength);
  crypto.getRandomValues(bytes);
  return encodeBase64Url(bytes);
}

function encodeBasicAuth(username: string, password: string): string {
  return encodeBase64(new TextEncoder().encode(`${username}:${password}`));
}

function getRequiredString(
  value: unknown,
  fieldName: string,
  context: string
): string {
  if (typeof value === "string" && value.length > 0) {
    return value;
  }

  throw new Error(`Missing ${fieldName} in ${context} response`);
}

function getRequiredNumber(
  value: unknown,
  fieldName: string,
  context: string
): number {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  throw new Error(`Missing ${fieldName} in ${context} response`);
}

async function sha256(plain: string): Promise<string> {
  const data = new TextEncoder().encode(plain);
  const hash = await crypto.subtle.digest("SHA-256", data);
  return encodeBase64Url(new Uint8Array(hash));
}

/**
 * Sanitize return paths to same-origin relative paths only.
 * Prevents open redirects after login.
 */
export function sanitizeReturnTo(
  returnTo: string | null | undefined,
  fallback: string = "/"
): string {
  if (!returnTo || !returnTo.startsWith("/") || returnTo.startsWith("//")) {
    return fallback;
  }

  try {
    const parsed = new URL(returnTo, "https://example.com");
    if (parsed.origin !== "https://example.com") {
      return fallback;
    }
    return `${parsed.pathname}${parsed.search}${parsed.hash}`;
  } catch {
    return fallback;
  }
}

/**
 * Create an OAuth authorization URL with state and PKCE.
 * Store state and codeVerifier in short-lived HttpOnly cookies.
 */
export async function createAuthorizationUrl(
  config: OAuthProviderConfig,
  options: {
    prompt?: string;
    loginHint?: string;
  } = {}
): Promise<AuthorizationRequest> {
  const state = generateSecureToken(16);
  const codeVerifier = generateSecureToken(32);
  const codeChallenge = await sha256(codeVerifier);

  const params = new URLSearchParams({
    client_id: config.clientId,
    redirect_uri: config.redirectUri,
    response_type: "code",
    scope: config.scopes.join(" "),
    state,
    code_challenge: codeChallenge,
    code_challenge_method: "S256",
  });

  if (options.prompt) {
    params.set("prompt", options.prompt);
  }

  if (options.loginHint) {
    params.set("login_hint", options.loginHint);
  }

  return {
    url: `${config.authorizationEndpoint}?${params.toString()}`,
    state,
    codeVerifier,
  };
}

export async function exchangeCodeForToken(
  config: OAuthProviderConfig,
  code: string,
  codeVerifier: string
): Promise<TokenResponse> {
  const params = new URLSearchParams({
    client_id: config.clientId,
    code,
    redirect_uri: config.redirectUri,
    grant_type: "authorization_code",
    code_verifier: codeVerifier,
  });

  const headers: Record<string, string> = {
    "Content-Type": "application/x-www-form-urlencoded",
    Accept: "application/json",
  };

  const authMethod = config.tokenEndpointAuthMethod ?? "client_secret_basic";

  if (authMethod === "client_secret_basic") {
    if (!config.clientSecret) {
      throw new Error("Missing OAuth client secret for client_secret_basic");
    }
    headers.Authorization = `Basic ${encodeBasicAuth(
      config.clientId,
      config.clientSecret
    )}`;
  } else if (authMethod === "client_secret_post") {
    if (!config.clientSecret) {
      throw new Error("Missing OAuth client secret for client_secret_post");
    }
    params.set("client_secret", config.clientSecret);
  }

  const response = await fetch(config.tokenEndpoint, {
    method: "POST",
    headers,
    body: params.toString(),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Token exchange failed: ${error}`);
  }

  const data = (await response.json()) as Record<string, unknown>;

  return {
    accessToken: getRequiredString(
      data.access_token,
      "access_token",
      "token exchange"
    ),
    tokenType: getRequiredString(
      data.token_type,
      "token_type",
      "token exchange"
    ),
    expiresIn:
      typeof data.expires_in === "number" ? data.expires_in : undefined,
    refreshToken:
      typeof data.refresh_token === "string" ? data.refresh_token : undefined,
    scope: typeof data.scope === "string" ? data.scope : undefined,
    idToken: typeof data.id_token === "string" ? data.id_token : undefined,
  };
}

export function verifyState(
  callbackState: string | null,
  storedState: string | null
): boolean {
  if (!callbackState || !storedState) {
    return false;
  }
  return constantTimeEqual(callbackState, storedState);
}

export async function getGitHubUser(
  accessToken: string
): Promise<{ id: number; login: string }> {
  const response = await fetch("https://api.github.com/user", {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: "application/vnd.github+json",
    },
  });

  if (!response.ok) {
    throw new Error("Failed to fetch GitHub user");
  }

  const data = (await response.json()) as Record<string, unknown>;
  return {
    id: getRequiredNumber(data.id, "id", "GitHub user"),
    login: getRequiredString(data.login, "login", "GitHub user"),
  };
}

/**
 * GitHub often omits email from /user unless it is public.
 * Use /user/emails and require a verified address before linking accounts.
 */
export async function getGitHubVerifiedEmail(
  accessToken: string
): Promise<string | null> {
  const response = await fetch("https://api.github.com/user/emails", {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: "application/vnd.github+json",
    },
  });

  if (!response.ok) {
    throw new Error("Failed to fetch GitHub email addresses");
  }

  const emails = (await response.json()) as Array<Record<string, unknown>>;

  const primaryVerifiedEmail =
    emails.find(
      (entry) => entry.primary === true && entry.verified === true
    ) ??
    emails.find((entry) => entry.verified === true);

  if (!primaryVerifiedEmail || typeof primaryVerifiedEmail.email !== "string") {
    return null;
  }

  return primaryVerifiedEmail.email.toLowerCase();
}

export async function getGoogleUser(
  accessToken: string
): Promise<{
  sub: string;
  email: string;
  email_verified: boolean;
  name?: string;
}> {
  const response = await fetch(
    "https://openidconnect.googleapis.com/v1/userinfo",
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );

  if (!response.ok) {
    throw new Error("Failed to fetch Google user");
  }

  const data = (await response.json()) as Record<string, unknown>;
  return {
    sub: getRequiredString(data.sub, "sub", "Google user"),
    email: getRequiredString(data.email, "email", "Google user").toLowerCase(),
    email_verified: data.email_verified === true,
    name: typeof data.name === "string" ? data.name : undefined,
  };
}

export function getOAuthCookieOptions(secure: boolean = true) {
  return {
    httpOnly: true,
    secure,
    sameSite: "lax" as const,
    path: "/",
    maxAge: 60 * 10,
  };
}
