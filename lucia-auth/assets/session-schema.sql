-- Core auth schema for a browser-based web app.
-- Based on Lucia Auth and The Copenhagen Book.
--
-- Notes:
-- - Store normalized lowercase emails in user.email
-- - Session secret hashes are SHA-256 of a high-entropy secret
-- - idle_expires_at and absolute_expires_at support both sliding and hard expiry
-- - fresh_until supports re-auth / sudo mode for security-sensitive actions

-- SQLite version

CREATE TABLE user (
    id TEXT NOT NULL PRIMARY KEY,
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT,
    email_verified_at INTEGER,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL
);

CREATE INDEX idx_user_email ON user(email);

CREATE TABLE session (
    id TEXT NOT NULL PRIMARY KEY,
    user_id TEXT NOT NULL,
    secret_hash BLOB NOT NULL,
    created_at INTEGER NOT NULL,
    last_verified_at INTEGER NOT NULL,
    idle_expires_at INTEGER NOT NULL,
    absolute_expires_at INTEGER NOT NULL,
    fresh_until INTEGER NOT NULL,
    ip_address TEXT,
    user_agent TEXT,
    FOREIGN KEY (user_id) REFERENCES user(id) ON DELETE CASCADE
);

CREATE INDEX idx_session_user_id ON session(user_id);
CREATE INDEX idx_session_idle_expires_at ON session(idle_expires_at);
CREATE INDEX idx_session_absolute_expires_at ON session(absolute_expires_at);

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

CREATE TABLE oauth_account (
    id TEXT NOT NULL PRIMARY KEY,
    user_id TEXT NOT NULL,
    provider TEXT NOT NULL,
    provider_user_id TEXT NOT NULL,
    email TEXT,
    created_at INTEGER NOT NULL,
    FOREIGN KEY (user_id) REFERENCES user(id) ON DELETE CASCADE,
    UNIQUE (provider, provider_user_id)
);

CREATE INDEX idx_oauth_account_user_id ON oauth_account(user_id);

-- PostgreSQL version (adapt column types if needed)
--
-- CREATE TABLE "user" (
--     id TEXT NOT NULL PRIMARY KEY,
--     email TEXT NOT NULL UNIQUE,
--     password_hash TEXT,
--     email_verified_at TIMESTAMPTZ,
--     created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
--     updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
-- );
--
-- CREATE TABLE session (
--     id TEXT NOT NULL PRIMARY KEY,
--     user_id TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
--     secret_hash BYTEA NOT NULL,
--     created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
--     last_verified_at TIMESTAMPTZ NOT NULL,
--     idle_expires_at TIMESTAMPTZ NOT NULL,
--     absolute_expires_at TIMESTAMPTZ NOT NULL,
--     fresh_until TIMESTAMPTZ NOT NULL,
--     ip_address INET,
--     user_agent TEXT
-- );
--
-- CREATE TABLE email_verification (
--     id TEXT NOT NULL PRIMARY KEY,
--     user_id TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
--     email TEXT NOT NULL,
--     purpose TEXT NOT NULL,
--     verification_type TEXT NOT NULL,
--     token_hash TEXT,
--     code_hash TEXT,
--     created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
--     expires_at TIMESTAMPTZ NOT NULL
-- );
--
-- CREATE TABLE password_reset (
--     id TEXT NOT NULL PRIMARY KEY,
--     user_id TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
--     email TEXT NOT NULL,
--     token_hash TEXT NOT NULL,
--     created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
--     expires_at TIMESTAMPTZ NOT NULL
-- );
--
-- CREATE TABLE oauth_account (
--     id TEXT NOT NULL PRIMARY KEY,
--     user_id TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
--     provider TEXT NOT NULL,
--     provider_user_id TEXT NOT NULL,
--     email TEXT,
--     created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
--     UNIQUE (provider, provider_user_id)
-- );
