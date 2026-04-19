import { useState, useEffect } from 'react';
import { MessageSquare, Send, Loader, CheckCircle, AlertCircle, Clock, BarChart3, TrendingUp, FileText, Calendar, Target, Award } from 'lucide-react';
import { interviewAPI } from '../services/api';
import XPNotification from '../components/XPNotification';
import PageHeader from '../components/ui/PageHeader';
import Button from '../components/ui/Button';
import { Card, CardContent } from '../components/ui/Card';
import EmptyState from '../components/ui/EmptyState';
import Badge from '../components/ui/Badge';
import { PageSkeleton } from '../components/ui/Skeleton';

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
      const response = await interviewAPI.getSessions();
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
      <div className="cp-page">
        <main className="cp-page-inner max-w-6xl space-y-6">
          <PageHeader
            title="Interview history"
            description="Review recent performance and track trends over time."
            actions={
              <Button variant="secondary" onClick={() => setShowHistory(false)}>
                Back to interview
              </Button>
            }
          />
          {overallStats && (
            <div className="grid md:grid-cols-4 gap-4">
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

          <Card>
            <CardContent className="pt-6">
              <h2 className="text-lg font-semibold text-white mb-4">Recent interviews</h2>
              <div className="space-y-3">
                {interviewHistory.length === 0 ? (
                  <EmptyState
                    icon={MessageSquare}
                    title="No interviews yet"
                    description="Start a mock interview to begin building history and trends."
                    primaryAction={
                      <Button onClick={() => setShowHistory(false)}>Start an interview</Button>
                    }
                  />
                ) : (
                  interviewHistory.map((session) => {
                    const statusVariant =
                      session.status === 'completed'
                        ? 'success'
                        : session.status === 'in_progress'
                          ? 'warning'
                          : 'neutral';
                    return (
                      <div
                        key={session.id}
                        className="rounded-xl border border-white/10 bg-white/5 p-4"
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="min-w-0">
                            <h3 className="font-semibold text-white truncate">{session.role_title}</h3>
                            <p className="text-sm text-white/60 mt-1">
                              {new Date(session.created_at).toLocaleDateString()} •{' '}
                              {new Date(session.created_at).toLocaleTimeString()}
                            </p>
                          </div>
                          <div className="text-right flex-shrink-0">
                            <div className="text-2xl font-semibold text-white">
                              {session.overall_score ? `${Math.round(session.overall_score)}%` : '—'}
                            </div>
                            <Badge variant={statusVariant}>{session.status}</Badge>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  if (!sessionId) {
    return (
      <div className="cp-page">
        <main className="cp-page-inner max-w-4xl space-y-6">
          <PageHeader
            title="Mock interview"
            description="Practice structured interviews and get detailed feedback. One session takes ~10 minutes."
            actions={
              interviewHistory.length > 0 ? (
                <Button variant="secondary" onClick={() => setShowHistory(true)}>
                  <BarChart3 className="w-4 h-4" />
                  History
                </Button>
              ) : null
            }
          />
          {overallStats && (
            <div className="grid sm:grid-cols-3 gap-4">
              <Card className="p-4">
                <div className="text-sm text-white/70">Average score</div>
                <div className="text-2xl font-semibold text-white mt-1">{overallStats.averageScore}%</div>
              </Card>
              <Card className="p-4">
                <div className="text-sm text-white/70">Total interviews</div>
                <div className="text-2xl font-semibold text-white mt-1">{overallStats.totalInterviews}</div>
              </Card>
              <Card className="p-4">
                <div className="text-sm text-white/70">Trend</div>
                <div className="text-2xl font-semibold text-white mt-1">
                  {overallStats.trend > 0 ? '+' : ''}
                  {overallStats.trend}
                </div>
              </Card>
            </div>
          )}

          <Card>
            <CardContent className="pt-6">
            <div className="mb-6">
              <h2 className="text-lg font-semibold text-white">Start a new session</h2>
              <p className="text-sm text-white/70 mt-1">Choose a role and interview type. You’ll get one question at a time.</p>
            </div>

            <div className="space-y-6">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-white/80 mb-2">
                    Target role <span className="text-white/40">*</span>
                  </label>
                  <input
                    type="text"
                    value={roleTitle}
                    onChange={(e) => setRoleTitle(e.target.value)}
                    placeholder="e.g., Frontend Engineer (React)"
                    className="cp-input"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-white/80 mb-2">Company (optional)</label>
                  <input
                    type="text"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    placeholder="e.g., Google"
                    className="cp-input"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-white/80 mb-2">Interview type</label>
                <select
                  value={interviewType}
                  onChange={(e) => setInterviewType(e.target.value)}
                  className="cp-select"
                >
                  <option value="technical">Technical Interview</option>
                  <option value="behavioral">Behavioral Interview</option>
                  <option value="mixed">Mixed (Technical + Behavioral)</option>
                  <option value="system-design">System Design</option>
                  <option value="leadership">Leadership & Management</option>
                </select>
              </div>

              {error && (
                <div className="bg-red-500/10 border border-red-500/25 rounded-lg p-4 flex items-start gap-2">
                  <AlertCircle className="w-5 h-5 text-red-300 mt-0.5" />
                  <p className="text-red-200 text-sm">{error}</p>
                </div>
              )}

              <Button onClick={startInterview} disabled={loading} className="w-full">
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
              </Button>
            </div>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  return (
    <div className="cp-page">
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

      <main className="cp-page-inner max-w-5xl space-y-6">
        <PageHeader
          title={`${companyName ? `${companyName} — ` : ''}${roleTitle || 'Interview'} `}
          description={`${interviewType.charAt(0).toUpperCase() + interviewType.slice(1)} session • Question ${questionNumber} / ${totalQuestions || '?'}`}
          actions={
            <div className="flex items-center gap-2">
              <Badge variant="neutral">{formatTime(elapsedTime)}</Badge>
              <Button variant="secondary" onClick={() => setShowHistory(true)}>
                <BarChart3 className="w-4 h-4" />
                History
              </Button>
            </div>
          }
        />
        {isComplete ? (
          <Card className="cp-fade-in">
            <CardContent className="pt-6">
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-green-500/10 border border-green-500/25 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-10 h-10 text-green-300" />
              </div>
              <h2 className="text-2xl font-semibold text-white mb-2">Session complete</h2>
              <p className="text-white/70">Total time: {formatTime(elapsedTime)}</p>
            </div>

            {feedback && (
              <div className="bg-white/5 border border-white/10 rounded-xl p-6 mb-6">
                <h3 className="font-semibold text-white mb-4 text-lg">Final assessment</h3>
                <div className="grid md:grid-cols-2 gap-4 mb-4">
                  <div className="bg-black/20 border border-white/10 rounded-lg p-4">
                    <p className="text-sm text-white/70 mb-1">Overall performance</p>
                    <p className="text-3xl font-semibold text-white">{feedback.overallScore || 0}/100</p>
                  </div>
                  <div className="bg-black/20 border border-white/10 rounded-lg p-4">
                    <p className="text-sm text-white/70 mb-1">Session duration</p>
                    <p className="text-3xl font-semibold text-white">{formatTime(elapsedTime)}</p>
                  </div>
                </div>
                {xpNotification && (
                  <div className="bg-black/20 border border-white/10 rounded-lg p-4 mb-4">
                    <p className="text-sm text-white/70 mb-1">XP earned</p>
                    <p className="text-2xl font-semibold text-white">
                      +{xpNotification.xpGained || 0} XP
                    </p>
                    {xpNotification.leveledUp && (
                      <p className="text-sm text-white/70 mt-1">
                        Level up: you’re now Level {xpNotification.newLevel}
                      </p>
                    )}
                  </div>
                )}
                {xpNotification?.unlockedAchievements && xpNotification.unlockedAchievements.length > 0 && (
                  <div className="bg-black/20 border border-white/10 rounded-lg p-4 mb-4">
                    <p className="text-sm font-semibold text-white mb-2">Achievements unlocked</p>
                    <div className="space-y-2">
                      {xpNotification.unlockedAchievements.map((achievement, i) => (
                        <div key={i} className="flex items-center gap-2">
                          <Award className="w-4 h-4 text-yellow-300" />
                          <span className="text-sm text-white/80">{achievement.name}</span>
                          <span className="text-xs text-white/50">+{achievement.xpReward} XP</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {feedback.summary && (
                  <p className="text-white/75">{feedback.summary}</p>
                )}
              </div>
            )}

            <div className="flex gap-4">
              <Button
                onClick={() => {
                  setSessionId(null);
                  setCurrentQuestion(null);
                  setFeedback(null);
                  setIsComplete(false);
                  setQuestionNumber(1);
                  setAnswer('');
                }}
                className="flex-1"
              >
                Start New Interview
              </Button>
              <Button variant="secondary" onClick={() => setShowHistory(true)} className="flex-1">
                View history
              </Button>
            </div>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {currentQuestion && (
              <Card>
                <CardContent className="pt-6">
                <div className="flex items-start gap-4 mb-4">
                  <div className="bg-white/5 border border-white/10 rounded-xl p-3">
                    <MessageSquare className="w-6 h-6 text-primary-200" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant="info">Question {questionNumber}</Badge>
                      {currentQuestion.questionType && (
                        <Badge variant="neutral">{currentQuestion.questionType}</Badge>
                      )}
                    </div>
                    <p className="text-xl font-semibold text-white mb-2">{currentQuestion.question}</p>
                    {currentQuestion.context && (
                      <p className="text-sm text-white/70">{currentQuestion.context}</p>
                    )}
                    {currentQuestion.hints && currentQuestion.hints.length > 0 && (
                      <div className="mt-3 p-3 bg-primary-500/10 border border-primary-400/20 rounded-lg">
                        <p className="text-xs font-medium text-white mb-1">Hints</p>
                        <ul className="text-xs text-white/75 space-y-1">
                          {currentQuestion.hints.map((hint, i) => (
                            <li key={i}>• {hint}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
                </CardContent>
              </Card>
            )}

            {feedback && (
              <Card>
                <CardContent className="pt-6">
                <h3 className="font-semibold text-white mb-4 text-lg flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-primary-200" />
                  Feedback
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                  <ScoreCard label="Clarity" value={feedback.clarity} />
                  <ScoreCard label="Technical" value={feedback.technicalAccuracy} />
                  <ScoreCard label="Relevance" value={feedback.relevance} />
                  <ScoreCard label="Communication" value={feedback.communication} />
                </div>
                <div className="mb-4 p-4 bg-white/5 border border-white/10 rounded-lg">
                  <p className="text-sm font-medium text-white/80 mb-2">Overall score</p>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 bg-white/5 border border-white/10 rounded-full h-3 overflow-hidden">
                      <div 
                        className="bg-primary-500/80 h-3 rounded-full transition-all duration-200"
                        style={{ width: `${feedback.overallScore || 0}%` }}
                      />
                    </div>
                    <span className="text-lg font-semibold text-white">{feedback.overallScore || 0}/100</span>
                  </div>
                </div>
                {feedback.strengths && feedback.strengths.length > 0 && (
                  <div className="mb-4">
                    <p className="text-sm font-medium text-white/80 mb-2 flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-300" />
                      Strengths
                    </p>
                    <ul className="list-disc list-inside text-sm text-white/70 space-y-1">
                      {feedback.strengths.map((strength, i) => (
                        <li key={i}>{strength}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {feedback.improvements && feedback.improvements.length > 0 && (
                  <div className="mb-4">
                    <p className="text-sm font-medium text-white/80 mb-2 flex items-center gap-2">
                      <Target className="w-4 h-4 text-yellow-300" />
                      Improvements
                    </p>
                    <ul className="list-disc list-inside text-sm text-white/70 space-y-1">
                      {feedback.improvements.map((improvement, i) => (
                        <li key={i}>{improvement}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {feedback.comments && (
                  <div className="p-4 bg-primary-500/10 border border-primary-400/20 rounded-lg">
                    <p className="text-sm text-white/75">{feedback.comments}</p>
                  </div>
                )}
                </CardContent>
              </Card>
            )}

            {!isComplete && currentQuestion && (
              <Card>
                <CardContent className="pt-6">
                <label className="block text-sm font-medium text-white/80 mb-2">
                  Your answer
                </label>
                <textarea
                  value={answer}
                  onChange={(e) => setAnswer(e.target.value)}
                  rows={8}
                  className="cp-input w-full px-4 py-3 mb-4 font-sans min-h-[180px]"
                  placeholder="Write a structured answer. Be specific and use examples."
                />
                <div className="flex items-center justify-between mb-4">
                  <p className="text-xs text-white/50">
                    {answer.length} characters
                  </p>
                  <p className="text-xs text-white/50">
                    Recommended: 150-300 words
                  </p>
                </div>
                {error && (
                  <div className="bg-red-500/10 border border-red-500/25 rounded-lg p-3 mb-4 flex items-start gap-2">
                    <AlertCircle className="w-5 h-5 text-red-300 mt-0.5" />
                    <p className="text-red-200 text-sm">{error}</p>
                  </div>
                )}
                <Button onClick={submitAnswer} disabled={loading || !answer.trim()} className="w-full">
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
                </Button>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

function ScoreCard({ label, value }) {
  const percentage = value || 0;
  const colorClass =
    percentage >= 80 ? 'text-green-200' : percentage >= 60 ? 'text-primary-200' : 'text-yellow-200';
  
  return (
    <div className="bg-white/5 border border-white/10 rounded-lg p-4">
      <p className="text-xs text-white/60 mb-2">{label}</p>
      <div className="flex items-end gap-2">
        <p className={`text-2xl font-semibold ${colorClass}`}>{value || 0}</p>
        <span className="text-xs text-white/40 mb-1">/100</span>
      </div>
      <div className="mt-2 bg-white/5 border border-white/10 rounded-full h-1.5 overflow-hidden">
        <div 
          className={`h-1.5 rounded-full transition-all duration-200 ${
            percentage >= 80 ? 'bg-green-400/80' : percentage >= 60 ? 'bg-primary-400/80' : 'bg-yellow-400/80'
          }`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}

function StatCard({ icon, label, value, color = 'blue' }) {
  const colorClasses = {
    blue: 'bg-primary-500/10 text-primary-200 border border-primary-400/20',
    green: 'bg-green-500/10 text-green-200 border border-green-500/20',
    red: 'bg-red-500/10 text-red-200 border border-red-500/20',
    purple: 'bg-purple-500/10 text-purple-200 border border-purple-500/20',
  };

  return (
    <Card depth className="p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-white/70 mb-1">{label}</p>
          <p className="text-3xl font-semibold text-white">{value}</p>
        </div>
        <div className={colorClasses[color] + ' rounded-lg p-3'}>
          {icon}
        </div>
      </div>
    </Card>
  );
}
