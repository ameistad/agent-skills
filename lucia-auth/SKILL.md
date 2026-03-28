---
name: lucia-auth
description: Build production-ready web authentication using Lucia Auth and The Copenhagen Book patterns. Use when users ask to "add auth", "implement authentication", "setup login", "add sessions", "password reset", "verify email", "implement OAuth", "add 2FA/MFA", "add passkeys", "password hashing", or reference "lucia auth" or "the copenhagen book". Default to a production baseline for browser-based web apps, not a demo-only login flow.
---

# Lucia Auth

Implements secure, production-oriented authentication using the patterns from [Lucia Auth](https://lucia-auth.com) and [The Copenhagen Book](https://thecopenhagenbook.com).

## Overview

For browser-based web apps, treat auth as a system instead of a pair of login routes. If a user asks to "add auth" and does not explicitly ask for a toy example, ship a production baseline by default.

## Production Baseline For Web Apps

When the repo does not already provide equivalents, the default baseline is:

1. Email/password sign up, sign in, and sign out
2. Server-side sessions in `HttpOnly`, `Secure`, `SameSite` cookies
3. Email verification plus resend flow
4. Password reset flow
5. Rate limiting on every auth and email-sending endpoint
6. CSRF protection or strict `Origin` validation on every state-changing route
7. Session invalidation on password change, email verification/change, and permission changes
8. Re-authentication ("sudo mode") for sensitive actions such as changing password/email, deleting account, disabling MFA, or viewing API keys
9. Safe post-auth redirects with open-redirect protection
10. Optional OAuth, TOTP, or WebAuthn layered on top as requested

Do not default to JWTs in `localStorage` for a normal web app. Prefer server-side sessions unless the architecture clearly requires stateless tokens.

## Required Reference Reads

For any browser-based web auth task, always read these first:

- `references/copenhagen-book/password-authentication.md`
- `references/copenhagen-book/sessions.md`
- `references/copenhagen-book/csrf.md`
- `references/copenhagen-book/email-verification.md`
- `references/copenhagen-book/password-reset.md`
- `references/copenhagen-book/open-redirect.md`
- `references/lucia/sessions-basic.md`
- `references/lucia/sessions-inactivity-timeout.md`
- `references/lucia/rate-limit-token-bucket.md`

Read these when relevant:

- OAuth: `references/copenhagen-book/oauth.md`, then `references/lucia/tutorial-github-oauth.md` or `references/lucia/tutorial-google-oauth.md`
- MFA: `references/copenhagen-book/mfa.md`
- WebAuthn / passkeys: `references/copenhagen-book/webauthn.md`, then `references/lucia/example-email-password-2fa-webauthn.md`
- Session tradeoffs: `references/lucia/sessions-overview.md`, `references/lucia/sessions-stateless-tokens.md`

## Implementation Workflow

1. Inspect the repo for existing auth, user, email, session, middleware, and database patterns.
2. Decide the auth surface area.
   For a standard web app, default to the production baseline above.
3. Create or update the auth schema first.
   At minimum: `user`, `session`, `email_verification`, and `password_reset`.
   Add `oauth_account`, `user_totp`, `user_recovery_code`, or WebAuthn tables only when needed.
4. Implement secure primitives next.
   Password hashing, session issuance/validation, CSRF/origin checks, rate limiting, token generation, and redirect validation.
5. Wire complete user flows.
   Registration, login, logout, verify email, resend verification, forgot password, reset password, change password, and revoke sessions.
6. Add sensitive-action re-auth.
   Changing email/password, account deletion, disabling MFA, or security settings should require a fresh session or a new credential challenge.
7. Verify behavior.
   Confirm cookie flags, rate limits, invalidation behavior, expired-token handling, and unhappy paths.

## Security Rules

### Passwords

- Hash passwords with Argon2id. Scrypt is an acceptable fallback, bcrypt only for legacy constraints.
- Minimum length is 8 characters. Do not set a low maximum; 64-256 is a reasonable bound.
- Do not silently trim, normalize, or truncate passwords.
- Allow copy/paste and password managers.
- Check leaked passwords with haveibeenpwned when practical.
- Recommend MFA for security-sensitive apps and require it when the app meaningfully needs it.

### Emails

- Normalize emails to lowercase before storing or comparing.
- Keep validation simple to avoid ReDoS.
- Do not silently remove `+tag` segments.
- If email is used for identity recovery, implement verification before treating it as trusted.

### Sessions

- Create a brand new session on login. Never reuse a pre-auth or anonymous session after authentication.
- Store a hash of the session secret, not the raw secret.
- Prefer idle expiration plus an absolute lifetime.
- Track session freshness for re-auth flows.
- Invalidate all sessions when credentials or privileges change.
- Never accept session tokens through URLs.

### Cookies

- Use `HttpOnly`, `Secure`, `Path=/`, and `SameSite=Lax` by default.
- Use `SameSite=Strict` only when the UX tradeoff is acceptable.
- Refresh long-lived cookies when the server refreshes the session inactivity window.

### CSRF

- Do not mutate state with `GET`.
- Check `Origin` on all non-GET browser requests and reject when missing or untrusted.
- For form-heavy apps, add CSRF tokens as a second layer.
- Keep CORS strict so CSRF tokens cannot be harvested cross-origin.

### OAuth / OIDC

- Use Authorization Code + PKCE.
- Verify `state` and the code verifier on callback.
- Prefer `client_secret_basic` when the provider supports it.
- Link accounts by provider subject first, and only auto-link by email when the provider explicitly marks the email as verified.
- Sanitize any post-login `returnTo` or `redirect_to` value to same-origin paths only.

### Verification And Reset Tokens

- Use high-entropy random tokens for links.
- Hash link tokens before storage with SHA-256.
- Keep tokens single-use and expire them automatically.
- Put token-bearing pages behind `Referrer-Policy: strict-origin`.
- Email-sending endpoints must be strictly rate limited.

## Template Map

Use these assets as starting points and adapt them to the framework and ORM already in the repo:

- Password hashing and password policy: `assets/password-utils.ts`
- Session issuance, validation, inactivity timeout, and fresh-session helpers: `assets/session-manager.ts`
- Core SQL schema: `assets/session-schema.sql`
- Email verification links and codes: `assets/email-verification.ts`
- Password reset flow: `assets/password-reset.ts`
- OAuth + PKCE flow helpers: `assets/oauth-handler.ts`
- CSRF and origin validation helpers: `assets/csrf-protection.ts`
- Token bucket rate limiting: `assets/rate-limit.ts`
- TOTP MFA and recovery codes: `assets/totp-mfa.ts`

## When To Escalate Beyond The Baseline

Add WebAuthn or passkeys when:

- The user explicitly asks for passkeys or WebAuthn
- The product is security-sensitive
- The app wants phishing-resistant MFA

Add OAuth when:

- The product already uses external identity providers
- The user explicitly asks for social login
- The app benefits from lower signup friction

Use stateless tokens only when:

- The app is an API-first system that cannot rely on same-origin cookies, or
- There is a clear multi-service architecture reason

## Output Expectations

When using this skill, the final answer should make it clear:

1. Which auth flows were implemented
2. Which security controls were included by default
3. Any remaining assumptions or provider-specific configuration the user must supply
4. What was verified locally and what still needs integration testing
