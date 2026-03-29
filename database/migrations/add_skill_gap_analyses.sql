-- Migration: Add skill gap analyses persistence
-- Prerequisite: `users` table must exist (apply after main schema).
-- Stores complete AI-generated skill gap analysis results (not just individual skills)
-- Includes indexes optimized for user-scoped history and role-based lookups
CREATE TABLE IF NOT EXISTS skill_gap_analyses (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL COMMENT 'Owning user (FK to users.id)',
    target_role VARCHAR(255) NOT NULL COMMENT 'Role title used for this analysis',
    analysis_json JSON NOT NULL COMMENT 'Full skill-gap analysis payload from the AI',
    current_match_percentage DECIMAL(5,2) DEFAULT NULL COMMENT 'Overall role match score (0-100)',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT 'When this analysis was stored',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Last modification time',
    CONSTRAINT chk_skill_gap_analyses_match_pct CHECK (current_match_percentage IS NULL OR (current_match_percentage >= 0 AND current_match_percentage <= 100)),
    CONSTRAINT fk_skill_gap_analyses_user_id FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id),
    INDEX idx_user_target_role (user_id, target_role),
    INDEX idx_created_at (created_at),
    INDEX idx_target_role (target_role)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
