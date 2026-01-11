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

  isRecoverableAiError(error) {
    const msg = (error && (error.message || String(error))) || '';
    const lower = msg.toLowerCase();
    return (
      msg.includes('quota') ||
      msg.includes('429') ||
      msg.includes('Quota') ||
      msg.includes('exceeded') ||
      lower.includes('api key') ||
      msg.includes('401') ||
      msg.includes('403') ||
      lower.includes('unauthorized') ||
      lower.includes('permission')
    );
  }

  generateFallbackGapAnalysis(targetRole, userSkills = []) {
    const genericCritical = [
      { skill: 'Data Structures & Algorithms', importance: 'high', estimatedTime: '4-6 weeks', priority: 9 },
      { skill: 'System Design Basics', importance: 'high', estimatedTime: '3-5 weeks', priority: 8 },
      { skill: 'Testing & Debugging', importance: 'medium', estimatedTime: '2-3 weeks', priority: 7 },
    ];

    // If they already list many skills, bump match a bit.
    const match = Math.max(20, Math.min(80, 35 + Math.min(25, userSkills.length * 2)));

    return {
      currentMatchPercentage: match,
      missingCritical: genericCritical.map(s => ({
        ...s,
        learningResources: [
          'Build small projects to apply concepts',
          'Use documentation + official guides',
          'Practice 3-5 problems per week'
        ]
      })),
      missingNiceToHave: [
        {
          skill: 'Communication & Stakeholder Management',
          learningResources: ['Write weekly summaries of your work', 'Practice explaining tradeoffs'],
          estimatedTime: '2-4 weeks'
        }
      ],
      existingStrengths: userSkills.slice(0, 10),
      recommendations: [
        `Tailor your learning plan toward ${targetRole}`,
        'Focus on one critical skill at a time and track progress weekly'
      ],
      overallAssessment: 'AI skill-gap fallback used (Gemini unavailable). Configure GEMINI_API_KEY for best results.'
    };
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
      let gapAnalysis;
      const parseGeminiJson = (text) => {
        const cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
        return JSON.parse(cleaned);
      };

      try {
        const result = await this.model.generateContent(prompt);
        const response = await result.response;
        gapAnalysis = parseGeminiJson(response.text());
      } catch (geminiError) {
        // Retry once with stricter instruction
        const strictPrompt = `${prompt}\n\nIMPORTANT: Return ONLY valid JSON. No markdown, no commentary, no code fences.`;
        try {
          const retryResult = await this.model.generateContent(strictPrompt);
          const retryResponse = await retryResult.response;
          gapAnalysis = parseGeminiJson(retryResponse.text());
        } catch (retryError) {
          if (this.isRecoverableAiError(geminiError) || this.isRecoverableAiError(retryError) || retryError instanceof SyntaxError) {
            console.warn('Gemini unavailable or returned invalid JSON; using fallback skill gap for demo.');
            gapAnalysis = this.generateFallbackGapAnalysis(targetRole, userSkills);
          } else {
            throw retryError;
          }
        }
      }

      // Save missing skills to database
      await this.saveMissingSkills(context.userId, gapAnalysis.missingCritical || []);

      // Save complete analysis to database
      const analysisId = await this.saveAnalysis(context.userId, targetRole, gapAnalysis);

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
        data: { ...gapAnalysis, analysisId }
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

  /**
   * Save complete skill gap analysis to database
   */
  async saveAnalysis(userId, targetRole, analysis) {
    try {
      const [result] = await db.query(
        `INSERT INTO skill_gap_analyses 
         (user_id, target_role, analysis_json, current_match_percentage)
         VALUES (?, ?, ?, ?)`,
        [
          userId,
          targetRole,
          JSON.stringify(analysis),
          analysis.currentMatchPercentage || null
        ]
      );
      return result.insertId;
    } catch (error) {
      console.error('Error saving skill gap analysis:', error);
      throw error;
    }
  }
}

module.exports = SkillGapAgent;

