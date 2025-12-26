import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Target, AlertCircle, CheckCircle, Loader, ArrowRight } from 'lucide-react';
import { skillsAPI, resumeAPI, userAPI } from '../services/api';

export default function SkillGap() {
  const navigate = useNavigate();
  const [userId] = useState(1);
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState(null);
  const [targetRole, setTargetRole] = useState('');
  const [error, setError] = useState(null);

  useEffect(() => {
    loadAnalysis();
  }, []);

  const loadAnalysis = async () => {
    try {
      setLoading(true);
      const [resumeRes, userRes] = await Promise.allSettled([
        resumeAPI.get(userId),
        userAPI.get(userId),
      ]);

      if (resumeRes.status === 'fulfilled' && resumeRes.value.data.data) {
        const resume = resumeRes.value.data.data;
        const resumeAnalysis = typeof resume.analysis_json === 'string' 
          ? JSON.parse(resume.analysis_json) 
          : resume.analysis_json;

        // Auto-analyze if we have resume
        if (resumeAnalysis) {
          await analyzeSkillGap(resumeAnalysis);
        }
      }
    } catch (err) {
      console.error('Error loading analysis:', err);
    } finally {
      setLoading(false);
    }
  };

  const analyzeSkillGap = async (resumeAnalysis = null) => {
    if (!targetRole && !resumeAnalysis) {
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
    <div className="min-h-screen bg-gray-50">
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-200">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <h1 className="text-xl font-bold text-gray-900">Skill Gap Analysis</h1>
        </div>
      </header>

      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 max-w-4xl">
        {!analysis ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Target Role
                </label>
                <input
                  type="text"
                  value={targetRole}
                  onChange={(e) => setTargetRole(e.target.value)}
                  placeholder="e.g., Senior Software Engineer"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 text-red-600" />
                  <p className="text-red-800">{error}</p>
                </div>
              )}

              <button
                onClick={() => analyzeSkillGap()}
                disabled={loading}
                className="w-full bg-gray-900 hover:bg-gray-800 text-white font-semibold py-3 px-6 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-sm hover:shadow-md"
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
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Skill Gap Analysis</h2>
                <div className="bg-blue-50 rounded-lg px-4 py-2">
                  <p className="text-sm text-gray-600">Match Score</p>
                  <p className="text-2xl font-bold text-blue-600">
                    {Math.round(analysis.currentMatchPercentage || 0)}%
                  </p>
                </div>
              </div>

              <div className="mb-6">
                <h3 className="font-semibold text-gray-900 mb-2">Overall Assessment</h3>
                <p className="text-gray-700">{analysis.overallAssessment}</p>
              </div>

              {analysis.missingCritical && analysis.missingCritical.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <AlertCircle className="w-6 h-6 text-red-600" />
                    Missing Critical Skills
                  </h3>
                  <div className="space-y-4">
                    {analysis.missingCritical.map((skill, i) => (
                      <div key={i} className="border border-red-200 rounded-lg p-4 bg-red-50">
                        <div className="flex items-start justify-between mb-2">
                          <h4 className="font-semibold text-gray-900">{skill.skill}</h4>
                          <span className="text-sm text-gray-600">Priority: {skill.priority}/10</span>
                        </div>
                        <p className="text-sm text-gray-600 mb-2">Estimated Time: {skill.estimatedTime}</p>
                        {skill.learningResources && skill.learningResources.length > 0 && (
                          <div>
                            <p className="text-sm font-medium text-gray-700 mb-1">Learning Resources:</p>
                            <ul className="list-disc list-inside text-sm text-gray-600">
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
                  <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <CheckCircle className="w-6 h-6 text-green-600" />
                    Existing Strengths
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {analysis.existingStrengths.map((strength, i) => (
                      <span
                        key={i}
                        className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm"
                      >
                        {strength}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div className="mt-8">
                <button
                  onClick={() => navigate('/roadmap')}
                  className="w-full bg-gray-900 hover:bg-gray-800 text-white font-semibold py-3 px-6 rounded-lg transition-colors flex items-center justify-center gap-2 shadow-sm hover:shadow-md"
                >
                  Generate Career Roadmap
                  <ArrowRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}


