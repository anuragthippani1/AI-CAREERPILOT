-- Migration: Ensure users table has gamification/profile columns required by leaderboard + XP logic
-- Safe to run multiple times.
USE careerpilot;

-- Helper macro pattern: if column missing, add it.
SET @tbl := 'users';

-- xp
SET @col := 'xp';
SET @exists := (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = @tbl AND COLUMN_NAME = @col);
SET @sql := IF(@exists = 0, 'ALTER TABLE users ADD COLUMN xp INT DEFAULT 0', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- level
SET @col := 'level';
SET @exists := (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = @tbl AND COLUMN_NAME = @col);
SET @sql := IF(@exists = 0, 'ALTER TABLE users ADD COLUMN level INT DEFAULT 1', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- current_streak
SET @col := 'current_streak';
SET @exists := (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = @tbl AND COLUMN_NAME = @col);
SET @sql := IF(@exists = 0, 'ALTER TABLE users ADD COLUMN current_streak INT DEFAULT 0', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- longest_streak
SET @col := 'longest_streak';
SET @exists := (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = @tbl AND COLUMN_NAME = @col);
SET @sql := IF(@exists = 0, 'ALTER TABLE users ADD COLUMN longest_streak INT DEFAULT 0', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- last_activity_date
SET @col := 'last_activity_date';
SET @exists := (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = @tbl AND COLUMN_NAME = @col);
SET @sql := IF(@exists = 0, 'ALTER TABLE users ADD COLUMN last_activity_date DATE NULL', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- avatar_url
SET @col := 'avatar_url';
SET @exists := (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = @tbl AND COLUMN_NAME = @col);
SET @sql := IF(@exists = 0, 'ALTER TABLE users ADD COLUMN avatar_url VARCHAR(500) NULL', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- bio
SET @col := 'bio';
SET @exists := (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = @tbl AND COLUMN_NAME = @col);
SET @sql := IF(@exists = 0, 'ALTER TABLE users ADD COLUMN bio TEXT NULL', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- title
SET @col := 'title';
SET @exists := (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = @tbl AND COLUMN_NAME = @col);
SET @sql := IF(@exists = 0, 'ALTER TABLE users ADD COLUMN title VARCHAR(255) NULL', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- Indexes used by leaderboard ordering
SET @idx := 'idx_xp';
SET @idx_exists := (SELECT COUNT(*) FROM information_schema.STATISTICS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = @tbl AND INDEX_NAME = @idx);
SET @sql := IF(@idx_exists = 0, 'ALTER TABLE users ADD INDEX idx_xp (xp)', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @idx := 'idx_level';
SET @idx_exists := (SELECT COUNT(*) FROM information_schema.STATISTICS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = @tbl AND INDEX_NAME = @idx);
SET @sql := IF(@idx_exists = 0, 'ALTER TABLE users ADD INDEX idx_level (level)', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;


