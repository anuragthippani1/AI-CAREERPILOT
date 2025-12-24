const express = require('express');
const router = express.Router();
const orchestrator = require('../agents/orchestrator');

// POST /api/skills/analyze
router.post('/analyze', async (req, res, next) => {
  try {
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
router.get('/:userId', async (req, res, next) => {
  try {
    const db = require('../config/database');
    const userId = req.params.userId;

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

