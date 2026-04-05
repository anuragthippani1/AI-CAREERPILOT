import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { AlertCircle, ArrowRight, CheckCircle, Share2, Target } from 'lucide-react';
import { skillsAPI } from '../services/api';
import Button from '../components/ui/Button';
import PageHeader from '../components/ui/PageHeader';
import { Card, CardContent } from '../components/ui/Card';
import { PageSkeleton } from '../components/ui/Skeleton';

export default function SharedSkillGapSnapshot() {
  const { token } = useParams();
  const [snapshot, setSnapshot] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    document.body.dataset.cpBg = 'landing';
    return () => {
      delete document.body.dataset.cpBg;
    };
  }, []);

  useEffect(() => {
    let active = true;

    const loadSnapshot = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await skillsAPI.getSharedSnapshot(token);

        if (!active) return;

        const nextSnapshot = response?.data?.data || null;
        setSnapshot(nextSnapshot);

        try {
          const tracked = await skillsAPI.trackSharedSnapshotView(token);
          if (!active || !tracked?.data?.success || !nextSnapshot) return;

          setSnapshot({
            ...nextSnapshot,
            metrics: tracked.data.data,
          });
        } catch {
          // Non-blocking tracking call
        }
      } catch (err) {
        if (!active) return;
        setError(err.response?.data?.error || 'Failed to load shared snapshot');
      } finally {
        if (active) setLoading(false);
      }
    };

    loadSnapshot();

    return () => {
      active = false;
    };
  }, [token]);

  const createdAt = useMemo(() => {
    if (!snapshot?.createdAt) return null;
    const date = new Date(snapshot.createdAt);
    if (Number.isNaN(date.getTime())) return null;
    return date.toLocaleDateString();
  }, [snapshot]);

  if (loading) {
    return <PageSkeleton />;
  }

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-50 border-b border-white/10 bg-[#070A12]/80 backdrop-blur">
        <div className="cp-container py-4 flex items-center justify-between gap-3">
          <Link to="/" className="flex items-center gap-3">
            <div className="w-9 h-9 bg-white/5 border border-white/10 rounded-xl flex items-center justify-center">
              <Target className="w-5 h-5 text-white" />
            </div>
            <span className="text-base font-semibold text-white tracking-[-0.01em]">CareerPilot</span>
          </Link>
          <div className="flex items-center gap-2">
            <Link to="/login">
              <Button variant="secondary">Log in</Button>
            </Link>
            <Link to="/signup">
              <Button>Try CareerPilot</Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="cp-page-inner max-w-4xl space-y-6">
        {error ? (
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-start gap-3 text-red-200">
                <AlertCircle className="w-5 h-5 mt-0.5" />
                <div>
                  <p className="font-semibold text-white">Snapshot unavailable</p>
                  <p className="text-sm text-white/70 mt-1">{error}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ) : snapshot ? (
          <>
            <PageHeader
              title={`${snapshot.owner?.name || 'A candidate'} is targeting ${snapshot.targetRole || 'their next role'}`}
              description="A live CareerPilot skill-gap snapshot. Compare the goal, the current match score, and the highest-leverage gaps."
              actions={
                <Link to="/signup">
                  <Button>
                    Build your own snapshot
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </Link>
              }
            />

            <Card highlighted depth>
              <CardContent className="pt-6">
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-6">
                  <div>
                    <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/70">
                      <Share2 className="w-3.5 h-3.5" />
                      Public snapshot
                    </div>
                    <h2 className="mt-4 text-2xl font-semibold text-white">
                      {snapshot.owner?.name || 'Candidate'}'s fit for {snapshot.targetRole || 'their target role'}
                    </h2>
                    <p className="mt-2 text-sm text-white/70 max-w-2xl">
                      {snapshot.overallAssessment || 'CareerPilot analyzed the candidate profile and highlighted the most important skills to close next.'}
                    </p>
                    <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-white/55">
                      {snapshot.owner?.title ? <span>{snapshot.owner.title}</span> : null}
                      {createdAt ? <span>Updated {createdAt}</span> : null}
                      <span>{snapshot.metrics?.viewCount || 0} public views</span>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-white/10 bg-white/5 px-5 py-4 text-center min-w-[150px]">
                    <div className="text-xs uppercase tracking-[0.12em] text-white/50">Match Score</div>
                    <div className="mt-2 text-4xl font-semibold text-white">{snapshot.matchScore || 0}%</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="grid md:grid-cols-2 gap-6">
              <Card>
                <CardContent className="pt-6">
                  <h3 className="text-lg font-semibold text-white">Top gaps to close</h3>
                  <div className="mt-4 space-y-3">
                    {(snapshot.missingCritical || []).map((item, index) => (
                      <div key={`${item.skill}-${index}`} className="rounded-xl border border-white/10 bg-white/5 p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <div className="font-semibold text-white">{item.skill}</div>
                            {item.estimatedTime ? (
                              <div className="mt-1 text-sm text-white/65">Estimated time: {item.estimatedTime}</div>
                            ) : null}
                          </div>
                          {item.priority != null ? (
                            <div className="text-xs text-white/55">Priority {item.priority}/10</div>
                          ) : null}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <h3 className="text-lg font-semibold text-white">Existing strengths</h3>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {(snapshot.existingStrengths || []).length > 0 ? (
                      snapshot.existingStrengths.map((strength) => (
                        <span
                          key={strength}
                          className="inline-flex items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1 text-sm text-emerald-100"
                        >
                          <CheckCircle className="w-3.5 h-3.5" />
                          {strength}
                        </span>
                      ))
                    ) : (
                      <p className="text-sm text-white/65">Run your own analysis to see personalized strengths and gaps.</p>
                    )}
                  </div>

                  <div className="mt-8 rounded-xl border border-white/10 bg-white/5 p-4">
                    <div className="text-sm font-semibold text-white">Want your own shareable snapshot?</div>
                    <p className="mt-1 text-sm text-white/70">
                      Upload your resume, run a skill-gap analysis, and generate a public link from the results screen.
                    </p>
                    <div className="mt-4">
                      <Link to="/signup">
                        <Button className="w-full">
                          Create my snapshot
                          <ArrowRight className="w-4 h-4" />
                        </Button>
                      </Link>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </>
        ) : null}
      </main>
    </div>
  );
}
