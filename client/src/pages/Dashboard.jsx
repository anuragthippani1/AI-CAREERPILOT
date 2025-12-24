import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FileText, Target, Map, MessageSquare, Plus, TrendingUp } from 'lucide-react';
import { userAPI, resumeAPI, roadmapAPI } from '../services/api';

export default function Dashboard() {
  const [userId] = useState(1); // Demo user
  const [user, setUser] = useState(null);
  const [resume, setResume] = useState(null);
  const [roadmap, setRoadmap] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      setLoading(true);
      const [userRes, resumeRes, roadmapRes] = await Promise.allSettled([
        userAPI.get(userId),
        resumeAPI.get(userId),
        roadmapAPI.get(userId),
      ]);

      if (userRes.status === 'fulfilled') setUser(userRes.value.data.data);
      if (resumeRes.status === 'fulfilled') setResume(resumeRes.value.data.data);
      if (roadmapRes.status === 'fulfilled') setRoadmap(roadmapRes.value.data.data);
    } catch (error) {
      console.error('Error loading dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading your career dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-900">CareerPilot Dashboard</h1>
            <div className="text-sm text-gray-600">
              {user ? `Welcome, ${user.name}` : 'Welcome'}
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-6 py-8">
        {/* Quick Stats */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <StatCard
            title="ATS Score"
            value={resume?.ats_score ? `${Math.round(resume.ats_score)}%` : 'N/A'}
            icon={<TrendingUp className="w-6 h-6" />}
            link="/resume"
          />
          <StatCard
            title="Skills"
            value={resume?.analysis_json?.skills?.length || 0}
            icon={<Target className="w-6 h-6" />}
            link="/skills"
          />
          <StatCard
            title="Roadmap Progress"
            value={roadmap?.progress_percentage ? `${Math.round(roadmap.progress_percentage)}%` : '0%'}
            icon={<Map className="w-6 h-6" />}
            link="/roadmap"
          />
          <StatCard
            title="Interviews"
            value="Ready"
            icon={<MessageSquare className="w-6 h-6" />}
            link="/interview"
          />
        </div>

        {/* Main Actions */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
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
        </div>

        <div className="grid md:grid-cols-2 gap-6">
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
        </div>
      </main>
    </div>
  );
}

function StatCard({ title, value, icon, link }) {
  return (
    <Link
      to={link}
      className="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow border border-gray-200"
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-600 mb-1">{title}</p>
          <p className="text-3xl font-bold text-gray-900">{value}</p>
        </div>
        <div className="text-blue-600">{icon}</div>
      </div>
    </Link>
  );
}

function ActionCard({ icon, title, description, link, hasData }) {
  return (
    <Link
      to={link}
      className="bg-white rounded-xl p-8 shadow-sm hover:shadow-lg transition-all border border-gray-200 group"
    >
      <div className="flex items-start gap-4">
        <div className="text-blue-600 group-hover:text-blue-700 transition-colors">
          {icon}
        </div>
        <div className="flex-1">
          <h3 className="text-xl font-semibold text-gray-900 mb-2">{title}</h3>
          <p className="text-gray-600 mb-4">{description}</p>
          <div className="flex items-center text-blue-600 group-hover:text-blue-700 font-medium">
            {hasData ? 'View Details' : 'Get Started'}
            <Plus className="w-4 h-4 ml-2" />
          </div>
        </div>
      </div>
    </Link>
  );
}

