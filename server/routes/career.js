const express = require('express');
const { body, validationResult } = require('express-validator');
const orchestrator = require('../agents/orchestrator');
const db = require('../config/database');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

router.get('/match', authenticate, async (req, res, next) => {
  try {
    const userId = req.user.id;
    const [rows] = await db.query(
      `SELECT id, target_role, interests_json, report_json, top_career_title, top_career_confidence, created_at
       FROM career_reports
       WHERE user_id = ?
       ORDER BY created_at DESC
       LIMIT 1`,
      [userId]
    );

    if (rows.length === 0) {
      return res.json({ success: true, data: null });
    }

    const row = rows[0];
    res.json({
      success: true,
      data: {
        id: row.id,
        targetRole: row.target_role,
        interests: typeof row.interests_json === 'string' ? JSON.parse(row.interests_json) : (row.interests_json || []),
        report: typeof row.report_json === 'string' ? JSON.parse(row.report_json) : row.report_json,
        topCareerTitle: row.top_career_title,
        topCareerConfidence: row.top_career_confidence != null ? Math.round(Number(row.top_career_confidence)) : null,
        createdAt: row.created_at,
      },
    });
  } catch (error) {
    next(error);
  }
});

router.post(
  '/match',
  authenticate,
  body('interests').optional().custom((value) => {
    if (typeof value === 'string') return true;
    if (Array.isArray(value) && value.every((item) => typeof item === 'string')) return true;
    throw new Error('Interests must be a comma-separated string or an array of strings');
  }),
  body('targetRole').optional().isString().trim().isLength({ min: 1, max: 200 }),
  body('currentRoleOrEducation').optional().isString().trim().isLength({ min: 1, max: 300 }),
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          error: 'Validation failed',
          details: errors.array(),
        });
      }

      const result = await orchestrator.orchestrate(req.user.id, 'match_careers', {
        interests: req.body.interests,
        targetRole: req.body.targetRole,
        currentRoleOrEducation: req.body.currentRoleOrEducation,
      });

      if (result.success) {
        return res.json(result);
      }

      return res.status(500).json(result);
    } catch (error) {
      next(error);
    }
  }
);

module.exports = router;
