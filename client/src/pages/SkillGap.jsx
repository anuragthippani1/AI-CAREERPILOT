import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Target, AlertCircle, CheckCircle, Loader, ArrowRight, Share2, Copy, Check, ExternalLink } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { skillsAPI, resumeAPI, userAPI } from '../services/api';
import PageHeader from '../components/ui/PageHeader';
import Button from '../components/ui/Button';
import { Card, CardContent } from '../components/ui/Card';

export default function SkillGap() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState(null);
  const [history, setHistory] = useState([]);
  const [targetRole, setTargetRole] = useState('');
  const [resumeAnalysis, setResumeAnalysis] = useState(null);
  const [error, setError] = useState(null);
  const [lastUpdatedAt, setLastUpdatedAt] = useState(null);
  const [shareState, setShareState] = useState({
    loading: false,
    error: null,
    success: false,
    url: '',
    metrics: null,
  });

  useEffect(() => {
    if (user) {
      loadAnalysis();
    }
  }, [user]);

  const loadAnalysis = async () => {
    if (!user) return;
    
    try {
      setError(null);
      setLoading(true);
      const [resumeRes, userRes, gapAnalysesRes] = await Promise.allSettled([
        resumeAPI.get(),
        userAPI.getMe(),
        skillsAPI.getGapAnalyses(),
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
        setHistory(analyses);
        if (analyses.length > 0) {
          const latest = analyses[0];
          setAnalysis(latest.analysis);
          setLastUpdatedAt(latest.createdAt || null);
          if (latest.targetRole && !targetRole) {
            setTargetRole(latest.targetRole);
          }
        } else {
          setAnalysis(null);
          setLastUpdatedAt(null);
        }
      }
    } catch (err) {
      console.error('Error loading analysis:', err);
      setError(err.response?.data?.error || 'Failed to load skill gap analysis');
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
        await userAPI.setGoal({ targetRole });
      }

      const response = await skillsAPI.analyze({
        resumeAnalysis: resumeAnalysis || null,
      });

      // Orchestrator wraps the agent response; prefer a nested data shape if present
      const payload = response.data?.data;
      const next =
        payload && payload.data
          ? payload.data
          : payload || response.data;

      setAnalysis(next);
      setLastUpdatedAt(new Date().toISOString());
      setShareState({
        loading: false,
        error: null,
        success: false,
        url: '',
        metrics: null,
      });

      // Refresh history so trend widgets stay in sync
      try {
        const refreshed = await skillsAPI.getGapAnalyses();
        if (refreshed?.data?.success) {
          setHistory(refreshed.data.data || []);
        }
      } catch {
        // non-blocking
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to analyze skill gap');
    } finally {
      setLoading(false);
    }
  };

  const analytics = useMemo(() => {
    if (!analysis) {
      return {
        currentMatch: null,
        previousMatch: null,
        delta: null,
        runs: history.length,
      };
    }

    const currentMatch = Math.round(analysis.currentMatchPercentage || 0);
    const previous = history.length > 1 ? history[1] : null;
    const previousMatch = previous?.analysis?.currentMatchPercentage != null
      ? Math.round(previous.analysis.currentMatchPercentage)
      : null;
    const delta =
      previousMatch != null ? currentMatch - previousMatch : null;

    return {
      currentMatch,
      previousMatch,
      delta,
      runs: history.length,
    };
  }, [analysis, history]);

  const formattedLastUpdated = useMemo(() => {
    if (!lastUpdatedAt) return null;
    try {
      const d = new Date(lastUpdatedAt);
      if (Number.isNaN(d.getTime())) return null;
      return d.toLocaleString();
    } catch {
      return null;
    }
  }, [lastUpdatedAt]);

  const shareSnapshot = async () => {
    try {
      setShareState((current) => ({
        ...current,
        loading: true,
        error: null,
        success: false,
      }));

      const response = await skillsAPI.createShareSnapshot();
      const shareUrl = response?.data?.data?.shareUrl;
      const metrics = response?.data?.data?.metrics || null;

      if (!shareUrl) {
        throw new Error('Share link was not created');
      }

      let copied = false;

      if (navigator.share) {
        try {
          await navigator.share({
            title: 'My CareerPilot skill gap snapshot',
            text: `See how I stack up for ${targetRole || 'my target role'} on CareerPilot.`,
            url: shareUrl,
          });
        } catch (shareError) {
          if (shareError?.name !== 'AbortError' && navigator.clipboard?.writeText) {
            await navigator.clipboard.writeText(shareUrl);
            copied = true;
          }
        }
      } else if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(shareUrl);
        copied = true;
      }

      setShareState({
        loading: false,
        error: null,
        success: true,
        url: shareUrl,
        metrics,
        copied,
      });
    } catch (err) {
      setShareState({
        loading: false,
        error: err.response?.data?.error || err.message || 'Failed to create share link',
        success: false,
        url: '',
        metrics: null,
      });
    }
  };

  const copyShareUrl = async () => {
    if (!shareState.url || !navigator.clipboard?.writeText) return;
    try {
      await navigator.clipboard.writeText(shareState.url);
      setShareState((current) => ({ ...current, copied: true }));
    } catch {
      // Non-blocking
    }
  };

  return (
    <div className="cp-page">
      <main className="cp-page-inner max-w-4xl">
        <PageHeader
          title="Skill gap analysis"
          description="Turn your target role into a prioritized learning plan based on your current profile and resume."
        />

        {loading && !analysis ? (
          <Card className="mt-6">
            <CardContent className="pt-6">
              <div className="flex items-center justify-center gap-3 text-white/70">
                <Loader className="w-5 h-5 animate-spin" />
                <span>Loading your latest analysis…</span>
              </div>
            </CardContent>
          </Card>
        ) : !analysis ? (
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
          <div className="space-y-6 mt-6">
            <Card className="mt-6">
              <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-xl font-semibold text-white">Your results</h2>
                  <p className="text-sm text-white/70 mt-1">
                    Focus on the critical gaps first to move fastest.
                  </p>

                  <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-white/60">
                    {formattedLastUpdated && (
                      <span>Last updated: {formattedLastUpdated}</span>
                    )}
                    {analytics.runs > 1 && analytics.delta != null && (
                      <span className={analytics.delta >= 0 ? 'text-green-300' : 'text-red-300'}>
                        {analytics.delta >= 0 ? '▲' : '▼'} {Math.abs(analytics.delta)} pts since last analysis
                      </span>
                    )}
                    {analytics.runs > 0 && (
                      <span className="text-white/50">
                        Total analyses run: {analytics.runs}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex flex-col items-end gap-3">
                  <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-right">
                    <p className="text-xs text-white/60">Match score</p>
                    <p className="text-2xl font-semibold text-white">
                      {analytics.currentMatch != null ? `${analytics.currentMatch}%` : '—'}
                    </p>
                  </div>
                  <Button
                    variant={shareState.success ? 'secondary' : 'primary'}
                    onClick={shareSnapshot}
                    disabled={shareState.loading}
                    className="min-w-[190px]"
                  >
                    {shareState.loading ? (
                      <>
                        <Loader className="w-4 h-4 animate-spin" />
                        Creating link...
                      </>
                    ) : shareState.success ? (
                      <>
                        <Check className="w-4 h-4" />
                        Link ready
                      </>
                    ) : (
                      <>
                        <Share2 className="w-4 h-4" />
                        Share snapshot
                      </>
                    )}
                  </Button>
                </div>
              </div>

              {(shareState.error || shareState.success) && (
                <div className={`mb-6 rounded-xl border px-4 py-3 ${
                  shareState.error
                    ? 'border-red-500/25 bg-red-500/10'
                    : 'border-emerald-400/20 bg-emerald-400/10'
                }`}>
                  {shareState.error ? (
                    <p className="text-sm text-red-200">{shareState.error}</p>
                  ) : (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm text-emerald-100">
                        <Copy className="w-4 h-4" />
                        {shareState.copied
                          ? 'Share link copied. Use it to send your score + top gaps publicly.'
                          : 'Share link ready. Copy it to share your score + top gaps publicly.'}
                      </div>
                      <div className="text-xs text-emerald-100/80 break-all">{shareState.url}</div>
                      <div className="flex flex-wrap items-center gap-2 pt-1">
                        <Button
                          variant="secondary"
                          onClick={copyShareUrl}
                          className="h-9"
                          disabled={!shareState.url || !navigator.clipboard?.writeText}
                        >
                          <Copy className="w-4 h-4" />
                          Copy link
                        </Button>
                        <a href={shareState.url} target="_blank" rel="noreferrer">
                          <Button variant="secondary" className="h-9">
                            <ExternalLink className="w-4 h-4" />
                            Open snapshot
                          </Button>
                        </a>
                      </div>
                      {shareState.metrics && (
                        <div className="text-xs text-emerald-100/80">
                          `share_clicked`: {shareState.metrics.shareCount} · `share_snapshot_viewed`: {shareState.metrics.viewCount}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

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

