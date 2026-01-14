const express = require('express');
const router = express.Router();
const { body, param, validationResult } = require('express-validator');
const orchestrator = require('../agents/orchestrator');
const { authenticate } = require('../middleware/auth');

// Validation middleware
const validateInterviewStart = [
  body('roleTitle').notEmpty().trim().isLength({ min: 1, max: 200 }).withMessage('Role title is required and must be between 1 and 200 characters'),
  body('type').notEmpty().isIn(['technical', 'behavioral', 'mixed', 'system-design', 'coding', 'leadership']).withMessage('Interview type must be one of: technical, behavioral, mixed, system-design, coding, leadership'),
  body('companyName').optional().trim().isLength({ max: 200 }).withMessage('Company name must be less than 200 characters'),
];

const validateInterviewContinue = [
  body('sessionId').notEmpty().isUUID().withMessage('Valid session ID is required'),
  body('answer').notEmpty().trim().isLength({ min: 1, max: 5000 }).withMessage('Answer is required and must be between 1 and 5000 characters'),
];

// POST /api/interview/start
router.post('/start', authenticate, validateInterviewStart, async (req, res, next) => {
  try {
    // Check validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        success: false,
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const userId = req.user.id;
    const roleTitle = req.body.roleTitle.trim();
    const type = req.body.type;
    const companyName = req.body.companyName?.trim();

    const result = await orchestrator.orchestrate(userId, 'start_interview', {
      roleTitle,
      type,
      companyName
    });

    // Return result directly (orchestrator already wraps it)
    if (result.success && result.data && result.data.success) {
      res.json(result);
    } else if (result.success && result.data && !result.data.success) {
      // Agent returned error
      res.status(500).json(result);
    } else {
      res.status(500).json(result);
    }
  } catch (error) {
    next(error);
  }
});

// POST /api/interview/continue
router.post('/continue', authenticate, validateInterviewContinue, async (req, res, next) => {
  try {
    // Check validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        success: false,
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const userId = req.user.id;
    const sessionId = req.body.sessionId;
    const answer = req.body.answer.trim();

    // Verify session ownership before continuing
    const db = require('../config/database');
    const [sessions] = await db.query(
      'SELECT id FROM interview_sessions WHERE session_id = ? AND user_id = ?',
      [sessionId, userId]
    );

    if (sessions.length === 0) {
      return res.status(403).json({
        success: false,
        error: 'Interview session not found or access denied'
      });
    }

    const result = await orchestrator.orchestrate(userId, 'continue_interview', {
      sessionId,
      answer
    });

    // Return result directly (orchestrator already wraps it)
    if (result.success && result.data && result.data.success) {
      res.json(result);
    } else if (result.success && result.data && !result.data.success) {
      // Agent returned error
      res.status(500).json(result);
    } else {
      res.status(500).json(result);
    }
  } catch (error) {
    next(error);
  }
});

// POST /api/interview/feedback
router.post('/feedback', 
  body('sessionId').notEmpty().isUUID().withMessage('Valid session ID is required'),
  async (req, res, next) => {
  try {
    // Check validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        success: false,
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const db = require('../config/database');
    const sessionId = req.body.sessionId;

    const [sessions] = await db.query(
      'SELECT * FROM interview_sessions WHERE session_id = ?',
      [sessionId]
    );

    if (sessions.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Interview session not found'
      });
    }

    const session = sessions[0];
    const feedback = typeof session.feedback_json === 'string' 
      ? JSON.parse(session.feedback_json) 
      : session.feedback_json;

    res.json({ 
      success: true, 
      data: {
        sessionId: session.session_id,
        roleTitle: session.role_title,
        overallScore: session.overall_score,
        feedback,
        status: session.status
      }
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/interview/sessions - Get current user's interview sessions
router.get('/sessions', authenticate, async (req, res, next) => {
  try {
    const db = require('../config/database');
    const userId = req.user.id;

    const [sessions] = await db.query(
      'SELECT id, session_id, role_title, overall_score, status, created_at, updated_at FROM interview_sessions WHERE user_id = ? ORDER BY created_at DESC',
      [userId]
    );

    res.json({ success: true, data: sessions });
  } catch (error) {
    next(error);
  }
});

module.exports = router;

