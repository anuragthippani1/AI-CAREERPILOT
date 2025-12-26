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
  const totalPages = Math.ceil(12 / interviewsPerPage); // Mock total

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-200">
        <nav className="container mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <Link to="/" className="flex items-center space-x-2 group">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold text-gray-900">
                CareerPilot
              </span>
            </Link>
            <div className="flex items-center gap-3">
              <Link
                to="/profile"
                className="px-4 py-2 text-gray-700 hover:text-gray-900 font-medium text-sm hover:bg-gray-100 rounded-lg transition-colors"
              >
                Profile
              </Link>
              <Link
                to="/leaderboard"
                className="px-4 py-2 text-gray-700 hover:text-gray-900 font-medium text-sm hover:bg-gray-100 rounded-lg transition-colors"
              >
                Leaderboard
              </Link>
            </div>
          </div>
        </nav>
      </header>

      <main>
        {/* Hero Section - Compact */}
        <section className="bg-gradient-to-br from-blue-50 to-indigo-50 border-b border-gray-200">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <div className="max-w-4xl mx-auto text-center">
              <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
                {getGreeting()}, {user?.name || 'anurag'}!
              </h1>
              <p className="text-lg text-gray-600 mb-6">
                Start your interview preparation journey with our AI-powered platform.
              </p>
            </div>
          </div>
        </section>

        {/* Dashboard Content */}
        <section className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Top Section */}
          <div className="grid md:grid-cols-3 gap-6 mb-8">
            {/* Greeting Card */}
            <div className="md:col-span-2 bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
              <div className="flex items-center gap-3 mb-4">
                <Sparkles className="w-5 h-5 text-blue-600" />
                <h2 className="text-xl font-bold text-gray-900">
                  Your Progress
                </h2>
              </div>
              
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
                <h2 className="text-xl font-bold text-gray-900 mb-2">Find Interviews</h2>
                <p className="text-sm text-gray-600">Select Type, Tech Stack, and Level to filter available interviews</p>
              </div>
            </div>

            {/* Filters */}
            <div className="bg-white rounded-xl border border-gray-200 p-4 mb-6 shadow-sm">
              <div className="grid sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Select Type</label>
                  <select
                    value={interviewFilters.type}
                    onChange={(e) => {
                      setInterviewFilters({ ...interviewFilters, type: e.target.value });
                      setCurrentPage(1);
                    }}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                  <label className="block text-sm font-medium text-gray-700 mb-2">Select Tech Stack</label>
                  <select
                    value={interviewFilters.techStack}
                    onChange={(e) => {
                      setInterviewFilters({ ...interviewFilters, techStack: e.target.value });
                      setCurrentPage(1);
                    }}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                  <label className="block text-sm font-medium text-gray-700 mb-2">Select Level</label>
                  <select
                    value={interviewFilters.level}
                    onChange={(e) => {
                      setInterviewFilters({ ...interviewFilters, level: e.target.value });
                      setCurrentPage(1);
                    }}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
                <p className="text-sm text-blue-800">
                  Please complete your profile to get personalized interview suggestions
                </p>
                <Link
                  to="/resume"
                  className="inline-block mt-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 transition-colors"
                >
                  Complete Profile
                </Link>
              </div>
            )}

            {/* Interview Cards */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Your Interviews</h3>
              {interviewStats.completed === 0 ? (
                <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
                  <MessageSquare className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h4 className="text-lg font-semibold text-gray-900 mb-2">Track your progress and improvement</h4>
                  <p className="text-gray-600 mb-6">
                    You haven't taken any interviews yet. Start your interview preparation journey by taking your first practice interview. Our AI-powered platform will help you improve your skills.
                  </p>
                  <Link
                    to="/interview"
                    className="inline-flex items-center gap-2 px-6 py-3 bg-gray-900 text-white rounded-lg font-semibold hover:bg-gray-800 transition-colors"
                  >
                    Start Your First Interview
                  </Link>
                </div>
              ) : (
                <div className="text-sm text-gray-600 mb-4">
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
                    className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    Previous
                  </button>
                  <div className="flex gap-1">
                    {Array.from({ length: Math.min(totalPages, 10) }, (_, i) => i + 1).map((page) => (
                      <button
                        key={page}
                        onClick={() => setCurrentPage(page)}
                        className={`px-3 py-2 rounded-lg text-sm font-medium ${
                          currentPage === page
                            ? 'bg-gray-900 text-white'
                            : 'text-gray-700 hover:bg-gray-100'
                        }`}
                      >
                        {page}
                      </button>
                    ))}
                  </div>
                  <button
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    disabled={currentPage >= totalPages}
                    className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
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
        <section className="py-16 md:py-24 bg-gray-50">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-3xl mx-auto text-center mb-12 md:mb-16">
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
                Why Choose <span className="text-blue-600">CareerPilot</span>
              </h2>
              <p className="text-lg text-gray-600">
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
      <footer className="border-t border-gray-200 bg-white py-8">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center text-gray-600 text-sm">
            <p>
              Built with <span className="text-red-500">❤️</span> by{' '}
              <a href="https://github.com/anuragthippani1" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-700 font-medium transition-colors">
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

function FeatureCard({ icon, title, description }) {
  return (
    <div className="bg-white rounded-xl p-6 border border-gray-200 hover:shadow-lg transition-shadow">
      <div className="inline-flex p-3 bg-blue-50 rounded-lg text-blue-600 mb-4">
        {icon}
      </div>
      <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
      <p className="text-gray-600 leading-relaxed text-sm">{description}</p>
    </div>
  );
}

function InterviewCard({ interview, onStart }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-4">
        <div>
          <span className="inline-block px-2 py-1 bg-green-50 text-green-700 rounded text-xs font-medium mb-2">
            Available
          </span>
          <h3 className="text-lg font-semibold text-gray-900">{interview.type}</h3>
          <p className="text-base font-medium text-gray-700 mt-1">{interview.role}</p>
        </div>
      </div>
      <div className="space-y-2 mb-4">
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <span className="font-medium">Level:</span>
          <span className="px-2 py-1 bg-gray-100 rounded text-xs">{interview.level}</span>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <span className="font-medium">Date:</span>
          <span>{interview.date}</span>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <span className="font-medium">Tech:</span>
          <span className="text-xs">{interview.techStack}</span>
        </div>
      </div>
      <p className="text-xs text-gray-500 mb-4">
        You haven't taken the interview yet. Take it now to improve your skills.
      </p>
      <button
        onClick={onStart}
        className="w-full px-4 py-2 bg-gray-900 text-white rounded-lg font-semibold hover:bg-gray-800 transition-colors text-sm"
      >
        Start Interview
      </button>
    </div>
  );
}
