const db = require('../config/database');
const { logAgentAction } = require('../utils/logger');

/**
 * Gamification Service
 * Handles XP, levels, streaks, and achievement checking
 */
class GamificationService {
  /**
   * Calculate level from XP
   * Formula: level = floor(sqrt(XP / 100)) + 1
   */
  calculateLevel(xp) {
    return Math.floor(Math.sqrt(xp / 100)) + 1;
  }

  /**
   * Calculate XP required for a specific level
   */
  getXPForLevel(level) {
    return Math.pow(level - 1, 2) * 100;
  }

  /**
   * Award XP to a user
   * @param {number} userId - User ID
   * @param {number} amount - XP amount to award
   * @param {string} source - Source of XP (e.g., 'interview', 'coding', 'streak', 'achievement')
   * @returns {Promise<Object>} - { xpGained, newXP, newLevel, leveledUp, previousLevel }
   */
  async awardXP(userId, amount, source = 'unknown') {
    try {
      // Get current user stats
      const [users] = await db.query(
        'SELECT xp, level FROM users WHERE id = ?',
        [userId]
      );

      if (users.length === 0) {
        throw new Error('User not found');
      }

      const currentXP = users[0].xp || 0;
      const currentLevel = users[0].level || 1;
      const newXP = currentXP + amount;
      const newLevel = this.calculateLevel(newXP);
      const leveledUp = newLevel > currentLevel;

      // Update user XP and level
      await db.query(
        'UPDATE users SET xp = ?, level = ? WHERE id = ?',
        [newXP, newLevel, userId]
      );

      // Log XP gain
      await logAgentAction(
        userId,
        'gamification',
        'award_xp',
        { amount, source, previousXP: currentXP, newXP, previousLevel: currentLevel, newLevel },
        { success: true }
      );

      return {
        xpGained: amount,
        newXP,
        newLevel,
        leveledUp,
        previousLevel: currentLevel,
        progressToNextLevel: this.getProgressToNextLevel(newXP, newLevel)
      };
    } catch (error) {
      console.error('Error awarding XP:', error);
      throw error;
    }
  }

  /**
   * Get progress to next level (0-100)
   */
  getProgressToNextLevel(currentXP, currentLevel) {
    const xpForCurrentLevel = this.getXPForLevel(currentLevel);
    const xpForNextLevel = this.getXPForLevel(currentLevel + 1);
    const xpInCurrentLevel = currentXP - xpForCurrentLevel;
    const xpNeededForNextLevel = xpForNextLevel - xpForCurrentLevel;
    
    if (xpNeededForNextLevel === 0) return 100;
    return Math.min(100, Math.round((xpInCurrentLevel / xpNeededForNextLevel) * 100));
  }

  /**
   * Update daily streak for a user
   * @param {number} userId - User ID
   * @returns {Promise<Object>} - { currentStreak, longestStreak, streakMaintained, streakBroken }
   */
  async updateStreak(userId) {
    try {
      const today = new Date().toISOString().split('T')[0];
      
      // Get current streak info
      const [users] = await db.query(
        'SELECT current_streak, longest_streak, last_activity_date FROM users WHERE id = ?',
        [userId]
      );

      if (users.length === 0) {
        throw new Error('User not found');
      }

      const currentStreak = users[0].current_streak || 0;
      const longestStreak = users[0].longest_streak || 0;
      const lastActivityDate = users[0].last_activity_date 
        ? new Date(users[0].last_activity_date).toISOString().split('T')[0]
        : null;

      let newStreak = currentStreak;
      let streakMaintained = false;
      let streakBroken = false;

      if (!lastActivityDate) {
        // First activity
        newStreak = 1;
        streakMaintained = true;
      } else {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = yesterday.toISOString().split('T')[0];

        if (lastActivityDate === today) {
          // Already active today, no change
          newStreak = currentStreak;
        } else if (lastActivityDate === yesterdayStr) {
          // Consecutive day - increment streak
          newStreak = currentStreak + 1;
          streakMaintained = true;
        } else {
          // Gap in streak - reset
          newStreak = 1;
          streakBroken = currentStreak > 0;
        }
      }

      const newLongestStreak = Math.max(longestStreak, newStreak);

      // Update streak
      await db.query(
        'UPDATE users SET current_streak = ?, longest_streak = ?, last_activity_date = ? WHERE id = ?',
        [newStreak, newLongestStreak, today, userId]
      );

      // Award streak bonus XP (10 XP per day maintained)
      if (streakMaintained && newStreak > 1) {
        await this.awardXP(userId, 10, 'streak');
      }

      return {
        currentStreak: newStreak,
        longestStreak: newLongestStreak,
        streakMaintained,
        streakBroken
      };
    } catch (error) {
      console.error('Error updating streak:', error);
      throw error;
    }
  }

  /**
   * Get comprehensive user stats
   * @param {number} userId - User ID
   * @returns {Promise<Object>} - User stats including XP, level, streak, achievements
   */
  async getUserStats(userId) {
    try {
      const [users] = await db.query(
        `SELECT id, name, email, xp, level, current_streak, longest_streak, 
         last_activity_date, avatar_url, bio, title, created_at
         FROM users WHERE id = ?`,
        [userId]
      );

      if (users.length === 0) {
        throw new Error('User not found');
      }

      const user = users[0];
      const progressToNextLevel = this.getProgressToNextLevel(user.xp || 0, user.level || 1);
      const xpForNextLevel = this.getXPForLevel((user.level || 1) + 1);
      const xpForCurrentLevel = this.getXPForLevel(user.level || 1);
      const xpNeeded = xpForNextLevel - (user.xp || 0);

      // Get achievement count
      const [achievementCount] = await db.query(
        'SELECT COUNT(*) as count FROM user_achievements WHERE user_id = ?',
        [userId]
      );

      // Get interview stats
      const [interviewStats] = await db.query(
        `SELECT 
          COUNT(*) as total,
          SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed,
          AVG(CASE WHEN status = 'completed' THEN overall_score ELSE NULL END) as avg_score
         FROM interview_sessions WHERE user_id = ?`,
        [userId]
      );

      // Get coding practice stats
      const [codingStats] = await db.query(
        `SELECT 
          COUNT(DISTINCT question_id) as problems_attempted,
          SUM(CASE WHEN completion_status = 'solved' THEN 1 ELSE 0 END) as problems_solved
         FROM practice_progress WHERE user_id = ?`,
        [userId]
      );

      return {
        userId: user.id,
        name: user.name,
        email: user.email,
        xp: user.xp || 0,
        level: user.level || 1,
        currentStreak: user.current_streak || 0,
        longestStreak: user.longest_streak || 0,
        lastActivityDate: user.last_activity_date,
        avatarUrl: user.avatar_url,
        bio: user.bio,
        title: user.title,
        createdAt: user.created_at,
        progressToNextLevel,
        xpForNextLevel,
        xpForCurrentLevel,
        xpNeeded,
        achievementCount: achievementCount[0].count || 0,
        interviewStats: {
          total: interviewStats[0].total || 0,
          completed: interviewStats[0].completed || 0,
          avgScore: interviewStats[0].avg_score ? Math.round(interviewStats[0].avg_score) : 0
        },
        codingStats: {
          attempted: codingStats[0].problems_attempted || 0,
          solved: codingStats[0].problems_solved || 0
        }
      };
    } catch (error) {
      console.error('Error getting user stats:', error);
      throw error;
    }
  }
}

module.exports = new GamificationService();





