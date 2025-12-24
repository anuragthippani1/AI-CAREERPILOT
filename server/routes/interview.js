const express = require('express');
const router = express.Router();
const orchestrator = require('../agents/orchestrator');

// POST /api/interview/start
router.post('/start', async (req, res, next) => {
  try {
    const userId = req.body.userId || 1;
    const roleTitle = req.body.roleTitle;
    const type = req.body.type;
    const companyName = req.body.companyName;

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
router.post('/continue', async (req, res, next) => {
  try {
    const userId = req.body.userId || 1;
    const sessionId = req.body.sessionId;
    const answer = req.body.answer;

    if (!sessionId || !answer) {
      return res.status(400).json({ error: 'Session ID and answer are required' });
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
router.post('/feedback', async (req, res, next) => {
  try {
    const db = require('../config/database');
    const sessionId = req.body.sessionId;

    if (!sessionId) {
      return res.status(400).json({ error: 'Session ID is required' });
    }

    const [sessions] = await db.query(
      'SELECT * FROM interview_sessions WHERE session_id = ?',
      [sessionId]
    );

    if (sessions.length === 0) {
      return res.status(404).json({ error: 'Interview session not found' });
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

// GET /api/interview/sessions/:userId
router.get('/sessions/:userId', async (req, res, next) => {
  try {
    const db = require('../config/database');
    const userId = req.params.userId;

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

