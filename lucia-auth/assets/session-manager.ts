/**
 * Session management helpers for server-side web auth.
 * Based on Lucia Auth and The Copenhagen Book:
 * - https://lucia-auth.com/sessions/basic
 * - https://lucia-auth.com/sessions/inactivity-timeout
 * - https://thecopenhagenbook.com/sessions
 *
 * Production defaults:
 * - Separate session ID and secret
 * - Hash the secret before storage
 * - Idle timeout plus absolute lifetime
 * - Fresh-session window for re-auth / sudo mode
 * - Optional metadata for anomaly detection
 */

export const SESSION_IDLE_TIMEOUT_SECONDS = 60 * 60 * 24 * 30; // 30 days
export const SESSION_ABSOLUTE_TIMEOUT_SECONDS = 60 * 60 * 24 * 90; // 90 days
export const SESSION_ACTIVITY_UPDATE_INTERVAL_SECONDS = 60 * 60; // 1 hour
export const SESSION_FRESH_WINDOW_SECONDS = 60 * 15; // 15 minutes

export interface Session {
  id: string;
  userId: string;
  secretHash: Uint8Array;
  createdAt: Date;
  lastVerifiedAt: Date;
  idleExpiresAt: Date;
  absoluteExpiresAt: Date;
  freshUntil: Date;
  ipAddress: string | null;
  userAgent: string | null;
}

export interface SessionWithToken extends Session {
  token: string;
}

export interface SessionMetadata {
  ipAddress?: string | null;
  userAgent?: string | null;
}

export interface SessionValidationResult {
  session: Session | null;
  shouldRefreshCookie: boolean;
}

interface DatabaseRow {
  [key: string]: unknown;
}

interface DatabaseConnection {
  execute(sql: string, params: unknown[]): Promise<void>;
  query(sql: string, params: unknown[]): Promise<{ rows: DatabaseRow[] }>;
}

function addSeconds(date: Date, seconds: number): Date {
  return new Date(date.getTime() + seconds * 1000);
}

function toUnixTimeSeconds(date: Date): number {
  return Math.floor(date.getTime() / 1000);
}

function fromUnixTimeSeconds(value: unknown): Date {
  if (typeof value === "number") {
    return new Date(value * 1000);
  }

  if (typeof value === "string") {
    const parsedValue = Number.parseInt(value, 10);
    if (!Number.isNaN(parsedValue)) {
      return new Date(parsedValue * 1000);
    }
  }

  throw new Error("Expected unix timestamp number");
}

function toUint8Array(value: unknown): Uint8Array {
  if (value instanceof Uint8Array) {
    return value;
  }
  if (value instanceof ArrayBuffer) {
    return new Uint8Array(value);
  }
  if (Array.isArray(value)) {
    return new Uint8Array(value);
  }
  throw new Error("Expected binary secret hash");
}

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

function generateSecureToken(byteLength: number): string {
  const bytes = new Uint8Array(byteLength);
  crypto.getRandomValues(bytes);
  return encodeBase64Url(bytes);
}

async function hashSecret(secret: string): Promise<Uint8Array> {
  const secretBytes = new TextEncoder().encode(secret);
  const hashBuffer = await crypto.subtle.digest("SHA-256", secretBytes);
  return new Uint8Array(hashBuffer);
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

function parseSessionToken(
  token: string
): { sessionId: string; sessionSecret: string } | null {
  const separatorIndex = token.indexOf(".");
  if (separatorIndex <= 0 || separatorIndex === token.length - 1) {
    return null;
  }

  if (token.indexOf(".", separatorIndex + 1) !== -1) {
    return null;
  }

  return {
    sessionId: token.slice(0, separatorIndex),
    sessionSecret: token.slice(separatorIndex + 1),
  };
}

/**
 * Create a brand new authenticated session.
 * Always issue a new session after login to avoid session fixation.
 */
export async function createSession(
  userId: string,
  db: DatabaseConnection,
  metadata: SessionMetadata = {}
): Promise<SessionWithToken> {
  const now = new Date();
  const tokenId = generateSecureToken(18); // 144 bits
  const tokenSecret = generateSecureToken(32); // 256 bits
  const token = `${tokenId}.${tokenSecret}`;
  const secretHash = await hashSecret(tokenSecret);

  const session: SessionWithToken = {
    id: tokenId,
    userId,
    secretHash,
    createdAt: now,
    lastVerifiedAt: now,
    idleExpiresAt: addSeconds(now, SESSION_IDLE_TIMEOUT_SECONDS),
    absoluteExpiresAt: addSeconds(now, SESSION_ABSOLUTE_TIMEOUT_SECONDS),
    freshUntil: addSeconds(now, SESSION_FRESH_WINDOW_SECONDS),
    ipAddress: metadata.ipAddress ?? null,
    userAgent: metadata.userAgent ?? null,
    token,
  };

  await db.execute(
    `INSERT INTO session (
      id,
      user_id,
      secret_hash,
      created_at,
      last_verified_at,
      idle_expires_at,
      absolute_expires_at,
      fresh_until,
      ip_address,
      user_agent
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      session.id,
      session.userId,
      session.secretHash,
      toUnixTimeSeconds(session.createdAt),
      toUnixTimeSeconds(session.lastVerifiedAt),
      toUnixTimeSeconds(session.idleExpiresAt),
      toUnixTimeSeconds(session.absoluteExpiresAt),
      toUnixTimeSeconds(session.freshUntil),
      session.ipAddress,
      session.userAgent,
    ]
  );

  return session;
}

/**
 * Validate a session token and refresh the inactivity window when needed.
 *
 * When `shouldRefreshCookie` is true, re-set the cookie so the browser
 * expiration stays aligned with the updated server-side inactivity timeout.
 */
export async function validateSessionToken(
  token: string,
  db: DatabaseConnection
): Promise<SessionValidationResult> {
  const parsedToken = parseSessionToken(token);
  if (parsedToken === null) {
    return { session: null, shouldRefreshCookie: false };
  }

  const session = await getSession(db, parsedToken.sessionId);
  if (session === null) {
    return { session: null, shouldRefreshCookie: false };
  }

  const tokenSecretHash = await hashSecret(parsedToken.sessionSecret);
  if (!constantTimeEqual(tokenSecretHash, session.secretHash)) {
    return { session: null, shouldRefreshCookie: false };
  }

  const now = new Date();
  if (now >= session.idleExpiresAt || now >= session.absoluteExpiresAt) {
    await deleteSession(db, session.id);
    return { session: null, shouldRefreshCookie: false };
  }

  const shouldUpdateActivity =
    now.getTime() - session.lastVerifiedAt.getTime() >=
    SESSION_ACTIVITY_UPDATE_INTERVAL_SECONDS * 1000;

  if (shouldUpdateActivity) {
    session.lastVerifiedAt = now;
    session.idleExpiresAt = addSeconds(now, SESSION_IDLE_TIMEOUT_SECONDS);
    await db.execute(
      "UPDATE session SET last_verified_at = ?, idle_expires_at = ? WHERE id = ?",
      [
        toUnixTimeSeconds(session.lastVerifiedAt),
        toUnixTimeSeconds(session.idleExpiresAt),
        session.id,
      ]
    );
  }

  return {
    session,
    shouldRefreshCookie: shouldUpdateActivity,
  };
}

export function isFreshSession(session: Session, now: Date = new Date()): boolean {
  return now < session.freshUntil;
}

/**
 * Mark a session as fresh again after a password, TOTP, or WebAuthn challenge.
 */
export async function markSessionFresh(
  db: DatabaseConnection,
  sessionId: string,
  now: Date = new Date()
): Promise<Date> {
  const freshUntil = addSeconds(now, SESSION_FRESH_WINDOW_SECONDS);
  await db.execute("UPDATE session SET fresh_until = ? WHERE id = ?", [
    toUnixTimeSeconds(freshUntil),
    sessionId,
  ]);
  return freshUntil;
}

/**
 * Replace an existing session with a brand new one.
 * Useful after privileged actions or suspected token leakage.
 */
export async function replaceSession(
  db: DatabaseConnection,
  sessionId: string,
  userId: string,
  metadata: SessionMetadata = {}
): Promise<SessionWithToken> {
  await deleteSession(db, sessionId);
  return createSession(userId, db, metadata);
}

export async function invalidateSession(
  db: DatabaseConnection,
  sessionId: string
): Promise<void> {
  await deleteSession(db, sessionId);
}

export async function invalidateAllUserSessions(
  db: DatabaseConnection,
  userId: string
): Promise<void> {
  await db.execute("DELETE FROM session WHERE user_id = ?", [userId]);
}

export async function deleteExpiredSessions(
  db: DatabaseConnection,
  now: Date = new Date()
): Promise<void> {
  const unixNow = toUnixTimeSeconds(now);
  await db.execute(
    "DELETE FROM session WHERE idle_expires_at <= ? OR absolute_expires_at <= ?",
    [unixNow, unixNow]
  );
}

async function getSession(
  db: DatabaseConnection,
  sessionId: string
): Promise<Session | null> {
  const result = await db.query(
    `SELECT
      id,
      user_id,
      secret_hash,
      created_at,
      last_verified_at,
      idle_expires_at,
      absolute_expires_at,
      fresh_until,
      ip_address,
      user_agent
    FROM session
    WHERE id = ?`,
    [sessionId]
  );

  if (result.rows.length !== 1) {
    return null;
  }

  const row = result.rows[0];
  return {
    id: String(row.id),
    userId: String(row.user_id),
    secretHash: toUint8Array(row.secret_hash),
    createdAt: fromUnixTimeSeconds(row.created_at),
    lastVerifiedAt: fromUnixTimeSeconds(row.last_verified_at),
    idleExpiresAt: fromUnixTimeSeconds(row.idle_expires_at),
    absoluteExpiresAt: fromUnixTimeSeconds(row.absolute_expires_at),
    freshUntil: fromUnixTimeSeconds(row.fresh_until),
    ipAddress:
      row.ip_address === null || row.ip_address === undefined
        ? null
        : String(row.ip_address),
    userAgent:
      row.user_agent === null || row.user_agent === undefined
        ? null
        : String(row.user_agent),
  };
}

async function deleteSession(
  db: DatabaseConnection,
  sessionId: string
): Promise<void> {
  await db.execute("DELETE FROM session WHERE id = ?", [sessionId]);
}

/**
 * Session cookie configuration for browser-based web apps.
 */
export function getSessionCookieOptions(
  secure: boolean = true,
  sameSite: "lax" | "strict" = "lax"
) {
  return {
    httpOnly: true,
    secure,
    sameSite,
    path: "/",
    maxAge: SESSION_IDLE_TIMEOUT_SECONDS,
  };
}
