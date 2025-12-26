import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FileText, Target, Map, MessageSquare, Plus, TrendingUp, Calendar, Clock, Sparkles, Code, Trophy, History, Terminal, ArrowRight, Star, Flame, Award, User } from 'lucide-react';
import { userAPI, resumeAPI, roadmapAPI, interviewAPI } from '../services/api';

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
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading your career dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-200">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <h1 className="text-xl font-bold text-gray-900">CareerPilot Dashboard</h1>
            </div>
            <div className="text-sm text-gray-600">
              {user ? `${getGreeting()}, ${user.name || 'User'}!` : 'Welcome'}
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Top Section */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          {/* Greeting Card */}
          <div className="md:col-span-2 bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <Sparkles className="w-5 h-5 text-blue-600" />
              <h2 className="text-2xl font-bold text-gray-900">
                {getGreeting()}, {user?.name || 'anurag'}!
              </h2>
            </div>
            <p className="text-gray-600 mb-6">
              Start your interview preparation journey with our AI-powered platform.
            </p>
            
            {/* XP and Level Display */}
            {userStats && (
              <div className="mb-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Star className="w-5 h-5 text-yellow-500" />
                    <span className="font-semibold text-gray-900">Level {userStats.level}</span>
                  </div>
                  <span className="text-sm font-semibold text-gray-700">{userStats.xp.toLocaleString()} XP</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                  <div
                    className="bg-gradient-to-r from-blue-600 to-indigo-600 h-2 rounded-full transition-all duration-500"
                    style={{ width: `${userStats.progressToNextLevel}%` }}
                  ></div>
                </div>
                <p className="text-xs text-gray-600">
                  {userStats.xpNeeded} XP to Level {userStats.level + 1}
                </p>
              </div>
            )}

            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-600">Your Progress</span>
                <span className="text-sm font-semibold text-gray-900">{isNaN(progress) ? '0' : Math.round(progress)}%</span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-2.5">
                <div
                  className="bg-gradient-to-r from-blue-600 to-indigo-600 h-2.5 rounded-full transition-all duration-500"
                  style={{ width: `${isNaN(progress) ? 0 : Math.round(progress)}%` }}
                ></div>
              </div>
            </div>
          </div>

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
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Trophy className="w-5 h-5 text-yellow-500" />
                <h3 className="text-lg font-semibold text-gray-900">Recent Achievements</h3>
              </div>
              <Link
                to="/profile"
                className="text-sm text-blue-600 hover:text-blue-700 font-medium"
              >
                View All
              </Link>
            </div>
            <div className="grid sm:grid-cols-3 gap-4">
              {recentAchievements.map((achievement) => (
                <div
                  key={achievement.id}
                  className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 bg-yellow-50 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Award className="w-5 h-5 text-yellow-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-gray-900 text-sm">{achievement.name}</h4>
                      <p className="text-xs text-gray-600 mt-1 line-clamp-2">{achievement.description}</p>
                      <p className="text-xs text-gray-500 mt-2">+{achievement.xpReward} XP</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Performance Metrics */}
        <div className="grid sm:grid-cols-3 gap-6 mb-8">
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

        {/* Quick Actions */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="w-5 h-5 text-blue-600" />
            <h2 className="text-xl font-bold text-gray-900">Quick Actions</h2>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <QuickActionButton
              icon={<Plus className="w-6 h-6" />}
              title="Start Interview"
              description="Begin a new practice session"
              link="/interview"
            />
            <QuickActionButton
              icon={<Code className="w-6 h-6" />}
              title="Technical Challenges"
              description="Practice coding problems"
              link="#"
              disabled
              comingSoon
            />
            <QuickActionButton
              icon={<Trophy className="w-6 h-6" />}
              title="Leaderboard"
              description="See top performers"
              link="#"
            />
            <QuickActionButton
              icon={<History className="w-6 h-6" />}
              title="Interview History"
              description="View your past interviews"
              link="/interview"
            />
          </div>
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
    <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
      <div className="flex items-center gap-3 mb-2">
        <div className="text-blue-600">{icon}</div>
        <span className="text-sm text-gray-600">{label}</span>
      </div>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
    </div>
  );
}

function MetricCard({ label, value, hint }) {
  return (
    <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
      <p className="text-sm text-gray-600 mb-2">{label}</p>
      <p className="text-3xl font-bold text-gray-900 mb-2">{value}</p>
      <p className="text-xs text-gray-500">{hint}</p>
    </div>
  );
}

function QuickActionButton({ icon, title, description, link, disabled = false, comingSoon = false }) {
  const content = (
    <div className={`bg-white rounded-xl p-5 border border-gray-200 shadow-sm transition-all relative ${
      disabled ? 'opacity-60 cursor-not-allowed' : 'hover:shadow-md cursor-pointer hover:border-gray-300'
    } min-h-[120px] flex flex-col justify-between`}>
      {comingSoon && (
        <div className="absolute top-2 right-2 bg-yellow-100 text-yellow-800 text-xs font-semibold px-2 py-1 rounded">
          Coming Soon
        </div>
      )}
      <div className="text-blue-600 mb-3">{icon}</div>
      <div className="w-full">
        {title && <h3 className="text-base font-semibold text-gray-900 mb-1">{title}</h3>}
        {description && <p className="text-xs text-gray-600 leading-relaxed">{description}</p>}
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
      className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm group hover:shadow-md transition-all"
    >
      <div className="flex items-start gap-4">
        <div className="text-blue-600 group-hover:text-blue-700 transition-colors">
          {icon}
        </div>
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
          <p className="text-gray-600 mb-4 text-sm">{description}</p>
          <div className="flex items-center text-blue-600 group-hover:text-blue-700 font-medium text-sm">
            {hasData ? 'View Details' : 'Get Started'}
            <ArrowRight className="w-4 h-4 ml-2" />
          </div>
        </div>
      </div>
    </Link>
  );
}
