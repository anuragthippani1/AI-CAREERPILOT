const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const { body, validationResult } = require('express-validator');
const orchestrator = require('../agents/orchestrator');
const { authenticate } = require('../middleware/auth');

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, '../../uploads');
fs.mkdir(uploadsDir, { recursive: true }).catch(console.error);

// Configure multer for file uploads
const upload = multer({
  dest: uploadsDir,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['application/pdf', 'text/plain', 'application/msword', 
                         'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only PDF, TXT, and DOC files are allowed.'));
    }
  }
});

// Validation middleware
const validateResumeAnalyze = [
  body('targetRole').optional().isString().trim().isLength({ min: 1, max: 200 }).withMessage('Target role must be between 1 and 200 characters'),
  body('text').optional().isString().trim().isLength({ min: 10, max: 50000 }).withMessage('Resume text must be between 10 and 50000 characters'),
];

// POST /api/resume/analyze
router.post('/analyze', authenticate, upload.single('resume'), validateResumeAnalyze, async (req, res, next) => {
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
    const targetRole = req.body.targetRole?.trim();

    let inputData = {
      targetRole
    };

    if (req.file) {
      inputData.filePath = req.file.path;
      inputData.fileType = req.file.mimetype;
    } else if (req.body.text) {
      inputData.text = req.body.text;
    } else {
      return res.status(400).json({
        success: false,
        error: 'No resume file or text provided'
      });
    }

    const result = await orchestrator.orchestrate(userId, 'analyze_resume', inputData);

    if (result.success) {
      // Clean up uploaded file after processing
      if (req.file) {
        try {
          await fs.unlink(req.file.path);
        } catch (err) {
          console.error('Error deleting file:', err);
        }
      }
      res.json(result);
    } else {
      res.status(500).json(result);
    }
  } catch (error) {
    next(error);
  }
});

// GET /api/resume - Get current user's resume
router.get('/', authenticate, async (req, res, next) => {
  try {
    const db = require('../config/database');
    const userId = req.user.id;

    const [resumes] = await db.query(
      'SELECT * FROM resumes WHERE user_id = ? ORDER BY created_at DESC LIMIT 1',
      [userId]
    );

    // Demo/UX-friendly: treat "no resume yet" as a successful empty state (avoid noisy 404s in the browser console)
    if (resumes.length === 0) {
      return res.json({
        success: true,
        data: null
      });
    }

    const resume = resumes[0];
    resume.analysis_json = typeof resume.analysis_json === 'string' 
      ? JSON.parse(resume.analysis_json) 
      : resume.analysis_json;

    res.json({ success: true, data: resume });
  } catch (error) {
    next(error);
  }
});

module.exports = router;

