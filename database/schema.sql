-- CareerPilot Database Schema
-- MySQL Database

CREATE DATABASE IF NOT EXISTS careerpilot;
USE careerpilot;

-- Users Table
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    xp INT DEFAULT 0,
    level INT DEFAULT 1,
    current_streak INT DEFAULT 0,
    longest_streak INT DEFAULT 0,
    last_activity_date DATE,
    avatar_url VARCHAR(500),
    bio TEXT,
    title VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_email (email),
    INDEX idx_xp (xp),
    INDEX idx_level (level)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Resumes Table
CREATE TABLE IF NOT EXISTS resumes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    file_path VARCHAR(500),
    file_type VARCHAR(50),
    raw_text TEXT,
    ats_score DECIMAL(5,2),
    analysis_json JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Skills Table
CREATE TABLE IF NOT EXISTS skills (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    skill_name VARCHAR(255) NOT NULL,
    skill_level ENUM('beginner', 'intermediate', 'advanced', 'expert') DEFAULT 'beginner',
    source ENUM('resume', 'manual', 'inferred') DEFAULT 'resume',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY unique_user_skill (user_id, skill_name),
    INDEX idx_user_id (user_id),
    INDEX idx_skill_name (skill_name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Career Goals Table
CREATE TABLE IF NOT EXISTS career_goals (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    target_role VARCHAR(255) NOT NULL,
    target_company VARCHAR(255),
    target_salary DECIMAL(10,2),
    timeline_months INT,
    status ENUM('active', 'completed', 'paused') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Roadmaps Table
CREATE TABLE IF NOT EXISTS roadmaps (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    career_goal_id INT,
    roadmap_json JSON NOT NULL,
    milestones JSON,
    progress_percentage DECIMAL(5,2) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (career_goal_id) REFERENCES career_goals(id) ON DELETE SET NULL,
    INDEX idx_user_id (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Interview Sessions Table
CREATE TABLE IF NOT EXISTS interview_sessions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    session_id VARCHAR(255) UNIQUE NOT NULL,
    role_title VARCHAR(255) NOT NULL,
    questions_json JSON,
    answers_json JSON,
    feedback_json JSON,
    overall_score DECIMAL(5,2),
    status ENUM('in_progress', 'completed', 'abandoned') DEFAULT 'in_progress',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id),
    INDEX idx_session_id (session_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Agent Logs Table
CREATE TABLE IF NOT EXISTS agent_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT,
    agent_name VARCHAR(100) NOT NULL,
    action VARCHAR(255) NOT NULL,
    input_data JSON,
    output_data JSON,
    execution_time_ms INT,
    status ENUM('success', 'error', 'pending') DEFAULT 'pending',
    error_message TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_user_id (user_id),
    INDEX idx_agent_name (agent_name),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Coding Questions Table
CREATE TABLE IF NOT EXISTS coding_questions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(500) NOT NULL,
    slug VARCHAR(500) UNIQUE NOT NULL,
    description TEXT NOT NULL,
    difficulty ENUM('easy', 'medium', 'hard') NOT NULL,
    topics JSON, -- Array of topics: ["Arrays", "Strings", "Trees", etc.]
    company_tags JSON, -- Array of company names: ["Google", "Amazon", etc.]
    examples JSON, -- Array of example inputs/outputs
    constraints TEXT,
    expected_approach TEXT, -- High-level expected approach (no code)
    hints JSON, -- Array of hints
    test_cases JSON, -- Array of test cases with input/output
    solution_template JSON, -- Code templates for different languages
    source ENUM('geeksforgeeks', 'leetcode', 'curated') DEFAULT 'curated',
    source_id VARCHAR(255), -- Original ID from source
    acceptance_rate DECIMAL(5,2), -- Percentage of users who solved it
    frequency INT DEFAULT 0, -- How often it appears in interviews
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_difficulty (difficulty),
    INDEX idx_source (source),
    INDEX idx_slug (slug),
    FULLTEXT idx_search (title, description)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Question Solutions Table
CREATE TABLE IF NOT EXISTS question_solutions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    question_id INT NOT NULL,
    language VARCHAR(50) NOT NULL, -- python, javascript, java, cpp
    solution_code TEXT NOT NULL,
    time_complexity VARCHAR(100),
    space_complexity VARCHAR(100),
    explanation TEXT,
    is_optimal BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (question_id) REFERENCES coding_questions(id) ON DELETE CASCADE,
    INDEX idx_question_id (question_id),
    INDEX idx_language (language)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- User Practice Sessions Table
CREATE TABLE IF NOT EXISTS user_practice_sessions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    question_id INT NOT NULL,
    session_id VARCHAR(255) NOT NULL,
    code TEXT,
    language VARCHAR(50) NOT NULL,
    status ENUM('in_progress', 'submitted', 'completed', 'failed') DEFAULT 'in_progress',
    test_results JSON, -- Results of test case execution
    score DECIMAL(5,2), -- Score out of 100
    execution_time_ms INT,
    memory_usage_kb INT,
    error_message TEXT,
    feedback_json JSON, -- AI-generated feedback
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (question_id) REFERENCES coding_questions(id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id),
    INDEX idx_question_id (question_id),
    INDEX idx_session_id (session_id),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Practice Progress Table
CREATE TABLE IF NOT EXISTS practice_progress (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    question_id INT NOT NULL,
    attempts INT DEFAULT 0,
    best_score DECIMAL(5,2) DEFAULT 0,
    completion_status ENUM('not_started', 'in_progress', 'solved', 'mastered') DEFAULT 'not_started',
    first_attempt_at TIMESTAMP NULL,
    last_attempt_at TIMESTAMP NULL,
    solved_at TIMESTAMP NULL,
    time_spent_minutes INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (question_id) REFERENCES coding_questions(id) ON DELETE CASCADE,
    UNIQUE KEY unique_user_question (user_id, question_id),
    INDEX idx_user_id (user_id),
    INDEX idx_question_id (question_id),
    INDEX idx_completion_status (completion_status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Achievements Table
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

-- User Achievements Table
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

-- Leaderboard Cache Table
CREATE TABLE IF NOT EXISTS leaderboard_cache (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    `rank` INT NOT NULL,
    xp INT NOT NULL,
    level INT NOT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_rank (`rank`),
    INDEX idx_xp (xp),
    INDEX idx_user_id (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Skill Gap Analyses Table
CREATE TABLE IF NOT EXISTS skill_gap_analyses (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    target_role VARCHAR(255) NOT NULL,
    analysis_json JSON NOT NULL,
    current_match_percentage DECIMAL(5,2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id),
    INDEX idx_created_at (created_at),
    INDEX idx_target_role (target_role)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

