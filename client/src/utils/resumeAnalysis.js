function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n));
}

export function parseResumeAnalysisJson(resume) {
  if (!resume?.analysis_json) return null;

  if (typeof resume.analysis_json === 'string') {
    try {
      return JSON.parse(resume.analysis_json);
    } catch {
      return null;
    }
  }

  return resume.analysis_json;
}

export function getAnalysisFromResume(resume) {
  const analysis = parseResumeAnalysisJson(resume);
  if (!analysis || analysis.atsScore == null) return null;
  return analysis;
}

export function getResumeAtsScore(resume) {
  if (!resume) return null;

  if (resume.ats_score != null && resume.ats_score !== '') {
    return clamp(Math.round(Number(resume.ats_score) || 0), 0, 100);
  }

  const analysis = parseResumeAnalysisJson(resume);
  if (analysis?.atsScore != null) {
    return clamp(Math.round(Number(analysis.atsScore) || 0), 0, 100);
  }

  return null;
}
