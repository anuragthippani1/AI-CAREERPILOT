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
      `SELECT 
        r.*,
        cg.target_role,
        cg.timeline_months
      FROM roadmaps r
      LEFT JOIN career_goals cg ON cg.id = r.career_goal_id
      WHERE r.user_id = ?
      ORDER BY r.created_at DESC
      LIMIT 1`,
      [userId]
    );

    // Demo/UX-friendly: treat "no roadmap yet" as a successful empty state (avoid noisy 404s in the browser console)
    if (roadmaps.length === 0) {
      return res.json({
        success: true,
        data: null
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

// GET /api/roadmap/tasks/progress/:userId
// Get all task completions for a user
router.get('/tasks/progress/:userId',
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

      const [completions] = await db.query(
        `SELECT task_id, completed, started_at, completed_at
         FROM roadmap_task_completions
         WHERE user_id = ?`,
        [userId]
      );

      // Convert to object format for frontend consumption
      const taskState = {};
      completions.forEach(c => {
        taskState[c.task_id] = {
          done: !!c.completed,
          startedAt: c.started_at ? new Date(c.started_at).getTime() : null,
          doneAt: c.completed_at ? new Date(c.completed_at).getTime() : null
        };
      });

      res.json({ success: true, data: taskState });
    } catch (error) {
      next(error);
    }
  }
);

// POST /api/roadmap/tasks/complete
// Mark a task as complete or incomplete
router.post('/tasks/complete',
  body('userId').isInt({ min: 1 }).withMessage('User ID must be a positive integer'),
  body('taskId').notEmpty().isString().withMessage('Task ID is required'),
  body('completed').isBoolean().withMessage('Completed must be a boolean'),
  body('roadmapId').optional().isInt({ min: 1 }),
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
      const { userId, taskId, completed, roadmapId } = req.body;

      // Check if task exists
      const [existing] = await db.query(
        `SELECT started_at FROM roadmap_task_completions 
         WHERE user_id = ? AND task_id = ?`,
        [userId, taskId]
      );

      const existingStartedAt = existing.length > 0 ? existing[0].started_at : null;

      if (completed) {
        // Mark as complete
        await db.query(
          `INSERT INTO roadmap_task_completions 
           (user_id, task_id, roadmap_id, completed, started_at, completed_at)
           VALUES (?, ?, ?, TRUE, COALESCE(?, CURRENT_TIMESTAMP), CURRENT_TIMESTAMP)
           ON DUPLICATE KEY UPDATE 
             completed = TRUE,
             completed_at = CURRENT_TIMESTAMP,
             started_at = COALESCE(started_at, CURRENT_TIMESTAMP),
             roadmap_id = COALESCE(VALUES(roadmap_id), roadmap_id)`,
          [userId, taskId, roadmapId || null, existingStartedAt]
        );
      } else {
        // Mark as incomplete (uncheck)
        await db.query(
          `INSERT INTO roadmap_task_completions 
           (user_id, task_id, roadmap_id, completed, started_at, completed_at)
           VALUES (?, ?, ?, FALSE, ?, NULL)
           ON DUPLICATE KEY UPDATE 
             completed = FALSE,
             completed_at = NULL`,
          [userId, taskId, roadmapId || null, existingStartedAt]
        );
      }

      // Get updated task state
      const [result] = await db.query(
        `SELECT task_id, completed, started_at, completed_at
         FROM roadmap_task_completions
         WHERE user_id = ? AND task_id = ?`,
        [userId, taskId]
      );

      const taskState = result.length > 0 ? {
        done: !!result[0].completed,
        startedAt: result[0].started_at ? new Date(result[0].started_at).getTime() : null,
        doneAt: result[0].completed_at ? new Date(result[0].completed_at).getTime() : null
      } : null;

      res.json({ 
        success: true, 
        data: { taskId, taskState }
      });
    } catch (error) {
      next(error);
    }
  }
);

// POST /api/roadmap/tasks/start
// Mark a task as started
router.post('/tasks/start',
  body('userId').isInt({ min: 1 }).withMessage('User ID must be a positive integer'),
  body('taskId').notEmpty().isString().withMessage('Task ID is required'),
  body('roadmapId').optional().isInt({ min: 1 }),
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
      const { userId, taskId, roadmapId } = req.body;

      await db.query(
        `INSERT INTO roadmap_task_completions 
         (user_id, task_id, roadmap_id, started_at)
         VALUES (?, ?, ?, CURRENT_TIMESTAMP)
         ON DUPLICATE KEY UPDATE 
           started_at = COALESCE(started_at, CURRENT_TIMESTAMP),
           roadmap_id = COALESCE(VALUES(roadmap_id), roadmap_id)`,
        [userId, taskId, roadmapId || null]
      );

      res.json({ success: true });
    } catch (error) {
      next(error);
    }
  }
);

module.exports = router;

