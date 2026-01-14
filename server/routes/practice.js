const express = require('express');
const router = express.Router();
const { body, param, query, validationResult } = require('express-validator');
const db = require('../config/database');
const { v4: uuidv4 } = require('uuid');
const questionBank = require('../services/questionBank');
const codeExecutor = require('../services/codeExecutor');
const PracticeAgent = require('../agents/practice');
const gamification = require('../services/gamification');
const achievements = require('../services/achievements');
const { authenticate } = require('../middleware/auth');

const practiceAgent = new PracticeAgent();

// GET /api/practice/questions
router.get('/questions',
  query('difficulty').optional().isIn(['easy', 'medium', 'hard']),
  query('topic').optional().isString(),
  query('search').optional().isString(),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  query('offset').optional().isInt({ min: 0 }),
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

      const filters = {
        difficulty: req.query.difficulty,
        topic: req.query.topic,
        search: req.query.search,
        limit: parseInt(req.query.limit) || 50,
        offset: parseInt(req.query.offset) || 0
      };

      const questions = await questionBank.getQuestionsByFilter(filters);
      res.json({ success: true, data: questions });
    } catch (error) {
      next(error);
    }
  }
);

// GET /api/practice/questions/:id
router.get('/questions/:id',
  param('id').isInt({ min: 1 }),
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

      const questionId = parseInt(req.params.id);
      const question = await questionBank.getQuestionById(questionId);

      if (!question) {
        return res.status(404).json({
          success: false,
          error: 'Question not found'
        });
      }

      res.json({ success: true, data: question });
    } catch (error) {
      next(error);
    }
  }
);

// POST /api/practice/execute
router.post('/execute',
  body('questionId').isInt({ min: 1 }),
  body('code').notEmpty().isString(),
  body('language').isIn(['python', 'javascript', 'java', 'cpp', 'c', 'typescript', 'go', 'rust']),
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

      const { questionId, code, language } = req.body;

      // Get question and test cases
      const question = await questionBank.getQuestionById(questionId);
      if (!question) {
        return res.status(404).json({
          success: false,
          error: 'Question not found'
        });
      }

      if (!question.testCases || question.testCases.length === 0) {
        return res.status(400).json({
          success: false,
          error: 'No test cases available for this question'
        });
      }

      // Execute code
      const executionResult = await codeExecutor.executeCode(
        code,
        language,
        question.testCases
      );

      res.json({ success: true, data: executionResult });
    } catch (error) {
      next(error);
    }
  }
);

// POST /api/practice/submit
router.post('/submit', authenticate,
  body('questionId').isInt({ min: 1 }),
  body('code').notEmpty().isString(),
  body('language').isIn(['python', 'javascript', 'java', 'cpp', 'c', 'typescript', 'go', 'rust']),
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
      const { questionId, code, language } = req.body;

      // Get question
      const question = await questionBank.getQuestionById(questionId);
      if (!question) {
        return res.status(404).json({
          success: false,
          error: 'Question not found'
        });
      }

      // Execute code
      const executionResult = await codeExecutor.executeCode(
        code,
        language,
        question.testCases || []
      );

      // Calculate score
      const totalTests = Number(executionResult.totalTests) || 0;
      const passedTests = Number(executionResult.passedTests) || 0;
      const score = totalTests > 0 ? (passedTests / totalTests) * 100 : 0;

      // Save practice session
      const sessionId = uuidv4();
      await db.query(
        `INSERT INTO user_practice_sessions 
         (user_id, question_id, session_id, code, language, status, test_results, score, execution_time_ms, memory_usage_kb)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          userId,
          questionId,
          sessionId,
          code,
          language,
          executionResult.success ? 'completed' : 'failed',
          JSON.stringify(executionResult.results),
          score,
          executionResult.executionTime,
          executionResult.memoryUsage
        ]
      );

      // Update or create progress
      await db.query(
        `INSERT INTO practice_progress (user_id, question_id, attempts, best_score, completion_status, last_attempt_at, time_spent_minutes)
         VALUES (?, ?, 1, ?, ?, NOW(), 0)
         ON DUPLICATE KEY UPDATE
         attempts = attempts + 1,
         best_score = GREATEST(best_score, ?),
         completion_status = CASE 
           WHEN ? >= 100 THEN 'solved'
           WHEN completion_status = 'not_started' THEN 'in_progress'
           ELSE completion_status
         END,
         last_attempt_at = NOW()`,
        [
          userId,
          questionId,
          score,
          executionResult.success ? 'solved' : 'in_progress',
          score,
          score
        ]
      );

      // If solved, update solved_at and award XP
      let xpResult = null;
      let unlockedAchievements = [];
      if (executionResult.success) {
        // Check if this is the first time solving this problem
        const [progress] = await db.query(
          'SELECT solved_at FROM practice_progress WHERE user_id = ? AND question_id = ?',
          [userId, questionId]
        );
        const isFirstSolve = !progress[0] || !progress[0].solved_at;

        await db.query(
          `UPDATE practice_progress 
           SET solved_at = NOW(), completion_status = 'solved'
           WHERE user_id = ? AND question_id = ? AND solved_at IS NULL`,
          [userId, questionId]
        );

        // Award XP only if first time solving
        if (isFirstSolve) {
          try {
            // Calculate XP based on difficulty: 25 (easy), 50 (medium), 100 (hard)
            const difficultyXP = {
              easy: 25,
              medium: 50,
              hard: 100
            };
            const xpAmount = difficultyXP[question.difficulty?.toLowerCase()] || 25;

            // Award XP
            xpResult = await gamification.awardXP(userId, xpAmount, 'coding');

            // Update streak
            await gamification.updateStreak(userId);

            // Check and unlock achievements
            unlockedAchievements = await achievements.checkAchievements(userId, 'solve_problem', {
              difficulty: question.difficulty,
              questionId
            });
          } catch (error) {
            console.error('Error awarding XP/achievements for coding problem:', error);
            // Don't fail the submission if gamification fails
          }
        }
      }

      // Get AI explanation
      let explanation = null;
      try {
        const explanationResult = await practiceAgent.explainSolution(
          userId,
          questionId,
          code,
          executionResult
        );
        if (explanationResult.success) {
          explanation = explanationResult.data;
          
          // Save explanation to session
          await db.query(
            `UPDATE user_practice_sessions 
             SET feedback_json = ?
             WHERE session_id = ?`,
            [JSON.stringify(explanation), sessionId]
          );
        }
      } catch (error) {
        console.error('Error getting explanation:', error);
      }

      res.json({
        success: true,
        data: {
          executionResult,
          score,
          sessionId,
          explanation,
          xpGained: xpResult ? xpResult.xpGained : null,
          leveledUp: xpResult ? xpResult.leveledUp : false,
          newLevel: xpResult ? xpResult.newLevel : null,
          unlockedAchievements: unlockedAchievements
        }
      });
    } catch (error) {
      next(error);
    }
  }
);

// GET /api/practice/progress - Get current user's practice progress
router.get('/progress', authenticate, async (req, res, next) => {
    try {
      const userId = req.user.id;

      // Get overall progress
      const [progress] = await db.query(
        `SELECT 
          COUNT(DISTINCT question_id) as totalAttempted,
          COUNT(DISTINCT CASE WHEN completion_status = 'solved' THEN question_id END) as solvedCount,
          COUNT(DISTINCT CASE WHEN completion_status = 'mastered' THEN question_id END) as masteredCount,
          AVG(best_score) as avgScore,
          SUM(attempts) as totalAttempts
        FROM practice_progress
        WHERE user_id = ?`,
        [userId]
      );

      const stats = progress[0] || {};
      const accuracy = stats.totalAttempts > 0 
        ? (stats.solvedCount / stats.totalAttempted * 100) || 0
        : 0;

      res.json({
        success: true,
        data: {
          totalAttempted: stats.totalAttempted || 0,
          solvedCount: stats.solvedCount || 0,
          masteredCount: stats.masteredCount || 0,
          averageScore: Math.round(stats.avgScore || 0),
          totalAttempts: stats.totalAttempts || 0,
          accuracy: Math.round(accuracy)
        }
      });
    } catch (error) {
      next(error);
    }
  }
);

// POST /api/practice/hint
router.post('/hint', authenticate,
  body('questionId').isInt({ min: 1 }),
  body('code').optional().isString(),
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
      const { questionId, code } = req.body;

      // Get user's attempt count
      const [progress] = await db.query(
        'SELECT attempts FROM practice_progress WHERE user_id = ? AND question_id = ?',
        [userId, questionId]
      );

      const attempts = progress[0]?.attempts || 0;

      const result = await practiceAgent.getHint(userId, questionId, code, attempts);

      if (result.success) {
        res.json(result);
      } else {
        res.status(500).json(result);
      }
    } catch (error) {
      next(error);
    }
  }
);

// GET /api/practice/code/:questionId - Get current user's saved code for a question
router.get('/code/:questionId', authenticate,
  param('questionId').isInt({ min: 1 }),
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
      const questionId = parseInt(req.params.questionId);

      // Get latest session code
      const [sessions] = await db.query(
        `SELECT code, language 
         FROM user_practice_sessions 
         WHERE user_id = ? AND question_id = ?
         ORDER BY created_at DESC 
         LIMIT 1`,
        [userId, questionId]
      );

      if (sessions.length > 0) {
        res.json({
          success: true,
          data: {
            code: sessions[0].code,
            language: sessions[0].language
          }
        });
      } else {
        res.json({
          success: true,
          data: null
        });
      }
    } catch (error) {
      next(error);
    }
  }
);

module.exports = router;

