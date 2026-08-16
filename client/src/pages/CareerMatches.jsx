import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, BriefcaseBusiness, Loader, Sparkles, Target } from 'lucide-react';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { careerAPI } from '../services/api';
import { useToast } from '../contexts/ToastContext';
import PageHeader from '../components/ui/PageHeader';
import Button from '../components/ui/Button';
import { Card, CardContent } from '../components/ui/Card';

function normalizeCareerResponse(payload) {
  if (!payload) return null;

  if (payload.report) {
    return {
      targetRole: payload.targetRole || null,
      interests: payload.interests || [],
      report: payload.report,
      topCareerTitle: payload.topCareerTitle || payload.report?.topMatches?.[0]?.title || null,
      topCareerConfidence: payload.topCareerConfidence || payload.report?.topMatches?.[0]?.confidence || null,
      createdAt: payload.createdAt || null,
    };
  }

  if (payload.data?.report) {
    return normalizeCareerResponse(payload.data);
  }

  return null;
}

export default function CareerMatches() {
  const { push: pushToast } = useToast();
  const [interests, setInterests] = useState('');
  const [targetRole, setTargetRole] = useState('');
  const [currentRoleOrEducation, setCurrentRoleOrEducation] = useState('');
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    document.body.dataset.cpBg = 'roadmap';
    return () => {
      delete document.body.dataset.cpBg;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    const loadLatest = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await careerAPI.getLatestMatch();
        if (cancelled) return;

        const nextReport = normalizeCareerResponse(response.data?.data);
        if (nextReport) {
          setReport(nextReport);
          setTargetRole(nextReport.targetRole || '');
          setInterests(Array.isArray(nextReport.interests) ? nextReport.interests.join(', ') : '');
        }
      } catch (err) {
        if (!cancelled) {
          setError(err.response?.data?.error || 'Failed to load career matches');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    loadLatest();
    return () => {
      cancelled = true;
    };
  }, []);

  const chartData = useMemo(() => {
    return (report?.report?.topMatches || []).map((item) => ({
      career: item.title,
      confidence: item.confidence,
    }));
  }, [report]);

  const handleGenerate = async (event) => {
    event.preventDefault();

    try {
      setGenerating(true);
      setError(null);

      const response = await careerAPI.generateMatches({
        interests,
        targetRole,
        currentRoleOrEducation,
      });

      const nextReport = normalizeCareerResponse(response.data?.data);
      if (!nextReport) {
        throw new Error(response.data?.error || 'Career match generation failed');
      }

      setReport(nextReport);
      pushToast({
        variant: 'success',
        title: 'Career matches ready',
        message: 'Your top-fit career paths have been ranked and saved.',
      });
    } catch (err) {
      const message = err.response?.data?.error || err.message || 'Failed to generate career matches';
      setError(message);
      pushToast({
        variant: 'error',
        title: 'Career match failed',
        message,
      });
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="cp-page">
      <main className="cp-page-inner max-w-6xl space-y-6">
        <PageHeader
          title="Career matches"
          description="Predict the five strongest career paths from your current profile, resume signal, and stated interests."
          actions={
            <>
              <Link to="/skills">
                <Button variant="secondary">
                  <Target className="w-4 h-4" />
                  Skill gap
                </Button>
              </Link>
              <Link to="/roadmap-generator">
                <Button>
                  <Sparkles className="w-4 h-4" />
                  Build roadmap
                </Button>
              </Link>
            </>
          }
        />

        <Card>
          <CardContent className="pt-6">
            <form onSubmit={handleGenerate} className="grid lg:grid-cols-[1.2fr_0.8fr] gap-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-white/80 mb-2">Target role (optional)</label>
                  <input
                    className="cp-input"
                    value={targetRole}
                    onChange={(e) => setTargetRole(e.target.value)}
                    placeholder="e.g., AI Engineer"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-white/80 mb-2">Interests</label>
                  <input
                    className="cp-input"
                    value={interests}
                    onChange={(e) => setInterests(e.target.value)}
                    placeholder="e.g., machine learning, backend systems, cloud"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-white/80 mb-2">Current role or education</label>
                  <textarea
                    className="cp-input min-h-[120px]"
                    value={currentRoleOrEducation}
                    onChange={(e) => setCurrentRoleOrEducation(e.target.value)}
                    placeholder="e.g., final-year CS student, junior frontend developer, self-taught builder"
                  />
                </div>
                {error ? (
                  <div className="rounded-lg border border-red-500/25 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                    {error}
                  </div>
                ) : null}
                <Button type="submit" disabled={generating}>
                  {generating ? <Loader className="w-4 h-4 animate-spin" /> : <BriefcaseBusiness className="w-4 h-4" />}
                  Generate top-fit careers
                </Button>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
                <div className="text-sm font-semibold text-white">What this uses</div>
                <div className="mt-3 space-y-3 text-sm text-white/68">
                  <p>Your latest resume analysis and extracted skills.</p>
                  <p>Your active target role, if one exists.</p>
                  <p>Any interests or context you provide here.</p>
                </div>
                <div className="mt-5 rounded-xl border border-primary-400/20 bg-primary-500/10 p-4">
                  <div className="text-xs uppercase tracking-[0.14em] text-primary-100/70">Outcome</div>
                  <div className="mt-2 text-lg font-semibold text-white">
                    Get ranked career options before committing to one roadmap.
                  </div>
                </div>
              </div>
            </form>
          </CardContent>
        </Card>

        {loading ? (
          <Card>
            <CardContent className="pt-6 flex items-center justify-center gap-3 text-white/70">
              <Loader className="w-5 h-5 animate-spin" />
              Loading latest career match report…
            </CardContent>
          </Card>
        ) : report ? (
          <>
            <div className="grid lg:grid-cols-[1.2fr_0.8fr] gap-6">
              <Card highlighted depth>
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between gap-6">
                    <div>
                      <div className="text-xs uppercase tracking-[0.14em] text-white/50">Top recommended path</div>
                      <h2 className="mt-2 text-2xl font-semibold text-white">
                        {report.topCareerTitle || report.report?.topMatches?.[0]?.title || 'Career path'}
                      </h2>
                      <p className="mt-3 text-sm text-white/72 max-w-2xl">
                        {report.report?.summary}
                      </p>
                    </div>
                    <div className="rounded-2xl border border-white/10 bg-white/5 px-5 py-4 text-center min-w-[140px]">
                      <div className="text-xs uppercase tracking-[0.14em] text-white/50">Confidence</div>
                      <div className="mt-2 text-4xl font-semibold text-white">
                        {report.topCareerConfidence != null ? `${Math.round(report.topCareerConfidence)}%` : '—'}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="text-lg font-semibold text-white">Confidence spread</div>
                  <div className="mt-4 h-[280px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={chartData} layout="vertical" margin={{ top: 4, right: 4, left: 18, bottom: 4 }}>
                        <CartesianGrid stroke="rgba(255,255,255,0.06)" horizontal={false} />
                        <XAxis type="number" domain={[0, 100]} stroke="rgba(255,255,255,0.45)" tickLine={false} axisLine={false} />
                        <YAxis
                          type="category"
                          dataKey="career"
                          stroke="rgba(255,255,255,0.55)"
                          tickLine={false}
                          axisLine={false}
                          width={110}
                        />
                        <Tooltip
                          cursor={{ fill: 'rgba(255,255,255,0.04)' }}
                          contentStyle={{
                            background: 'rgba(10, 14, 24, 0.96)',
                            border: '1px solid rgba(255,255,255,0.12)',
                            borderRadius: '12px',
                            color: 'white',
                          }}
                        />
                        <Bar dataKey="confidence" fill="rgba(99, 102, 241, 0.82)" radius={[8, 8, 8, 8]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="grid xl:grid-cols-2 gap-6">
              <Card>
                <CardContent className="pt-6">
                  <h3 className="text-lg font-semibold text-white">Top 5 matches</h3>
                  <div className="mt-4 space-y-4">
                    {(report.report?.topMatches || []).map((match, index) => (
                      <div key={`${match.title}-${index}`} className="rounded-2xl border border-white/10 bg-white/5 p-5 cp-card-depth">
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <div className="text-xs uppercase tracking-[0.12em] text-white/45">#{index + 1} Match</div>
                            <div className="mt-1 text-lg font-semibold text-white">{match.title}</div>
                          </div>
                          <div className="text-sm font-semibold text-primary-100">{match.confidence}%</div>
                        </div>
                        <p className="mt-3 text-sm text-white/72">{match.whyFit}</p>
                        <div className="mt-4">
                          <div className="text-xs uppercase tracking-[0.12em] text-white/45">Core strengths</div>
                          <div className="mt-2 flex flex-wrap gap-2">
                            {(match.coreStrengths || []).map((item) => (
                              <span key={item} className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1 text-xs text-emerald-100">
                                {item}
                              </span>
                            ))}
                          </div>
                        </div>
                        <div className="mt-4">
                          <div className="text-xs uppercase tracking-[0.12em] text-white/45">Missing skills</div>
                          <div className="mt-2 flex flex-wrap gap-2">
                            {(match.missingSkills || []).map((item) => (
                              <span key={item} className="rounded-full border border-amber-400/20 bg-amber-400/10 px-3 py-1 text-xs text-amber-100">
                                {item}
                              </span>
                            ))}
                          </div>
                        </div>
                        <div className="mt-4">
                          <div className="text-xs uppercase tracking-[0.12em] text-white/45">Recommended projects</div>
                          <ul className="mt-2 space-y-1 text-sm text-white/68">
                            {(match.recommendedProjects || []).map((item) => (
                              <li key={item}>• {item}</li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <div className="space-y-6">
                <Card>
                  <CardContent className="pt-6">
                    <h3 className="text-lg font-semibold text-white">Recommended next steps</h3>
                    <div className="mt-4 space-y-3">
                      {(report.report?.recommendedNextSteps || []).map((step, index) => (
                        <div key={`${step}-${index}`} className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/75">
                          {step}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-6">
                    <h3 className="text-lg font-semibold text-white">Suggested learning tracks</h3>
                    <div className="mt-4 space-y-3">
                      {(report.report?.suggestedLearningTracks || []).map((track, index) => (
                        <div key={`${track.title}-${index}`} className="rounded-xl border border-white/10 bg-white/5 p-4">
                          <div className="flex items-start justify-between gap-4">
                            <div>
                              <div className="font-semibold text-white">{track.title}</div>
                              <p className="mt-1 text-sm text-white/70">{track.focus}</p>
                            </div>
                            <div className="text-xs text-white/55">{track.duration}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-6">
                    <h3 className="text-lg font-semibold text-white">Turn a match into execution</h3>
                    <div className="mt-4 grid gap-3">
                      <Link to="/skills" className="glass-card rounded-xl border border-white/10 p-4 hover:border-white/15 transition-colors">
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="font-semibold text-white text-sm">Run skill gap analysis</div>
                            <div className="text-xs text-white/60">Compare your profile against the path you choose.</div>
                          </div>
                          <ArrowRight className="w-4 h-4 text-white/40" />
                        </div>
                      </Link>
                      <Link to="/roadmap-generator" className="glass-card rounded-xl border border-white/10 p-4 hover:border-white/15 transition-colors">
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="font-semibold text-white text-sm">Generate a roadmap</div>
                            <div className="text-xs text-white/60">Convert the selected path into a timeline.</div>
                          </div>
                          <ArrowRight className="w-4 h-4 text-white/40" />
                        </div>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </>
        ) : (
          <Card>
            <CardContent className="pt-6 text-center">
              <div className="text-lg font-semibold text-white">No career match report yet</div>
              <p className="mt-2 text-sm text-white/65">Generate your first report to rank the most plausible career paths from your current profile.</p>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}
