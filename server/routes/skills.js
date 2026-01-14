const express = require('express');
const router = express.Router();
const orchestrator = require('../agents/orchestrator');
const { body, validationResult } = require('express-validator');
const { authenticate } = require('../middleware/auth');

// POST /api/skills/analyze
router.post('/analyze', authenticate,
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

    const userId = req.user.id;
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

// GET /api/skills - Get current user's skills
router.get('/', authenticate, async (req, res, next) => {
  try {
    const db = require('../config/database');
    const userId = req.user.id;

    const [skills] = await db.query(
      'SELECT * FROM skills WHERE user_id = ? ORDER BY created_at DESC',
      [userId]
    );

    res.json({ success: true, data: skills });
  } catch (error) {
    next(error);
  }
});

// GET /api/skills/gap-analyses
// Get skill gap analysis history for current user
router.get('/gap-analyses', authenticate, async (req, res, next) => {
    try {
      const db = require('../config/database');
      const userId = req.user.id;

      const [analyses] = await db.query(
        `SELECT id, target_role, analysis_json, current_match_percentage, created_at
         FROM skill_gap_analyses
         WHERE user_id = ?
         ORDER BY created_at DESC`,
        [userId]
      );

      // Parse JSON for each analysis
      const parsedAnalyses = analyses.map(a => ({
        id: a.id,
        targetRole: a.target_role,
        currentMatchPercentage: a.current_match_percentage,
        createdAt: a.created_at,
        analysis: typeof a.analysis_json === 'string' ? JSON.parse(a.analysis_json) : a.analysis_json
      }));

      res.json({ success: true, data: parsedAnalyses });
    } catch (error) {
      next(error);
    }
  }
);

module.exports = router;






