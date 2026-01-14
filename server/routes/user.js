const express = require('express');
const router = express.Router();
const { body, param, query, validationResult } = require('express-validator');
const db = require('../config/database');
const gamification = require('../services/gamification');
const achievements = require('../services/achievements');
const { authenticate } = require('../middleware/auth');

// POST /api/user/create
router.post('/create', async (req, res, next) => {
  try {
    const { email, name } = req.body;

    if (!email || !name) {
      return res.status(400).json({ success: false, error: 'Email and name are required' });
    }

    const [result] = await db.query(
      'INSERT INTO users (email, name) VALUES (?, ?)',
      [email, name]
    );

    res.status(201).json({ success: true, data: { userId: result.insertId, email, name } });
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ success: false, error: 'User with this email already exists' });
    }
    next(error);
  }
});

// POST /api/user/goal
router.post('/goal', authenticate, async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { targetRole, targetCompany, targetSalary, timelineMonths } = req.body;

    if (!targetRole) {
      return res.status(400).json({ success: false, error: 'Target role is required' });
    }

    // Deactivate existing goals
    await db.query(
      'UPDATE career_goals SET status = "paused" WHERE user_id = ? AND status = "active"',
      [userId]
    );

    // Create new goal
    const [result] = await db.query(
      `INSERT INTO career_goals (user_id, target_role, target_company, target_salary, timeline_months, status)
       VALUES (?, ?, ?, ?, ?, 'active')`,
      [userId, targetRole, targetCompany || null, targetSalary || null, timelineMonths || null]
    );

    res.json({ success: true, data: { goalId: result.insertId } });
  } catch (error) {
    next(error);
  }
});

// GET /api/user/me - Get current user profile
router.get('/me', authenticate, async (req, res) => {
  res.json({ success: true, data: req.user });
});

// GET /api/user/:userId - Get user by ID (for leaderboard/public profiles)
// Public endpoint - only exposes safe profile data (no email or sensitive info)
router.get('/:userId', 
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

      // Only expose public profile data (no email, no sensitive fields)
      const [users] = await db.query(
        'SELECT id, name, xp, level, current_streak, longest_streak, avatar_url, bio, title, created_at FROM users WHERE id = ?',
        [userId]
      );

      if (users.length === 0) {
        return res.status(404).json({ 
          success: false,
          error: 'User not found' 
        });
      }

      res.json({ success: true, data: users[0] });
    } catch (error) {
      next(error);
    }
  }
);

// PUT /api/user/profile - Update current user profile
router.put('/profile', authenticate,
  body('name').optional().trim().isLength({ min: 1, max: 255 }),
  body('bio').optional().trim().isLength({ max: 1000 }),
  body('title').optional().trim().isLength({ max: 255 }),
  body('avatarUrl').optional().trim().isURL().withMessage('Avatar URL must be a valid URL'),
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

      const userId = req.user.id;
      const { name, bio, title, avatarUrl } = req.body;

      // Security: Only allow updating user-editable fields
      // System-managed fields (xp, level, streaks, etc.) cannot be modified via this endpoint
      const allowedFields = ['name', 'bio', 'title', 'avatar_url'];
      const updates = [];
      const values = [];

      if (name !== undefined) {
        updates.push('name = ?');
        values.push(name);
      }
      if (bio !== undefined) {
        updates.push('bio = ?');
        values.push(bio);
      }
      if (title !== undefined) {
        updates.push('title = ?');
        values.push(title);
      }
      if (avatarUrl !== undefined) {
        updates.push('avatar_url = ?');
        values.push(avatarUrl);
      }

      if (updates.length === 0) {
        return res.status(400).json({
          success: false,
          error: 'No fields to update'
        });
      }

      values.push(userId);

      await db.query(
        `UPDATE users SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
        values
      );

      // Get updated user
      const [users] = await db.query(
        'SELECT id, email, name, xp, level, current_streak, longest_streak, avatar_url, bio, title, created_at FROM users WHERE id = ?',
        [userId]
      );

      res.json({ success: true, data: users[0] });
    } catch (error) {
      next(error);
    }
  }
);

// GET /api/user/stats - Get current user stats
router.get('/stats', authenticate, async (req, res, next) => {
    try {
      const userId = req.user.id;
      const stats = await gamification.getUserStats(userId);

      res.json({ success: true, data: stats });
    } catch (error) {
      if (error.message === 'User not found') {
        return res.status(404).json({
          success: false,
          error: 'User not found'
        });
      }
      next(error);
    }
  }
);

// GET /api/user/achievements - Get current user achievements
router.get('/achievements', authenticate,
  query('all').optional().isBoolean(),
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

      const userId = req.user.id;
      const showAll = req.query.all === 'true';

      if (showAll) {
        // Get all achievements with unlock status
        const allAchievements = await achievements.getAllAchievements(userId);
        res.json({ success: true, data: allAchievements });
      } else {
        // Get only unlocked achievements
        const userAchievements = await achievements.getUserAchievements(userId);
        res.json({ success: true, data: userAchievements });
      }
    } catch (error) {
      next(error);
    }
  }
);

module.exports = router;


