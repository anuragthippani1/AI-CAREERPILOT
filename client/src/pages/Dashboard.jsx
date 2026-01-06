import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FileText, Target, Map, MessageSquare, Calendar, Clock, Terminal, ArrowRight, Star, Flame, Award, Trophy, User } from 'lucide-react';
import { userAPI, resumeAPI, roadmapAPI, interviewAPI } from '../services/api';
import PageHeader from '../components/ui/PageHeader';
import Button from '../components/ui/Button';
import { Card, CardContent } from '../components/ui/Card';
import { PageSkeleton } from '../components/ui/Skeleton';
import MotionDebug from '../components/MotionDebug';

export default function Dashboard() {
  const [userId] = useState(1); // Demo user
  const [user, setUser] = useState(null);
  const [resume, setResume] = useState(null);
  const [roadmap, setRoadmap] = useState(null);
  const [interviewStats, setInterviewStats] = useState({ completed: 0, averageScore: 0, streak: 0 });
  const [userStats, setUserStats] = useState(null);
  const [recentAchievements, setRecentAchievements] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboard();
  }, []);

  useEffect(() => {
    document.body.dataset.cpBg = 'dashboard';
    return () => {
      delete document.body.dataset.cpBg;
    };
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
      if (statsRes.status === 'fulfilled') setUserStats(statsRes.value.data.data);
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
        setInterviewStats({
          completed: completed.length,
          averageScore: Math.round(avgScore),
          streak: statsRes.status === 'fulfilled' ? (statsRes.value.data.data?.currentStreak || 0) : 0,
        });
      }
    } catch (error) {
      console.error('Error loading dashboard:', error);
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
        {/* Top Section */}
        <div className="grid md:grid-cols-3 gap-6 cp-fade-in">
          {/* Greeting Card */}
          <Card className="md:col-span-2">
            <CardContent className="pt-6">
            <h2 className="text-xl font-semibold text-white">
              {user ? `${getGreeting()}, ${user.name || 'User'}` : 'Welcome back'}
            </h2>
            <p className="text-sm text-white/70 mt-1">
              Keep momentum: a small session today compounds over time.
            </p>
            
            {/* XP and Level Display */}
            {userStats && (
              <div className="mt-5 p-4 rounded-xl border border-white/10 bg-white/5">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Star className="w-4 h-4 text-yellow-300" />
                    <span className="font-semibold text-white">Level {userStats.level}</span>
                  </div>
                  <span className="text-sm font-semibold text-white/70">{userStats.xp.toLocaleString()} XP</span>
                </div>
                <div className="w-full bg-white/5 rounded-full h-2.5 mb-2 border border-white/10 overflow-hidden">
                  <div
                    className="bg-primary-500/80 h-2.5 rounded-full transition-all duration-200"
                    style={{ width: `${userStats.progressToNextLevel}%` }}
                  ></div>
                </div>
                <p className="text-xs text-white/60">
                  {userStats.xpNeeded} XP to Level {userStats.level + 1}
                </p>
              </div>
            )}

            <div className="mt-5">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-white/70">Roadmap progress</span>
                <span className="text-sm font-semibold text-white">{isNaN(progress) ? '0' : Math.round(progress)}%</span>
              </div>
              <div className="w-full bg-white/5 rounded-full h-2.5 border border-white/10 overflow-hidden">
                <div
                  className="bg-primary-500/80 h-2.5 rounded-full transition-all duration-200"
                  style={{ width: `${isNaN(progress) ? 0 : Math.round(progress)}%` }}
                ></div>
              </div>
            </div>
            </CardContent>
          </Card>

          {/* Stats Cards */}
          <div className="space-y-4">
            {userStats && (
              <StatCard
                icon={<Flame className="w-5 h-5" />}
                label="Current Streak"
                value={`${userStats.currentStreak} days`}
              />
            )}
            <StatCard
              icon={<Calendar className="w-5 h-5" />}
              label="Your Interviews"
              value={interviewStats.completed}
            />
            <StatCard
              icon={<Clock className="w-5 h-5" />}
              label="Available Interviews"
              value="139"
            />
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
            icon={<Map className="w-6 h-6" />}
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

function StatCard({ icon, label, value }) {
  return (
    <Card depth className="p-4">
      <div className="flex items-center gap-3 mb-2">
        <div className="text-primary-300">{icon}</div>
        <span className="text-sm text-white/70">{label}</span>
      </div>
      <p className="text-2xl font-semibold text-white">{value}</p>
    </Card>
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
