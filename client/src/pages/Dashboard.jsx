import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FileText, Target, Map, MessageSquare, Plus, TrendingUp, Calendar, Clock, Sparkles, Code, Trophy, History, Terminal } from 'lucide-react';
import { userAPI, resumeAPI, roadmapAPI, interviewAPI } from '../services/api';

export default function Dashboard() {
  const [userId] = useState(1); // Demo user
  const [user, setUser] = useState(null);
  const [resume, setResume] = useState(null);
  const [roadmap, setRoadmap] = useState(null);
  const [interviewStats, setInterviewStats] = useState({ completed: 0, averageScore: 0, streak: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      setLoading(true);
      const [userRes, resumeRes, roadmapRes, interviewRes] = await Promise.allSettled([
        userAPI.get(userId),
        resumeAPI.get(userId),
        roadmapAPI.get(userId),
        interviewAPI.getSessions(userId),
      ]);

      if (userRes.status === 'fulfilled') setUser(userRes.value.data.data);
      if (resumeRes.status === 'fulfilled') setResume(resumeRes.value.data.data);
      if (roadmapRes.status === 'fulfilled') setRoadmap(roadmapRes.value.data.data);
      
      if (interviewRes.status === 'fulfilled' && interviewRes.value.data.success) {
        const sessions = interviewRes.value.data.data || [];
        const completed = sessions.filter(s => s.status === 'completed');
        const avgScore = completed.length > 0
          ? completed.reduce((sum, s) => sum + (s.overall_score || 0), 0) / completed.length
          : 0;
        setInterviewStats({
          completed: completed.length,
          averageScore: Math.round(avgScore),
          streak: 0, // TODO: Calculate streak
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
    return 'Good night';
  };

  const progress = roadmap?.progress_percentage || 0;

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0a0a0a] via-purple-900/30 to-[#0a0a0a] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-400 mx-auto"></div>
          <p className="mt-4 text-gray-300">Loading your career dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a0a0a] via-purple-900/30 to-[#0a0a0a] relative overflow-hidden">
      {/* Background Grid Pattern */}
      <div className="absolute inset-0 bg-grid-pattern opacity-10"></div>
      
      {/* Header */}
      <header className="relative z-10 border-b border-white/10 bg-white/5 backdrop-blur-md">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-white">CareerPilot Dashboard</h1>
            <div className="text-sm text-gray-300">
              {user ? `${getGreeting()}, ${user.name || 'User'}!` : 'Welcome'}
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-6 py-8 relative z-10">
        {/* Top Section */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          {/* Greeting Card */}
          <div className="md:col-span-2 glass-card p-6 rounded-2xl">
            <div className="flex items-center gap-3 mb-4">
              <Sparkles className="w-6 h-6 text-purple-400" />
              <h2 className="text-2xl font-bold text-white">
                {getGreeting()}, {user?.name || 'anurag'}!
              </h2>
            </div>
            <p className="text-gray-300 mb-6">
              Start your interview preparation journey with our AI-powered platform.
            </p>
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-400">Your Progress</span>
                <span className="text-sm font-semibold text-white">{isNaN(progress) ? '0' : Math.round(progress)}%</span>
              </div>
              <div className="w-full bg-gray-700/50 rounded-full h-2.5">
                <div
                  className="bg-gradient-to-r from-purple-500 to-indigo-500 h-2.5 rounded-full transition-all duration-500"
                  style={{ width: `${isNaN(progress) ? 0 : Math.round(progress)}%` }}
                ></div>
              </div>
            </div>
          </div>

          {/* Interview Stats Cards */}
          <div className="space-y-4">
            <GlassStatCard
              icon={<Calendar className="w-5 h-5" />}
              label="Your Interviews"
              value={interviewStats.completed}
            />
            <GlassStatCard
              icon={<Clock className="w-5 h-5" />}
              label="Available Interviews"
              value="139"
            />
          </div>
        </div>

        {/* Performance Metrics */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <GlassMetricCard
            label="Total Completed Interviews"
            value={interviewStats.completed}
            hint="Start your first interview"
          />
          <GlassMetricCard
            label="Average Score"
            value={`${interviewStats.averageScore}%`}
            hint="Keep practicing!"
          />
          <GlassMetricCard
            label="Practice Streak"
            value={`${interviewStats.streak} days`}
            hint="Build your streak!"
          />
        </div>

        {/* Quick Actions */}
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="w-5 h-5 text-purple-400" />
            <h2 className="text-xl font-bold text-white">Quick Actions</h2>
          </div>
          <div className="grid grid-cols-4 gap-4">
            <QuickActionButton
              icon={<Plus className="w-8 h-8" />}
              title="Start Interview"
              description="Begin a new practice session"
              link="/interview"
              color="from-gray-700/80 to-gray-800/80"
            />
            <QuickActionButton
              icon={<Code className="w-8 h-8" />}
              title="Technical Challenges"
              description="Practice coding problems"
              link="#"
              color="from-gray-700/80 to-gray-800/80"
              disabled
              comingSoon
            />
            <QuickActionButton
              icon={<Trophy className="w-8 h-8" />}
              title="Leaderboard"
              description="See top performers"
              link="#"
              color="from-amber-700/80 to-orange-800/80"
            />
            <QuickActionButton
              icon={<History className="w-8 h-8" />}
              title="Interview History"
              description="View your past interviews"
              link="/interview"
              color="from-purple-700/80 to-purple-800/80"
            />
          </div>
        </div>

        {/* Main Actions Grid */}
        <div className="grid md:grid-cols-2 gap-6">
          <ActionCard
            icon={<FileText className="w-8 h-8" />}
            title="Resume Analysis"
            description={resume ? "View your resume insights and ATS score" : "Upload and analyze your resume"}
            link="/resume"
            hasData={!!resume}
          />
          <ActionCard
            icon={<Target className="w-8 h-8" />}
            title="Skill Gap Analysis"
            description="Identify missing skills for your target role"
            link="/skills"
            hasData={!!resume}
          />
          <ActionCard
            icon={<Map className="w-8 h-8" />}
            title="Career Roadmap"
            description={roadmap ? "View your personalized career roadmap" : "Generate your career roadmap"}
            link="/roadmap"
            hasData={!!roadmap}
          />
          <ActionCard
            icon={<MessageSquare className="w-8 h-8" />}
            title="Mock Interview"
            description="Practice with AI-powered mock interviews"
            link="/interview"
            hasData={true}
          />
          <ActionCard
            icon={<Terminal className="w-8 h-8" />}
            title="Coding Practice"
            description="Solve coding problems from GeeksforGeeks & LeetCode"
            link="/practice"
            hasData={true}
          />
        </div>
      </main>
    </div>
  );
}

function GlassStatCard({ icon, label, value }) {
  return (
    <div className="glass-card p-4 rounded-xl">
      <div className="flex items-center gap-3 mb-2">
        <div className="text-purple-400">{icon}</div>
        <span className="text-sm text-gray-400">{label}</span>
      </div>
      <p className="text-2xl font-bold text-white">{value}</p>
    </div>
  );
}

function GlassMetricCard({ label, value, hint }) {
  return (
    <div className="glass-card p-6 rounded-xl">
      <p className="text-sm text-gray-400 mb-2">{label}</p>
      <p className="text-3xl font-bold text-white mb-2">{value}</p>
      <p className="text-xs text-gray-500">{hint}</p>
    </div>
  );
}

function QuickActionButton({ icon, title, description, link, color, disabled = false, comingSoon = false }) {
  const content = (
    <div className={`glass-card p-6 rounded-xl flex flex-col items-start justify-between transition-all relative ${
      disabled ? 'opacity-60 cursor-not-allowed' : 'hover:scale-[1.02] cursor-pointer'
    } bg-gradient-to-br ${color} min-h-[140px]`}>
      {comingSoon && (
        <div className="absolute top-2 right-2 bg-yellow-500/80 text-yellow-900 text-xs font-semibold px-2 py-1 rounded">
          Coming Soon
        </div>
      )}
      <div className="text-white mb-4">{icon}</div>
      <div className="w-full">
        {title && <h3 className="text-lg font-bold text-white mb-1">{title}</h3>}
        {description && <p className="text-xs text-white/70 leading-relaxed">{description}</p>}
      </div>
    </div>
  );

  if (disabled || link === '#') {
    return content;
  }

  return <Link to={link}>{content}</Link>;
}

function ActionCard({ icon, title, description, link, hasData }) {
  return (
    <Link
      to={link}
      className="glass-card p-6 rounded-xl group hover:scale-[1.02] transition-all"
    >
      <div className="flex items-start gap-4">
        <div className="text-purple-400 group-hover:text-purple-300 transition-colors">
          {icon}
        </div>
        <div className="flex-1">
          <h3 className="text-xl font-semibold text-white mb-2">{title}</h3>
          <p className="text-gray-400 mb-4">{description}</p>
          <div className="flex items-center text-purple-400 group-hover:text-purple-300 font-medium">
            {hasData ? 'View Details' : 'Get Started'}
            <Plus className="w-4 h-4 ml-2" />
          </div>
        </div>
      </div>
    </Link>
  );
}
