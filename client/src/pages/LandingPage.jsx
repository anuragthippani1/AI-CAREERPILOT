import { Link } from 'react-router-dom';
import { ArrowRight, Sparkles, Target, FileText, MessageSquare, Users, Zap, BarChart3, Clock, Shield, TrendingUp, CheckCircle2, Code, Brain, MessageCircle, Award, Star } from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a0a0a] via-purple-900/30 to-[#0a0a0a] relative overflow-hidden">
      {/* Background Grid Pattern */}
      <div className="absolute inset-0 bg-grid-pattern opacity-10"></div>
      
      {/* Header */}
      <header className="relative z-50 border-b border-white/10 bg-white/5 backdrop-blur-md sticky top-0">
        <nav className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <Link to="/" className="flex items-center space-x-2 group">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-lg blur opacity-75 group-hover:opacity-100 transition-opacity"></div>
                <Sparkles className="w-8 h-8 text-purple-400 relative z-10" />
              </div>
              <span className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-indigo-400 bg-clip-text text-transparent">
                CareerPilot
              </span>
            </Link>
            <Link
              to="/dashboard"
              className="px-6 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white rounded-lg transition-all font-medium shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
            >
              Get Started
            </Link>
          </div>
        </nav>
      </header>

      <main className="relative z-10">
        {/* Hero Section */}
        <section className="container mx-auto px-6 py-20 md:py-28">
          <div className="max-w-6xl mx-auto">
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div>
                <div className="inline-flex items-center gap-2 px-4 py-2 glass-card text-purple-300 rounded-full text-sm font-semibold mb-6">
                  <Zap className="w-4 h-4 text-yellow-400" />
                  AI-Powered Interview Practice
                </div>
                <h1 className="text-5xl md:text-6xl font-extrabold text-white mb-6 leading-tight">
                  Master Your Interview Skills{' '}
                  <span className="bg-gradient-to-r from-purple-400 via-indigo-400 to-pink-400 bg-clip-text text-transparent">
                    with AI
                  </span>
                </h1>
                <p className="text-xl text-gray-300 mb-8 leading-relaxed">
                  Get interview-ready with our AI-powered platform. Practice technical and behavioral interviews, receive instant feedback, and improve your skills at your own pace.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 mb-8">
                  <Link
                    to="/dashboard"
                    className="group px-8 py-4 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white rounded-xl text-lg font-semibold transition-all flex items-center justify-center gap-2 shadow-xl hover:shadow-2xl transform hover:-translate-y-1"
                  >
                    Start Practicing Now
                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </Link>
                </div>
              </div>
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-br from-purple-500/20 to-indigo-600/20 rounded-3xl blur-3xl"></div>
                <div className="relative glass-card rounded-2xl p-8 shadow-2xl">
                  <div className="glass-card rounded-xl p-6">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-full flex items-center justify-center shadow-lg">
                        <Brain className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-white">AI Interview Assistant</h3>
                        <p className="text-sm text-gray-400">Ready to help</p>
                      </div>
                    </div>
                    <div className="space-y-3">
                      <div className="glass-card rounded-lg p-4">
                        <p className="text-gray-300">Can you tell me about a challenging project you worked on?</p>
                      </div>
                      <div className="glass-card bg-purple-500/10 rounded-lg p-4 ml-8 border border-purple-500/20">
                        <p className="text-gray-300">I worked on a distributed system that handled 1M+ requests...</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Why Choose CareerPilot */}
        <section className="py-20">
          <div className="container mx-auto px-6">
            <div className="max-w-3xl mx-auto text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-extrabold text-white mb-4">
                Why Choose <span className="bg-gradient-to-r from-purple-400 to-indigo-400 bg-clip-text text-transparent">CareerPilot</span>
              </h2>
              <p className="text-xl text-gray-300">
                Our AI-powered platform helps you prepare for interviews with personalized feedback and real-world scenarios.
              </p>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
              <FeatureCard
                icon={<MessageCircle className="w-8 h-8" />}
                title="Realistic Conversations"
                description="Practice with AI that simulates real interviewers and adapts to your responses."
                gradient="from-blue-500 to-cyan-500"
              />
              <FeatureCard
                icon={<Code className="w-8 h-8" />}
                title="Technical Challenges"
                description="Tackle coding problems and system design questions with instant feedback."
                gradient="from-purple-500 to-pink-500"
              />
              <FeatureCard
                icon={<BarChart3 className="w-8 h-8" />}
                title="Detailed Feedback"
                description="Get comprehensive feedback on your answers, communication, and technical skills."
                gradient="from-green-500 to-emerald-500"
              />
              <FeatureCard
                icon={<TrendingUp className="w-8 h-8" />}
                title="Track Progress"
                description="Monitor your improvement over time with detailed analytics and performance metrics."
                gradient="from-orange-500 to-red-500"
              />
            </div>
          </div>
        </section>

        {/* How It Works */}
        <section className="py-20 bg-[#0a0a0a]/40">
          <div className="container mx-auto px-6">
            <div className="max-w-3xl mx-auto text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-extrabold text-white mb-4">How It Works</h2>
              <p className="text-xl text-gray-300">
                Get started with CareerPilot in three simple steps.
              </p>
            </div>
            <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
              <StepCard
                number="1"
                icon={<Target className="w-6 h-6" />}
                title="Choose Your Interview"
                description="Select from a variety of interview types, difficulty levels, and tech stacks."
                gradient="from-purple-500 to-indigo-500"
              />
              <StepCard
                number="2"
                icon={<Brain className="w-6 h-6" />}
                title="Practice with AI"
                description="Engage in realistic conversations with our AI interviewer that adapts to your responses."
                gradient="from-indigo-500 to-pink-500"
              />
              <StepCard
                number="3"
                icon={<Award className="w-6 h-6" />}
                title="Get Detailed Feedback"
                description="Receive comprehensive feedback on your performance and areas for improvement."
                gradient="from-pink-500 to-purple-500"
              />
            </div>
          </div>
        </section>

        {/* Key Benefits */}
        <section className="py-20">
          <div className="container mx-auto px-6">
            <div className="max-w-3xl mx-auto text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-extrabold text-white mb-4">Key Benefits</h2>
              <p className="text-xl text-gray-300">
                Why our platform is the best choice for interview preparation.
              </p>
            </div>
            <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
              <BenefitCard
                icon={<Clock className="w-8 h-8" />}
                title="Practice Anytime"
                description="Access our platform 24/7 to practice interviews at your own pace and convenience."
                gradient="from-blue-500 to-indigo-500"
              />
              <BenefitCard
                icon={<Shield className="w-8 h-8" />}
                title="Safe Environment"
                description="Practice in a judgment-free environment where you can make mistakes and learn from them."
                gradient="from-purple-500 to-pink-500"
              />
              <BenefitCard
                icon={<TrendingUp className="w-8 h-8" />}
                title="Track Progress"
                description="Monitor your improvement over time with detailed analytics and performance metrics."
                gradient="from-green-500 to-emerald-500"
              />
            </div>
          </div>
        </section>

        {/* Stats Section */}
        <section className="py-20 bg-[#0a0a0a]/40">
          <div className="container mx-auto px-6">
            <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
              <StatCard
                icon={<FileText className="w-8 h-8" />}
                number="100+"
                label="Interview Scenarios"
                gradient="from-blue-400 to-cyan-400"
              />
              <StatCard
                icon={<Code className="w-8 h-8" />}
                number="50+"
                label="Technical Challenges"
                gradient="from-purple-400 to-pink-400"
              />
              <StatCard
                icon={<Clock className="w-8 h-8" />}
                number="24/7"
                label="Available Practice"
                gradient="from-green-400 to-emerald-400"
              />
            </div>
          </div>
        </section>

        {/* Early Adopters */}
        <section className="py-20 bg-gradient-to-br from-purple-900/50 via-indigo-900/50 to-pink-900/50 relative overflow-hidden">
          <div className="absolute inset-0 opacity-20" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.05'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
            backgroundSize: '60px 60px'
          }}></div>
          <div className="container mx-auto px-6 relative z-10">
            <div className="max-w-3xl mx-auto text-center mb-12">
              <h2 className="text-4xl md:text-5xl font-extrabold text-white mb-4">Join Our Early Adopters</h2>
              <p className="text-xl text-purple-200">
                Be among the first to experience our AI-powered interview practice platform
              </p>
            </div>
            <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
              <EarlyAdopterCard
                icon={<Sparkles className="w-8 h-8" />}
                title="Free Access"
                description="Get unlimited access to our AI interview practice platform during our beta phase."
                gradient="from-yellow-400 to-orange-400"
              />
              <EarlyAdopterCard
                icon={<Users className="w-8 h-8" />}
                title="Shape the Future"
                description="Your feedback helps us improve and build the best interview practice platform."
                gradient="from-blue-400 to-cyan-400"
              />
              <EarlyAdopterCard
                icon={<Award className="w-8 h-8" />}
                title="Early Benefits"
                description="Get premium features and special offers when we launch our full version."
                gradient="from-green-400 to-emerald-400"
              />
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="py-20">
          <div className="container mx-auto px-6">
            <div className="max-w-4xl mx-auto text-center glass-card rounded-3xl p-12 md:p-16 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-full blur-3xl"></div>
              <div className="absolute bottom-0 left-0 w-64 h-64 bg-gradient-to-tr from-indigo-500/20 to-purple-500/20 rounded-full blur-3xl"></div>
              <div className="relative z-10">
                <h2 className="text-4xl md:text-5xl font-extrabold text-white mb-4">
                  Ready to Improve Your Interview Skills?
                </h2>
                <p className="text-xl text-gray-300 mb-8">
                  Join our community of early adopters and start practicing with our AI-powered interview platform today.
                </p>
                <Link
                  to="/dashboard"
                  className="inline-flex items-center gap-2 px-10 py-5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white rounded-xl text-lg font-semibold transition-all shadow-xl hover:shadow-2xl transform hover:-translate-y-1"
                >
                  Get Started Now
                  <ArrowRight className="w-5 h-5" />
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-white/10 bg-[#0a0a0a]/40 backdrop-blur-md py-8 relative z-10">
        <div className="container mx-auto px-6">
          <div className="text-center text-gray-400">
            <p>
              Built with <span className="text-red-400">❤️</span> by{' '}
              <a href="https://github.com/anuragthippani1" target="_blank" rel="noopener noreferrer" className="text-purple-400 hover:text-purple-300 font-semibold transition-colors">
                Anurag Thippani
              </a>
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({ icon, title, description, gradient }) {
  return (
    <div className="group glass-card rounded-2xl p-6 hover:scale-105 transition-all">
      <div className={`inline-flex p-3 bg-gradient-to-br ${gradient} rounded-xl text-white mb-4 shadow-lg group-hover:scale-110 transition-transform`}>
        {icon}
      </div>
      <h3 className="text-xl font-bold text-white mb-2">{title}</h3>
      <p className="text-gray-300 leading-relaxed">{description}</p>
    </div>
  );
}

function StepCard({ number, icon, title, description, gradient }) {
  return (
    <div className="text-center group">
      <div className="relative inline-block mb-4">
        <div className={`absolute inset-0 bg-gradient-to-br ${gradient} rounded-full blur-lg opacity-50 group-hover:opacity-75 transition-opacity`}></div>
        <div className={`relative inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br ${gradient} text-white rounded-full text-2xl font-bold shadow-xl`}>
          {number}
        </div>
      </div>
      <div className={`inline-flex p-3 bg-gradient-to-br ${gradient} rounded-xl text-white mb-4 shadow-lg`}>
        {icon}
      </div>
      <h3 className="text-xl font-bold text-white mb-2">{title}</h3>
      <p className="text-gray-300 leading-relaxed">{description}</p>
    </div>
  );
}

function BenefitCard({ icon, title, description, gradient }) {
  return (
    <div className="group glass-card rounded-2xl p-6 hover:scale-105 transition-all">
      <div className={`inline-flex p-3 bg-gradient-to-br ${gradient} rounded-xl text-white mb-4 shadow-lg group-hover:scale-110 transition-transform`}>
        {icon}
      </div>
      <h3 className="text-xl font-bold text-white mb-2">{title}</h3>
      <p className="text-gray-300 leading-relaxed">{description}</p>
    </div>
  );
}

function StatCard({ icon, number, label, gradient }) {
  return (
    <div className="text-center group glass-card rounded-2xl p-8">
      <div className={`inline-flex p-4 bg-gradient-to-br ${gradient} rounded-2xl text-white mb-4 shadow-xl`}>
        {icon}
      </div>
      <h3 className="text-5xl font-extrabold text-white mb-2">{number}</h3>
      <p className="text-gray-300 text-lg font-medium">{label}</p>
    </div>
  );
}

function EarlyAdopterCard({ icon, title, description, gradient }) {
  return (
    <div className="group glass-card rounded-2xl p-6 hover:scale-105 transition-all">
      <div className={`inline-flex p-3 bg-gradient-to-br ${gradient} rounded-xl text-white mb-4 shadow-lg group-hover:scale-110 transition-transform`}>
        {icon}
      </div>
      <h3 className="text-xl font-bold text-white mb-2">{title}</h3>
      <p className="text-purple-200 leading-relaxed">{description}</p>
    </div>
  );
}
