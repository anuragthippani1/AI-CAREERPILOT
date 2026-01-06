import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Award, FileText, Map, MessageSquare, Sparkles, Target, Terminal } from 'lucide-react';
import { interviewAPI, resumeAPI, roadmapAPI, userAPI } from '../services/api';
import PageHeader from '../components/ui/PageHeader';
import Button from '../components/ui/Button';
import { Card, CardContent } from '../components/ui/Card';
import EmptyState from '../components/ui/EmptyState';
import { PageSkeleton } from '../components/ui/Skeleton';

export default function LandingPage() {
  const [userId] = useState(1); // Demo user
  const [user, setUser] = useState(null);
  const [resume, setResume] = useState(null);
  const [roadmap, setRoadmap] = useState(null);
  const [interviewStats, setInterviewStats] = useState({ completed: 0, averageScore: 0, streak: 0 });
  const [recentAchievements, setRecentAchievements] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboard();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadDashboard = async () => {
    try {
      setLoading(true);
      const [userRes, resumeRes, roadmapRes, interviewRes, statsRes, achievementsRes] = await Promise.allSettled([
        userAPI.get(userId),
        resumeAPI.get(userId),
        roadmapAPI.get(userId),
        interviewAPI.getSessions(userId),
        userAPI.getStats(userId),
        userAPI.getAchievements(userId),
      ]);

      if (userRes.status === 'fulfilled') setUser(userRes.value.data.data);
      if (resumeRes.status === 'fulfilled') setResume(resumeRes.value.data.data);
      if (roadmapRes.status === 'fulfilled') setRoadmap(roadmapRes.value.data.data);

      if (achievementsRes.status === 'fulfilled') {
        const achievements = achievementsRes.value.data.data || [];
        setRecentAchievements(achievements.slice(0, 3));
      }

      if (interviewRes.status === 'fulfilled' && interviewRes.value.data.success) {
        const sessions = interviewRes.value.data.data || [];
        const completed = sessions.filter((s) => s.status === 'completed');
        const avgScore =
          completed.length > 0
            ? completed.reduce((sum, s) => sum + (Number(s.overall_score) || 0), 0) / completed.length
            : 0;

        setInterviewStats({
          completed: completed.length,
          averageScore: Math.round(avgScore),
          streak: statsRes.status === 'fulfilled' ? (statsRes.value.data.data?.currentStreak || 0) : 0,
        });
      }
    } catch (error) {
      console.error('Error loading landing:', error);
    } finally {
      setLoading(false);
    }
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  const progress = roadmap?.progress_percentage || 0;

  if (loading) return <PageSkeleton />;

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-50 border-b border-white/10 bg-[#070A12]/80 backdrop-blur">
        <div className="cp-container py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3">
            <div className="w-9 h-9 bg-white/5 border border-white/10 rounded-xl flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <span className="text-base font-semibold text-white tracking-[-0.01em]">CareerPilot</span>
          </Link>
          <Link to="/dashboard">
            <Button>Open dashboard</Button>
          </Link>
        </div>
      </header>

      <main className="cp-page-inner max-w-6xl space-y-6">
        <PageHeader
          title={user ? `${getGreeting()}, ${user.name || 'User'}` : 'Welcome'}
          description="Practice consistently, measure progress, and build confidence for interviews."
          actions={
            <Link to="/interview">
              <Button variant="secondary">
                <MessageSquare className="w-4 h-4" />
                Start interview
              </Button>
            </Link>
          }
        />

        <div className="grid sm:grid-cols-3 gap-4">
          <Card className="p-4">
            <div className="text-sm text-white/70">Roadmap progress</div>
            <div className="text-2xl font-semibold text-white mt-1">{isNaN(progress) ? 0 : Math.round(progress)}%</div>
          </Card>
          <Card className="p-4">
            <div className="text-sm text-white/70">Interviews completed</div>
            <div className="text-2xl font-semibold text-white mt-1">{interviewStats.completed}</div>
          </Card>
          <Card className="p-4">
            <div className="text-sm text-white/70">Average score</div>
            <div className="text-2xl font-semibold text-white mt-1">{interviewStats.averageScore}%</div>
          </Card>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <Card>
            <CardContent className="pt-6">
              <h2 className="text-lg font-semibold text-white">Next actions</h2>
              <p className="text-sm text-white/70 mt-1">Pick one and keep it focused.</p>
              <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Link to="/practice" className="glass-card rounded-xl border border-white/10 p-4 hover:border-white/15 transition-colors">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center">
                      <Terminal className="w-5 h-5 text-primary-200" />
                    </div>
                    <div>
                      <div className="font-semibold text-white">Practice challenges</div>
                      <div className="text-sm text-white/70">Build speed and confidence.</div>
                    </div>
                  </div>
                </Link>
                <Link to="/resume" className="glass-card rounded-xl border border-white/10 p-4 hover:border-white/15 transition-colors">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center">
                      <FileText className="w-5 h-5 text-primary-200" />
                    </div>
                    <div>
                      <div className="font-semibold text-white">Analyze resume</div>
                      <div className="text-sm text-white/70">Improve ATS signals.</div>
                    </div>
                  </div>
                </Link>
                <Link to="/skills" className="glass-card rounded-xl border border-white/10 p-4 hover:border-white/15 transition-colors">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center">
                      <Target className="w-5 h-5 text-primary-200" />
                    </div>
                    <div>
                      <div className="font-semibold text-white">Skill gap</div>
                      <div className="text-sm text-white/70">Prioritize what matters.</div>
                    </div>
                  </div>
                </Link>
                <Link to="/roadmap" className="glass-card rounded-xl border border-white/10 p-4 hover:border-white/15 transition-colors">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center">
                      <Map className="w-5 h-5 text-primary-200" />
                    </div>
                    <div>
                      <div className="font-semibold text-white">Roadmap</div>
                      <div className="text-sm text-white/70">Make progress measurable.</div>
                    </div>
                  </div>
                </Link>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <h2 className="text-lg font-semibold text-white">Recent achievements</h2>
              <p className="text-sm text-white/70 mt-1">Trust signals that you’re progressing.</p>
              <div className="mt-4">
                {recentAchievements.length === 0 ? (
                  <EmptyState
                    icon={Award}
                    title="No achievements yet"
                    description="Complete an interview or solve a challenge to unlock your first milestone."
                    primaryAction={
                      <Link to="/practice">
                        <Button>Start practicing</Button>
                      </Link>
                    }
                  />
                ) : (
                  <div className="space-y-3">
                    {recentAchievements.slice(0, 3).map((a) => (
                      <div key={a.id} className="rounded-xl border border-white/10 bg-white/5 p-4">
                        <div className="flex items-start gap-3">
                          <div className="w-10 h-10 bg-white/5 border border-white/10 rounded-lg flex items-center justify-center">
                            <Award className="w-5 h-5 text-yellow-300" />
                          </div>
                          <div className="min-w-0">
                            <div className="font-semibold text-white">{a.name}</div>
                            <div className="text-sm text-white/70 line-clamp-2">{a.description}</div>
                            <div className="text-xs text-white/60 mt-1">+{a.xpReward} XP</div>
                          </div>
                        </div>
                      </div>
                    ))}
                    <Link to="/profile" className="inline-flex text-sm text-white/70 hover:text-white transition-colors">
                      View profile →
                    </Link>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}


