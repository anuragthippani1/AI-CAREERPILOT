/**
 * Career Roadmap Agent
 * Generates step-by-step career roadmap with milestones
 */

const { getModel } = require('../config/gemini');
const db = require('../config/database');
const { logAgentAction } = require('../utils/logger');

class CareerRoadmapAgent {
  constructor() {
    this.model = getModel('gemini-2.0-flash-lite');
    this.systemPrompt = `You are a Career Roadmap Generator Agent for CareerPilot.
Your responsibilities:
1. Create personalized, actionable career roadmaps
2. Break down journey into short-term and long-term milestones
3. Set realistic timelines
4. Adapt based on user's current skills and goals
5. Provide specific, measurable steps

Always provide:
- Short-term milestones (0-3 months)
- Medium-term milestones (3-6 months)
- Long-term milestones (6-12+ months)
- Specific action items for each milestone
- Success metrics
- Timeline estimates

Format your response as JSON.`;
  }

  /**
   * Generate career roadmap
   */
  async generate(context, inputData) {
    const startTime = Date.now();

    try {
      if (!context.activeGoal) {
        throw new Error('No active career goal found');
      }

      const goal = context.activeGoal;
      const skillGap = inputData.skillGap || {};
      const resumeAnalysis = context.resume?.analysis_json 
        ? (typeof context.resume.analysis_json === 'string' 
            ? JSON.parse(context.resume.analysis_json) 
            : context.resume.analysis_json)
        : null;

      // Build context
      let contextText = `Target Role: ${goal.target_role}\n`;
      if (goal.target_company) contextText += `Target Company: ${goal.target_company}\n`;
      if (goal.timeline_months) contextText += `Timeline: ${goal.timeline_months} months\n`;
      
      if (skillGap.missingCritical) {
        contextText += `\nMissing Critical Skills: ${skillGap.missingCritical.map(s => s.skill).join(', ')}\n`;
      }
      
      if (resumeAnalysis) {
        contextText += `\nCurrent Experience: ${resumeAnalysis.experience?.summary || 'Not specified'}\n`;
        contextText += `Current Skills: ${resumeAnalysis.skills?.join(', ') || 'None'}\n`;
      }

      const prompt = `${this.systemPrompt}

${contextText}

Generate a comprehensive career roadmap in JSON format:
{
  "shortTerm": [
    {
      "title": "<string>",
      "description": "<string>",
      "timeline": "<string>",
      "actionItems": [<array of strings>],
      "successMetrics": [<array of strings>],
      "priority": <number 1-10>
    }
  ],
  "mediumTerm": [
    {
      "title": "<string>",
      "description": "<string>",
      "timeline": "<string>",
      "actionItems": [<array of strings>],
      "successMetrics": [<array of strings>],
      "priority": <number 1-10>
    }
  ],
  "longTerm": [
    {
      "title": "<string>",
      "description": "<string>",
      "timeline": "<string>",
      "actionItems": [<array of strings>],
      "successMetrics": [<array of strings>],
      "priority": <number 1-10>
    }
  ],
  "overallTimeline": "<string>",
  "keyMilestones": [<array of milestone objects>],
  "recommendations": [<array of strings>]
}`;

      // Call Gemini
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      let roadmapText = response.text();

      // Clean JSON
      roadmapText = roadmapText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      const roadmap = JSON.parse(roadmapText);

      // Save to database
      const roadmapId = await this.saveRoadmap(context.userId, goal.id, roadmap);

      const executionTime = Date.now() - startTime;
      await logAgentAction(
        context.userId,
        'careerRoadmap',
        'generate',
        { targetRole: goal.target_role },
        roadmap,
        executionTime,
        'success'
      );

      return {
        success: true,
        data: {
          roadmapId,
          roadmap
        }
      };

    } catch (error) {
      const executionTime = Date.now() - startTime;
      await logAgentAction(
        context.userId,
        'careerRoadmap',
        'generate',
        inputData,
        null,
        executionTime,
        'error',
        error.message
      );

      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Save roadmap to database
   */
  async saveRoadmap(userId, careerGoalId, roadmap) {
    // Extract milestones for separate storage
    const milestones = [
      ...(roadmap.shortTerm || []),
      ...(roadmap.mediumTerm || []),
      ...(roadmap.longTerm || [])
    ];

    const [result] = await db.query(
      `INSERT INTO roadmaps (user_id, career_goal_id, roadmap_json, milestones, progress_percentage)
       VALUES (?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
         roadmap_json = VALUES(roadmap_json),
         milestones = VALUES(milestones),
         updated_at = CURRENT_TIMESTAMP`,
      [
        userId,
        careerGoalId,
        JSON.stringify(roadmap),
        JSON.stringify(milestones),
        0
      ]
    );

    return result.insertId || result.affectedRows;
  }
}

module.exports = CareerRoadmapAgent;

