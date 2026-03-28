/**
 * CSRF and request-origin helpers for cookie-based web auth.
 * Based on The Copenhagen Book:
 * https://thecopenhagenbook.com/csrf
 *
 * Recommended approach:
 * - Reject untrusted Origin headers on all non-GET browser requests
 * - For form-heavy apps, add signed double-submit CSRF tokens
 * - Never use GET for state-changing operations
 */

const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);

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

function decodeBase64(input: string): Uint8Array {
  const globalWithBuffer = globalThis as {
    Buffer?: {
      from(input: string, encoding: string): Uint8Array;
    };
  };

  if (globalWithBuffer.Buffer) {
    return globalWithBuffer.Buffer.from(input, "base64");
  }

  const binary = atob(input);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

function decodeBase64Url(input: string): Uint8Array {
  const normalized = input.replace(/-/g, "+").replace(/_/g, "/");
  const padding = normalized.length % 4;
  const padded = padding === 0 ? normalized : normalized + "=".repeat(4 - padding);
  return decodeBase64(padded);
}

function constantTimeEqual(a: Uint8Array, b: Uint8Array): boolean {
  if (a.byteLength !== b.byteLength) {
    return false;
  }

  let result = 0;
  for (let i = 0; i < a.byteLength; i++) {
    result |= a[i] ^ b[i];
  }
  return result === 0;
}

function splitToken(value: string): [string, string] | null {
  const separatorIndex = value.indexOf(".");
  if (separatorIndex <= 0 || separatorIndex === value.length - 1) {
    return null;
  }

  if (value.indexOf(".", separatorIndex + 1) !== -1) {
    return null;
  }

  return [value.slice(0, separatorIndex), value.slice(separatorIndex + 1)];
}

async function signValue(value: string, secret: string): Promise<Uint8Array> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );

  const signature = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(value)
  );

  return new Uint8Array(signature);
}

/**
 * Validate the request origin for cookie-authenticated browser requests.
 * Reject when the Origin header is missing on non-safe methods.
 * Use Referer as a fallback only if you intentionally support older clients.
 */
export function verifyRequestOrigin(
  method: string,
  originHeader: string | null,
  allowedOrigins: string[],
  refererHeader?: string | null
): boolean {
  if (SAFE_METHODS.has(method.toUpperCase())) {
    return true;
  }

  const allowed = new Set(allowedOrigins);

  if (originHeader) {
    return allowed.has(originHeader);
  }

  if (!refererHeader) {
    return false;
  }

  try {
    const refererUrl = new URL(refererHeader);
    return allowed.has(refererUrl.origin);
  } catch {
    return false;
  }
}

/**
 * Generate a signed double-submit CSRF token pair.
 * Store `cookieToken` in a Secure, HttpOnly cookie and embed `formToken`
 * in a form field or request header.
 */
export async function createCsrfTokenPair(
  sessionId: string,
  secret: string
): Promise<{ cookieToken: string; formToken: string }> {
  const randomBytes = new Uint8Array(32);
  crypto.getRandomValues(randomBytes);

  const cookieToken = encodeBase64Url(randomBytes);
  const signature = await signValue(`${cookieToken}.${sessionId}`, secret);

  return {
    cookieToken,
    formToken: `${cookieToken}.${encodeBase64Url(signature)}`,
  };
}

export async function verifyCsrfTokenPair(
  sessionId: string,
  cookieToken: string | null,
  formToken: string | null,
  secret: string
): Promise<boolean> {
  if (!cookieToken || !formToken) {
    return false;
  }

  const parts = splitToken(formToken);
  if (parts === null) {
    return false;
  }

  const [submittedToken, submittedSignature] = parts;
  if (submittedToken !== cookieToken) {
    return false;
  }

  const expectedSignature = await signValue(`${cookieToken}.${sessionId}`, secret);

  try {
    const providedSignature = decodeBase64Url(submittedSignature);
    return constantTimeEqual(expectedSignature, providedSignature);
  } catch {
    return false;
  }
}

export function getCsrfCookieOptions(secure: boolean = true) {
  return {
    httpOnly: true,
    secure,
    sameSite: "lax" as const,
    path: "/",
  };
}
