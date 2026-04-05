const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const orchestrator = require('../agents/orchestrator');
const { body, validationResult } = require('express-validator');
const db = require('../config/database');
const { authenticate } = require('../middleware/auth');

let ensureShareTablesPromise = null;

function getFrontendUrl() {
  return (process.env.FRONTEND_URL || 'http://localhost:3000').replace(/\/$/, '');
}

async function ensureShareTables() {
  if (!ensureShareTablesPromise) {
    ensureShareTablesPromise = (async () => {
      await db.query(`
        CREATE TABLE IF NOT EXISTS skill_gap_shares (
          id INT AUTO_INCREMENT PRIMARY KEY,
          user_id INT NOT NULL,
          analysis_id INT NOT NULL,
          share_token VARCHAR(64) NOT NULL UNIQUE,
          share_count INT DEFAULT 0,
          view_count INT DEFAULT 0,
          last_shared_at TIMESTAMP NULL,
          last_viewed_at TIMESTAMP NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          UNIQUE KEY unique_user_analysis_share (user_id, analysis_id),
          INDEX idx_share_token (share_token),
          INDEX idx_user_id (user_id),
          INDEX idx_analysis_id (analysis_id),
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
          FOREIGN KEY (analysis_id) REFERENCES skill_gap_analyses(id) ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
      `);

      await db.query(`
        CREATE TABLE IF NOT EXISTS growth_events (
          id INT AUTO_INCREMENT PRIMARY KEY,
          event_name VARCHAR(100) NOT NULL,
          share_id INT NULL,
          viewer_user_id INT NULL,
          metadata_json JSON NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          INDEX idx_event_name (event_name),
          INDEX idx_share_id (share_id),
          INDEX idx_created_at (created_at),
          FOREIGN KEY (share_id) REFERENCES skill_gap_shares(id) ON DELETE SET NULL,
          FOREIGN KEY (viewer_user_id) REFERENCES users(id) ON DELETE SET NULL
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
      `);
    })().catch((error) => {
      ensureShareTablesPromise = null;
      throw error;
    });
  }

  return ensureShareTablesPromise;
}

function parseAnalysis(raw) {
  if (!raw) return null;
  return typeof raw === 'string' ? JSON.parse(raw) : raw;
}

function buildShareSnapshot(row) {
  const analysis = parseAnalysis(row.analysis_json) || {};
  const missingCritical = Array.isArray(analysis.missingCritical) ? analysis.missingCritical : [];
  const existingStrengths = Array.isArray(analysis.existingStrengths) ? analysis.existingStrengths : [];
  const safeName = (row.name || 'CareerPilot user').trim();
  const firstName = safeName.split(/\s+/)[0] || safeName;

  return {
    owner: {
      name: firstName,
      title: row.title || null,
      level: row.level || null,
    },
    targetRole: row.target_role,
    matchScore: row.current_match_percentage != null
      ? Math.round(Number(row.current_match_percentage))
      : Math.round(Number(analysis.currentMatchPercentage || 0)),
    overallAssessment: analysis.overallAssessment || null,
    missingCritical: missingCritical.slice(0, 3).map((skill) => ({
      skill: skill?.skill || 'Skill gap',
      priority: skill?.priority ?? null,
      estimatedTime: skill?.estimatedTime || null,
    })),
    existingStrengths: existingStrengths.slice(0, 5),
    createdAt: row.analysis_created_at,
    metrics: {
      shareCount: row.share_count || 0,
      viewCount: row.view_count || 0,
    },
  };
}

async function getLatestSkillGapAnalysis(userId) {
  const [rows] = await db.query(
    `SELECT id, target_role, analysis_json, current_match_percentage, created_at
     FROM skill_gap_analyses
     WHERE user_id = ?
     ORDER BY created_at DESC
     LIMIT 1`,
    [userId]
  );

  return rows[0] || null;
}

async function findShareByToken(token) {
  const [rows] = await db.query(
    `SELECT s.id, s.user_id, s.analysis_id, s.share_token, s.share_count, s.view_count,
            s.created_at AS share_created_at, s.last_shared_at, s.last_viewed_at,
            a.target_role, a.analysis_json, a.current_match_percentage, a.created_at AS analysis_created_at,
            u.name, u.title, u.level
     FROM skill_gap_shares s
     INNER JOIN skill_gap_analyses a ON a.id = s.analysis_id
     INNER JOIN users u ON u.id = s.user_id
     WHERE s.share_token = ?
     LIMIT 1`,
    [token]
  );

  return rows[0] || null;
}

// POST /api/skills/share-snapshot
router.post('/share-snapshot', authenticate, async (req, res, next) => {
  try {
    await ensureShareTables();

    const userId = req.user.id;
    const latestAnalysis = await getLatestSkillGapAnalysis(userId);

    if (!latestAnalysis) {
      return res.status(404).json({
        success: false,
        error: 'Run a skill gap analysis before sharing a snapshot.'
      });
    }

    const [existingRows] = await db.query(
      `SELECT id, share_token, share_count, view_count
       FROM skill_gap_shares
       WHERE user_id = ? AND analysis_id = ?
       LIMIT 1`,
      [userId, latestAnalysis.id]
    );

    let share = existingRows[0] || null;

    if (!share) {
      const shareToken = crypto.randomBytes(24).toString('hex');
      const [insertResult] = await db.query(
        `INSERT INTO skill_gap_shares (user_id, analysis_id, share_token, share_count, last_shared_at)
         VALUES (?, ?, ?, 0, NOW())`,
        [userId, latestAnalysis.id, shareToken]
      );

      share = {
        id: insertResult.insertId,
        share_token: shareToken,
        share_count: 0,
        view_count: 0,
      };
    }

    await db.query(
      `UPDATE skill_gap_shares
       SET share_count = share_count + 1,
           last_shared_at = NOW()
       WHERE id = ?`,
      [share.id]
    );

    await db.query(
      `INSERT INTO growth_events (event_name, share_id, viewer_user_id, metadata_json)
       VALUES (?, ?, ?, ?)`,
      [
        'share_clicked',
        share.id,
        userId,
        JSON.stringify({ source: 'skill_gap_results' })
      ]
    );

    const shareUrl = `${getFrontendUrl()}/share/skills/${share.share_token}`;

    res.json({
      success: true,
      data: {
        shareUrl,
        token: share.share_token,
        metrics: {
          shareCount: (share.share_count || 0) + 1,
          viewCount: share.view_count || 0,
        },
      },
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/skills/share/:token
router.get('/share/:token', async (req, res, next) => {
  try {
    await ensureShareTables();

    const share = await findShareByToken(req.params.token);

    if (!share) {
      return res.status(404).json({
        success: false,
        error: 'Shared snapshot not found'
      });
    }

    res.json({
      success: true,
      data: buildShareSnapshot(share),
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/skills/share/:token/view
router.post('/share/:token/view', async (req, res, next) => {
  try {
    await ensureShareTables();

    const share = await findShareByToken(req.params.token);

    if (!share) {
      return res.status(404).json({
        success: false,
        error: 'Shared snapshot not found'
      });
    }

    await db.query(
      `UPDATE skill_gap_shares
       SET view_count = view_count + 1,
           last_viewed_at = NOW()
       WHERE id = ?`,
      [share.id]
    );

    await db.query(
      `INSERT INTO growth_events (event_name, share_id, viewer_user_id, metadata_json)
       VALUES (?, ?, ?, ?)`,
      [
        'share_snapshot_viewed',
        share.id,
        null,
        JSON.stringify({ source: 'public_snapshot' })
      ]
    );

    res.json({
      success: true,
      data: {
        viewCount: (share.view_count || 0) + 1,
        shareCount: share.share_count || 0,
      },
    });
  } catch (error) {
    next(error);
  }
});

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





