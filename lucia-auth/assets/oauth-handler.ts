/**
 * OAuth 2.0 Authorization Code Flow with PKCE
 * Based on Copenhagen Book: https://thecopenhagenbook.com/oauth
 *
 * Key security features:
 * - PKCE (Proof Key for Code Exchange) prevents authorization code interception
 * - State parameter prevents CSRF attacks
 * - All tokens stored in HttpOnly cookies
 */

/**
 * OAuth provider configuration.
 * Add your provider's endpoints here.
 */
export interface OAuthProviderConfig {
  clientId: string;
  clientSecret: string;
  authorizationEndpoint: string;
  tokenEndpoint: string;
  redirectUri: string;
  scopes: string[];
}

export const GITHUB_CONFIG: Partial<OAuthProviderConfig> = {
  authorizationEndpoint: "https://github.com/login/oauth/authorize",
  tokenEndpoint: "https://github.com/login/oauth/access_token",
  scopes: ["read:user", "user:email"],
};

export const GOOGLE_CONFIG: Partial<OAuthProviderConfig> = {
  authorizationEndpoint: "https://accounts.google.com/o/oauth2/v2/auth",
  tokenEndpoint: "https://oauth2.googleapis.com/token",
  scopes: ["openid", "email", "profile"],
};

/**
 * Generate a cryptographically secure random string.
 * Used for state and PKCE code verifier.
 * Returns a URL-safe base64 string with at least 112 bits of entropy.
 */
function generateSecureToken(byteLength: number = 32): string {
  const bytes = new Uint8Array(byteLength);
  crypto.getRandomValues(bytes);
  return btoa(String.fromCharCode(...bytes))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=/g, "");
}

/**
 * Generate SHA-256 hash for PKCE code challenge.
 */
async function sha256(plain: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(plain);
  const hash = await crypto.subtle.digest("SHA-256", data);
  return btoa(String.fromCharCode(...new Uint8Array(hash)))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=/g, "");
}

export interface AuthorizationRequest {
  url: string;
  state: string;
  codeVerifier: string;
}

/**
 * Create an OAuth authorization URL with state and PKCE.
 *
 * Store the returned state and codeVerifier in HttpOnly cookies
 * to verify the callback.
 */
export async function createAuthorizationUrl(
  config: OAuthProviderConfig
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

  return {
    url: `${config.authorizationEndpoint}?${params.toString()}`,
    state,
    codeVerifier,
  };
}

export interface TokenResponse {
  accessToken: string;
  tokenType: string;
  expiresIn?: number;
  refreshToken?: string;
  scope?: string;
  idToken?: string;
}

/**
 * Exchange authorization code for tokens.
 *
 * @param config - OAuth provider configuration
 * @param code - Authorization code from callback
 * @param codeVerifier - PKCE code verifier from cookie
 */
export async function exchangeCodeForToken(
  config: OAuthProviderConfig,
  code: string,
  codeVerifier: string
): Promise<TokenResponse> {
  const params = new URLSearchParams({
    client_id: config.clientId,
    client_secret: config.clientSecret,
    code,
    redirect_uri: config.redirectUri,
    grant_type: "authorization_code",
    code_verifier: codeVerifier,
  });

  const response = await fetch(config.tokenEndpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Accept: "application/json",
    },
    body: params.toString(),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Token exchange failed: ${error}`);
  }

  const data = await response.json();

  return {
    accessToken: data.access_token,
    tokenType: data.token_type,
    expiresIn: data.expires_in,
    refreshToken: data.refresh_token,
    scope: data.scope,
    idToken: data.id_token,
  };
}

/**
 * Verify the OAuth callback.
 *
 * @param callbackState - State from callback URL query params
 * @param storedState - State from cookie
 * @returns true if state matches
 */
export function verifyState(
  callbackState: string | null,
  storedState: string | null
): boolean {
  if (!callbackState || !storedState) {
    return false;
  }
  return callbackState === storedState;
}

/**
 * Fetch user info from GitHub API.
 */
export async function getGitHubUser(
  accessToken: string
): Promise<{ id: number; login: string; email: string | null }> {
  const response = await fetch("https://api.github.com/user", {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: "application/vnd.github+json",
    },
  });

  if (!response.ok) {
    throw new Error("Failed to fetch GitHub user");
  }

  return response.json();
}

/**
 * Fetch user info from Google API.
 */
export async function getGoogleUser(
  accessToken: string
): Promise<{ sub: string; email: string; email_verified: boolean; name: string }> {
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

  return response.json();
}

/**
 * Cookie options for OAuth state and PKCE verifier.
 * Short-lived since they're only needed during the OAuth flow.
 */
export function getOAuthCookieOptions(secure: boolean = true) {
  return {
    httpOnly: true,
    secure,
    sameSite: "lax" as const,
    path: "/",
    maxAge: 60 * 10, // 10 minutes
  };
}
