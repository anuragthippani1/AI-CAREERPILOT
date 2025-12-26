const express = require('express');
const router = express.Router();
const { param, query, validationResult } = require('express-validator');
const db = require('../config/database');

// GET /api/leaderboard - Get top users by XP
router.get('/', 
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          error: 'Validation failed',
          details: errors.array()
        });
      }

      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 20;
      const offset = (page - 1) * limit;

      // Get top users by XP
      const [users] = await db.query(
        `SELECT id, name, email, xp, level, current_streak, longest_streak, avatar_url, title
         FROM users
         WHERE xp > 0
         ORDER BY xp DESC, level DESC, current_streak DESC
         LIMIT ? OFFSET ?`,
        [limit, offset]
      );

      // Get total count
      const [countResult] = await db.query(
        'SELECT COUNT(*) as total FROM users WHERE xp > 0'
      );
      const total = countResult[0].total;

      // Calculate ranks
      const usersWithRank = users.map((user, index) => ({
        ...user,
        rank: offset + index + 1
      }));

      res.json({
        success: true,
        data: usersWithRank,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        }
      });
    } catch (error) {
      next(error);
    }
  }
);

// GET /api/leaderboard/interviews - Top users by interviews completed
router.get('/interviews',
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  async (req, res, next) => {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 20;
      const offset = (page - 1) * limit;

      const [users] = await db.query(
        `SELECT u.id, u.name, u.email, u.avatar_url, u.title,
         COUNT(CASE WHEN is.status = 'completed' THEN 1 END) as completed_interviews,
         AVG(CASE WHEN is.status = 'completed' THEN is.overall_score END) as avg_score
         FROM users u
         LEFT JOIN interview_sessions is ON u.id = is.user_id
         GROUP BY u.id, u.name, u.email, u.avatar_url, u.title
         HAVING completed_interviews > 0
         ORDER BY completed_interviews DESC, avg_score DESC
         LIMIT ? OFFSET ?`,
        [limit, offset]
      );

      const [countResult] = await db.query(
        `SELECT COUNT(DISTINCT u.id) as total
         FROM users u
         INNER JOIN interview_sessions is ON u.id = is.user_id
         WHERE is.status = 'completed'`
      );
      const total = countResult[0].total;

      const usersWithRank = users.map((user, index) => ({
        ...user,
        rank: offset + index + 1,
        completedInterviews: parseInt(user.completed_interviews) || 0,
        avgScore: user.avg_score ? Math.round(user.avg_score) : 0
      }));

      res.json({
        success: true,
        data: usersWithRank,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        }
      });
    } catch (error) {
      next(error);
    }
  }
);

// GET /api/leaderboard/streaks - Top users by longest streak
router.get('/streaks',
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  async (req, res, next) => {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 20;
      const offset = (page - 1) * limit;

      const [users] = await db.query(
        `SELECT id, name, email, current_streak, longest_streak, avatar_url, title
         FROM users
         WHERE longest_streak > 0
         ORDER BY longest_streak DESC, current_streak DESC
         LIMIT ? OFFSET ?`,
        [limit, offset]
      );

      const [countResult] = await db.query(
        'SELECT COUNT(*) as total FROM users WHERE longest_streak > 0'
      );
      const total = countResult[0].total;

      const usersWithRank = users.map((user, index) => ({
        ...user,
        rank: offset + index + 1,
        currentStreak: user.current_streak || 0,
        longestStreak: user.longest_streak || 0
      }));

      res.json({
        success: true,
        data: usersWithRank,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        }
      });
    } catch (error) {
      next(error);
    }
  }
);

// GET /api/leaderboard/rank/:userId - Get user's rank
router.get('/rank/:userId',
  param('userId').isInt({ min: 1 }),
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          error: 'Validation failed',
          details: errors.array()
        });
      }

      const userId = parseInt(req.params.userId);

      // Get user's XP
      const [users] = await db.query(
        'SELECT xp, level FROM users WHERE id = ?',
        [userId]
      );

      if (users.length === 0) {
        return res.status(404).json({
          success: false,
          error: 'User not found'
        });
      }

      const userXP = users[0].xp || 0;

      // Get rank by XP
      const [rankResult] = await db.query(
        `SELECT COUNT(*) + 1 as rank
         FROM users
         WHERE xp > ?`,
        [userXP]
      );

      const rank = parseInt(rankResult[0].rank);

      // Get total users
      const [totalResult] = await db.query('SELECT COUNT(*) as total FROM users WHERE xp > 0');
      const total = totalResult[0].total;

      res.json({
        success: true,
        data: {
          userId,
          rank,
          total,
          xp: userXP,
          level: users[0].level || 1,
          percentile: total > 0 ? Math.round(((total - rank) / total) * 100) : 0
        }
      });
    } catch (error) {
      next(error);
    }
  }
);

module.exports = router;

