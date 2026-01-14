const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const bcrypt = require('bcrypt');
const db = require('../config/database');
const { generateToken, authenticate } = require('../middleware/auth');

// POST /api/auth/signup
router.post('/signup',
  body('email').isEmail().withMessage('Valid email is required'),
  body('name').trim().isLength({ min: 1, max: 255 }).withMessage('Name is required (1-255 characters)'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
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

      const { email, name, password } = req.body;

      // Check if user already exists
      const [existing] = await db.query(
        'SELECT id FROM users WHERE email = ?',
        [email]
      );

      if (existing.length > 0) {
        return res.status(409).json({
          success: false,
          error: 'User with this email already exists'
        });
      }

      // Hash password
      const saltRounds = 10;
      const passwordHash = await bcrypt.hash(password, saltRounds);

      // Create user
      const [result] = await db.query(
        'INSERT INTO users (email, name, password_hash) VALUES (?, ?, ?)',
        [email, name, passwordHash]
      );

      const userId = result.insertId;

      // Generate token
      const token = generateToken(userId);

      // Return user data (without password)
      const [users] = await db.query(
        'SELECT id, email, name, xp, level, current_streak, longest_streak, avatar_url, bio, title, created_at FROM users WHERE id = ?',
        [userId]
      );

      res.status(201).json({
        success: true,
        data: {
          user: users[0],
          token
        }
      });
    } catch (error) {
      next(error);
    }
  }
);

// POST /api/auth/login
router.post('/login',
  body('email').isEmail().withMessage('Valid email is required'),
  body('password').notEmpty().withMessage('Password is required'),
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

      const { email, password } = req.body;

      // Find user by email
      const [users] = await db.query(
        'SELECT id, email, name, password_hash, xp, level, current_streak, longest_streak, avatar_url, bio, title, created_at FROM users WHERE email = ?',
        [email]
      );

      if (users.length === 0) {
        return res.status(401).json({
          success: false,
          error: 'Invalid email or password'
        });
      }

      const user = users[0];

      // Check if user has a password (for existing users without passwords)
      if (!user.password_hash) {
        return res.status(401).json({
          success: false,
          error: 'Account not set up with password. Please sign up again or reset your password.'
        });
      }

      // Verify password
      const passwordMatch = await bcrypt.compare(password, user.password_hash);

      if (!passwordMatch) {
        return res.status(401).json({
          success: false,
          error: 'Invalid email or password'
        });
      }

      // Generate token
      const token = generateToken(user.id);

      // Remove password_hash from response
      delete user.password_hash;

      res.json({
        success: true,
        data: {
          user,
          token
        }
      });
    } catch (error) {
      next(error);
    }
  }
);

// GET /api/auth/me - Get current user (requires authentication)
router.get('/me', authenticate, async (req, res) => {
  res.json({
    success: true,
    data: req.user
  });
});

// POST /api/auth/logout - Logout (client-side token removal, but endpoint for consistency)
router.post('/logout', (req, res) => {
  res.json({
    success: true,
    message: 'Logged out successfully'
  });
});

module.exports = router;
