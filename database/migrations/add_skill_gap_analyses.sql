-- Migration: Add skill gap analyses persistence
-- Stores complete AI-generated skill gap analysis results (not just individual skills)
USE careerpilot;
CREATE TABLE IF NOT EXISTS skill_gap_analyses (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    target_role VARCHAR(255) NOT NULL,
    analysis_json JSON NOT NULL,
    current_match_percentage DECIMAL(5, 2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id),
    INDEX idx_created_at (created_at),
    INDEX idx_target_role (target_role)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4;