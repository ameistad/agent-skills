/**
 * Email verification helpers for sign-up and change-email flows.
 * Based on The Copenhagen Book:
 * https://thecopenhagenbook.com/email-verification
 *
 * Security properties:
 * - Link tokens are high entropy and hashed with SHA-256 before storage
 * - Numeric codes are low entropy and hashed with Argon2id before storage
 * - Tokens and codes are single-use
 * - Verification invalidates all user sessions so trust state is refreshed
 *
 * Pair this with:
 * - strict rate limiting on send + verify endpoints
 * - Referrer-Policy: strict-origin on token-bearing pages
 * - re-authentication before change-email flows
 */

import { hash, verify, type Options } from "@node-rs/argon2";

const VERIFICATION_EXPIRES_IN_SECONDS = 60 * 60; // 1 hour
const VERIFICATION_CODE_LENGTH = 8;

const CODE_HASH_OPTIONS: Options = {
  memoryCost: 19456,
  timeCost: 2,
  parallelism: 1,
  outputLen: 32,
};

export type EmailVerificationPurpose = "sign_up" | "change_email";

export interface EmailVerificationResult {
  userId: string;
  email: string;
  purpose: EmailVerificationPurpose;
}

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

function generateVerificationCode(): string {
  const bytes = new Uint8Array(4);
  crypto.getRandomValues(bytes);
  const value =
    (bytes[0] << 24) |
    (bytes[1] << 16) |
    (bytes[2] << 8) |
    bytes[3];

  return String(Math.abs(value) % 10 ** VERIFICATION_CODE_LENGTH).padStart(
    VERIFICATION_CODE_LENGTH,
    "0"
  );
}

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function validateEmail(email: string): boolean {
  if (email !== email.trim()) {
    return false;
  }

  const normalizedEmail = email.toLowerCase();
  if (normalizedEmail.length === 0 || normalizedEmail.length > 255) {
    return false;
  }

  const parts = normalizedEmail.split("@");
  if (parts.length !== 2) {
    return false;
  }

  const [local, domain] = parts;
  if (local.length === 0 || domain.length < 3 || !domain.includes(".")) {
    return false;
  }
  return true;
}

/**
 * Create a link-based verification token.
 * This is the safest default for most web apps.
 */
export async function createEmailVerificationLink(
  userId: string,
  email: string,
  db: DatabaseConnection,
  purpose: EmailVerificationPurpose = "sign_up"
): Promise<{ token: string; expiresAt: Date }> {
  const normalizedEmail = normalizeEmail(email);
  const token = generateSecureToken(32);
  const tokenHash = await hashToken(token);
  const now = new Date();
  const expiresAt = addSeconds(now, VERIFICATION_EXPIRES_IN_SECONDS);

  await db.execute(
    "DELETE FROM email_verification WHERE user_id = ? AND purpose = ?",
    [userId, purpose]
  );

  await db.execute(
    `INSERT INTO email_verification (
      id,
      user_id,
      email,
      purpose,
      verification_type,
      token_hash,
      code_hash,
      created_at,
      expires_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      crypto.randomUUID(),
      userId,
      normalizedEmail,
      purpose,
      "link",
      tokenHash,
      null,
      toUnixTimeSeconds(now),
      toUnixTimeSeconds(expiresAt),
    ]
  );

  return { token, expiresAt };
}

/**
 * Create a code-based verification challenge.
 * Only use this together with strong user-scoped rate limits.
 */
export async function createEmailVerificationCode(
  userId: string,
  email: string,
  db: DatabaseConnection,
  purpose: EmailVerificationPurpose = "sign_up"
): Promise<{ code: string; expiresAt: Date }> {
  const normalizedEmail = normalizeEmail(email);
  const code = generateVerificationCode();
  const codeHash = await hash(code, CODE_HASH_OPTIONS);
  const now = new Date();
  const expiresAt = addSeconds(now, VERIFICATION_EXPIRES_IN_SECONDS);

  await db.execute(
    "DELETE FROM email_verification WHERE user_id = ? AND purpose = ?",
    [userId, purpose]
  );

  await db.execute(
    `INSERT INTO email_verification (
      id,
      user_id,
      email,
      purpose,
      verification_type,
      token_hash,
      code_hash,
      created_at,
      expires_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      crypto.randomUUID(),
      userId,
      normalizedEmail,
      purpose,
      "code",
      null,
      codeHash,
      toUnixTimeSeconds(now),
      toUnixTimeSeconds(expiresAt),
    ]
  );

  return { code, expiresAt };
}

/**
 * Verify a link token and apply the verified email state.
 * For sign-up this marks the existing email as verified.
 * For change-email this promotes the pending email onto the user record.
 */
export async function verifyEmailLink(
  token: string,
  db: DatabaseConnection
): Promise<EmailVerificationResult | null> {
  const tokenHash = await hashToken(token);
  const now = toUnixTimeSeconds(new Date());

  return db.transaction(async (tx) => {
    const result = await tx.query(
      `SELECT id, user_id, email, purpose, expires_at
       FROM email_verification
       WHERE verification_type = ? AND token_hash = ?`,
      ["link", tokenHash]
    );

    if (result.rows.length !== 1) {
      return null;
    }

    const row = result.rows[0];
    if (typeof row.expires_at !== "number" || row.expires_at < now) {
      await tx.execute("DELETE FROM email_verification WHERE id = ?", [row.id]);
      return null;
    }

    const verification = {
      userId: String(row.user_id),
      email: String(row.email),
      purpose: String(row.purpose) as EmailVerificationPurpose,
    };

    await applyEmailVerification(tx, verification, now);
    await tx.execute("DELETE FROM email_verification WHERE user_id = ?", [
      verification.userId,
    ]);
    await tx.execute("DELETE FROM session WHERE user_id = ?", [
      verification.userId,
    ]);

    return verification;
  });
}

/**
 * Verify a user-entered numeric code and apply the verified email state.
 */
export async function verifyEmailCode(
  userId: string,
  code: string,
  db: DatabaseConnection
): Promise<EmailVerificationResult | null> {
  if (!new RegExp(`^\\d{${VERIFICATION_CODE_LENGTH}}$`).test(code)) {
    return null;
  }

  const now = toUnixTimeSeconds(new Date());

  return db.transaction(async (tx) => {
    const result = await tx.query(
      `SELECT id, user_id, email, purpose, code_hash, expires_at
       FROM email_verification
       WHERE user_id = ? AND verification_type = ?`,
      [userId, "code"]
    );

    for (const row of result.rows) {
      if (typeof row.expires_at !== "number") {
        continue;
      }

      if (row.expires_at < now) {
        await tx.execute("DELETE FROM email_verification WHERE id = ?", [row.id]);
        continue;
      }

      const codeHash = row.code_hash;
      if (typeof codeHash !== "string") {
        continue;
      }

      const matches = await verify(codeHash, code, CODE_HASH_OPTIONS);
      if (!matches) {
        continue;
      }

      const verification = {
        userId: String(row.user_id),
        email: String(row.email),
        purpose: String(row.purpose) as EmailVerificationPurpose,
      };

      await applyEmailVerification(tx, verification, now);
      await tx.execute("DELETE FROM email_verification WHERE user_id = ?", [
        verification.userId,
      ]);
      await tx.execute("DELETE FROM session WHERE user_id = ?", [
        verification.userId,
      ]);

      return verification;
    }

    return null;
  });
}

async function applyEmailVerification(
  tx: Queryable,
  verification: EmailVerificationResult,
  now: number
): Promise<void> {
  if (verification.purpose === "change_email") {
    await tx.execute(
      `UPDATE user
       SET email = ?, email_verified_at = ?, updated_at = ?
       WHERE id = ?`,
      [verification.email, now, now, verification.userId]
    );
    return;
  }

  await tx.execute(
    `UPDATE user
     SET email_verified_at = COALESCE(email_verified_at, ?), updated_at = ?
     WHERE id = ?`,
    [now, now, verification.userId]
  );
}

/**
 * Build a token-bearing verification URL.
 * Serve this page with Referrer-Policy: strict-origin.
 */
export function buildVerificationUrl(baseUrl: string, token: string): string {
  const url = new URL(`/verify-email/${encodeURIComponent(token)}`, baseUrl);
  return url.toString();
}

export const EMAIL_VERIFICATION_SCHEMA = `
CREATE TABLE email_verification (
    id TEXT NOT NULL PRIMARY KEY,
    user_id TEXT NOT NULL,
    email TEXT NOT NULL,
    purpose TEXT NOT NULL,
    verification_type TEXT NOT NULL,
    token_hash TEXT,
    code_hash TEXT,
    created_at INTEGER NOT NULL,
    expires_at INTEGER NOT NULL,
    FOREIGN KEY (user_id) REFERENCES user(id) ON DELETE CASCADE
);

CREATE INDEX idx_email_verification_user_purpose
    ON email_verification(user_id, purpose);
CREATE INDEX idx_email_verification_token_hash
    ON email_verification(token_hash);
`;
