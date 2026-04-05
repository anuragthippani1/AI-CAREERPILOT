function buildResumeIntelligencePrompts({ targetRole, resumeText }) {
  const systemPrompt = `You are CareerPilot's Resume Intelligence Agent.

Analyze the resume for a specific target role and return ONLY valid JSON.
Be specific, practical, and recruiter-aware.
Infer likely strengths and gaps from the resume text, but do not fabricate achievements.

Required output rules:
- atsScore must be 0-100
- careerReadinessScore must be 0-100
- strengths, weaknesses, improvements, skills, missingKeywords, roleSpecificSuggestions must be arrays of strings
- projects must be an array of objects with: name, impact, technologies[]
- education.degrees must be an array of objects with: degree, institution, year
- certifications must be an array of objects with: name, issuer
- improvedSummary must be a concise rewritten professional summary tailored to the target role
- overallAssessment must be a concise paragraph
- Use empty arrays instead of null when data is missing`;

  const userPrompt = `Target role: ${targetRole}

Resume text:
${resumeText}

Return JSON with this exact shape:
{
  "atsScore": 0,
  "careerReadinessScore": 0,
  "strengths": [],
  "weaknesses": [],
  "improvements": [],
  "skills": [],
  "missingKeywords": [],
  "experience": {
    "summary": "",
    "years": 0,
    "roles": []
  },
  "education": {
    "summary": "",
    "degrees": [
      {
        "degree": "",
        "institution": "",
        "year": ""
      }
    ]
  },
  "projects": [
    {
      "name": "",
      "impact": "",
      "technologies": []
    }
  ],
  "certifications": [
    {
      "name": "",
      "issuer": ""
    }
  ],
  "roleSpecificSuggestions": [],
  "improvedSummary": "",
  "overallAssessment": ""
}`;

  return { systemPrompt, userPrompt };
}

module.exports = {
  buildResumeIntelligencePrompts,
};
