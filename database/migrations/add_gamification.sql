-- Migration: Add Gamification Features
-- Run this after the main schema.sql

USE careerpilot;

-- Add gamification fields to users table
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS xp INT DEFAULT 0 AFTER name,
ADD COLUMN IF NOT EXISTS level INT DEFAULT 1 AFTER xp,
ADD COLUMN IF NOT EXISTS current_streak INT DEFAULT 0 AFTER level,
ADD COLUMN IF NOT EXISTS longest_streak INT DEFAULT 0 AFTER current_streak,
ADD COLUMN IF NOT EXISTS last_activity_date DATE AFTER longest_streak,
ADD COLUMN IF NOT EXISTS avatar_url VARCHAR(500) AFTER last_activity_date,
ADD COLUMN IF NOT EXISTS bio TEXT AFTER avatar_url,
ADD COLUMN IF NOT EXISTS title VARCHAR(255) AFTER bio;

-- Add indexes for gamification fields
ALTER TABLE users 
ADD INDEX IF NOT EXISTS idx_xp (xp),
ADD INDEX IF NOT EXISTS idx_level (level);

-- Create achievements table if not exists
CREATE TABLE IF NOT EXISTS achievements (
    id INT AUTO_INCREMENT PRIMARY KEY,
    code VARCHAR(100) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    icon VARCHAR(100),
    xp_reward INT DEFAULT 0,
    category ENUM('interviews', 'streaks', 'coding', 'milestones') NOT NULL,
    criteria JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_category (category),
    INDEX idx_code (code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Create user_achievements table if not exists
CREATE TABLE IF NOT EXISTS user_achievements (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    achievement_id INT NOT NULL,
    unlocked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (achievement_id) REFERENCES achievements(id) ON DELETE CASCADE,
    UNIQUE KEY unique_user_achievement (user_id, achievement_id),
    INDEX idx_user_id (user_id),
    INDEX idx_achievement_id (achievement_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Create leaderboard_cache table if not exists
CREATE TABLE IF NOT EXISTS leaderboard_cache (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    rank INT NOT NULL,
    xp INT NOT NULL,
    level INT NOT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_rank (rank),
    INDEX idx_xp (xp),
    INDEX idx_user_id (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;



