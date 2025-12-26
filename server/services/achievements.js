const db = require('../config/database');
const gamification = require('./gamification');
const { logAgentAction } = require('../utils/logger');

/**
 * Achievements Service
 * Handles achievement initialization, checking, and unlocking
 */
class AchievementsService {
  /**
   * Initialize achievements in database
   * Seeds initial achievements if they don't exist
   */
  async initializeAchievements() {
    try {
      const [existing] = await db.query('SELECT COUNT(*) as count FROM achievements');
      
      if (existing[0].count > 0) {
        console.log('Achievements already initialized');
        return;
      }

      const achievements = [
        // Interview achievements
        {
          code: 'first_interview',
          name: 'First Steps',
          description: 'Complete your first interview',
          icon: 'star',
          xp_reward: 10,
          category: 'interviews',
          criteria: JSON.stringify({ type: 'count', action: 'complete_interview', threshold: 1 })
        },
        {
          code: 'five_interviews',
          name: 'Getting Started',
          description: 'Complete 5 interviews',
          icon: 'target',
          xp_reward: 50,
          category: 'interviews',
          criteria: JSON.stringify({ type: 'count', action: 'complete_interview', threshold: 5 })
        },
        {
          code: 'twenty_five_interviews',
          name: 'Interview Pro',
          description: 'Complete 25 interviews',
          icon: 'award',
          xp_reward: 200,
          category: 'interviews',
          criteria: JSON.stringify({ type: 'count', action: 'complete_interview', threshold: 25 })
        },
        {
          code: 'perfect_score',
          name: 'Perfect Score',
          description: 'Get 100% on an interview',
          icon: 'trophy',
          xp_reward: 50,
          category: 'interviews',
          criteria: JSON.stringify({ type: 'score', action: 'complete_interview', threshold: 100 })
        },
        {
          code: 'speed_demon',
          name: 'Speed Demon',
          description: 'Complete an interview in under 10 minutes',
          icon: 'zap',
          xp_reward: 75,
          category: 'interviews',
          criteria: JSON.stringify({ type: 'time', action: 'complete_interview', threshold: 600 }) // 600 seconds = 10 minutes
        },
        
        // Streak achievements
        {
          code: 'streak_3',
          name: 'Streak Starter',
          description: 'Maintain a 3-day streak',
          icon: 'flame',
          xp_reward: 25,
          category: 'streaks',
          criteria: JSON.stringify({ type: 'streak', threshold: 3 })
        },
        {
          code: 'streak_7',
          name: 'Week Warrior',
          description: 'Maintain a 7-day streak',
          icon: 'calendar',
          xp_reward: 100,
          category: 'streaks',
          criteria: JSON.stringify({ type: 'streak', threshold: 7 })
        },
        {
          code: 'streak_30',
          name: 'Month Master',
          description: 'Maintain a 30-day streak',
          icon: 'crown',
          xp_reward: 500,
          category: 'streaks',
          criteria: JSON.stringify({ type: 'streak', threshold: 30 })
        },
        
        // Coding achievements
        {
          code: 'first_code',
          name: 'Code Solver',
          description: 'Solve your first coding problem',
          icon: 'code',
          xp_reward: 25,
          category: 'coding',
          criteria: JSON.stringify({ type: 'count', action: 'solve_problem', threshold: 1 })
        },
        {
          code: 'ten_problems',
          name: 'Problem Solver',
          description: 'Solve 10 coding problems',
          icon: 'check-circle',
          xp_reward: 150,
          category: 'coding',
          criteria: JSON.stringify({ type: 'count', action: 'solve_problem', threshold: 10 })
        },
        {
          code: 'fifty_problems',
          name: 'Coding Master',
          description: 'Solve 50 coding problems',
          icon: 'medal',
          xp_reward: 500,
          category: 'coding',
          criteria: JSON.stringify({ type: 'count', action: 'solve_problem', threshold: 50 })
        },
        
        // Milestone achievements
        {
          code: 'level_5',
          name: 'Rising Star',
          description: 'Reach level 5',
          icon: 'trending-up',
          xp_reward: 100,
          category: 'milestones',
          criteria: JSON.stringify({ type: 'level', threshold: 5 })
        },
        {
          code: 'level_10',
          name: 'Expert',
          description: 'Reach level 10',
          icon: 'star',
          xp_reward: 250,
          category: 'milestones',
          criteria: JSON.stringify({ type: 'level', threshold: 10 })
        },
        {
          code: 'level_20',
          name: 'Master',
          description: 'Reach level 20',
          icon: 'crown',
          xp_reward: 500,
          category: 'milestones',
          criteria: JSON.stringify({ type: 'level', threshold: 20 })
        }
      ];

      for (const achievement of achievements) {
        await db.query(
          `INSERT INTO achievements (code, name, description, icon, xp_reward, category, criteria)
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [
            achievement.code,
            achievement.name,
            achievement.description,
            achievement.icon,
            achievement.xp_reward,
            achievement.category,
            achievement.criteria
          ]
        );
      }

      console.log(`Initialized ${achievements.length} achievements`);
    } catch (error) {
      console.error('Error initializing achievements:', error);
      throw error;
    }
  }

  /**
   * Check if user qualifies for an achievement
   * @param {number} userId - User ID
   * @param {string} achievementCode - Achievement code
   * @returns {Promise<boolean>} - True if user qualifies
   */
  async checkAchievement(userId, achievementCode) {
    try {
      // Check if already unlocked
      const [existing] = await db.query(
        `SELECT ua.id FROM user_achievements ua
         JOIN achievements a ON ua.achievement_id = a.id
         WHERE ua.user_id = ? AND a.code = ?`,
        [userId, achievementCode]
      );

      if (existing.length > 0) {
        return false; // Already unlocked
      }

      // Get achievement
      const [achievements] = await db.query(
        'SELECT * FROM achievements WHERE code = ?',
        [achievementCode]
      );

      if (achievements.length === 0) {
        return false;
      }

      const achievement = achievements[0];
      const criteria = JSON.parse(achievement.criteria);

      // Check criteria based on type
      switch (criteria.type) {
        case 'count':
          return await this.checkCountAchievement(userId, criteria);
        case 'score':
          return await this.checkScoreAchievement(userId, criteria);
        case 'time':
          return await this.checkTimeAchievement(userId, criteria);
        case 'streak':
          return await this.checkStreakAchievement(userId, criteria);
        case 'level':
          return await this.checkLevelAchievement(userId, criteria);
        default:
          return false;
      }
    } catch (error) {
      console.error('Error checking achievement:', error);
      return false;
    }
  }

  /**
   * Check count-based achievement (e.g., complete 5 interviews)
   */
  async checkCountAchievement(userId, criteria) {
    const { action, threshold } = criteria;

    switch (action) {
      case 'complete_interview':
        const [interviews] = await db.query(
          "SELECT COUNT(*) as count FROM interview_sessions WHERE user_id = ? AND status = 'completed'",
          [userId]
        );
        return (interviews[0].count || 0) >= threshold;

      case 'solve_problem':
        const [problems] = await db.query(
          "SELECT COUNT(*) as count FROM practice_progress WHERE user_id = ? AND completion_status = 'solved'",
          [userId]
        );
        return (problems[0].count || 0) >= threshold;

      default:
        return false;
    }
  }

  /**
   * Check score-based achievement (e.g., get 100% on interview)
   */
  async checkScoreAchievement(userId, criteria) {
    const { action, threshold } = criteria;

    if (action === 'complete_interview') {
      const [interviews] = await db.query(
        "SELECT overall_score FROM interview_sessions WHERE user_id = ? AND status = 'completed' AND overall_score >= ? LIMIT 1",
        [userId, threshold]
      );
      return interviews.length > 0;
    }

    return false;
  }

  /**
   * Check time-based achievement (e.g., complete interview in under 10 minutes)
   */
  async checkTimeAchievement(userId, criteria) {
    const { action, threshold } = criteria;

    if (action === 'complete_interview') {
      // Check if any interview was completed in less than threshold seconds
      const [interviews] = await db.query(
        `SELECT id FROM interview_sessions 
         WHERE user_id = ? AND status = 'completed'
         AND TIMESTAMPDIFF(SECOND, created_at, updated_at) <= ?
         LIMIT 1`,
        [userId, threshold]
      );
      return interviews.length > 0;
    }

    return false;
  }

  /**
   * Check streak-based achievement
   */
  async checkStreakAchievement(userId, criteria) {
    const { threshold } = criteria;
    const [users] = await db.query(
      'SELECT current_streak FROM users WHERE id = ?',
      [userId]
    );

    if (users.length === 0) return false;
    return (users[0].current_streak || 0) >= threshold;
  }

  /**
   * Check level-based achievement
   */
  async checkLevelAchievement(userId, criteria) {
    const { threshold } = criteria;
    const [users] = await db.query(
      'SELECT level FROM users WHERE id = ?',
      [userId]
    );

    if (users.length === 0) return false;
    return (users[0].level || 0) >= threshold;
  }

  /**
   * Unlock achievement for user
   * @param {number} userId - User ID
   * @param {number} achievementId - Achievement ID
   * @returns {Promise<Object>} - Unlocked achievement info
   */
  async unlockAchievement(userId, achievementId) {
    try {
      // Check if already unlocked
      const [existing] = await db.query(
        'SELECT id FROM user_achievements WHERE user_id = ? AND achievement_id = ?',
        [userId, achievementId]
      );

      if (existing.length > 0) {
        return null; // Already unlocked
      }

      // Get achievement details
      const [achievements] = await db.query(
        'SELECT * FROM achievements WHERE id = ?',
        [achievementId]
      );

      if (achievements.length === 0) {
        throw new Error('Achievement not found');
      }

      const achievement = achievements[0];

      // Unlock achievement
      await db.query(
        'INSERT INTO user_achievements (user_id, achievement_id) VALUES (?, ?)',
        [userId, achievementId]
      );

      // Award XP if applicable
      if (achievement.xp_reward > 0) {
        await gamification.awardXP(userId, achievement.xp_reward, 'achievement');
      }

      // Log achievement unlock
      await logAgentAction(
        userId,
        'achievements',
        'unlock_achievement',
        { achievementId, achievementCode: achievement.code, xpReward: achievement.xp_reward },
        { success: true }
      );

      return {
        id: achievement.id,
        code: achievement.code,
        name: achievement.name,
        description: achievement.description,
        icon: achievement.icon,
        xpReward: achievement.xp_reward,
        category: achievement.category
      };
    } catch (error) {
      console.error('Error unlocking achievement:', error);
      throw error;
    }
  }

  /**
   * Check and unlock achievements for a specific action
   * @param {number} userId - User ID
   * @param {string} action - Action type (e.g., 'complete_interview', 'solve_problem')
   * @param {Object} data - Action data (e.g., { score: 100, time: 600 })
   * @returns {Promise<Array>} - Array of newly unlocked achievements
   */
  async checkAchievements(userId, action, data = {}) {
    try {
      // Get all achievements related to this action
      const [achievements] = await db.query(
        `SELECT * FROM achievements 
         WHERE JSON_EXTRACT(criteria, '$.action') = ? OR category = ?`,
        [action, action === 'complete_interview' ? 'interviews' : action === 'solve_problem' ? 'coding' : 'milestones']
      );

      const unlocked = [];

      for (const achievement of achievements) {
        const criteria = JSON.parse(achievement.criteria);
        
        // Check if this achievement is relevant to the action
        if (criteria.action && criteria.action !== action) {
          continue;
        }

        // Check if user qualifies
        const qualifies = await this.checkAchievement(userId, achievement.code);
        
        if (qualifies) {
          const unlockedAchievement = await this.unlockAchievement(userId, achievement.id);
          if (unlockedAchievement) {
            unlocked.push(unlockedAchievement);
          }
        }
      }

      // Also check level-based achievements
      const [user] = await db.query('SELECT level FROM users WHERE id = ?', [userId]);
      if (user.length > 0) {
        const [levelAchievements] = await db.query(
          `SELECT * FROM achievements 
           WHERE category = 'milestones' AND JSON_EXTRACT(criteria, '$.type') = 'level'`
        );

        for (const achievement of levelAchievements) {
          const criteria = JSON.parse(achievement.criteria);
          if (user[0].level >= criteria.threshold) {
            const qualifies = await this.checkAchievement(userId, achievement.code);
            if (qualifies) {
              const unlockedAchievement = await this.unlockAchievement(userId, achievement.id);
              if (unlockedAchievement) {
                unlocked.push(unlockedAchievement);
              }
            }
          }
        }
      }

      return unlocked;
    } catch (error) {
      console.error('Error checking achievements:', error);
      return [];
    }
  }

  /**
   * Get all user achievements
   * @param {number} userId - User ID
   * @returns {Promise<Array>} - User achievements
   */
  async getUserAchievements(userId) {
    try {
      const [achievements] = await db.query(
        `SELECT a.*, ua.unlocked_at
         FROM achievements a
         INNER JOIN user_achievements ua ON a.id = ua.achievement_id
         WHERE ua.user_id = ?
         ORDER BY ua.unlocked_at DESC`,
        [userId]
      );

      return achievements.map(a => ({
        id: a.id,
        code: a.code,
        name: a.name,
        description: a.description,
        icon: a.icon,
        xpReward: a.xp_reward,
        category: a.category,
        unlockedAt: a.unlocked_at
      }));
    } catch (error) {
      console.error('Error getting user achievements:', error);
      return [];
    }
  }

  /**
   * Get all achievements with user's unlock status
   * @param {number} userId - User ID
   * @returns {Promise<Array>} - All achievements with unlock status
   */
  async getAllAchievements(userId) {
    try {
      const [achievements] = await db.query(
        `SELECT a.*, 
         CASE WHEN ua.id IS NOT NULL THEN 1 ELSE 0 END as unlocked,
         ua.unlocked_at
         FROM achievements a
         LEFT JOIN user_achievements ua ON a.id = ua.achievement_id AND ua.user_id = ?
         ORDER BY a.category, a.xp_reward DESC`,
        [userId]
      );

      return achievements.map(a => ({
        id: a.id,
        code: a.code,
        name: a.name,
        description: a.description,
        icon: a.icon,
        xpReward: a.xp_reward,
        category: a.category,
        unlocked: a.unlocked === 1,
        unlockedAt: a.unlocked_at
      }));
    } catch (error) {
      console.error('Error getting all achievements:', error);
      return [];
    }
  }
}

module.exports = new AchievementsService();

