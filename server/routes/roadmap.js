const express = require('express');
const router = express.Router();
const { body, param, validationResult } = require('express-validator');
const orchestrator = require('../agents/orchestrator');

// GET /api/roadmap/:userId
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

    const [roadmaps] = await db.query(
      'SELECT * FROM roadmaps WHERE user_id = ? ORDER BY created_at DESC LIMIT 1',
      [userId]
    );

    if (roadmaps.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'No roadmap found. Generate one first.'
      });
    }

    const roadmap = roadmaps[0];
    roadmap.roadmap_json = typeof roadmap.roadmap_json === 'string' 
      ? JSON.parse(roadmap.roadmap_json) 
      : roadmap.roadmap_json;
    roadmap.milestones = typeof roadmap.milestones === 'string' 
      ? JSON.parse(roadmap.milestones) 
      : roadmap.milestones;

    res.json({ success: true, data: roadmap });
  } catch (error) {
    next(error);
  }
});

// POST /api/roadmap/generate
router.post('/generate',
  body('userId').optional().isInt({ min: 1 }).withMessage('User ID must be a positive integer'),
  body('targetRole').optional().isString().trim().isLength({ min: 1, max: 200 }).withMessage('Target role must be between 1 and 200 characters'),
  body('skillGap').optional(),
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
    const skillGap = req.body.skillGap;
    const targetRole = req.body.targetRole;

    const result = await orchestrator.orchestrate(userId, 'generate_roadmap', {
      skillGap,
      targetRole
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

module.exports = router;

