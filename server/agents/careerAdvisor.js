const db = require('../config/database');
const { logAgentAction } = require('../utils/logger');
const { generateStructuredJson, isRecoverableAiError } = require('../config/aiProvider');
const { buildCareerMatchPrompts } = require('./prompts/careerMatch');

const CAREER_LIBRARY = [
  {
    title: 'Full Stack Developer',
    keywords: ['javascript', 'typescript', 'react', 'node', 'express', 'sql', 'api', 'css', 'html', 'mongodb'],
    missingDefaults: ['System design', 'Testing', 'Deployment'],
    projects: ['Build a production-ready SaaS dashboard', 'Ship a full-stack portfolio app'],
  },
  {
    title: 'AI Engineer',
    keywords: ['python', 'machine learning', 'llm', 'ai', 'pytorch', 'tensorflow', 'nlp', 'data', 'api'],
    missingDefaults: ['Model evaluation', 'Vector databases', 'MLOps'],
    projects: ['Build an LLM workflow assistant', 'Create an end-to-end AI search app'],
  },
  {
    title: 'Data Scientist',
    keywords: ['python', 'sql', 'statistics', 'pandas', 'numpy', 'machine learning', 'visualization', 'data'],
    missingDefaults: ['Experiment design', 'Feature engineering', 'Business communication'],
    projects: ['Analyze a public dataset end-to-end', 'Build a predictive analytics project'],
  },
  {
    title: 'Cloud Engineer',
    keywords: ['aws', 'azure', 'gcp', 'docker', 'kubernetes', 'linux', 'terraform', 'ci/cd', 'networking'],
    missingDefaults: ['Infrastructure as code', 'Observability', 'Security hardening'],
    projects: ['Deploy a scalable cloud platform', 'Automate infra with Terraform and CI/CD'],
  },
  {
    title: 'Cybersecurity Analyst',
    keywords: ['security', 'linux', 'networking', 'siem', 'incident response', 'python', 'cloud', 'risk'],
    missingDefaults: ['Threat modeling', 'SOC workflows', 'Security monitoring'],
    projects: ['Build a home SOC lab', 'Document an incident response simulation'],
  },
  {
    title: 'Backend Engineer',
    keywords: ['node', 'python', 'java', 'sql', 'api', 'microservices', 'redis', 'postgres', 'system design'],
    missingDefaults: ['Scalability patterns', 'Performance tuning', 'Distributed systems'],
    projects: ['Build a high-throughput API service', 'Design a queue-driven backend system'],
  },
  {
    title: 'Frontend Engineer',
    keywords: ['react', 'typescript', 'javascript', 'css', 'html', 'accessibility', 'performance', 'design systems'],
    missingDefaults: ['Advanced state management', 'Accessibility audits', 'Performance optimization'],
    projects: ['Build a polished design-system demo', 'Create a complex data-rich dashboard'],
  },
];

class CareerAdvisorAgent {
  normalizeInterests(interests) {
    if (Array.isArray(interests)) {
      return interests.map((item) => String(item).trim()).filter(Boolean);
    }
    if (typeof interests === 'string') {
      return interests.split(',').map((item) => item.trim()).filter(Boolean);
    }
    return [];
  }

  normalizeSkills(skills, resumeAnalysis) {
    const raw = Array.isArray(skills) && skills.length > 0
      ? skills
      : Array.isArray(resumeAnalysis?.skills)
        ? resumeAnalysis.skills
        : [];

    return raw.map((skill) => String(skill).trim()).filter(Boolean);
  }

  generateFallbackMatches({ targetRole, interests, resumeAnalysis, skills }) {
    const normalizedSkills = this.normalizeSkills(skills, resumeAnalysis);
    const normalizedSkillSet = new Set(normalizedSkills.map((skill) => skill.toLowerCase()));
    const normalizedInterests = this.normalizeInterests(interests).map((item) => item.toLowerCase());

    const scored = CAREER_LIBRARY.map((career) => {
      const matchedKeywords = career.keywords.filter((keyword) => normalizedSkillSet.has(keyword));
      const baseScore = 38 + matchedKeywords.length * 8;
      const targetLift = targetRole && career.title.toLowerCase().includes(String(targetRole).toLowerCase()) ? 14 : 0;
      const interestLift = normalizedInterests.some((interest) => career.title.toLowerCase().includes(interest)) ? 10 : 0;
      const confidence = Math.max(42, Math.min(94, baseScore + targetLift + interestLift));
      const missingSkills = career.missingDefaults.filter((item) => !normalizedSkillSet.has(item.toLowerCase())).slice(0, 3);

      return {
        title: career.title,
        confidence,
        whyFit: matchedKeywords.length > 0
          ? `Your profile already shows signal in ${matchedKeywords.slice(0, 3).join(', ')}, which maps well to this path.`
          : `This path is plausible based on your broader technical foundation and can be explored with focused projects.`,
        coreStrengths: matchedKeywords.length > 0 ? matchedKeywords.slice(0, 4) : (resumeAnalysis?.strengths || []).slice(0, 4),
        missingSkills,
        recommendedProjects: career.projects.slice(0, 2),
      };
    })
      .sort((a, b) => b.confidence - a.confidence)
      .slice(0, 5);

    return {
      summary: `Your profile is currently strongest for ${scored[0]?.title || 'software engineering'}-adjacent roles, with the best outcomes coming from matching existing strengths to a focused specialization.`,
      topMatches: scored,
      recommendedNextSteps: [
        `Pick one target path from the top two matches and commit to it for the next 6-8 weeks.`,
        'Run skill gap analysis against that target role to identify the highest-leverage missing skills.',
        'Build one portfolio project aligned to the selected path before expanding your scope.',
      ],
      suggestedLearningTracks: scored.slice(0, 3).map((career) => ({
        title: `${career.title} readiness track`,
        focus: `Close the most important gaps for ${career.title.toLowerCase()} interviews and projects.`,
        duration: '6-8 weeks',
      })),
    };
  }

  normalizeReport(rawReport) {
    const topMatches = Array.isArray(rawReport?.topMatches) ? rawReport.topMatches : [];

    return {
      summary: rawReport?.summary || '',
      topMatches: topMatches.slice(0, 5).map((match) => ({
        title: match?.title || 'Career path',
        confidence: Math.max(0, Math.min(100, Math.round(Number(match?.confidence || 0)))),
        whyFit: match?.whyFit || '',
        coreStrengths: Array.isArray(match?.coreStrengths) ? match.coreStrengths : [],
        missingSkills: Array.isArray(match?.missingSkills) ? match.missingSkills : [],
        recommendedProjects: Array.isArray(match?.recommendedProjects) ? match.recommendedProjects : [],
      })),
      recommendedNextSteps: Array.isArray(rawReport?.recommendedNextSteps) ? rawReport.recommendedNextSteps : [],
      suggestedLearningTracks: Array.isArray(rawReport?.suggestedLearningTracks)
        ? rawReport.suggestedLearningTracks.map((track) => ({
            title: track?.title || 'Learning track',
            focus: track?.focus || '',
            duration: track?.duration || '',
          }))
        : [],
    };
  }

  async saveCareerReport(userId, resumeId, targetRole, interests, report) {
    const [result] = await db.query(
      `INSERT INTO career_reports (user_id, resume_id, target_role, interests_json, report_json, top_career_title, top_career_confidence)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        userId,
        resumeId || null,
        targetRole || null,
        JSON.stringify(interests || []),
        JSON.stringify(report),
        report.topMatches?.[0]?.title || null,
        report.topMatches?.[0]?.confidence || null,
      ]
    );

    return result.insertId;
  }

  async match(context, inputData) {
    const startTime = Date.now();

    try {
      const resumeAnalysis = context.resume?.analysis_json
        ? (typeof context.resume.analysis_json === 'string'
            ? JSON.parse(context.resume.analysis_json)
            : context.resume.analysis_json)
        : null;
      const targetRole = inputData.targetRole || context.activeGoal?.target_role || resumeAnalysis?.targetRole || null;
      const interests = this.normalizeInterests(inputData.interests);
      const currentRoleOrEducation =
        inputData.currentRoleOrEducation ||
        resumeAnalysis?.experience?.summary ||
        resumeAnalysis?.education?.summary ||
        null;
      const skills = this.normalizeSkills(
        Array.isArray(context.skills) ? context.skills.map((item) => item.skill_name || item) : [],
        resumeAnalysis
      );

      if (!resumeAnalysis && skills.length === 0) {
        throw new Error('Upload a resume or build a skills profile before generating career matches.');
      }

      const { systemPrompt, userPrompt } = buildCareerMatchPrompts({
        targetRole,
        interests,
        resumeAnalysis,
        skills,
        currentRoleOrEducation,
      });

      let report;

      try {
        report = await generateStructuredJson({
          systemPrompt,
          userPrompt,
          preferredProvider: process.env.AI_PROVIDER || 'openai',
        });
      } catch (error) {
        if (isRecoverableAiError(error) || error instanceof SyntaxError) {
          console.warn('Career advisor AI unavailable; using fallback career match scoring.');
          report = this.generateFallbackMatches({ targetRole, interests, resumeAnalysis, skills });
        } else {
          throw error;
        }
      }

      report = this.normalizeReport(report);

      const reportId = await this.saveCareerReport(
        context.userId,
        context.resume?.id || null,
        targetRole,
        interests,
        report
      );

      const executionTime = Date.now() - startTime;
      await logAgentAction(
        context.userId,
        'careerAdvisor',
        'match',
        { targetRole, interests },
        report,
        executionTime,
        'success'
      );

      return {
        success: true,
        data: {
          reportId,
          report,
        },
      };
    } catch (error) {
      const executionTime = Date.now() - startTime;
      await logAgentAction(
        context.userId,
        'careerAdvisor',
        'match',
        inputData,
        null,
        executionTime,
        'error',
        error.message
      );

      return {
        success: false,
        error: error.message,
      };
    }
  }
}

module.exports = CareerAdvisorAgent;
