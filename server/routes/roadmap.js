const express = require('express');
const router = express.Router();
const orchestrator = require('../agents/orchestrator');

// GET /api/roadmap/:userId
router.get('/:userId', async (req, res, next) => {
  try {
    const db = require('../config/database');
    const userId = req.params.userId;

    const [roadmaps] = await db.query(
      'SELECT * FROM roadmaps WHERE user_id = ? ORDER BY created_at DESC LIMIT 1',
      [userId]
    );

    if (roadmaps.length === 0) {
      return res.status(404).json({ error: 'No roadmap found. Generate one first.' });
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
router.post('/generate', async (req, res, next) => {
  try {
    const userId = req.body.userId || 1;
    const skillGap = req.body.skillGap;

    const result = await orchestrator.orchestrate(userId, 'generate_roadmap', {
      skillGap
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

