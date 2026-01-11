import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Target, AlertCircle, CheckCircle, Loader, ArrowRight } from 'lucide-react';
import { skillsAPI, resumeAPI, userAPI } from '../services/api';
import PageHeader from '../components/ui/PageHeader';
import Button from '../components/ui/Button';
import { Card, CardContent } from '../components/ui/Card';

export default function SkillGap() {
  const navigate = useNavigate();
  const [userId] = useState(1);
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState(null);
  const [targetRole, setTargetRole] = useState('');
  const [resumeAnalysis, setResumeAnalysis] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadAnalysis();
  }, []);

  const loadAnalysis = async () => {
    try {
      setLoading(true);
      const [resumeRes, userRes, gapAnalysesRes] = await Promise.allSettled([
        resumeAPI.get(userId),
        userAPI.get(userId),
        skillsAPI.getGapAnalyses(userId),
      ]);

      if (resumeRes.status === 'fulfilled' && resumeRes.value.data.data) {
        const resume = resumeRes.value.data.data;
        const parsedResumeAnalysis = typeof resume.analysis_json === 'string' 
          ? JSON.parse(resume.analysis_json) 
          : resume.analysis_json;

        if (parsedResumeAnalysis) {
          // Store for later analysis (requires a target role/goal)
          setResumeAnalysis(parsedResumeAnalysis);
          // Pre-fill target role from resume if available
          if (parsedResumeAnalysis.targetRole && !targetRole) {
            setTargetRole(parsedResumeAnalysis.targetRole);
          }
        }
      }

      // Load most recent skill gap analysis if available
      if (gapAnalysesRes.status === 'fulfilled' && gapAnalysesRes.value.data.success) {
        const analyses = gapAnalysesRes.value.data.data || [];
        if (analyses.length > 0) {
          const latest = analyses[0];
          setAnalysis(latest.analysis);
          if (latest.targetRole && !targetRole) {
            setTargetRole(latest.targetRole);
          }
        }
      }
    } catch (err) {
      console.error('Error loading analysis:', err);
    } finally {
      setLoading(false);
    }
  };

  const analyzeSkillGap = async () => {
    if (!targetRole) {
      setError('Please set a target role first');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Set goal if target role provided
      if (targetRole) {
        await userAPI.setGoal({ userId, targetRole });
      }

      const response = await skillsAPI.analyze({
        userId,
        resumeAnalysis: resumeAnalysis || null,
      });

      setAnalysis(response.data.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to analyze skill gap');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="cp-page">
      <main className="cp-page-inner max-w-4xl">
        <PageHeader
          title="Skill gap analysis"
          description="Turn your target role into a prioritized learning plan based on your current profile and resume."
        />
        {!analysis ? (
          <Card className="mt-6">
            <CardContent className="pt-6">
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-white/80 mb-2">
                  Target Role
                </label>
                <input
                  type="text"
                  value={targetRole}
                  onChange={(e) => setTargetRole(e.target.value)}
                  placeholder="e.g., Frontend Engineer (React)"
                  className="cp-input"
                />
                <p className="text-xs text-white/50 mt-2">
                  This sets your goal so the roadmap and practice features can personalize recommendations.
                </p>
              </div>

              {error && (
                <div className="bg-red-500/10 border border-red-500/25 rounded-lg p-4 flex items-start gap-2">
                  <AlertCircle className="w-5 h-5 text-red-300 mt-0.5" />
                  <p className="text-red-200 text-sm">{error}</p>
                </div>
              )}

              <Button
                onClick={analyzeSkillGap}
                disabled={loading}
                className="w-full"
              >
                {loading ? (
                  <>
                    <Loader className="w-5 h-5 animate-spin" />
                    Analyzing Skill Gap...
                  </>
                ) : (
                  <>
                    <Target className="w-5 h-5" />
                    Analyze Skill Gap
                  </>
                )}
              </Button>
            </div>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            <Card className="mt-6">
              <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-xl font-semibold text-white">Your results</h2>
                  <p className="text-sm text-white/70 mt-1">Focus on the critical gaps first to move fastest.</p>
                </div>
                <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-right">
                  <p className="text-xs text-white/60">Match score</p>
                  <p className="text-2xl font-semibold text-white">
                    {Math.round(analysis.currentMatchPercentage || 0)}%
                  </p>
                </div>
              </div>

              <div className="mb-6">
                <h3 className="font-semibold text-white mb-2">Assessment</h3>
                <p className="text-white/75">{analysis.overallAssessment}</p>
              </div>

              {analysis.missingCritical && analysis.missingCritical.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                    <AlertCircle className="w-5 h-5 text-red-300" />
                    Missing Critical Skills
                  </h3>
                  <div className="space-y-4">
                    {analysis.missingCritical.map((skill, i) => (
                      <div key={i} className="border border-white/10 rounded-xl p-5 bg-white/5">
                        <div className="flex items-start justify-between mb-2">
                          <h4 className="font-semibold text-white">{skill.skill}</h4>
                          <span className="text-xs text-white/60">Priority: {skill.priority}/10</span>
                        </div>
                        <p className="text-sm text-white/70 mb-2">Estimated time: {skill.estimatedTime}</p>
                        {skill.learningResources && skill.learningResources.length > 0 && (
                          <div>
                            <p className="text-sm font-medium text-white/80 mb-1">Learning resources</p>
                            <ul className="list-disc list-inside text-sm text-white/70 space-y-1">
                              {skill.learningResources.map((resource, j) => (
                                <li key={j}>{resource}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {analysis.existingStrengths && analysis.existingStrengths.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-green-300" />
                    Existing Strengths
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {analysis.existingStrengths.map((strength, i) => (
                      <span
                        key={i}
                        className="px-3 py-1 bg-white/5 text-white/80 border border-white/10 rounded-full text-sm"
                      >
                        {strength}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div className="mt-8">
                <Button onClick={() => navigate('/roadmap')} className="w-full">
                  Generate Career Roadmap
                  <ArrowRight className="w-5 h-5" />
                </Button>
              </div>
              </CardContent>
            </Card>
          </div>
        )}
      </main>
    </div>
  );
}


