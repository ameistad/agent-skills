/**
 * Session management utilities
 * Based on Lucia Auth: https://lucia-auth.com/sessions/basic-implementation
 *
 * Key security features:
 * - Separate session ID and secret (prevents timing attacks)
 * - Secret is hashed before storage
 * - Constant-time comparison for secret validation
 * - Sliding expiration window for active users
 */

const SESSION_EXPIRES_IN_SECONDS = 60 * 60 * 24 * 30; // 30 days
const SESSION_REFRESH_THRESHOLD = SESSION_EXPIRES_IN_SECONDS / 2; // 15 days

export interface Session {
  id: string;
  userId: string;
  secretHash: Uint8Array;
  createdAt: Date;
  expiresAt: Date;
}

export interface SessionWithToken extends Session {
  token: string;
}

/**
 * Generate a cryptographically secure random string.
 * Uses a human-readable alphabet with 120 bits of entropy.
 */
function generateSecureRandomString(): string {
  const alphabet = "abcdefghijkmnpqrstuvwxyz23456789";
  const bytes = new Uint8Array(24);
  crypto.getRandomValues(bytes);

  let result = "";
  for (let i = 0; i < bytes.length; i++) {
    result += alphabet[bytes[i] >> 3];
  }
  return result;
}

/**
 * Hash a secret using SHA-256.
 * Safe for high-entropy secrets (120+ bits).
 */
async function hashSecret(secret: string): Promise<Uint8Array> {
  const secretBytes = new TextEncoder().encode(secret);
  const hashBuffer = await crypto.subtle.digest("SHA-256", secretBytes);
  return new Uint8Array(hashBuffer);
}

/**
 * Constant-time comparison to prevent timing attacks.
 */
function constantTimeEqual(a: Uint8Array, b: Uint8Array): boolean {
  if (a.byteLength !== b.byteLength) {
    return false;
  }
  let c = 0;
  for (let i = 0; i < a.byteLength; i++) {
    c |= a[i] ^ b[i];
  }
  return c === 0;
}

/**
 * Create a new session for a user.
 *
 * @param userId - The ID of the user
 * @param db - Your database connection (adapt to your ORM/driver)
 * @returns Session with token to send to client
 */
export async function createSession(
  userId: string,
  db: DatabaseConnection
): Promise<SessionWithToken> {
  const now = new Date();
  const expiresAt = new Date(now.getTime() + SESSION_EXPIRES_IN_SECONDS * 1000);

  const id = generateSecureRandomString();
  const secret = generateSecureRandomString();
  const secretHash = await hashSecret(secret);
  const token = `${id}.${secret}`;

  const session: SessionWithToken = {
    id,
    userId,
    secretHash,
    createdAt: now,
    expiresAt,
    token,
  };

  await db.execute(
    "INSERT INTO session (id, user_id, secret_hash, created_at, expires_at) VALUES (?, ?, ?, ?, ?)",
    [
      session.id,
      session.userId,
      session.secretHash,
      Math.floor(session.createdAt.getTime() / 1000),
      Math.floor(session.expiresAt.getTime() / 1000),
    ]
  );

  return session;
}

/**
 * Validate a session token.
 * Returns the session if valid, null otherwise.
 * Automatically extends expiration for active sessions.
 *
 * @param token - The session token from client (format: "id.secret")
 * @param db - Your database connection
 */
export async function validateSessionToken(
  token: string,
  db: DatabaseConnection
): Promise<Session | null> {
  const tokenParts = token.split(".");
  if (tokenParts.length !== 2) {
    return null;
  }

  const [sessionId, sessionSecret] = tokenParts;
  const session = await getSession(db, sessionId);

  if (!session) {
    return null;
  }

  const tokenSecretHash = await hashSecret(sessionSecret);
  if (!constantTimeEqual(tokenSecretHash, session.secretHash)) {
    return null;
  }

  const now = new Date();

  if (now >= session.expiresAt) {
    await deleteSession(db, sessionId);
    return null;
  }

  const shouldRefresh =
    session.expiresAt.getTime() - now.getTime() <
    SESSION_REFRESH_THRESHOLD * 1000;

  if (shouldRefresh) {
    session.expiresAt = new Date(
      now.getTime() + SESSION_EXPIRES_IN_SECONDS * 1000
    );
    await updateSessionExpiration(db, sessionId, session.expiresAt);
  }

  return session;
}

/**
 * Invalidate a session (sign out).
 */
export async function invalidateSession(
  db: DatabaseConnection,
  sessionId: string
): Promise<void> {
  await deleteSession(db, sessionId);
}

/**
 * Invalidate all sessions for a user.
 * Use after password change or security events.
 */
export async function invalidateAllUserSessions(
  db: DatabaseConnection,
  userId: string
): Promise<void> {
  await db.execute("DELETE FROM session WHERE user_id = ?", [userId]);
}

async function getSession(
  db: DatabaseConnection,
  sessionId: string
): Promise<Session | null> {
  const result = await db.query(
    "SELECT id, user_id, secret_hash, created_at, expires_at FROM session WHERE id = ?",
    [sessionId]
  );

  if (result.rows.length !== 1) {
    return null;
  }

  const row = result.rows[0];
  return {
    id: row.id,
    userId: row.user_id,
    secretHash: row.secret_hash,
    createdAt: new Date(row.created_at * 1000),
    expiresAt: new Date(row.expires_at * 1000),
  };
}

async function deleteSession(
  db: DatabaseConnection,
  sessionId: string
): Promise<void> {
  await db.execute("DELETE FROM session WHERE id = ?", [sessionId]);
}

async function updateSessionExpiration(
  db: DatabaseConnection,
  sessionId: string,
  expiresAt: Date
): Promise<void> {
  await db.execute("UPDATE session SET expires_at = ? WHERE id = ?", [
    Math.floor(expiresAt.getTime() / 1000),
    sessionId,
  ]);
}

/**
 * Cookie configuration for session tokens.
 * Based on Copenhagen Book: https://thecopenhagenbook.com/sessions
 */
export function getSessionCookieOptions(secure: boolean = true) {
  return {
    httpOnly: true,
    secure,
    sameSite: "lax" as const,
    path: "/",
    maxAge: SESSION_EXPIRES_IN_SECONDS,
  };
}

/**
 * Placeholder type - replace with your actual database connection type
 */
interface DatabaseConnection {
  execute(sql: string, params: unknown[]): Promise<void>;
  query(sql: string, params: unknown[]): Promise<{ rows: Record<string, unknown>[] }>;
}
