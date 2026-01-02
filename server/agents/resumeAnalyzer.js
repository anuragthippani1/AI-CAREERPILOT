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
      strengths: [
        length > 500 ? 'Resume has substantial detail' : 'Resume provided',
        skills.length > 0 ? 'Contains relevant technical keywords' : 'Provides baseline background'
      ],
      improvements: [
        `Tailor your resume more specifically to ${targetRole}`,
        'Add measurable impact (metrics) for key achievements',
        'Ensure consistent formatting and clear section headings'
      ],
      skills: skills.slice(0, 25),
      experience: {
        summary: length > 0 ? text.trim().slice(0, 220) + (text.trim().length > 220 ? '…' : '') : 'Not provided',
        years: 0,
        roles: []
      },
      education: {
        summary: 'Not extracted (demo fallback)',
        degrees: []
      },
      roleSpecificSuggestions: [
        `Add 2-3 bullet points emphasizing ${targetRole} responsibilities`,
        'Highlight the most relevant stack/tools near the top'
      ],
      overallAssessment: 'AI analysis fallback used (Gemini unavailable). Upload a complete resume and configure GEMINI_API_KEY for best results.'
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
      let analysis;
      const parseGeminiJson = (text) => {
        const cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
        return JSON.parse(cleaned);
      };

      try {
        const result = await this.model.generateContent(prompt);
        const response = await result.response;
        analysis = parseGeminiJson(response.text());
      } catch (geminiError) {
        // Retry once with stricter instruction if parsing fails / AI response is noisy
        const strictPrompt = `${prompt}\n\nIMPORTANT: Return ONLY valid JSON. No markdown, no commentary, no code fences.`;
        try {
          const retryResult = await this.model.generateContent(strictPrompt);
          const retryResponse = await retryResult.response;
          analysis = parseGeminiJson(retryResponse.text());
        } catch (retryError) {
          if (this.isRecoverableAiError(geminiError) || this.isRecoverableAiError(retryError) || retryError instanceof SyntaxError) {
            console.warn('Gemini unavailable or returned invalid JSON; using fallback resume analysis for demo.');
            analysis = this.generateFallbackAnalysis(resumeText, targetRole);
          } else {
            throw retryError;
          }
        }
      }

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

