-- Migration: Add roadmap task completion tracking
-- This table persists user progress on roadmap tasks (previously in localStorage only)

USE careerpilot;

CREATE TABLE IF NOT EXISTS roadmap_task_completions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    task_id VARCHAR(255) NOT NULL,
    roadmap_id INT,
    completed BOOLEAN DEFAULT FALSE,
    started_at TIMESTAMP NULL,
    completed_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (roadmap_id) REFERENCES roadmaps(id) ON DELETE SET NULL,
    UNIQUE KEY unique_user_task (user_id, task_id),
    INDEX idx_user_id (user_id),
    INDEX idx_roadmap_id (roadmap_id),
    INDEX idx_task_id (task_id),
    INDEX idx_completed (completed)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

