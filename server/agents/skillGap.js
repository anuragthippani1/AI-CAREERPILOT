/**
 * Skill Gap Agent
 * Compares resume vs target role, identifies missing skills
 */

const { getModel } = require('../config/gemini');
const db = require('../config/database');
const { logAgentAction } = require('../utils/logger');

class SkillGapAgent {
  constructor() {
    this.model = getModel('gemini-2.0-flash-lite');
    this.systemPrompt = `You are a Skill Gap Analyzer Agent for CareerPilot.
Your responsibilities:
1. Compare user's current skills vs target role requirements
2. Identify missing critical skills
3. Prioritize skills by importance
4. Map skills to learning resources
5. Estimate time to acquire each skill

Always provide:
- Current Skills Match (percentage)
- Missing Critical Skills (prioritized)
- Missing Nice-to-Have Skills
- Learning Resources for each skill
- Estimated Timeline
- Skill Acquisition Roadmap

Format your response as JSON.`;
  }

  /**
   * Analyze skill gap
   */
  async analyze(context, inputData) {
    const startTime = Date.now();

    try {
      if (!context.activeGoal) {
        throw new Error('No active career goal found. Please set a target role first.');
      }

      const targetRole = context.activeGoal.target_role;
      const userSkills = context.skills.map(s => s.skill_name);
      const resumeAnalysis = inputData.resumeAnalysis || context.resume?.analysis_json;

      // Build skills context
      let skillsContext = `Current Skills: ${userSkills.join(', ') || 'None listed'}`;
      if (resumeAnalysis) {
        const analysis = typeof resumeAnalysis === 'string' 
          ? JSON.parse(resumeAnalysis) 
          : resumeAnalysis;
        if (analysis.skills) {
          skillsContext += `\nResume Skills: ${analysis.skills.join(', ')}`;
        }
      }

      const prompt = `${this.systemPrompt}

Target Role: ${targetRole}
${skillsContext}

Analyze the skill gap and provide recommendations in JSON format:
{
  "currentMatchPercentage": <number 0-100>,
  "missingCritical": [
    {
      "skill": "<string>",
      "importance": "<high|medium|low>",
      "learningResources": [<array of resource URLs or descriptions>],
      "estimatedTime": "<string>",
      "priority": <number 1-10>
    }
  ],
  "missingNiceToHave": [
    {
      "skill": "<string>",
      "learningResources": [<array>],
      "estimatedTime": "<string>"
    }
    ],
  "existingStrengths": [<array of strings>],
  "recommendations": [<array of strings>],
  "overallAssessment": "<string>"
}`;

      // Call Gemini
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      let analysisText = response.text();

      // Clean JSON
      analysisText = analysisText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      const gapAnalysis = JSON.parse(analysisText);

      // Save missing skills to database
      await this.saveMissingSkills(context.userId, gapAnalysis.missingCritical || []);

      const executionTime = Date.now() - startTime;
      await logAgentAction(
        context.userId,
        'skillGap',
        'analyze',
        { targetRole },
        gapAnalysis,
        executionTime,
        'success'
      );

      return {
        success: true,
        data: gapAnalysis
      };

    } catch (error) {
      const executionTime = Date.now() - startTime;
      await logAgentAction(
        context.userId,
        'skillGap',
        'analyze',
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
   * Save missing skills to database
   */
  async saveMissingSkills(userId, missingSkills) {
    for (const skill of missingSkills) {
      await db.query(
        `INSERT INTO skills (user_id, skill_name, skill_level, source)
         VALUES (?, ?, "beginner", "inferred")
         ON DUPLICATE KEY UPDATE skill_name = skill_name`,
        [userId, skill.skill]
      );
    }
  }
}

module.exports = SkillGapAgent;

