const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const orchestrator = require('../agents/orchestrator');
const { authenticate } = require('../middleware/auth');

// GET /api/roadmap - Get current user's roadmap
router.get('/', authenticate, async (req, res, next) => {
  try {
    const db = require('../config/database');
    const userId = req.user.id;

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
router.post('/generate', authenticate,
  body('targetRole').optional().isString().trim().isLength({ min: 1, max: 200 }).withMessage('Target role must be between 1 and 200 characters'),
  body('dreamRole').optional().isString().trim().isLength({ min: 1, max: 200 }).withMessage('Dream role must be between 1 and 200 characters'),
  body('currentRoleOrEducation').optional().isString().trim().isLength({ min: 1, max: 200 }).withMessage('Current role or education must be between 1 and 200 characters'),
  body('currentSkills').optional().custom((value) => {
    if (typeof value === 'string') return true;
    if (Array.isArray(value) && value.every((s) => typeof s === 'string')) return true;
    throw new Error('Current skills must be a comma-separated string or an array of strings');
  }),
  body('experienceLevel').optional().isIn(['beginner', 'intermediate', 'advanced']).withMessage('Experience level must be beginner, intermediate, or advanced'),
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

    const userId = req.user.id;
    const {
      skillGap,
      targetRole,
      dreamRole,
      currentRoleOrEducation,
      currentSkills,
      experienceLevel,
    } = req.body;

    const resolvedTargetRole = dreamRole || targetRole;

    const result = await orchestrator.orchestrate(userId, 'generate_roadmap', {
      skillGap,
      targetRole: resolvedTargetRole,
      dreamRole,
      currentRoleOrEducation,
      currentSkills,
      experienceLevel,
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

// GET /api/roadmap/tasks/progress
// Get all task completions for current user
router.get('/tasks/progress', authenticate, async (req, res, next) => {
    try {
      const db = require('../config/database');
      const userId = req.user.id;

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
router.post('/tasks/complete', authenticate,
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
      const userId = req.user.id;
      const { taskId, completed, roadmapId } = req.body;

      // Verify roadmap ownership if roadmapId is provided
      if (roadmapId) {
        const [roadmaps] = await db.query(
          'SELECT id FROM roadmaps WHERE id = ? AND user_id = ?',
          [roadmapId, userId]
        );
        if (roadmaps.length === 0) {
          return res.status(403).json({
            success: false,
            error: 'Roadmap not found or access denied'
          });
        }
      }

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
router.post('/tasks/start', authenticate,
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
      const userId = req.user.id;
      const { taskId, roadmapId } = req.body;

      // Verify roadmap ownership if roadmapId is provided
      if (roadmapId) {
        const [roadmaps] = await db.query(
          'SELECT id FROM roadmaps WHERE id = ? AND user_id = ?',
          [roadmapId, userId]
        );
        if (roadmaps.length === 0) {
          return res.status(403).json({
            success: false,
            error: 'Roadmap not found or access denied'
          });
        }
      }

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

