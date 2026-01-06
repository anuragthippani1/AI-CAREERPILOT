const express = require('express');
const router = express.Router();
const orchestrator = require('../agents/orchestrator');
const { body, param, validationResult } = require('express-validator');

// POST /api/skills/analyze
router.post('/analyze',
  body('userId').optional().isInt({ min: 1 }).withMessage('User ID must be a positive integer'),
  body('resumeAnalysis').optional(),
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

    const userId = req.body.userId || 1;
    const resumeAnalysis = req.body.resumeAnalysis;

    const result = await orchestrator.orchestrate(userId, 'analyze_skill_gap', {
      resumeAnalysis
    });

    if (result.success) {
      res.json(result);
    } else {
      res.status(500).json(result);
    }
  } catch (error) {
    next(error);
  }
});

// GET /api/skills/:userId
router.get('/:userId',
  param('userId').isInt({ min: 1 }).withMessage('User ID must be a positive integer'),
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

    const db = require('../config/database');
    const userId = parseInt(req.params.userId);

    const [skills] = await db.query(
      'SELECT * FROM skills WHERE user_id = ? ORDER BY created_at DESC',
      [userId]
    );

    res.json({ success: true, data: skills });
  } catch (error) {
    next(error);
  }
});

module.exports = router;






