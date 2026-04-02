import { useMemo, useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FileText, Target, Map as MapIcon, MessageSquare, Calendar, Terminal, ArrowRight, Star, Flame, Award, Trophy, User, AlertCircle, Sparkles } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { userAPI, resumeAPI, roadmapAPI, interviewAPI, skillsAPI } from '../services/api';
import PageHeader from '../components/ui/PageHeader';
import Button from '../components/ui/Button';
import { Card, CardContent } from '../components/ui/Card';
import { PageSkeleton } from '../components/ui/Skeleton';
import MotionDebug from '../components/MotionDebug';
import DashboardStatsCard from '../components/dashboard/DashboardStatsCard';
import ProgressRing from '../components/dashboard/ProgressRing';
import NextActionCard from '../components/dashboard/NextActionCard';
import WeeklyProgressChart from '../components/dashboard/WeeklyProgressChart';

function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n));
}

function startOfDay(ts) {
  const d = new Date(ts);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

function buildLast7DaysCounts(doneAtTimestamps = []) {
  const now = Date.now();
  const today = startOfDay(now);
  const days = Array.from({ length: 7 }).map((_, i) => {
    const dayStart = today - (6 - i) * 24 * 60 * 60 * 1000;
    return { date: new Date(dayStart).toISOString(), completed: 0, dayStart };
  });
  const byDay = new Map(days.map((d) => [d.dayStart, d]));

  doneAtTimestamps.forEach((ts) => {
    if (!ts) return;
    const day = startOfDay(ts);
    const bucket = byDay.get(day);
    if (bucket) bucket.completed += 1;
  });

  return days.map(({ date, completed }) => ({ date, completed }));
}

function deriveNextAction({ resume, skills, roadmap, interviewStats }) {
  if (!resume) {
    return {
      title: 'Upload your resume',
      description: 'Resume analysis unlocks ATS scoring and more personalized recommendations across the app.',
      ctaLabel: 'Analyze resume',
      to: '/resume',
      icon: FileText,
    };
  }
  if (!skills || skills.length === 0) {
    return {
      title: 'Run skill gap analysis',
      description: 'Identify the highest-leverage missing skills for your target role and prioritize your learning.',
      ctaLabel: 'Analyze skill gap',
      to: '/skills',
      icon: Target,
    };
  }
  if (!roadmap) {
    return {
      title: 'Generate your roadmap',
      description: 'Turn your goal into a clear plan with milestones, projects, and a timeline you can execute.',
      ctaLabel: 'Generate roadmap',
      to: '/roadmap-generator',
      icon: Sparkles,
    };
  }
  if ((interviewStats?.completed || 0) === 0) {
    return {
      title: 'Complete your first mock interview',
      description: 'Practice speaking and get rubric-based feedback to improve quickly.',
      ctaLabel: 'Start interview',
      to: '/interview',
      icon: MessageSquare,
    };
  }
  return {
    title: 'Practice 2 focused challenges',
    description: 'Consistency compounds. A short practice session today keeps momentum and improves recall under pressure.',
    ctaLabel: 'Go to practice',
    to: '/practice',
    icon: Terminal,
  };
}

export default function Dashboard() {
  const { user: authUser } = useAuth();
  const [user, setUser] = useState(null);
  const [resume, setResume] = useState(null);
  const [skills, setSkills] = useState([]);
  const [roadmap, setRoadmap] = useState(null);
  const [interviewStats, setInterviewStats] = useState({ completed: 0, averageScore: 0, streak: 0 });
  const [userStats, setUserStats] = useState(null);
  const [taskProgress, setTaskProgress] = useState({});
  const [recentAchievements, setRecentAchievements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (authUser) {
      loadDashboard();
    }
  }, [authUser]);

  useEffect(() => {
    document.body.dataset.cpBg = 'dashboard';
    return () => {
      delete document.body.dataset.cpBg;
    };
  }, []);

  const loadDashboard = async () => {
    try {
      setLoading(true);
      setError(null);
      const [userRes, resumeRes, roadmapRes, interviewRes, statsRes, achievementsRes, skillsRes, taskRes] = await Promise.allSettled([
        userAPI.getMe(),
        resumeAPI.get(),
        roadmapAPI.get(),
        interviewAPI.getSessions(),
        userAPI.getStats(),
        userAPI.getAchievements(),
        skillsAPI.get(),
        roadmapAPI.getTaskProgress(),
      ]);

      if (userRes.status === 'fulfilled') setUser(userRes.value.data.data);
      if (resumeRes.status === 'fulfilled') setResume(resumeRes.value.data.data);
      if (roadmapRes.status === 'fulfilled') setRoadmap(roadmapRes.value.data.data);
      if (statsRes.status === 'fulfilled') setUserStats(statsRes.value.data.data);
      if (skillsRes.status === 'fulfilled') setSkills(skillsRes.value.data.data || []);
      if (taskRes.status === 'fulfilled') setTaskProgress(taskRes.value.data.data || {});
      if (achievementsRes.status === 'fulfilled') {
        const achievements = achievementsRes.value.data.data || [];
        // Get 3 most recent achievements
        setRecentAchievements(achievements.slice(0, 3));
      }

      if (interviewRes.status === 'fulfilled' && interviewRes.value.data.success) {
        const sessions = interviewRes.value.data.data || [];
        const completed = sessions.filter(s => s.status === 'completed');
        const avgScore = completed.length > 0
          ? completed.reduce((sum, s) => sum + (s.overall_score || 0), 0) / completed.length
          : 0;
        const latestCompleted = completed
          .slice()
          .sort((a, b) => new Date(b.updated_at || b.created_at).getTime() - new Date(a.updated_at || a.created_at).getTime())[0] || null;
        setInterviewStats({
          completed: completed.length,
          averageScore: Math.round(avgScore),
          streak: statsRes.status === 'fulfilled' ? (statsRes.value.data.data?.currentStreak || 0) : 0,
          latestScore: latestCompleted?.overall_score != null ? Math.round(Number(latestCompleted.overall_score) || 0) : null,
        });
      }

      // Use auth user if available
      if (authUser) {
        setUser(authUser);
      }
    } catch (error) {
      console.error('Error loading dashboard:', error);
      setError('Failed to load dashboard data. Please check the backend/API connection and try again.');
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
  const targetRole = roadmap?.target_role || 'Not set';
  const atsScore = resume?.ats_score != null ? clamp(Math.round(Number(resume.ats_score) || 0), 0, 100) : null;

  const completedSkillCount = Array.isArray(skills) ? skills.length : 0;
  const skillCompletionPct = clamp(Math.round((completedSkillCount / 24) * 100), 0, 100);

  const weeklyDoneAt = useMemo(() => {
    const entries = Object.values(taskProgress || {});
    return entries.map((e) => e?.doneAt).filter(Boolean);
  }, [taskProgress]);
  const weeklyData = useMemo(() => buildLast7DaysCounts(weeklyDoneAt), [weeklyDoneAt]);

  const nextAction = useMemo(
    () => deriveNextAction({ resume, skills, roadmap, interviewStats }),
    [resume, skills, roadmap, interviewStats]
  );

  if (loading) {
    return <PageSkeleton />;
  }

  return (
    <div className="cp-page">
      <MotionDebug />
      <main className="cp-page-inner max-w-6xl space-y-6">
        <PageHeader
          title="Dashboard"
          description={
            user
              ? `${getGreeting()}, ${user.name || 'User'}. Here's your progress and the next best step.`
              : 'Your progress and the next best step.'
          }
          actions={
            <>
              <Link to="/interview">
                <Button>
                  <MessageSquare className="w-4 h-4" />
                  Start interview
                </Button>
              </Link>
              <Link to="/practice">
                <Button variant="secondary">
                  <Terminal className="w-4 h-4" />
                  Practice
                </Button>
              </Link>
            </>
          }
        />

        {error && (
          <Card>
            <CardContent className="pt-6">
              <div className="bg-red-500/10 border border-red-500/25 rounded-lg p-4 flex items-start gap-2">
                <AlertCircle className="w-5 h-5 text-red-300 mt-0.5" />
                <p className="text-red-200 text-sm flex-1">{error}</p>
              </div>
              <div className="mt-4">
                <Button variant="secondary" onClick={loadDashboard}>
                  Retry loading dashboard
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
        {/* AI Command Center */}
        <div className="grid lg:grid-cols-3 gap-6 cp-fade-in">
          <div className="lg:col-span-2 space-y-6">
            <Card className="overflow-hidden">
              <CardContent className="pt-6">
                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6">
                  <div className="min-w-0">
                    <h2 className="text-xl font-semibold text-white">
                      {user ? `${getGreeting()}, ${user.name || 'User'}` : 'Welcome back'}
                    </h2>
                    <p className="text-sm text-white/70 mt-1">
                      Your AI command center: track what matters and take the next best action.
                    </p>

                    {userStats ? (
                      <div className="mt-5 p-4 rounded-xl border border-white/10 bg-white/5">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <Star className="w-4 h-4 text-yellow-300" aria-hidden="true" />
                            <span className="font-semibold text-white">Level {userStats.level}</span>
                          </div>
                          <span className="text-sm font-semibold text-white/70">
                            {userStats.xp.toLocaleString()} XP
                          </span>
                        </div>
                        <div className="w-full bg-white/5 rounded-full h-2.5 mb-2 border border-white/10 overflow-hidden">
                          <div
                            className="bg-primary-500/80 h-2.5 rounded-full transition-all duration-200"
                            style={{ width: `${clamp(userStats.progressToNextLevel || 0, 0, 100)}%` }}
                          />
                        </div>
                        <p className="text-xs text-white/60">
                          {userStats.xpNeeded} XP to Level {userStats.level + 1}
                        </p>
                      </div>
                    ) : null}
                  </div>

                  <div className="flex flex-wrap gap-4">
                    <DashboardStatsCard
                      title="Target role"
                      value={targetRole}
                      icon={MapIcon}
                      hint="This is pulled from your latest roadmap/goal."
                    />
                    <DashboardStatsCard
                      title="Resume ATS"
                      value={atsScore != null ? `${atsScore}%` : '—'}
                      icon={FileText}
                      hint={atsScore != null ? 'Keep iterating for stronger keyword alignment.' : 'Upload a resume to get an ATS score.'}
                      right={atsScore != null ? <ProgressRing value={atsScore} size={56} stroke={7} /> : null}
                    />
                    <DashboardStatsCard
                      title="Skill completion"
                      value={`${skillCompletionPct}%`}
                      icon={Target}
                      hint={`${completedSkillCount} skills tracked (goal baseline: 24).`}
                      right={<ProgressRing value={skillCompletionPct} size={56} stroke={7} />}
                    />
                    <DashboardStatsCard
                      title="Roadmap progress"
                      value={`${isNaN(progress) ? 0 : Math.round(progress)}%`}
                      icon={MapIcon}
                      hint="Based on your roadmap progress tracker."
                      right={<ProgressRing value={isNaN(progress) ? 0 : Math.round(progress)} size={56} stroke={7} />}
                    />
                    <DashboardStatsCard
                      title="Recent interview"
                      value={interviewStats.latestScore != null ? `${interviewStats.latestScore}%` : '—'}
                      icon={MessageSquare}
                      hint={interviewStats.latestScore != null ? 'Last completed mock interview score.' : 'Complete a mock interview to unlock this.'}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            <WeeklyProgressChart data={weeklyData} />
          </div>

          <div className="space-y-6">
            <NextActionCard {...nextAction} />

            <Card>
              <CardContent className="pt-6">
                <h3 className="text-lg font-semibold text-white">Quick actions</h3>
                <div className="mt-4 grid grid-cols-1 gap-3">
                  <Link to="/interview" className="glass-card rounded-xl p-4 border border-white/10 hover:border-white/15 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <MessageSquare className="w-5 h-5 text-primary-200" aria-hidden="true" />
                        <div>
                          <div className="font-semibold text-white text-sm">Start interview</div>
                          <div className="text-xs text-white/60">Get rubric-based feedback</div>
                        </div>
                      </div>
                      <ArrowRight className="w-4 h-4 text-white/40" aria-hidden="true" />
                    </div>
                  </Link>
                  <Link to="/practice" className="glass-card rounded-xl p-4 border border-white/10 hover:border-white/15 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Terminal className="w-5 h-5 text-primary-200" aria-hidden="true" />
                        <div>
                          <div className="font-semibold text-white text-sm">Practice</div>
                          <div className="text-xs text-white/60">Solve a focused challenge</div>
                        </div>
                      </div>
                      <ArrowRight className="w-4 h-4 text-white/40" aria-hidden="true" />
                    </div>
                  </Link>
                  <Link to="/roadmap" className="glass-card rounded-xl p-4 border border-white/10 hover:border-white/15 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <MapIcon className="w-5 h-5 text-primary-200" aria-hidden="true" />
                        <div>
                          <div className="font-semibold text-white text-sm">Roadmap</div>
                          <div className="text-xs text-white/60">Mark tasks complete</div>
                        </div>
                      </div>
                      <ArrowRight className="w-4 h-4 text-white/40" aria-hidden="true" />
                    </div>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Recent Achievements */}
        {recentAchievements.length > 0 && (
          <Card>
            <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Trophy className="w-5 h-5 text-yellow-300" />
                <h3 className="text-lg font-semibold text-white">Recent achievements</h3>
              </div>
              <Link
                to="/profile"
                className="text-sm text-white/70 hover:text-white transition-colors"
              >
                View All
              </Link>
            </div>
            <div className="grid sm:grid-cols-3 gap-4">
              {recentAchievements.map((achievement) => (
                <div
                  key={achievement.id}
                  className="rounded-xl border border-white/10 bg-white/5 p-4 modern-card hover:border-white/15 transition-colors"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 bg-white/5 border border-white/10 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Award className="w-5 h-5 text-yellow-300" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-white text-sm">{achievement.name}</h4>
                      <p className="text-xs text-white/70 mt-1 line-clamp-2">{achievement.description}</p>
                      <p className="text-xs text-white/60 mt-2">+{achievement.xpReward} XP</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            </CardContent>
          </Card>
        )}

        {/* Performance Metrics */}
        <div className="grid sm:grid-cols-3 gap-6">
          <MetricCard
            label="Total Completed Interviews"
            value={interviewStats.completed}
            hint="Start your first interview"
          />
          <MetricCard
            label="Average Score"
            value={`${interviewStats.averageScore}%`}
            hint="Keep practicing!"
          />
          <MetricCard
            label="Practice Streak"
            value={`${interviewStats.streak} days`}
            hint="Build your streak!"
          />
        </div>

        {/* Main Actions Grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          <ActionCard
            icon={<FileText className="w-6 h-6" />}
            title="Resume Analysis"
            description={resume ? "View your resume insights and ATS score" : "Upload and analyze your resume"}
            link="/resume"
            hasData={!!resume}
          />
          <ActionCard
            icon={<Target className="w-6 h-6" />}
            title="Skill Gap Analysis"
            description="Identify missing skills for your target role"
            link="/skills"
            hasData={!!resume}
          />
          <ActionCard
            icon={<MapIcon className="w-6 h-6" />}
            title="Career Roadmap"
            description={roadmap ? "View your personalized career roadmap" : "Generate your career roadmap"}
            link="/roadmap"
            hasData={!!roadmap}
          />
          <ActionCard
            icon={<MessageSquare className="w-6 h-6" />}
            title="Mock Interview"
            description="Practice with AI-powered mock interviews"
            link="/interview"
            hasData={true}
          />
          <ActionCard
            icon={<Terminal className="w-6 h-6" />}
            title="Coding Practice"
            description="Solve coding problems from GeeksforGeeks & LeetCode"
            link="/practice"
            hasData={true}
          />
          <ActionCard
            icon={<User className="w-6 h-6" />}
            title="Profile"
            description="View your profile, achievements, and stats"
            link="/profile"
            hasData={true}
          />
        </div>
      </main>
    </div>
  );
}

function MetricCard({ label, value, hint }) {
  return (
    <Card>
      <CardContent className="pt-6">
        <p className="text-sm text-white/70 mb-2">{label}</p>
        <p className="text-3xl font-semibold text-white mb-2">{value}</p>
        <p className="text-xs text-white/50">{hint}</p>
      </CardContent>
    </Card>
  );
}

function ActionCard({ icon, title, description, link, hasData }) {
  return (
    <Link
      to={link}
      className="glass-card rounded-xl p-6 border border-white/10 group cp-card-interactive hover:border-white/15 transition-colors"
    >
      <div className="flex items-start gap-4">
        <div className="text-primary-300 transition-colors">
          {icon}
        </div>
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-white mb-2">{title}</h3>
          <p className="text-white/70 mb-4 text-sm">{description}</p>
          <div className="flex items-center text-white/70 group-hover:text-white font-medium text-sm transition-colors">
            {hasData ? 'View Details' : 'Get Started'}
            <ArrowRight className="w-4 h-4 ml-2 text-white/50 group-hover:text-white/80" />
          </div>
        </div>
      </div>
    </Link>
  );
}
