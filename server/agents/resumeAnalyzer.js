/**
 * Resume Analyzer Agent
 * Parses resume, scores ATS compatibility, suggests improvements
 */

const { getModel } = require('../config/gemini');
const pdfParse = require('pdf-parse');
const fs = require('fs').promises;
const db = require('../config/database');
const { logAgentAction } = require('../utils/logger');

class ResumeAnalyzerAgent {
  constructor() {
    this.model = getModel('gemini-2.0-flash-lite');
    this.systemPrompt = `You are a professional Resume Analyzer Agent for CareerPilot.
Your responsibilities:
1. Parse and extract structured information from resumes
2. Score ATS (Applicant Tracking System) compatibility (0-100)
3. Identify strengths and weaknesses
4. Suggest role-specific improvements
5. Extract skills, experience, education

Always provide:
- ATS Score (0-100)
- Key Strengths (array)
- Areas for Improvement (array)
- Extracted Skills (array)
- Experience Summary
- Education Summary
- Role-Specific Suggestions (if target role provided)

Format your response as JSON.`;
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

      // Prepare prompt
      const targetRole = context.activeGoal?.target_role || inputData.targetRole || 'Software Engineer';
      const prompt = `${this.systemPrompt}

Target Role: ${targetRole}

Resume Text:
${resumeText}

Analyze this resume and provide a comprehensive analysis in JSON format:
{
  "atsScore": <number 0-100>,
  "strengths": [<array of strings>],
  "improvements": [<array of strings>],
  "skills": [<array of strings>],
  "experience": {
    "summary": "<string>",
    "years": <number>,
    "roles": [<array of role titles>]
  },
  "education": {
    "summary": "<string>",
    "degrees": [<array of degree info>]
  },
  "roleSpecificSuggestions": [<array of strings>],
  "overallAssessment": "<string>"
}`;

      // Call Gemini
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      let analysisText = response.text();

      // Clean JSON from markdown if present
      analysisText = analysisText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      const analysis = JSON.parse(analysisText);

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

