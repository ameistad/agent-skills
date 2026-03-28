/**
 * Password reset helpers for browser-based web apps.
 * Based on The Copenhagen Book:
 * https://thecopenhagenbook.com/password-reset
 *
 * Security properties:
 * - Reset links use high-entropy tokens
 * - Tokens are hashed with SHA-256 before storage
 * - Tokens are single-use
 * - Password reset invalidates every session for the user
 * - Reset marks the email as verified
 *
 * Pair this with:
 * - strict rate limiting on reset-request and reset-submit endpoints
 * - Referrer-Policy: strict-origin on reset pages
 * - MFA or other re-auth if the app requires it during reset
 */

const PASSWORD_RESET_EXPIRES_IN_SECONDS = 60 * 60; // 1 hour

interface DatabaseRow {
  [key: string]: unknown;
}

interface Queryable {
  execute(sql: string, params: unknown[]): Promise<void>;
  query(sql: string, params: unknown[]): Promise<{ rows: DatabaseRow[] }>;
}

interface DatabaseConnection extends Queryable {
  transaction<T>(callback: (tx: Queryable) => Promise<T>): Promise<T>;
}

export interface PasswordResetResult {
  userId: string;
  email: string;
}

function toUnixTimeSeconds(date: Date): number {
  return Math.floor(date.getTime() / 1000);
}

function addSeconds(date: Date, seconds: number): Date {
  return new Date(date.getTime() + seconds * 1000);
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

function generateSecureToken(byteLength: number = 32): string {
  const bytes = new Uint8Array(byteLength);
  crypto.getRandomValues(bytes);
  return encodeBase64Url(bytes);
}

async function hashToken(token: string): Promise<string> {
  const bytes = new TextEncoder().encode(token);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

export async function createPasswordResetToken(
  userId: string,
  email: string,
  db: DatabaseConnection
): Promise<{ token: string; expiresAt: Date }> {
  const now = new Date();
  const expiresAt = addSeconds(now, PASSWORD_RESET_EXPIRES_IN_SECONDS);
  const token = generateSecureToken(32);
  const tokenHash = await hashToken(token);

  await db.execute("DELETE FROM password_reset WHERE user_id = ?", [userId]);
  await db.execute(
    `INSERT INTO password_reset (
      id,
      user_id,
      email,
      token_hash,
      created_at,
      expires_at
    ) VALUES (?, ?, ?, ?, ?, ?)`,
    [
      crypto.randomUUID(),
      userId,
      email.trim().toLowerCase(),
      tokenHash,
      toUnixTimeSeconds(now),
      toUnixTimeSeconds(expiresAt),
    ]
  );

  return { token, expiresAt };
}

/**
 * Validate a reset token without changing the password yet.
 * Useful when showing the reset form after the user opens the email link.
 */
export async function validatePasswordResetToken(
  token: string,
  db: DatabaseConnection
): Promise<PasswordResetResult | null> {
  const tokenHash = await hashToken(token);
  const now = toUnixTimeSeconds(new Date());

  return db.transaction(async (tx) => {
    const result = await tx.query(
      `SELECT id, user_id, email, expires_at
       FROM password_reset
       WHERE token_hash = ?`,
      [tokenHash]
    );

    if (result.rows.length !== 1) {
      return null;
    }

    const row = result.rows[0];
    if (typeof row.expires_at !== "number" || row.expires_at < now) {
      await tx.execute("DELETE FROM password_reset WHERE id = ?", [row.id]);
      return null;
    }

    return {
      userId: String(row.user_id),
      email: String(row.email),
    };
  });
}

/**
 * Apply a password reset in one transaction.
 * The caller is responsible for hashing the new password first.
 */
export async function resetPasswordWithToken(
  token: string,
  newPasswordHash: string,
  db: DatabaseConnection
): Promise<PasswordResetResult | null> {
  const tokenHash = await hashToken(token);
  const now = toUnixTimeSeconds(new Date());

  return db.transaction(async (tx) => {
    const result = await tx.query(
      `SELECT id, user_id, email, expires_at
       FROM password_reset
       WHERE token_hash = ?`,
      [tokenHash]
    );

    if (result.rows.length !== 1) {
      return null;
    }

    const row = result.rows[0];
    if (typeof row.expires_at !== "number" || row.expires_at < now) {
      await tx.execute("DELETE FROM password_reset WHERE id = ?", [row.id]);
      return null;
    }

    const userId = String(row.user_id);
    const email = String(row.email);

    await tx.execute("DELETE FROM password_reset WHERE user_id = ?", [userId]);
    await tx.execute(
      `UPDATE user
       SET password_hash = ?, email_verified_at = COALESCE(email_verified_at, ?), updated_at = ?
       WHERE id = ?`,
      [newPasswordHash, now, now, userId]
    );
    await tx.execute("DELETE FROM session WHERE user_id = ?", [userId]);

    return { userId, email };
  });
}

/**
 * Build a token-bearing password reset URL.
 * Serve the reset page with Referrer-Policy: strict-origin.
 */
export function buildPasswordResetUrl(baseUrl: string, token: string): string {
  const url = new URL(`/reset-password/${encodeURIComponent(token)}`, baseUrl);
  return url.toString();
}

export const PASSWORD_RESET_SCHEMA = `
CREATE TABLE password_reset (
    id TEXT NOT NULL PRIMARY KEY,
    user_id TEXT NOT NULL,
    email TEXT NOT NULL,
    token_hash TEXT NOT NULL,
    created_at INTEGER NOT NULL,
    expires_at INTEGER NOT NULL,
    FOREIGN KEY (user_id) REFERENCES user(id) ON DELETE CASCADE
);

CREATE INDEX idx_password_reset_token_hash ON password_reset(token_hash);
CREATE INDEX idx_password_reset_user_id ON password_reset(user_id);
`;
