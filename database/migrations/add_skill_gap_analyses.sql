-- Migration: Add skill gap analyses persistence
-- Prerequisite: `users` table must exist (apply after main schema).
-- Stores complete AI-generated skill gap analysis results (not just individual skills)
-- Includes indexes optimized for user-scoped history and role-based lookups
CREATE TABLE IF NOT EXISTS skill_gap_analyses (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    target_role VARCHAR(255) NOT NULL,
    analysis_json JSON NOT NULL,
    current_match_percentage DECIMAL(5,2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_skill_gap_analyses_user_id FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id),
    INDEX idx_user_target_role (user_id, target_role),
    INDEX idx_created_at (created_at),
    INDEX idx_target_role (target_role)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
