/**
 * Ownership verification utilities
 * Ensures users can only access/modify their own resources
 */

const db = require('../config/database');

/**
 * Verify that a roadmap belongs to the user
 */
async function verifyRoadmapOwnership(userId, roadmapId) {
  if (!roadmapId) return true; // Optional parameter
  
  const [roadmaps] = await db.query(
    'SELECT id FROM roadmaps WHERE id = ? AND user_id = ?',
    [roadmapId, userId]
  );
  
  return roadmaps.length > 0;
}

/**
 * Verify that an interview session belongs to the user
 */
async function verifySessionOwnership(userId, sessionId) {
  if (!sessionId) return false;
  
  const [sessions] = await db.query(
    'SELECT id FROM interview_sessions WHERE session_id = ? AND user_id = ?',
    [sessionId, userId]
  );
  
  return sessions.length > 0;
}

/**
 * Verify that a resume belongs to the user
 */
async function verifyResumeOwnership(userId, resumeId) {
  if (!resumeId) return true; // Optional parameter
  
  const [resumes] = await db.query(
    'SELECT id FROM resumes WHERE id = ? AND user_id = ?',
    [resumeId, userId]
  );
  
  return resumes.length > 0;
}

/**
 * Verify that a skill gap analysis belongs to the user
 */
async function verifySkillGapOwnership(userId, analysisId) {
  if (!analysisId) return true; // Optional parameter
  
  const [analyses] = await db.query(
    'SELECT id FROM skill_gap_analyses WHERE id = ? AND user_id = ?',
    [analysisId, userId]
  );
  
  return analyses.length > 0;
}

module.exports = {
  verifyRoadmapOwnership,
  verifySessionOwnership,
  verifyResumeOwnership,
  verifySkillGapOwnership
};
