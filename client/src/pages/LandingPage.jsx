import { Link } from 'react-router-dom';
import { ArrowRight, Sparkles, Target, FileText, MessageSquare, Brain, Zap, BarChart3, Clock, Shield, TrendingUp, CheckCircle2, Code, MessageCircle, Award, Star } from 'lucide-react';

export default function LandingPage() {
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
            <Link
              to="/dashboard"
              className="px-4 py-2 bg-gray-900 text-white rounded-lg font-medium hover:bg-gray-800 transition-colors text-sm"
            >
              Get Started
            </Link>
          </div>
        </nav>
      </header>

      <main>
        {/* Hero Section */}
        <section className="container mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24 lg:py-32">
          <div className="max-w-6xl mx-auto">
            <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-50 text-blue-700 rounded-full text-sm font-medium mb-6 border border-blue-100">
                  <Zap className="w-4 h-4" />
                  AI-Powered Interview Practice
                </div>
                <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 mb-6 leading-tight">
                  Master Your Interview Skills{' '}
                  <span className="text-blue-600">with AI</span>
                </h1>
                <p className="text-lg sm:text-xl text-gray-600 mb-8 leading-relaxed max-w-xl">
                  Get interview-ready with our AI-powered platform. Practice technical and behavioral interviews, receive instant feedback, and improve your skills at your own pace.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 mb-8">
                  <Link
                    to="/dashboard"
                    className="group px-6 py-3.5 bg-gray-900 text-white rounded-lg text-base font-semibold transition-all flex items-center justify-center gap-2 hover:bg-gray-800 shadow-sm hover:shadow-md"
                  >
                    Start Practicing Now
                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </Link>
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex -space-x-2">
                    {[1, 2, 3, 4].map((i) => (
                      <div key={i} className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 border-2 border-white"></div>
                    ))}
                  </div>
                  <p className="text-sm text-gray-600">Join our community of aspiring professionals</p>
                </div>
              </div>
              <div className="relative">
                <div className="relative bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl p-8 shadow-xl border border-gray-200">
                  <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center shadow-sm">
                        <Brain className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">AI Interview Assistant</h3>
                        <p className="text-sm text-gray-500">Ready to help</p>
                      </div>
                    </div>
                    <div className="space-y-3">
                      <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                        <p className="text-gray-700 text-sm">Can you tell me about a challenging project you worked on?</p>
                      </div>
                      <div className="bg-blue-50 rounded-lg p-4 ml-8 border border-blue-200">
                        <p className="text-gray-700 text-sm">I worked on a distributed system that handled 1M+ requests...</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
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

        {/* How It Works */}
        <section className="py-16 md:py-24">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-3xl mx-auto text-center mb-12 md:mb-16">
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-4">How It Works</h2>
              <p className="text-lg text-gray-600">
                Get started with CareerPilot in three simple steps.
              </p>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8 max-w-5xl mx-auto">
              <StepCard
                number="1"
                icon={<Target className="w-5 h-5" />}
                title="Choose Your Interview"
                description="Select from a variety of interview types, difficulty levels, and tech stacks."
              />
              <StepCard
                number="2"
                icon={<Brain className="w-5 h-5" />}
                title="Practice with AI"
                description="Engage in realistic conversations with our AI interviewer that adapts to your responses."
              />
              <StepCard
                number="3"
                icon={<Award className="w-5 h-5" />}
                title="Get Detailed Feedback"
                description="Receive comprehensive feedback on your performance and areas for improvement."
              />
            </div>
          </div>
        </section>

        {/* Key Benefits */}
        <section className="py-16 md:py-24 bg-gray-50">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-3xl mx-auto text-center mb-12 md:mb-16">
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-4">Key Benefits</h2>
              <p className="text-lg text-gray-600">
                Why our platform is the best choice for interview preparation.
              </p>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8 max-w-5xl mx-auto">
              <BenefitCard
                icon={<Clock className="w-6 h-6" />}
                title="Practice Anytime"
                description="Access our platform 24/7 to practice interviews at your own pace and convenience."
              />
              <BenefitCard
                icon={<Shield className="w-6 h-6" />}
                title="Safe Environment"
                description="Practice in a judgment-free environment where you can make mistakes and learn from them."
              />
              <BenefitCard
                icon={<TrendingUp className="w-6 h-6" />}
                title="Track Progress"
                description="Monitor your improvement over time with detailed analytics and performance metrics."
              />
            </div>
          </div>
        </section>

        {/* Stats Section */}
        <section className="py-16 md:py-24">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid sm:grid-cols-3 gap-8 max-w-4xl mx-auto">
              <StatCard
                icon={<FileText className="w-6 h-6" />}
                number="100+"
                label="Interview Scenarios"
              />
              <StatCard
                icon={<Code className="w-6 h-6" />}
                number="50+"
                label="Technical Challenges"
              />
              <StatCard
                icon={<Clock className="w-6 h-6" />}
                number="24/7"
                label="Available Practice"
              />
            </div>
          </div>
        </section>

        {/* Early Adopters */}
        <section className="py-16 md:py-24 bg-gradient-to-br from-blue-50 to-indigo-50">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-3xl mx-auto text-center mb-12">
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-4">Join Our Early Adopters</h2>
              <p className="text-lg text-gray-600">
                Be among the first to experience our AI-powered interview practice platform
              </p>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
              <EarlyAdopterCard
                icon={<Sparkles className="w-6 h-6" />}
                title="Free Access"
                description="Get unlimited access to our AI interview practice platform during our beta phase."
              />
              <EarlyAdopterCard
                icon={<MessageCircle className="w-6 h-6" />}
                title="Shape the Future"
                description="Your feedback helps us improve and build the best interview practice platform."
              />
              <EarlyAdopterCard
                icon={<Award className="w-6 h-6" />}
                title="Early Benefits"
                description="Get premium features and special offers when we launch our full version."
              />
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="py-16 md:py-24">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto text-center bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl p-12 md:p-16 relative overflow-hidden">
              <div className="relative z-10">
                <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-4">
                  Ready to Improve Your Interview Skills?
                </h2>
                <p className="text-lg text-gray-300 mb-8 max-w-2xl mx-auto">
                  Join our community of early adopters and start practicing with our AI-powered interview platform today.
                </p>
                <Link
                  to="/dashboard"
                  className="inline-flex items-center gap-2 px-8 py-3.5 bg-white text-gray-900 rounded-lg text-base font-semibold transition-all hover:bg-gray-100 shadow-lg hover:shadow-xl"
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

function StepCard({ number, icon, title, description }) {
  return (
    <div className="text-center">
      <div className="relative inline-block mb-4">
        <div className="relative inline-flex items-center justify-center w-12 h-12 bg-gray-900 text-white rounded-full text-lg font-bold">
          {number}
        </div>
      </div>
      <div className="inline-flex p-3 bg-blue-50 rounded-lg text-blue-600 mb-4">
        {icon}
      </div>
      <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
      <p className="text-gray-600 leading-relaxed text-sm">{description}</p>
    </div>
  );
}

function BenefitCard({ icon, title, description }) {
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

function StatCard({ icon, number, label }) {
  return (
    <div className="text-center bg-white rounded-xl p-8 border border-gray-200">
      <div className="inline-flex p-3 bg-blue-50 rounded-lg text-blue-600 mb-4">
        {icon}
      </div>
      <h3 className="text-4xl font-bold text-gray-900 mb-2">{number}</h3>
      <p className="text-gray-600 font-medium">{label}</p>
    </div>
  );
}

function EarlyAdopterCard({ icon, title, description }) {
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
