import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, Sparkles, Target, FileText, MessageSquare, Brain, Zap, BarChart3, Clock, Shield, TrendingUp, CheckCircle2, Code, MessageCircle, Award, Star, Plus, Calendar, Flame, Trophy, History, Terminal, User, Filter, ChevronLeft, ChevronRight, Map } from 'lucide-react';
import { userAPI, resumeAPI, roadmapAPI, interviewAPI } from '../services/api';

export default function LandingPage() {
  const navigate = useNavigate();
  const [userId] = useState(1); // Demo user
  const [user, setUser] = useState(null);
  const [resume, setResume] = useState(null);
  const [roadmap, setRoadmap] = useState(null);
  const [interviewStats, setInterviewStats] = useState({ completed: 0, averageScore: 0, streak: 0 });
  const [userStats, setUserStats] = useState(null);
  const [recentAchievements, setRecentAchievements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [availableInterviews, setAvailableInterviews] = useState([]);
  const [availableInterviewsTotal, setAvailableInterviewsTotal] = useState(0);
  const [interviewFilters, setInterviewFilters] = useState({
    type: '',
    techStack: '',
    level: ''
  });
  const [currentPage, setCurrentPage] = useState(1);
  const interviewsPerPage = 6;

  useEffect(() => {
    loadDashboard();
    loadAvailableInterviews();
  }, [interviewFilters, currentPage]);

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

  const loadAvailableInterviews = () => {
    // Mock available interviews data
    const mockInterviews = [
      { id: 1, type: 'Technical', role: 'Frontend Developer', level: 'junior', techStack: 'React', date: 'Nov 19, 2025' },
      { id: 2, type: 'Technical', role: 'Frontend Developer', level: 'junior', techStack: 'React', date: 'Nov 19, 2025' },
      { id: 3, type: 'Technical', role: 'Frontend Developer', level: 'junior', techStack: 'React', date: 'Nov 19, 2025' },
      { id: 4, type: 'Technical', role: 'Python Developer', level: 'junior', techStack: 'python', date: 'Oct 19, 2025' },
      { id: 5, type: 'Technical', role: 'Devops Engineer', level: 'junior', techStack: 'docker, kubernetes', date: 'Oct 18, 2025' },
      { id: 6, type: 'Technical', role: 'DevOps Engineer', level: 'junior', techStack: 'Jenkins, Docker, Kubernetes', date: 'Oct 18, 2025' },
      { id: 7, type: 'Technical', role: 'Backend Developer', level: 'mid', techStack: 'Node.js', date: 'Oct 17, 2025' },
      { id: 8, type: 'Technical', role: 'Full Stack Developer', level: 'senior', techStack: 'React, Node.js', date: 'Oct 16, 2025' },
      { id: 9, type: 'Behavioral', role: 'Software Engineer', level: 'mid', techStack: 'General', date: 'Oct 15, 2025' },
      { id: 10, type: 'System Design', role: 'Senior Engineer', level: 'senior', techStack: 'System Design', date: 'Oct 14, 2025' },
      { id: 11, type: 'Technical', role: 'Data Engineer', level: 'mid', techStack: 'Python, SQL', date: 'Oct 13, 2025' },
      { id: 12, type: 'Technical', role: 'ML Engineer', level: 'senior', techStack: 'Python, TensorFlow', date: 'Oct 12, 2025' },
    ];

    let filtered = mockInterviews;

    if (interviewFilters.type) {
      filtered = filtered.filter(i => i.type.toLowerCase() === interviewFilters.type.toLowerCase());
    }
    if (interviewFilters.techStack) {
      filtered = filtered.filter(i => 
        i.techStack.toLowerCase().includes(interviewFilters.techStack.toLowerCase())
      );
    }
    if (interviewFilters.level) {
      filtered = filtered.filter(i => i.level.toLowerCase() === interviewFilters.level.toLowerCase());
    }

    setAvailableInterviewsTotal(filtered.length);
    const startIndex = (currentPage - 1) * interviewsPerPage;
    const endIndex = startIndex + interviewsPerPage;
    setAvailableInterviews(filtered.slice(startIndex, endIndex));
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  const progress = roadmap?.progress_percentage || 0;
  const totalPages = Math.max(1, Math.ceil(availableInterviewsTotal / interviewsPerPage));

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] relative">
      {/* Grid Pattern Overlay */}
      <div className="fixed inset-0 bg-grid-pattern opacity-30 pointer-events-none z-0"></div>
      
      {/* Header */}
      <header className="sticky top-0 z-50 glass-card border-b border-white/10">
        <nav className="container mx-auto px-4 sm:px-6 lg:px-8 py-4 relative z-10">
          <div className="flex items-center justify-between">
            <Link to="/" className="flex items-center space-x-3 group">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 via-indigo-500 to-purple-500 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/30 group-hover:scale-110 transition-transform duration-300">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <span className="text-2xl font-bold text-white">
                CareerPilot
              </span>
            </Link>
            <div className="flex items-center gap-2">
              <Link
                to="/profile"
                className="px-5 py-2.5 text-gray-300 hover:text-white font-medium text-sm glass-card rounded-xl transition-all duration-300 hover:scale-105"
              >
                Profile
              </Link>
              <Link
                to="/leaderboard"
                className="px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold text-sm rounded-xl hover:shadow-lg hover:shadow-blue-500/30 transition-all duration-300 hover:scale-105"
              >
                Leaderboard
              </Link>
            </div>
          </div>
        </nav>
      </header>

      <main className="relative z-10">
        {/* Hero Section - Dark Theme */}
        <section className="relative overflow-hidden">
          <div className="relative container mx-auto px-4 sm:px-6 lg:px-8 py-16">
            <div className="max-w-4xl mx-auto text-center animate-fade-in">
              <div className="inline-flex items-center gap-2 px-4 py-2 glass-card rounded-full border border-white/10 shadow-sm mb-6">
                <Zap className="w-4 h-4 text-blue-400" />
                <span className="text-sm font-semibold text-gray-300">AI-Powered Interview Practice</span>
              </div>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-white mb-6 leading-tight">
                {getGreeting()}, <span className="text-blue-400">{user?.name || 'anurag'}</span>!
              </h1>
              <p className="text-xl text-gray-400 mb-8 max-w-2xl mx-auto leading-relaxed">
                Start your interview preparation journey with our AI-powered platform.
              </p>
            </div>
          </div>
        </section>

        {/* Dashboard Content */}
        <section className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 relative z-10">
          {/* Top Section */}
          <div className="grid md:grid-cols-3 gap-6 mb-8">
            {/* Greeting Card */}
            <div className="md:col-span-2 glass-card rounded-2xl p-8 modern-card">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl shadow-lg shadow-blue-500/30">
                  <Sparkles className="w-5 h-5 text-white" />
                </div>
                <h2 className="text-2xl font-bold text-white">
                  Your Progress
                </h2>
              </div>
              
              {/* XP and Level Display */}
              {userStats && (
                <div className="mb-6 p-5 glass-card rounded-2xl border border-white/10">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-yellow-500/20 rounded-lg border border-yellow-500/30">
                        <Star className="w-5 h-5 text-yellow-400 fill-yellow-400" />
                      </div>
                      <span className="font-bold text-white text-lg">Level {userStats.level}</span>
                    </div>
                    <span className="text-base font-bold text-blue-400">{userStats.xp.toLocaleString()} XP</span>
                  </div>
                  <div className="w-full bg-gray-800/50 rounded-full h-3 mb-2 overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 h-3 rounded-full transition-all duration-700 shadow-lg shadow-blue-500/30"
                      style={{ width: `${userStats.progressToNextLevel}%` }}
                    ></div>
                  </div>
                  <p className="text-sm text-gray-400 font-medium">
                    {userStats.xpNeeded} XP to Level {userStats.level + 1}
                  </p>
                </div>
              )}

              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-semibold text-gray-300">Your Progress</span>
                  <span className="text-lg font-bold text-blue-400">{isNaN(progress) ? '0' : Math.round(progress)}%</span>
                </div>
                <div className="w-full bg-gray-800/50 rounded-full h-3 overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 h-3 rounded-full transition-all duration-700 shadow-md shadow-blue-500/20"
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
                value={availableInterviewsTotal}
              />
            </div>
          </div>

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
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl shadow-lg shadow-blue-500/30">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-white">Quick Actions</h2>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-5">
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
                link="/practice"
              />
              <QuickActionButton
                icon={<Trophy className="w-6 h-6" />}
                title="Leaderboard"
                description="See top performers"
                link="/leaderboard"
              />
              <QuickActionButton
                icon={<History className="w-6 h-6" />}
                title="Interview History"
                description="View your past interviews"
                link="/interview"
              />
            </div>
          </div>

          {/* Available Interviews Section */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold text-white mb-2">Find Interviews</h2>
                <p className="text-base text-gray-400">Select Type, Tech Stack, and Level to filter available interviews</p>
              </div>
            </div>

            {/* Filters */}
            <div className="glass-card rounded-2xl p-6 mb-6">
              <div className="grid sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Select Type</label>
                  <select
                    value={interviewFilters.type}
                    onChange={(e) => {
                      setInterviewFilters({ ...interviewFilters, type: e.target.value });
                      setCurrentPage(1);
                    }}
                    className="w-full px-4 py-3 glass-card border border-white/10 rounded-xl text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-300 hover:border-white/20 placeholder:text-gray-500"
                  >
                    <option value="">All Types</option>
                    <option value="Technical">Technical</option>
                    <option value="Behavioral">Behavioral</option>
                    <option value="System Design">System Design</option>
                    <option value="Coding">Coding</option>
                    <option value="Leadership">Leadership</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Select Tech Stack</label>
                  <select
                    value={interviewFilters.techStack}
                    onChange={(e) => {
                      setInterviewFilters({ ...interviewFilters, techStack: e.target.value });
                      setCurrentPage(1);
                    }}
                    className="w-full px-4 py-3 glass-card border border-white/10 rounded-xl text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-300 hover:border-white/20 placeholder:text-gray-500"
                  >
                    <option value="">All Tech Stacks</option>
                    <option value="React">React</option>
                    <option value="Node.js">Node.js</option>
                    <option value="Python">Python</option>
                    <option value="Java">Java</option>
                    <option value="Docker">Docker</option>
                    <option value="Kubernetes">Kubernetes</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Select Level</label>
                  <select
                    value={interviewFilters.level}
                    onChange={(e) => {
                      setInterviewFilters({ ...interviewFilters, level: e.target.value });
                      setCurrentPage(1);
                    }}
                    className="w-full px-4 py-3 glass-card border border-white/10 rounded-xl text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-300 hover:border-white/20 placeholder:text-gray-500"
                  >
                    <option value="">All Levels</option>
                    <option value="junior">Junior</option>
                    <option value="mid">Mid-Level</option>
                    <option value="senior">Senior</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Profile Completion Notice */}
            {!resume && (
              <div className="glass-card border border-blue-500/30 rounded-2xl p-6 mb-6">
                <p className="text-base font-semibold text-blue-400 mb-3">
                  Please complete your profile to get personalized interview suggestions
                </p>
                <Link
                  to="/resume"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl text-sm font-semibold hover:shadow-lg hover:shadow-blue-500/30 transition-all duration-300 hover:scale-105"
                >
                  Complete Profile
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            )}

            {/* Interview Cards */}
            <div>
              <h3 className="text-lg font-semibold text-white mb-4">Your Interviews</h3>
              {interviewStats.completed === 0 ? (
                <div className="glass-card rounded-2xl p-12 text-center">
                  <div className="w-20 h-20 glass-card border border-blue-500/30 rounded-2xl flex items-center justify-center mx-auto mb-6">
                    <MessageSquare className="w-10 h-10 text-blue-400" />
                  </div>
                  <h4 className="text-xl font-bold text-white mb-3">Track your progress and improvement</h4>
                  <p className="text-gray-400 mb-8 max-w-md mx-auto leading-relaxed">
                    You haven't taken any interviews yet. Start your interview preparation journey by taking your first practice interview. Our AI-powered platform will help you improve your skills.
                  </p>
                  <Link
                    to="/interview"
                    className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-bold hover:shadow-xl hover:shadow-blue-500/30 transition-all duration-300 hover:scale-105"
                  >
                    Start Your First Interview
                    <ArrowRight className="w-5 h-5" />
                  </Link>
                </div>
              ) : (
                <div className="text-sm text-gray-400 mb-4">
                  Track your progress and improvement
                </div>
              )}

              {/* Available Interviews Grid */}
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                {availableInterviews.map((interview) => (
                  <InterviewCard
                    key={interview.id}
                    interview={interview}
                    onStart={() => navigate('/interview')}
                  />
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2">
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                    className="px-5 py-2.5 glass-card border border-white/10 rounded-xl text-gray-300 hover:text-white hover:border-white/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 font-semibold transition-all duration-300 hover:scale-105"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    Previous
                  </button>
                  <div className="flex gap-2">
                    {Array.from({ length: Math.min(totalPages, 10) }, (_, i) => i + 1).map((page) => (
                      <button
                        key={page}
                        onClick={() => setCurrentPage(page)}
                        className={`px-4 py-2 rounded-xl text-sm font-bold transition-all duration-300 ${
                          currentPage === page
                            ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/30 scale-110'
                            : 'glass-card text-gray-300 hover:text-white hover:border-white/20 border border-white/10 hover:scale-105'
                        }`}
                      >
                        {page}
                      </button>
                    ))}
                  </div>
                  <button
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    disabled={currentPage >= totalPages}
                    className="px-5 py-2.5 glass-card border border-white/10 rounded-xl text-gray-300 hover:text-white hover:border-white/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 font-semibold transition-all duration-300 hover:scale-105"
                  >
                    Next
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Main Actions Grid */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
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
        </section>

        {/* Why Choose CareerPilot */}
        <section className="relative py-20 md:py-28 overflow-hidden">
          <div className="relative container mx-auto px-4 sm:px-6 lg:px-8 z-10">
            <div className="max-w-3xl mx-auto text-center mb-16">
              <h2 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-white mb-6">
                Why Choose <span className="text-blue-400">CareerPilot</span>
              </h2>
              <p className="text-xl text-gray-400 leading-relaxed">
                Our AI-powered platform helps you prepare for interviews with personalized feedback and real-world scenarios.
              </p>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
              <FeatureCard
                icon={<MessageCircle className="w-6 h-6" />}
                title="Realistic Conversations"
                description="Practice with AI that simulates real interviewers and adapts to your responses."
              />
              <FeatureCard
                icon={<Code className="w-6 h-6" />}
                title="Technical Challenges"
                description="Tackle coding problems and system design questions with instant feedback."
              />
              <FeatureCard
                icon={<BarChart3 className="w-6 h-6" />}
                title="Detailed Feedback"
                description="Get comprehensive feedback on your answers, communication, and technical skills."
              />
              <FeatureCard
                icon={<TrendingUp className="w-6 h-6" />}
                title="Track Progress"
                description="Monitor your improvement over time with detailed analytics and performance metrics."
              />
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-white/10 glass-card py-8 relative z-10">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center text-gray-400 text-sm">
            <p>
              Built with <span className="text-red-500">❤️</span> by{' '}
              <a href="https://github.com/anuragthippani1" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300 font-medium transition-colors">
                Anurag Thippani
              </a>
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

function StatCard({ icon, label, value }) {
  return (
    <div className="glass-card rounded-2xl p-5 modern-card">
      <div className="flex items-center gap-3 mb-3">
        <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg shadow-md shadow-blue-500/30 text-white">{icon}</div>
        <span className="text-sm font-semibold text-gray-300">{label}</span>
      </div>
      <p className="text-3xl font-extrabold text-white">{value}</p>
    </div>
  );
}

function MetricCard({ label, value, hint }) {
  return (
    <div className="glass-card rounded-2xl p-6 modern-card">
      <p className="text-sm font-semibold text-gray-400 mb-3">{label}</p>
      <p className="text-4xl font-extrabold text-white mb-3">{value}</p>
      <p className="text-xs font-medium text-gray-500">{hint}</p>
    </div>
  );
}

function QuickActionButton({ icon, title, description, link, disabled = false, comingSoon = false }) {
  const content = (
    <div className={`glass-card rounded-2xl p-6 transition-all relative modern-card ${
      disabled ? 'opacity-60 cursor-not-allowed' : 'hover:shadow-lg cursor-pointer hover:border-white/20'
    } min-h-[140px] flex flex-col justify-between group`}>
      {comingSoon && (
        <div className="absolute top-3 right-3 bg-gradient-to-r from-yellow-400 to-orange-400 text-white text-xs font-bold px-3 py-1 rounded-full shadow-md">
          Coming Soon
        </div>
      )}
      <div className="p-3 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl shadow-lg shadow-blue-500/30 w-fit mb-4 group-hover:scale-110 transition-transform duration-300 text-white">{icon}</div>
      <div className="w-full">
        {title && <h3 className="text-lg font-bold text-white mb-2 group-hover:text-blue-400 transition-colors">{title}</h3>}
        {description && <p className="text-sm text-gray-400 leading-relaxed">{description}</p>}
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
      className="glass-card rounded-2xl p-6 group hover:shadow-lg modern-card"
    >
      <div className="flex items-start gap-4">
        <div className="p-3 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl shadow-lg shadow-blue-500/30 group-hover:scale-110 transition-transform duration-300">
          <div className="text-white">{icon}</div>
        </div>
        <div className="flex-1">
          <h3 className="text-lg font-bold text-white mb-2 group-hover:text-blue-400 transition-colors">{title}</h3>
          <p className="text-gray-400 mb-4 text-sm leading-relaxed">{description}</p>
          <div className="flex items-center text-blue-400 group-hover:text-blue-300 font-semibold text-sm">
            {hasData ? 'View Details' : 'Get Started'}
            <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
          </div>
        </div>
      </div>
    </Link>
  );
}

function FeatureCard({ icon, title, description }) {
  return (
    <div className="glass-card rounded-2xl p-6 modern-card group">
      <div className="inline-flex p-3 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl text-white mb-5 shadow-lg shadow-blue-500/30 group-hover:scale-110 transition-transform duration-300">
        {icon}
      </div>
      <h3 className="text-lg font-bold text-white mb-3 group-hover:text-blue-400 transition-colors">{title}</h3>
      <p className="text-gray-400 leading-relaxed text-sm">{description}</p>
    </div>
  );
}

function InterviewCard({ interview, onStart }) {
  return (
    <div className="glass-card rounded-2xl p-6 modern-card group">
      <div className="flex items-start justify-between mb-4">
        <div>
          <span className="inline-flex items-center gap-1 px-3 py-1.5 bg-green-500/20 border border-green-500/30 text-green-400 rounded-full text-xs font-bold mb-3 shadow-sm">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            Available
          </span>
          <h3 className="text-lg font-bold text-white mb-1">{interview.type}</h3>
          <p className="text-base font-semibold text-gray-300">{interview.role}</p>
        </div>
      </div>
      <div className="space-y-2.5 mb-5">
        <div className="flex items-center gap-2 text-sm">
          <span className="font-semibold text-gray-400">Level:</span>
          <span className="px-3 py-1 glass-card border border-white/10 rounded-lg text-xs font-bold text-blue-400">{interview.level}</span>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-400">
          <span className="font-semibold">Date:</span>
          <span>{interview.date}</span>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-400">
          <span className="font-semibold">Tech:</span>
          <span className="text-xs font-medium">{interview.techStack}</span>
        </div>
      </div>
      <p className="text-xs text-gray-500 mb-5 leading-relaxed">
        You haven't taken the interview yet. Take it now to improve your skills.
      </p>
      <button
        onClick={onStart}
        className="w-full px-5 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-bold hover:shadow-xl hover:shadow-blue-500/30 transition-all duration-300 hover:scale-105 text-sm"
      >
        Start Interview
      </button>
    </div>
  );
}
