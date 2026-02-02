/**
 * Password hashing utilities using Argon2id
 * Based on Copenhagen Book best practices: https://thecopenhagenbook.com/password-authentication
 *
 * Argon2id is the recommended algorithm with these minimum parameters:
 * - Memory: 19MB (19456 KB)
 * - Iterations: 2
 * - Parallelism: 1
 *
 * This template uses the @node-rs/argon2 package for Node.js.
 * For other runtimes, adapt to your platform's Argon2 implementation.
 */

import { hash, verify, Options } from "@node-rs/argon2";

const ARGON2_OPTIONS: Options = {
  memoryCost: 19456, // 19 MB
  timeCost: 2, // 2 iterations
  parallelism: 1,
  outputLen: 32,
};

export async function hashPassword(password: string): Promise<string> {
  return hash(password, ARGON2_OPTIONS);
}

export async function verifyPassword(
  password: string,
  hashedPassword: string
): Promise<boolean> {
  try {
    return await verify(hashedPassword, password, ARGON2_OPTIONS);
  } catch {
    return false;
  }
}

/**
 * Password validation rules based on Copenhagen Book recommendations:
 * - Minimum 8 characters
 * - Maximum 256 characters (prevent DoS)
 * - All Unicode characters allowed including whitespace
 */
export interface PasswordValidationResult {
  valid: boolean;
  errors: string[];
}

export function validatePassword(password: string): PasswordValidationResult {
  const errors: string[] = [];

  if (password.length < 8) {
    errors.push("Password must be at least 8 characters long");
  }

  if (password.length > 256) {
    errors.push("Password must be at most 256 characters long");
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Check if a password has been compromised using the haveibeenpwned API.
 * Uses k-anonymity: only sends first 5 characters of SHA-1 hash.
 *
 * Returns the number of times the password appeared in breaches, or 0 if not found.
 */
export async function checkPasswordBreached(
  password: string
): Promise<number> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest("SHA-1", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map((b) => b.toString(16).padStart(2, "0")).join("").toUpperCase();

  const prefix = hashHex.slice(0, 5);
  const suffix = hashHex.slice(5);

  const response = await fetch(
    `https://api.pwnedpasswords.com/range/${prefix}`,
    {
      headers: {
        "Add-Padding": "true",
      },
    }
  );

  if (!response.ok) {
    throw new Error(`haveibeenpwned API error: ${response.status}`);
  }

  const text = await response.text();
  const lines = text.split("\n");

  for (const line of lines) {
    const [hashSuffix, count] = line.split(":");
    if (hashSuffix === suffix) {
      return parseInt(count.trim(), 10);
    }
  }

  return 0;
}
