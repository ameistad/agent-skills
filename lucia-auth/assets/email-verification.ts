/**
 * Email verification flow
 * Based on Copenhagen Book: https://thecopenhagenbook.com/email-verification
 *
 * Two approaches:
 * 1. Verification codes (8+ digits) - for user input
 * 2. Verification links with tokens - for email click-through
 *
 * Key security features:
 * - Tokens with high entropy (120+ bits)
 * - Short expiration (15 min to 24 hours)
 * - Single use tokens
 * - Rate limiting on send
 */

const VERIFICATION_EXPIRES_IN_SECONDS = 60 * 60; // 1 hour

export interface EmailVerificationToken {
  id: string;
  userId: string;
  email: string;
  token: string;
  expiresAt: Date;
}

/**
 * Generate a cryptographically secure token for email verification links.
 * 120+ bits of entropy.
 */
function generateVerificationToken(): string {
  const bytes = new Uint8Array(24);
  crypto.getRandomValues(bytes);
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/**
 * Generate a numeric verification code for user input.
 * 8 digits provides adequate security with rate limiting.
 */
function generateVerificationCode(): string {
  const bytes = new Uint8Array(4);
  crypto.getRandomValues(bytes);
  const num =
    (bytes[0] << 24) | (bytes[1] << 16) | (bytes[2] << 8) | bytes[3];
  return String(Math.abs(num) % 100000000).padStart(8, "0");
}

/**
 * Create a verification token/code for email verification.
 *
 * @param userId - The user's ID
 * @param email - The email to verify
 * @param db - Database connection
 * @param useCode - Use numeric code instead of token (for manual input)
 */
export async function createEmailVerification(
  userId: string,
  email: string,
  db: DatabaseConnection,
  useCode: boolean = false
): Promise<{ token: string; expiresAt: Date }> {
  const id = crypto.randomUUID();
  const token = useCode ? generateVerificationCode() : generateVerificationToken();
  const expiresAt = new Date(
    Date.now() + VERIFICATION_EXPIRES_IN_SECONDS * 1000
  );

  await db.execute(
    `DELETE FROM email_verification WHERE user_id = ? AND email = ?`,
    [userId, email]
  );

  await db.execute(
    `INSERT INTO email_verification (id, user_id, email, token, expires_at)
     VALUES (?, ?, ?, ?, ?)`,
    [id, userId, email, token, Math.floor(expiresAt.getTime() / 1000)]
  );

  return { token, expiresAt };
}

/**
 * Verify an email verification token/code.
 * Deletes the token after successful verification.
 *
 * @returns The email address if valid, null otherwise
 */
export async function verifyEmailToken(
  userId: string,
  token: string,
  db: DatabaseConnection
): Promise<string | null> {
  const now = Math.floor(Date.now() / 1000);

  const result = await db.query(
    `SELECT id, email, expires_at FROM email_verification
     WHERE user_id = ? AND token = ?`,
    [userId, token]
  );

  if (result.rows.length !== 1) {
    return null;
  }

  const row = result.rows[0];

  if (row.expires_at < now) {
    await db.execute(`DELETE FROM email_verification WHERE id = ?`, [row.id]);
    return null;
  }

  await db.execute(`DELETE FROM email_verification WHERE id = ?`, [row.id]);

  await db.execute(`UPDATE user SET email_verified = 1 WHERE id = ?`, [userId]);

  return row.email as string;
}

/**
 * Build a verification URL for email links.
 */
export function buildVerificationUrl(
  baseUrl: string,
  token: string
): string {
  const url = new URL("/verify-email", baseUrl);
  url.searchParams.set("token", token);
  return url.toString();
}

/**
 * Basic email validation.
 * Checks for @ symbol and domain, avoids complex regex (ReDoS risk).
 */
export function validateEmail(email: string): boolean {
  if (email.length > 255) {
    return false;
  }

  const parts = email.split("@");
  if (parts.length !== 2) {
    return false;
  }

  const [local, domain] = parts;

  if (local.length === 0 || domain.length === 0) {
    return false;
  }

  if (!domain.includes(".")) {
    return false;
  }

  return true;
}

/**
 * SQL schema for email verification tokens.
 * Add this to your migrations.
 */
export const EMAIL_VERIFICATION_SCHEMA = `
CREATE TABLE email_verification (
    id TEXT NOT NULL PRIMARY KEY,
    user_id TEXT NOT NULL,
    email TEXT NOT NULL,
    token TEXT NOT NULL,
    expires_at INTEGER NOT NULL,
    FOREIGN KEY (user_id) REFERENCES user(id) ON DELETE CASCADE
);

CREATE INDEX idx_email_verification_user_email ON email_verification(user_id, email);
CREATE INDEX idx_email_verification_token ON email_verification(token);
`;

interface DatabaseConnection {
  execute(sql: string, params: unknown[]): Promise<void>;
  query(sql: string, params: unknown[]): Promise<{ rows: Record<string, unknown>[] }>;
}
