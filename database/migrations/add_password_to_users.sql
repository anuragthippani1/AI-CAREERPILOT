-- Add password field to users table for authentication
ALTER TABLE users ADD COLUMN password_hash VARCHAR(255) NULL AFTER email;

-- Add index for faster email lookups during login
-- (email index already exists, but keeping for clarity)
