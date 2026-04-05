CREATE TABLE IF NOT EXISTS skill_gap_shares (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    analysis_id INT NOT NULL,
    share_token VARCHAR(64) NOT NULL UNIQUE,
    share_count INT DEFAULT 0,
    view_count INT DEFAULT 0,
    last_shared_at TIMESTAMP NULL,
    last_viewed_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY unique_user_analysis_share (user_id, analysis_id),
    INDEX idx_share_token (share_token),
    INDEX idx_user_id (user_id),
    INDEX idx_analysis_id (analysis_id),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (analysis_id) REFERENCES skill_gap_analyses(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS growth_events (
    id INT AUTO_INCREMENT PRIMARY KEY,
    event_name VARCHAR(100) NOT NULL,
    share_id INT NULL,
    viewer_user_id INT NULL,
    metadata_json JSON NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_event_name (event_name),
    INDEX idx_share_id (share_id),
    INDEX idx_created_at (created_at),
    FOREIGN KEY (share_id) REFERENCES skill_gap_shares(id) ON DELETE SET NULL,
    FOREIGN KEY (viewer_user_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
