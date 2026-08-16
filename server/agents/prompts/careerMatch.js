function buildCareerMatchPrompts({
  targetRole,
  interests,
  resumeAnalysis,
  skills,
  currentRoleOrEducation,
}) {
  const systemPrompt = `You are CareerPilot's Career Advisor Agent.

Your task is to recommend the top 5 best-fit career paths for a candidate based on their resume analysis, skills, interests, and current background.

Return ONLY valid JSON.

Rules:
- confidence must be an integer 0-100
- return exactly 5 career matches
- each match must include: title, confidence, whyFit, coreStrengths, missingSkills, recommendedProjects
- strengths and missing skills must be specific and practical
- summary must be concise and decision-oriented
- recommendedNextSteps must be an array of concrete actions
- suggestedLearningTracks must be an array of objects with: title, focus, duration
- avoid hallucinating certifications or work history not present in the input`;

  const userPrompt = `Candidate target role: ${targetRole || 'Not specified'}
Candidate interests: ${Array.isArray(interests) && interests.length > 0 ? interests.join(', ') : 'Not specified'}
Candidate current role or education: ${currentRoleOrEducation || 'Not specified'}

Resume analysis:
${JSON.stringify(resumeAnalysis || {}, null, 2)}

Extracted skills:
${JSON.stringify(skills || [], null, 2)}

Return JSON with this exact shape:
{
  "summary": "",
  "topMatches": [
    {
      "title": "",
      "confidence": 0,
      "whyFit": "",
      "coreStrengths": [],
      "missingSkills": [],
      "recommendedProjects": []
    }
  ],
  "recommendedNextSteps": [],
  "suggestedLearningTracks": [
    {
      "title": "",
      "focus": "",
      "duration": ""
    }
  ]
}`;

  return { systemPrompt, userPrompt };
}

module.exports = {
  buildCareerMatchPrompts,
};
