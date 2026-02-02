-- Session table for server-side session management
-- Based on Lucia Auth best practices: https://lucia-auth.com
--
-- Key design decisions:
-- - Separate ID and secret hash prevents timing attacks
-- - Secret is hashed with SHA-256 (safe for high-entropy secrets)
-- - Binary storage for hash (32 bytes for SHA-256)
-- - Timestamps stored as Unix seconds for portability

-- SQLite version
CREATE TABLE session (
    id TEXT NOT NULL PRIMARY KEY,
    user_id TEXT NOT NULL,
    secret_hash BLOB NOT NULL,
    created_at INTEGER NOT NULL,
    expires_at INTEGER NOT NULL,
    FOREIGN KEY (user_id) REFERENCES user(id) ON DELETE CASCADE
);

CREATE INDEX idx_session_user_id ON session(user_id);
CREATE INDEX idx_session_expires_at ON session(expires_at);

-- PostgreSQL version (uncomment if using PostgreSQL)
-- CREATE TABLE session (
--     id TEXT NOT NULL PRIMARY KEY,
--     user_id TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
--     secret_hash BYTEA NOT NULL,
--     created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
--     expires_at TIMESTAMPTZ NOT NULL
-- );
--
-- CREATE INDEX idx_session_user_id ON session(user_id);
-- CREATE INDEX idx_session_expires_at ON session(expires_at);

-- User table (minimal example)
CREATE TABLE user (
    id TEXT NOT NULL PRIMARY KEY,
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    email_verified INTEGER NOT NULL DEFAULT 0,
    created_at INTEGER NOT NULL
);

CREATE INDEX idx_user_email ON user(email);
