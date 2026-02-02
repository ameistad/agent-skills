/**
 * Time-based One-Time Password (TOTP) implementation
 * Based on Copenhagen Book: https://thecopenhagenbook.com/mfa
 *
 * Implements RFC 6238 (TOTP) and RFC 4226 (HOTP)
 *
 * Key security features:
 * - 160-bit secret (HMAC-SHA1 requirement)
 * - 30-second time windows
 * - Throttling after failed attempts
 */

const TOTP_PERIOD = 30; // seconds
const TOTP_DIGITS = 6;
const SECRET_LENGTH = 20; // 160 bits = 20 bytes

/**
 * Generate a cryptographically secure TOTP secret.
 * Returns raw bytes (20 bytes = 160 bits for HMAC-SHA1).
 */
export function generateTOTPSecret(): Uint8Array {
  const secret = new Uint8Array(SECRET_LENGTH);
  crypto.getRandomValues(secret);
  return secret;
}

/**
 * Encode bytes to Base32 for use in authenticator apps.
 */
export function encodeBase32(bytes: Uint8Array): string {
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
  let result = "";
  let bits = 0;
  let value = 0;

  for (let i = 0; i < bytes.length; i++) {
    value = (value << 8) | bytes[i];
    bits += 8;

    while (bits >= 5) {
      result += alphabet[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }

  if (bits > 0) {
    result += alphabet[(value << (5 - bits)) & 31];
  }

  return result;
}

/**
 * Decode Base32 to bytes.
 */
export function decodeBase32(str: string): Uint8Array {
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
  const lookup = new Map<string, number>();
  for (let i = 0; i < alphabet.length; i++) {
    lookup.set(alphabet[i], i);
  }

  const cleanStr = str.toUpperCase().replace(/=+$/, "");
  const bytes: number[] = [];
  let bits = 0;
  let value = 0;

  for (const char of cleanStr) {
    const charValue = lookup.get(char);
    if (charValue === undefined) {
      throw new Error(`Invalid Base32 character: ${char}`);
    }

    value = (value << 5) | charValue;
    bits += 5;

    if (bits >= 8) {
      bytes.push((value >>> (bits - 8)) & 255);
      bits -= 8;
    }
  }

  return new Uint8Array(bytes);
}

/**
 * Generate a TOTP URI for QR code generation.
 * Scan this with an authenticator app like Google Authenticator or Authy.
 *
 * @param issuer - Your app name
 * @param accountName - User identifier (email or username)
 * @param secret - The TOTP secret bytes
 */
export function generateTOTPUri(
  issuer: string,
  accountName: string,
  secret: Uint8Array
): string {
  const encodedSecret = encodeBase32(secret);
  const encodedIssuer = encodeURIComponent(issuer);
  const encodedAccount = encodeURIComponent(accountName);

  return `otpauth://totp/${encodedIssuer}:${encodedAccount}?secret=${encodedSecret}&issuer=${encodedIssuer}&algorithm=SHA1&digits=${TOTP_DIGITS}&period=${TOTP_PERIOD}`;
}

/**
 * Generate a TOTP code for the current time.
 */
export async function generateTOTP(secret: Uint8Array): Promise<string> {
  const counter = Math.floor(Date.now() / 1000 / TOTP_PERIOD);
  return generateHOTP(secret, counter);
}

/**
 * Generate an HOTP code (base for TOTP).
 */
async function generateHOTP(
  secret: Uint8Array,
  counter: number
): Promise<string> {
  const counterBytes = new Uint8Array(8);
  const view = new DataView(counterBytes.buffer);
  view.setBigUint64(0, BigInt(counter), false);

  const key = await crypto.subtle.importKey(
    "raw",
    secret,
    { name: "HMAC", hash: "SHA-1" },
    false,
    ["sign"]
  );

  const signature = await crypto.subtle.sign("HMAC", key, counterBytes);
  const hmac = new Uint8Array(signature);

  const offset = hmac[hmac.length - 1] & 0x0f;
  const binary =
    ((hmac[offset] & 0x7f) << 24) |
    ((hmac[offset + 1] & 0xff) << 16) |
    ((hmac[offset + 2] & 0xff) << 8) |
    (hmac[offset + 3] & 0xff);

  const otp = binary % Math.pow(10, TOTP_DIGITS);
  return String(otp).padStart(TOTP_DIGITS, "0");
}

/**
 * Validate a TOTP code.
 * Allows for 1 time window of drift in either direction.
 *
 * @param secret - The user's TOTP secret
 * @param code - The code provided by the user
 * @returns true if the code is valid
 */
export async function validateTOTP(
  secret: Uint8Array,
  code: string
): Promise<boolean> {
  if (code.length !== TOTP_DIGITS) {
    return false;
  }

  const currentCounter = Math.floor(Date.now() / 1000 / TOTP_PERIOD);

  for (let i = -1; i <= 1; i++) {
    const expectedCode = await generateHOTP(secret, currentCounter + i);
    if (constantTimeEqual(code, expectedCode)) {
      return true;
    }
  }

  return false;
}

/**
 * Constant-time string comparison.
 */
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

/**
 * Generate recovery codes.
 * These are single-use backup codes for when users lose access to their authenticator.
 *
 * @param count - Number of recovery codes to generate (typically 8-10)
 * @returns Array of recovery codes (10 hex characters each)
 */
export function generateRecoveryCodes(count: number = 8): string[] {
  const codes: string[] = [];

  for (let i = 0; i < count; i++) {
    const bytes = new Uint8Array(5); // 40 bits
    crypto.getRandomValues(bytes);
    const code = Array.from(bytes)
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
    codes.push(code);
  }

  return codes;
}

/**
 * SQL schema for TOTP secrets and recovery codes.
 */
export const TOTP_SCHEMA = `
-- TOTP secrets
CREATE TABLE user_totp (
    user_id TEXT NOT NULL PRIMARY KEY,
    secret BLOB NOT NULL,
    created_at INTEGER NOT NULL,
    FOREIGN KEY (user_id) REFERENCES user(id) ON DELETE CASCADE
);

-- Recovery codes (hashed with Argon2id)
CREATE TABLE user_recovery_code (
    id TEXT NOT NULL PRIMARY KEY,
    user_id TEXT NOT NULL,
    code_hash TEXT NOT NULL,
    used_at INTEGER,
    FOREIGN KEY (user_id) REFERENCES user(id) ON DELETE CASCADE
);

CREATE INDEX idx_recovery_code_user ON user_recovery_code(user_id);
`;

/**
 * Example usage:
 *
 * // Setup TOTP for a user
 * const secret = generateTOTPSecret();
 * const uri = generateTOTPUri("MyApp", "user@example.com", secret);
 * // Display QR code with the URI
 * // Store secret in database after user verifies with a code
 *
 * // Verify TOTP during login
 * const isValid = await validateTOTP(storedSecret, userProvidedCode);
 * if (!isValid) {
 *   // Increment failed attempt counter
 *   // Lock account after 5 failures for 15-60 minutes
 * }
 */
