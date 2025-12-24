import { Link } from 'react-router-dom';
import { ArrowRight, Sparkles, Target, FileText, MessageSquare } from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
      {/* Header */}
      <header className="container mx-auto px-6 py-6">
        <nav className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Sparkles className="w-8 h-8 text-blue-400" />
            <span className="text-2xl font-bold text-white">CareerPilot</span>
          </div>
          <Link
            to="/dashboard"
            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
          >
            Get Started
          </Link>
        </nav>
      </header>

      {/* Hero Section */}
      <main className="container mx-auto px-6 py-20">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-6xl font-bold text-white mb-6">
            Your AI-Powered
            <span className="block text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-400">
              Career Operating System
            </span>
          </h1>
          <p className="text-xl text-gray-300 mb-12 max-w-2xl mx-auto">
            Transform your career journey with intelligent agents that analyze your resume,
            identify skill gaps, create personalized roadmaps, and conduct mock interviews.
          </p>
          <div className="flex gap-4 justify-center">
            <Link
              to="/dashboard"
              className="px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-lg font-semibold transition-colors flex items-center gap-2"
            >
              Start Your Journey
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mt-20 max-w-6xl mx-auto">
          <FeatureCard
            icon={<FileText className="w-8 h-8" />}
            title="Resume Intelligence"
            description="AI-powered resume analysis with ATS scoring and role-specific improvements"
          />
          <FeatureCard
            icon={<Target className="w-8 h-8" />}
            title="Skill Gap Analysis"
            description="Identify missing skills and get personalized learning recommendations"
          />
          <FeatureCard
            icon={<Sparkles className="w-8 h-8" />}
            title="Career Roadmaps"
            description="Step-by-step roadmaps with milestones tailored to your goals"
          />
          <FeatureCard
            icon={<MessageSquare className="w-8 h-8" />}
            title="AI Mock Interviews"
            description="Practice with adaptive AI interviews and get instant feedback"
          />
        </div>

        {/* How It Works */}
        <div className="mt-32 max-w-4xl mx-auto">
          <h2 className="text-4xl font-bold text-white text-center mb-12">
            How CareerPilot Works
          </h2>
          <div className="space-y-8">
            <Step number="1" title="Upload Your Resume" description="Our Resume Analyzer Agent extracts skills, scores ATS compatibility, and provides insights." />
            <Step number="2" title="Set Your Career Goal" description="Define your target role and let the Skill Gap Agent identify what you need to learn." />
            <Step number="3" title="Get Your Roadmap" description="The Career Roadmap Agent creates a personalized, step-by-step plan to reach your goal." />
            <Step number="4" title="Practice & Improve" description="Conduct mock interviews with our Interview Agent and get real-time feedback." />
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="container mx-auto px-6 py-12 mt-20 border-t border-gray-800">
        <div className="text-center text-gray-400">
          <p>Built with Google Gemini, Antigravity Agents, and React 19</p>
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({ icon, title, description }) {
  return (
    <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6 hover:bg-white/10 transition-colors">
      <div className="text-blue-400 mb-4">{icon}</div>
      <h3 className="text-xl font-semibold text-white mb-2">{title}</h3>
      <p className="text-gray-400">{description}</p>
    </div>
  );
}

function Step({ number, title, description }) {
  return (
    <div className="flex gap-6 items-start">
      <div className="flex-shrink-0 w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold text-lg">
        {number}
      </div>
      <div>
        <h3 className="text-2xl font-semibold text-white mb-2">{title}</h3>
        <p className="text-gray-300">{description}</p>
      </div>
    </div>
  );
}

