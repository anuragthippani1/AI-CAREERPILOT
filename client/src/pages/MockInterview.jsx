import { useState, useEffect } from 'react';
import { MessageSquare, Send, Loader, CheckCircle, AlertCircle, Clock, BarChart3, TrendingUp, FileText, Calendar, Target, Award } from 'lucide-react';
import { interviewAPI } from '../services/api';
import XPNotification from '../components/XPNotification';

export default function MockInterview() {
  const [userId] = useState(1);
  const [sessionId, setSessionId] = useState(null);
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [answer, setAnswer] = useState('');
  const [feedback, setFeedback] = useState(null);
  const [isComplete, setIsComplete] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [roleTitle, setRoleTitle] = useState('');
  const [interviewType, setInterviewType] = useState('mixed');
  const [companyName, setCompanyName] = useState('');
  const [questionNumber, setQuestionNumber] = useState(1);
  const [totalQuestions, setTotalQuestions] = useState(0);
  const [startTime, setStartTime] = useState(null);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [interviewHistory, setInterviewHistory] = useState([]);
  const [showHistory, setShowHistory] = useState(false);
  const [overallStats, setOverallStats] = useState(null);
  const [xpNotification, setXpNotification] = useState(null);

  useEffect(() => {
    if (startTime && !isComplete) {
      const interval = setInterval(() => {
        setElapsedTime(Math.floor((Date.now() - startTime) / 1000));
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [startTime, isComplete]);

  useEffect(() => {
    loadInterviewHistory();
  }, []);

  const loadInterviewHistory = async () => {
    try {
      const response = await interviewAPI.getSessions(userId);
      if (response.data.success) {
        setInterviewHistory(response.data.data || []);
        calculateOverallStats(response.data.data || []);
      }
    } catch (err) {
      console.error('Error loading interview history:', err);
    }
  };

  const calculateOverallStats = (sessions) => {
    const completed = sessions.filter(s => s.status === 'completed' && s.overall_score);
    if (completed.length === 0) return;

    const avgScore = completed.reduce((sum, s) => sum + (s.overall_score || 0), 0) / completed.length;
    const totalInterviews = completed.length;
    const recentScores = completed.slice(0, 5).map(s => s.overall_score || 0);
    const trend = recentScores.length > 1 
      ? recentScores[0] - recentScores[recentScores.length - 1] 
      : 0;

    setOverallStats({
      averageScore: Math.round(avgScore),
      totalInterviews,
      trend,
      recentScores
    });
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const startInterview = async () => {
    if (!roleTitle) {
      setError('Please enter a role title');
      return;
    }

    setLoading(true);
    setError(null);
    setFeedback(null);
    setIsComplete(false);
    setQuestionNumber(1);
    setElapsedTime(0);
    setStartTime(Date.now());

    try {
      const response = await interviewAPI.start({
        userId,
        roleTitle,
        type: interviewType,
        companyName: companyName || undefined,
      });

      if (response.data.success) {
        const agentResult = response.data.data;
        
        if (agentResult.success && agentResult.data) {
          setSessionId(agentResult.data.sessionId);
          setCurrentQuestion(agentResult.data.question);
          setTotalQuestions(agentResult.data.totalQuestions || 5);
        } else {
          const errorMsg = agentResult.error || 'Failed to start interview';
          if (errorMsg.includes('quota') || errorMsg.includes('Quota')) {
            setError('API quota exceeded. Please wait a few minutes or check your Gemini API plan.');
          } else {
            setError(errorMsg.substring(0, 200));
          }
        }
      } else {
        setError('Failed to start interview');
      }
    } catch (err) {
      console.error('Interview start error:', err);
      let errorMsg = 'Network Error';
      
      if (err.code === 'ECONNREFUSED' || err.message?.includes('Network Error') || !err.response) {
        errorMsg = 'Cannot connect to server. Please make sure the backend server is running on port 8000.';
      } else {
        errorMsg = err.response?.data?.error || err.response?.data?.data?.error || err.message || 'Failed to start interview';
        if (errorMsg.includes('quota') || errorMsg.includes('Quota')) {
          errorMsg = 'API quota exceeded. Please wait a few minutes or check your Gemini API plan.';
        }
      }
      
      setError(errorMsg.substring(0, 200));
    } finally {
      setLoading(false);
    }
  };

  const submitAnswer = async () => {
    if (!answer.trim()) {
      setError('Please provide an answer');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await interviewAPI.continue({
        userId,
        sessionId,
        answer,
      });

      if (response.data.success) {
        const agentResult = response.data.data;
        
        if (agentResult.success && agentResult.data) {
          setFeedback(agentResult.data.feedback);
          setAnswer('');
          setQuestionNumber(prev => prev + 1);
          
          if (agentResult.data.isComplete) {
            setIsComplete(true);
            setCurrentQuestion(null);
            loadInterviewHistory();
            
            // Show XP and achievement notifications
            if (agentResult.data.xpGained || agentResult.data.leveledUp || agentResult.data.unlockedAchievements?.length > 0) {
              setXpNotification({
                xpGained: agentResult.data.xpGained,
                leveledUp: agentResult.data.leveledUp,
                newLevel: agentResult.data.newLevel,
                unlockedAchievements: agentResult.data.unlockedAchievements || []
              });
            }
          } else {
            setCurrentQuestion(agentResult.data.nextQuestion);
          }
        } else {
          const errorMsg = agentResult.error || 'Failed to submit answer';
          if (errorMsg.includes('quota') || errorMsg.includes('Quota')) {
            setError('API quota exceeded. Please wait a few minutes.');
          } else {
            setError(errorMsg.substring(0, 200));
          }
        }
      } else {
        setError('Failed to submit answer');
      }
    } catch (err) {
      const errorMsg = err.response?.data?.error || err.response?.data?.data?.error || err.message || 'Failed to submit answer';
      if (errorMsg.includes('quota') || errorMsg.includes('Quota')) {
        setError('API quota exceeded. Please wait a few minutes.');
      } else {
        setError(errorMsg.substring(0, 200));
      }
    } finally {
      setLoading(false);
    }
  };

  if (showHistory) {
    return (
      <div className="min-h-screen bg-gray-50">
        <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-200">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center justify-between">
              <h1 className="text-xl font-bold text-gray-900">Interview History & Analytics</h1>
              <button
                onClick={() => setShowHistory(false)}
                className="px-4 py-2 text-gray-700 hover:text-gray-900 font-medium text-sm hover:bg-gray-100 rounded-lg transition-colors"
              >
                Back to Interview
              </button>
            </div>
          </div>
        </header>

        <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {overallStats && (
            <div className="grid md:grid-cols-4 gap-6 mb-8">
              <StatCard
                icon={<Award className="w-6 h-6" />}
                label="Average Score"
                value={`${overallStats.averageScore}%`}
                color="blue"
              />
              <StatCard
                icon={<FileText className="w-6 h-6" />}
                label="Total Interviews"
                value={overallStats.totalInterviews}
                color="green"
              />
              <StatCard
                icon={<TrendingUp className="w-6 h-6" />}
                label="Performance Trend"
                value={overallStats.trend > 0 ? `+${overallStats.trend}` : overallStats.trend}
                color={overallStats.trend > 0 ? "green" : "red"}
              />
              <StatCard
                icon={<BarChart3 className="w-6 h-6" />}
                label="Completion Rate"
                value="100%"
                color="purple"
              />
            </div>
          )}

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Recent Interviews</h2>
            <div className="space-y-4">
              {interviewHistory.length === 0 ? (
                <p className="text-gray-500 text-center py-8">No interview history yet</p>
              ) : (
                interviewHistory.map((session) => (
                  <div key={session.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900">{session.role_title}</h3>
                        <p className="text-sm text-gray-600 mt-1">
                          {new Date(session.created_at).toLocaleDateString()} at {new Date(session.created_at).toLocaleTimeString()}
                        </p>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-blue-600">
                          {session.overall_score ? `${Math.round(session.overall_score)}%` : 'N/A'}
                        </div>
                        <span className={`text-xs px-2 py-1 rounded ${
                          session.status === 'completed' ? 'bg-green-100 text-green-800' :
                          session.status === 'in_progress' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {session.status}
                        </span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (!sessionId && !loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-200">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center justify-between">
              <h1 className="text-xl font-bold text-gray-900">AI Mock Interview Platform</h1>
              {interviewHistory.length > 0 && (
                <button
                  onClick={() => setShowHistory(true)}
                  className="px-4 py-2 text-gray-700 hover:text-gray-900 font-medium flex items-center gap-2 text-sm hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <BarChart3 className="w-5 h-5" />
                  View History
                </button>
              )}
            </div>
          </div>
        </header>

        <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 max-w-4xl">
          {overallStats && (
            <div className="grid sm:grid-cols-3 gap-4 mb-6">
              <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Average Score</p>
                    <p className="text-2xl font-bold text-gray-900">{overallStats.averageScore}%</p>
                  </div>
                  <Award className="w-8 h-8 text-blue-600" />
                </div>
              </div>
              <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Total Interviews</p>
                    <p className="text-2xl font-bold text-gray-900">{overallStats.totalInterviews}</p>
                  </div>
                  <FileText className="w-8 h-8 text-green-600" />
                </div>
              </div>
              <div className={`bg-white border border-gray-200 rounded-lg p-4 shadow-sm`}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Trend</p>
                    <p className={`text-2xl font-bold ${overallStats.trend > 0 ? 'text-green-600' : 'text-red-600'}`}>{overallStats.trend > 0 ? '+' : ''}{overallStats.trend}</p>
                  </div>
                  <TrendingUp className={`w-8 h-8 ${overallStats.trend > 0 ? 'text-green-600' : 'text-red-600'}`} />
                </div>
              </div>
            </div>
          )}

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 md:p-8">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Start New Interview Session</h2>
              <p className="text-gray-600">Practice with AI-powered interviews tailored to your target role</p>
            </div>

            <div className="space-y-6">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Target className="w-4 h-4 inline mr-1" />
                    Target Role *
                  </label>
                  <input
                    type="text"
                    value={roleTitle}
                    onChange={(e) => setRoleTitle(e.target.value)}
                    placeholder="e.g., Senior Software Engineer"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Calendar className="w-4 h-4 inline mr-1" />
                    Company (Optional)
                  </label>
                  <input
                    type="text"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    placeholder="e.g., Google, Microsoft"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Interview Type
                </label>
                <select
                  value={interviewType}
                  onChange={(e) => setInterviewType(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="technical">Technical Interview</option>
                  <option value="behavioral">Behavioral Interview</option>
                  <option value="mixed">Mixed (Technical + Behavioral)</option>
                  <option value="system-design">System Design</option>
                  <option value="leadership">Leadership & Management</option>
                </select>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 text-red-600" />
                  <p className="text-red-800">{error}</p>
                </div>
              )}

              <button
                onClick={startInterview}
                disabled={loading}
                className="w-full bg-gray-900 hover:bg-gray-800 text-white font-semibold py-3.5 px-6 rounded-lg transition-all shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader className="w-5 h-5 animate-spin" />
                    Initializing Interview Session...
                  </>
                ) : (
                  <>
                    <MessageSquare className="w-5 h-5" />
                    Start Interview Session
                  </>
                )}
              </button>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* XP Notification */}
      {xpNotification && (
        <XPNotification
          xpGained={xpNotification.xpGained}
          leveledUp={xpNotification.leveledUp}
          newLevel={xpNotification.newLevel}
          unlockedAchievements={xpNotification.unlockedAchievements}
          onClose={() => setXpNotification(null)}
        />
      )}

      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-200">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold text-gray-900">
                {companyName ? `${companyName} - ` : ''}{roleTitle} Interview
              </h1>
              <p className="text-sm text-gray-600 mt-1">
                {interviewType.charAt(0).toUpperCase() + interviewType.slice(1)} Interview Session
              </p>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 text-gray-600">
                <Clock className="w-5 h-5" />
                <span className="font-mono">{formatTime(elapsedTime)}</span>
              </div>
              <div className="text-sm text-gray-600">
                Question {questionNumber} / {totalQuestions || '?'}
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 max-w-5xl">
        {isComplete ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 md:p-8">
            <div className="text-center mb-8">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-12 h-12 text-green-600" />
              </div>
              <h2 className="text-3xl font-bold text-gray-900 mb-2">Interview Session Complete!</h2>
              <p className="text-gray-600">Total time: {formatTime(elapsedTime)}</p>
            </div>

            {feedback && (
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6 mb-6">
                <h3 className="font-semibold text-gray-900 mb-4 text-lg">Final Assessment</h3>
                <div className="grid md:grid-cols-2 gap-4 mb-4">
                  <div className="bg-white rounded-lg p-4">
                    <p className="text-sm text-gray-600 mb-1">Overall Performance</p>
                    <p className="text-3xl font-bold text-blue-600">{feedback.overallScore || 0}/100</p>
                  </div>
                  <div className="bg-white rounded-lg p-4">
                    <p className="text-sm text-gray-600 mb-1">Session Duration</p>
                    <p className="text-3xl font-bold text-gray-900">{formatTime(elapsedTime)}</p>
                  </div>
                </div>
                {xpNotification && (
                  <div className="bg-white rounded-lg p-4 mb-4">
                    <p className="text-sm text-gray-600 mb-1">XP Earned</p>
                    <p className="text-2xl font-bold text-green-600">
                      +{xpNotification.xpGained || 0} XP
                    </p>
                    {xpNotification.leveledUp && (
                      <p className="text-sm text-gray-600 mt-1">
                        🎉 Level Up! You're now Level {xpNotification.newLevel}
                      </p>
                    )}
                  </div>
                )}
                {xpNotification?.unlockedAchievements && xpNotification.unlockedAchievements.length > 0 && (
                  <div className="bg-white rounded-lg p-4 mb-4">
                    <p className="text-sm font-semibold text-gray-900 mb-2">Achievements Unlocked:</p>
                    <div className="space-y-2">
                      {xpNotification.unlockedAchievements.map((achievement, i) => (
                        <div key={i} className="flex items-center gap-2">
                          <Award className="w-4 h-4 text-yellow-500" />
                          <span className="text-sm text-gray-700">{achievement.name}</span>
                          <span className="text-xs text-gray-500">+{achievement.xpReward} XP</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {feedback.summary && (
                  <p className="text-gray-700">{feedback.summary}</p>
                )}
              </div>
            )}

            <div className="flex gap-4">
              <button
                onClick={() => {
                  setSessionId(null);
                  setCurrentQuestion(null);
                  setFeedback(null);
                  setIsComplete(false);
                  setQuestionNumber(1);
                  setAnswer('');
                }}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
              >
                Start New Interview
              </button>
              <button
                onClick={() => setShowHistory(true)}
                className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-3 px-6 rounded-lg transition-colors"
              >
                View History
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {currentQuestion && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-start gap-4 mb-4">
                  <div className="bg-blue-50 rounded-full p-3">
                    <MessageSquare className="w-6 h-6 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-2 py-1 rounded">
                        Question {questionNumber}
                      </span>
                      {currentQuestion.questionType && (
                        <span className="text-xs text-gray-600 bg-gray-100 px-2 py-1 rounded">
                          {currentQuestion.questionType}
                        </span>
                      )}
                    </div>
                    <p className="text-xl font-semibold text-gray-900 mb-2">{currentQuestion.question}</p>
                    {currentQuestion.context && (
                      <p className="text-sm text-gray-600">{currentQuestion.context}</p>
                    )}
                    {currentQuestion.hints && currentQuestion.hints.length > 0 && (
                      <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                        <p className="text-xs font-medium text-blue-900 mb-1">💡 Hints:</p>
                        <ul className="text-xs text-blue-800 space-y-1">
                          {currentQuestion.hints.map((hint, i) => (
                            <li key={i}>• {hint}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {feedback && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h3 className="font-semibold text-gray-900 mb-4 text-lg flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-blue-600" />
                  Performance Feedback
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                  <ScoreCard label="Clarity" value={feedback.clarity} />
                  <ScoreCard label="Technical" value={feedback.technicalAccuracy} />
                  <ScoreCard label="Relevance" value={feedback.relevance} />
                  <ScoreCard label="Communication" value={feedback.communication} />
                </div>
                <div className="mb-4 p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm font-medium text-gray-700 mb-2">Overall Score</p>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 bg-gray-200 rounded-full h-3">
                      <div 
                        className="bg-gradient-to-r from-blue-500 to-blue-600 h-3 rounded-full transition-all"
                        style={{ width: `${feedback.overallScore || 0}%` }}
                      />
                    </div>
                    <span className="text-lg font-bold text-gray-900">{feedback.overallScore || 0}/100</span>
                  </div>
                </div>
                {feedback.strengths && feedback.strengths.length > 0 && (
                  <div className="mb-4">
                    <p className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-600" />
                      Strengths
                    </p>
                    <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
                      {feedback.strengths.map((strength, i) => (
                        <li key={i}>{strength}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {feedback.improvements && feedback.improvements.length > 0 && (
                  <div className="mb-4">
                    <p className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                      <Target className="w-4 h-4 text-orange-600" />
                      Areas for Improvement
                    </p>
                    <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
                      {feedback.improvements.map((improvement, i) => (
                        <li key={i}>{improvement}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {feedback.comments && (
                  <div className="p-4 bg-blue-50 rounded-lg">
                    <p className="text-sm text-gray-700">{feedback.comments}</p>
                  </div>
                )}
              </div>
            )}

            {!isComplete && currentQuestion && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Your Answer
                </label>
                <textarea
                  value={answer}
                  onChange={(e) => setAnswer(e.target.value)}
                  rows={8}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent mb-4 font-sans"
                  placeholder="Type your detailed answer here. Be specific and provide examples..."
                />
                <div className="flex items-center justify-between mb-4">
                  <p className="text-xs text-gray-500">
                    {answer.length} characters
                  </p>
                  <p className="text-xs text-gray-500">
                    Recommended: 150-300 words
                  </p>
                </div>
                {error && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4 flex items-center gap-2">
                    <AlertCircle className="w-5 h-5 text-red-600" />
                    <p className="text-red-800 text-sm">{error}</p>
                  </div>
                )}
                <button
                  onClick={submitAnswer}
                  disabled={loading || !answer.trim()}
                  className="w-full bg-gray-900 hover:bg-gray-800 text-white font-semibold py-3.5 px-6 rounded-lg transition-all shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <Loader className="w-5 h-5 animate-spin" />
                      Analyzing Response...
                    </>
                  ) : (
                    <>
                      <Send className="w-5 h-5" />
                      Submit Answer & Continue
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

function ScoreCard({ label, value }) {
  const percentage = value || 0;
  const colorClass = percentage >= 80 ? 'text-green-600' : percentage >= 60 ? 'text-blue-600' : 'text-orange-600';
  
  return (
    <div className="bg-gray-50 rounded-lg p-4">
      <p className="text-xs text-gray-600 mb-2">{label}</p>
      <div className="flex items-end gap-2">
        <p className={`text-2xl font-bold ${colorClass}`}>{value || 0}</p>
        <span className="text-xs text-gray-500 mb-1">/100</span>
      </div>
      <div className="mt-2 bg-gray-200 rounded-full h-1.5">
        <div 
          className={`h-1.5 rounded-full transition-all ${
            percentage >= 80 ? 'bg-green-500' : percentage >= 60 ? 'bg-blue-500' : 'bg-orange-500'
          }`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}

function StatCard({ icon, label, value, color = 'blue' }) {
  const colorClasses = {
    blue: 'bg-blue-50 text-blue-600',
    green: 'bg-green-50 text-green-600',
    red: 'bg-red-50 text-red-600',
    purple: 'bg-purple-50 text-purple-600',
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-600 mb-1">{label}</p>
          <p className="text-3xl font-bold text-gray-900">{value}</p>
        </div>
        <div className={colorClasses[color] + ' rounded-lg p-3'}>
          {icon}
        </div>
      </div>
    </div>
  );
}
