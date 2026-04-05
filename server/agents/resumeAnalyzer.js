/**
 * Resume Analyzer Agent
 * Parses resume, scores ATS compatibility, suggests improvements
 */

const pdfParse = require('pdf-parse');
const fs = require('fs').promises;
const db = require('../config/database');
const { logAgentAction } = require('../utils/logger');
const { generateStructuredJson, isRecoverableAiError } = require('../config/aiProvider');
const { buildResumeIntelligencePrompts } = require('./prompts/resumeIntelligence');

class ResumeAnalyzerAgent {
  constructor() {
  }

  generateFallbackAnalysis(resumeText, targetRole) {
    const text = (resumeText || '').toString();
    const length = text.trim().length;

    // Very lightweight skill keyword extraction (demo-safe fallback)
    const skillKeywords = [
      'javascript', 'typescript', 'react', 'node', 'express', 'python', 'java', 'c++', 'c#',
      'sql', 'mysql', 'postgres', 'mongodb', 'redis', 'aws', 'azure', 'gcp', 'docker', 'kubernetes',
      'git', 'ci/cd', 'rest', 'graphql', 'linux'
    ];
    const lower = text.toLowerCase();
    const skills = skillKeywords.filter(k => lower.includes(k)).map(s => s.toUpperCase());

    const atsScore = Math.max(35, Math.min(85, Math.round(45 + Math.log10(Math.max(10, length)) * 15 + skills.length * 2)));

    return {
      atsScore,
      careerReadinessScore: Math.max(30, Math.min(88, atsScore - 5 + skills.length)),
      strengths: [
        length > 500 ? 'Resume has substantial detail' : 'Resume provided',
        skills.length > 0 ? 'Contains relevant technical keywords' : 'Provides baseline background'
      ],
      weaknesses: [
        'Bullet points may not show quantified business impact',
        `Resume is not fully optimized for ${targetRole} keywords`
      ],
      improvements: [
        `Tailor your resume more specifically to ${targetRole}`,
        'Add measurable impact (metrics) for key achievements',
        'Ensure consistent formatting and clear section headings'
      ],
      skills: skills.slice(0, 25),
      missingKeywords: [
        targetRole,
        'system design',
        'leadership',
        'performance optimization'
      ],
      experience: {
        summary: length > 0 ? text.trim().slice(0, 220) + (text.trim().length > 220 ? '…' : '') : 'Not provided',
        years: 0,
        roles: []
      },
      education: {
        summary: 'Not extracted (demo fallback)',
        degrees: []
      },
      projects: [],
      certifications: [],
      roleSpecificSuggestions: [
        `Add 2-3 bullet points emphasizing ${targetRole} responsibilities`,
        'Highlight the most relevant stack/tools near the top'
      ],
      improvedSummary: `Results-driven candidate targeting ${targetRole} with hands-on experience across modern engineering workflows, a foundation in problem solving, and clear potential to grow through focused project execution and role-specific keyword alignment.`,
      overallAssessment: 'AI analysis fallback used because a primary model was unavailable. The resume has baseline signal, but it needs sharper positioning, stronger quantified impact, and better target-role keyword coverage.'
    };
  }

  normalizeAnalysis(rawAnalysis) {
    return {
      atsScore: Math.max(0, Math.min(100, Math.round(Number(rawAnalysis?.atsScore || 0)))),
      careerReadinessScore: Math.max(0, Math.min(100, Math.round(Number(rawAnalysis?.careerReadinessScore || 0)))),
      strengths: Array.isArray(rawAnalysis?.strengths) ? rawAnalysis.strengths : [],
      weaknesses: Array.isArray(rawAnalysis?.weaknesses) ? rawAnalysis.weaknesses : [],
      improvements: Array.isArray(rawAnalysis?.improvements) ? rawAnalysis.improvements : [],
      skills: Array.isArray(rawAnalysis?.skills) ? rawAnalysis.skills : [],
      missingKeywords: Array.isArray(rawAnalysis?.missingKeywords) ? rawAnalysis.missingKeywords : [],
      experience: {
        summary: rawAnalysis?.experience?.summary || '',
        years: Number(rawAnalysis?.experience?.years || 0),
        roles: Array.isArray(rawAnalysis?.experience?.roles) ? rawAnalysis.experience.roles : [],
      },
      education: {
        summary: rawAnalysis?.education?.summary || '',
        degrees: Array.isArray(rawAnalysis?.education?.degrees) ? rawAnalysis.education.degrees : [],
      },
      projects: Array.isArray(rawAnalysis?.projects) ? rawAnalysis.projects : [],
      certifications: Array.isArray(rawAnalysis?.certifications) ? rawAnalysis.certifications : [],
      roleSpecificSuggestions: Array.isArray(rawAnalysis?.roleSpecificSuggestions) ? rawAnalysis.roleSpecificSuggestions : [],
      improvedSummary: rawAnalysis?.improvedSummary || '',
      overallAssessment: rawAnalysis?.overallAssessment || '',
    };
  }

  /**
   * Analyze resume from file or text
   */
  async analyze(context, inputData) {
    const startTime = Date.now();
    let resumeText = '';

    try {
      // Extract text from resume
      if (inputData.filePath) {
        const fileBuffer = await fs.readFile(inputData.filePath);
        if (inputData.fileType === 'application/pdf') {
          const pdfData = await pdfParse(fileBuffer);
          resumeText = pdfData.text;
        } else {
          resumeText = fileBuffer.toString();
        }
      } else if (inputData.text) {
        resumeText = inputData.text;
      } else {
        throw new Error('No resume text or file provided');
      }

      const targetRole = context.activeGoal?.target_role || inputData.targetRole || 'Software Engineer';
      const { systemPrompt, userPrompt } = buildResumeIntelligencePrompts({
        targetRole,
        resumeText,
      });

      let analysis;

      try {
        analysis = await generateStructuredJson({
          systemPrompt,
          userPrompt,
          preferredProvider: process.env.AI_PROVIDER || 'openai',
        });
      } catch (aiError) {
        if (isRecoverableAiError(aiError) || aiError instanceof SyntaxError) {
          console.warn('Primary AI provider unavailable or returned invalid JSON; using fallback resume analysis.');
          analysis = this.generateFallbackAnalysis(resumeText, targetRole);
        } else {
          throw aiError;
        }
      }

      analysis = this.normalizeAnalysis(analysis);

      // Save to database
      const resumeId = await this.saveResume(context.userId, resumeText, inputData, analysis);

      // Extract and save skills
      if (analysis.skills && Array.isArray(analysis.skills)) {
        await this.saveSkills(context.userId, analysis.skills);
      }

      const executionTime = Date.now() - startTime;
      await logAgentAction(
        context.userId,
        'resumeAnalyzer',
        'analyze',
        { hasFile: !!inputData.filePath, targetRole },
        analysis,
        executionTime,
        'success'
      );

      return {
        success: true,
        data: {
          resumeId,
          analysis,
          extractedText: resumeText.substring(0, 500) + '...'
        }
      };

    } catch (error) {
      const executionTime = Date.now() - startTime;
      await logAgentAction(
        context.userId,
        'resumeAnalyzer',
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
   * Save resume analysis to database
   */
  async saveResume(userId, resumeText, inputData, analysis) {
    const [result] = await db.query(
      `INSERT INTO resumes (user_id, file_path, file_type, raw_text, ats_score, analysis_json)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        userId,
        inputData.filePath || null,
        inputData.fileType || 'text',
        resumeText,
        analysis.atsScore || 0,
        JSON.stringify(analysis)
      ]
    );
    return result.insertId;
  }

  /**
   * Save extracted skills to database
   */
  async saveSkills(userId, skills) {
    // Delete existing resume-extracted skills
    await db.query(
      'DELETE FROM skills WHERE user_id = ? AND source = "resume"',
      [userId]
    );

    // Insert new skills
    for (const skill of skills) {
      await db.query(
        `INSERT INTO skills (user_id, skill_name, source)
         VALUES (?, ?, "resume")
         ON DUPLICATE KEY UPDATE skill_name = skill_name`,
        [userId, skill]
      );
    }
  }
}

module.exports = ResumeAnalyzerAgent;
