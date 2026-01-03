const express = require('express');
const router = express.Router();
const { param, query, validationResult } = require('express-validator');
const questionBank = require('../services/questionBank');

// GET /api/technical-challenges
router.get(
  '/',
  query('difficulty').optional({ checkFalsy: true }).isIn(['easy', 'medium', 'hard']),
  // support both `topic` (existing UI wording) and `category` (feature requirement)
  query('topic').optional({ checkFalsy: true }).isString().trim(),
  query('category').optional({ checkFalsy: true }).isString().trim(),
  query('search').optional({ checkFalsy: true }).isString().trim(),
  query('limit').optional({ checkFalsy: true }).isInt({ min: 1, max: 100 }),
  query('offset').optional({ checkFalsy: true }).isInt({ min: 0 }),
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
        difficulty: req.query.difficulty || undefined,
        topic: (req.query.topic || req.query.category) || undefined,
        search: req.query.search || undefined,
        limit: Number.isFinite(parseInt(req.query.limit, 10)) ? parseInt(req.query.limit, 10) : 50,
        offset: Number.isFinite(parseInt(req.query.offset, 10)) ? parseInt(req.query.offset, 10) : 0
      };

      const questions = await questionBank.getQuestionsByFilter(filters);

      return res.json({
        success: true,
        data: questions,
        meta: {
          limit: filters.limit,
          offset: filters.offset,
          returned: questions.length
        }
      });
    } catch (error) {
      next(error);
    }
  }
);

// GET /api/technical-challenges/:id
router.get(
  '/:id',
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

      const id = parseInt(req.params.id, 10);
      const question = await questionBank.getQuestionById(id);

      if (!question) {
        return res.status(404).json({ success: false, error: 'Challenge not found' });
      }

      return res.json({ success: true, data: question });
    } catch (error) {
      next(error);
    }
  }
);

module.exports = router;


