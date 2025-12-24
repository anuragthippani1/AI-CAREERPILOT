const express = require('express');
const router = express.Router();
const db = require('../config/database');

// POST /api/user/create
router.post('/create', async (req, res, next) => {
  try {
    const { email, name } = req.body;

    if (!email || !name) {
      return res.status(400).json({ error: 'Email and name are required' });
    }

    const [result] = await db.query(
      'INSERT INTO users (email, name) VALUES (?, ?)',
      [email, name]
    );

    res.json({ success: true, data: { userId: result.insertId, email, name } });
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ error: 'User with this email already exists' });
    }
    next(error);
  }
});

// POST /api/user/goal
router.post('/goal', async (req, res, next) => {
  try {
    const userId = req.body.userId || 1;
    const { targetRole, targetCompany, targetSalary, timelineMonths } = req.body;

    if (!targetRole) {
      return res.status(400).json({ error: 'Target role is required' });
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

// GET /api/user/:userId
router.get('/:userId', async (req, res, next) => {
  try {
    const userId = req.params.userId;

    const [users] = await db.query(
      'SELECT * FROM users WHERE id = ?',
      [userId]
    );

    if (users.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ success: true, data: users[0] });
  } catch (error) {
    next(error);
  }
});

module.exports = router;

