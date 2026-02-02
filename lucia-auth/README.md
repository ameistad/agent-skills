# lucia-auth

Implement secure authentication following the patterns from [Lucia Auth](https://lucia-auth.com) and [The Copenhagen Book](https://thecopenhagenbook.com).

## Installation

```bash
npx skills add https://github.com/ameistad/agent-skills --skill lucia-auth
```

## Usage

Ask your AI assistant to implement authentication:

- "Add authentication to my app"
- "Implement login with Google OAuth"
- "Add 2FA to my existing auth"
- "Setup session management"
- "Add password reset flow"

## What's Included

### Reference Documentation

Downloaded from the official sources:

**From The Copenhagen Book:**
- Sessions, password authentication, email verification
- OAuth, MFA, WebAuthn, CSRF protection
- Password reset, random value generation

**From Lucia Auth:**
- Session implementation patterns
- Inactivity timeout, stateless tokens
- OAuth tutorials (GitHub, Google)
- Rate limiting with token bucket

### Starter Templates

Framework-agnostic TypeScript templates in `assets/`:

- `session-schema.sql` - Database schema for sessions
- `password-utils.ts` - Argon2id password hashing
- `session-manager.ts` - Session creation and validation
- `oauth-handler.ts` - OAuth 2.0 with PKCE
- `email-verification.ts` - Email verification flow
- `totp-mfa.ts` - TOTP-based two-factor auth

## Updating Resources

To pull the latest documentation from Lucia Auth and The Copenhagen Book:

```bash
./scripts/fetch-resources.sh
```

Check `references/VERSION.md` for current source versions.

## Key Security Features

This skill implements authentication following current best practices:

- Argon2id password hashing with proper parameters
- Session tokens with 120+ bits of entropy
- Constant-time comparisons to prevent timing attacks
- PKCE for OAuth to prevent code interception
- HttpOnly, Secure, SameSite cookies
- TOTP with recovery codes for 2FA

## License

MIT
