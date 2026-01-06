import { useState, useEffect } from 'react';
import { Code, Filter, Search, TrendingUp, Clock, CheckCircle, XCircle, Lightbulb, BookOpen, Trophy } from 'lucide-react';
import CodeEditor from '../components/CodeEditor';
import QuestionPanel from '../components/QuestionPanel';
import TestResults from '../components/TestResults';
import XPNotification from '../components/XPNotification';
import { practiceAPI, technicalChallengesAPI } from '../services/api';
import PageHeader from '../components/ui/PageHeader';
import Button from '../components/ui/Button';
import { Card, CardContent } from '../components/ui/Card';
import EmptyState from '../components/ui/EmptyState';
import Badge from '../components/ui/Badge';
import { Skeleton } from '../components/ui/Skeleton';

export default function CodingPractice() {
  const [userId] = useState(1); // Demo user
  const [questions, setQuestions] = useState([]);
  const [selectedQuestion, setSelectedQuestion] = useState(null);
  const [code, setCode] = useState('');
  const [language, setLanguage] = useState('python');
  const [loading, setLoading] = useState(false);
  const [executing, setExecuting] = useState(false);
  const [testResults, setTestResults] = useState(null);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    difficulty: '',
    topic: '',
    search: ''
  });
  const [showFilters, setShowFilters] = useState(false);
  const [progress, setProgress] = useState(null);
  const [hint, setHint] = useState(null);
  const [explanation, setExplanation] = useState(null);
  const [xpNotification, setXpNotification] = useState(null);

  useEffect(() => {
    loadQuestions();
    loadProgress();
  }, [filters]);

  useEffect(() => {
    if (selectedQuestion?.id) {
      loadQuestionDetails(selectedQuestion.id);
      loadUserCode(selectedQuestion.id);
    }
  }, [selectedQuestion?.id]);

  const loadQuestions = async () => {
    try {
      setLoading(true);
      const response = await technicalChallengesAPI.getChallenges(filters);
      if (response.data.success) {
        setQuestions(response.data.data || []);
        if (response.data.data && response.data.data.length > 0 && !selectedQuestion) {
          setSelectedQuestion(response.data.data[0]);
        }
      }
    } catch (err) {
      console.error('Error loading questions:', err);
      setError('Failed to load technical challenges');
    } finally {
      setLoading(false);
    }
  };

  const loadQuestionDetails = async (questionId) => {
    try {
      const response = await technicalChallengesAPI.getChallenge(questionId);
      if (response.data.success) {
        setSelectedQuestion(response.data.data);
      }
    } catch (err) {
      console.error('Error loading question details:', err);
    }
  };

  const loadUserCode = async (questionId) => {
    try {
      const response = await practiceAPI.getUserCode(userId, questionId);
      if (response.data.success && response.data.data) {
        setCode(response.data.data.code || '');
        setLanguage(response.data.data.language || 'python');
      } else if (selectedQuestion?.solutionTemplate) {
        // Load template if available
        const template = selectedQuestion.solutionTemplate[language] || selectedQuestion.solutionTemplate['python'] || '';
        setCode(template);
      }
    } catch (err) {
      // If no saved code, use template
      if (selectedQuestion?.solutionTemplate) {
        const template = selectedQuestion.solutionTemplate[language] || selectedQuestion.solutionTemplate['python'] || '';
        setCode(template);
      }
    }
  };

  const loadProgress = async () => {
    try {
      const response = await practiceAPI.getProgress(userId);
      if (response.data.success) {
        setProgress(response.data.data);
      }
    } catch (err) {
      console.error('Error loading progress:', err);
    }
  };

  const handleRunCode = async () => {
    if (!selectedQuestion || !code.trim()) {
      setError('Please select a question and write some code');
      return;
    }

    setExecuting(true);
    setError(null);
    setTestResults(null);

    try {
      const response = await practiceAPI.executeCode({
        questionId: selectedQuestion.id,
        code,
        language
      });

      if (response.data.success) {
        setTestResults(response.data.data);
      } else {
        setError(response.data.error || 'Execution failed');
      }
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Failed to execute code');
    } finally {
      setExecuting(false);
    }
  };

  const handleSubmit = async () => {
    if (!selectedQuestion || !code.trim()) {
      setError('Please select a question and write some code');
      return;
    }

    setExecuting(true);
    setError(null);
    setTestResults(null);
    setExplanation(null);

    try {
      const response = await practiceAPI.submitSolution({
        userId,
        questionId: selectedQuestion.id,
        code,
        language
      });

      if (response.data.success) {
        setTestResults(response.data.data.executionResult);
        setExplanation(response.data.data.explanation);
        
        // Show XP and achievement notifications if problem was solved
        if (response.data.data.executionResult?.success) {
          if (response.data.data.xpGained || response.data.data.leveledUp || response.data.data.unlockedAchievements?.length > 0) {
            setXpNotification({
              xpGained: response.data.data.xpGained,
              leveledUp: response.data.data.leveledUp,
              newLevel: response.data.data.newLevel,
              unlockedAchievements: response.data.data.unlockedAchievements || []
            });
          }
        }
        
        await loadProgress();
        await loadQuestionDetails(selectedQuestion.id);
      } else {
        setError(response.data.error || 'Submission failed');
      }
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Failed to submit solution');
    } finally {
      setExecuting(false);
    }
  };

  const handleGetHint = async () => {
    if (!selectedQuestion) return;

    try {
      const response = await practiceAPI.getHint(userId, selectedQuestion.id, code);
      if (response.data.success) {
        setHint(response.data.data);
      }
    } catch (err) {
      console.error('Error getting hint:', err);
    }
  };

  const difficultyVariant = (difficulty) => {
    switch ((difficulty || '').toLowerCase()) {
      case 'easy': return 'success';
      case 'medium': return 'warning';
      case 'hard': return 'danger';
      default: return 'neutral';
    }
  };

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

      <div className="cp-page-inner max-w-7xl space-y-6">
        <PageHeader
          title="Practice"
          description="Solve curated coding challenges with hints, tests, and instant feedback."
        />

        {progress ? (
          <div className="grid sm:grid-cols-3 gap-4 cp-fade-in">
            <Card depth className="p-4">
              <div className="text-sm text-white/70">Solved</div>
              <div className="text-2xl font-semibold text-white mt-1">{progress.solvedCount || 0}</div>
            </Card>
            <Card depth className="p-4">
              <div className="text-sm text-white/70">Attempts</div>
              <div className="text-2xl font-semibold text-white mt-1">{progress.totalAttempts || 0}</div>
            </Card>
            <Card depth className="p-4">
              <div className="text-sm text-white/70">Accuracy</div>
              <div className="text-2xl font-semibold text-white mt-1">{progress.accuracy || 0}%</div>
            </Card>
          </div>
        ) : null}

        {/* Filters */}
        <Card className="cp-fade-in-delay-1">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                <input
                  type="text"
                  placeholder="Search challenges…"
                  value={filters.search}
                  onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                  className="cp-input pl-9"
                />
              </div>
              <Button variant="secondary" onClick={() => setShowFilters(!showFilters)}>
                <Filter className="w-4 h-4" />
                Filters
              </Button>
            </div>

            {showFilters ? (
              <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-white/70 mb-2">Difficulty</label>
                  <select
                    value={filters.difficulty}
                    onChange={(e) => setFilters({ ...filters, difficulty: e.target.value })}
                    className="cp-select"
                  >
                    <option value="">All</option>
                    <option value="easy">Easy</option>
                    <option value="medium">Medium</option>
                    <option value="hard">Hard</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-white/70 mb-2">Topic</label>
                  <select
                    value={filters.topic}
                    onChange={(e) => setFilters({ ...filters, topic: e.target.value })}
                    className="cp-select"
                  >
                    <option value="">All topics</option>
                    <option value="Arrays">Arrays</option>
                    <option value="Strings">Strings</option>
                    <option value="Hashing">Hashing</option>
                    <option value="Linked List">Linked List</option>
                    <option value="Stack & Queue">Stack & Queue</option>
                    <option value="Recursion">Recursion</option>
                    <option value="Trees">Trees</option>
                    <option value="Binary Search">Binary Search</option>
                    <option value="Graphs">Graphs</option>
                    <option value="Dynamic Programming">Dynamic Programming</option>
                    <option value="Greedy">Greedy</option>
                    <option value="Bit Manipulation">Bit Manipulation</option>
                    <option value="Math">Math</option>
                  </select>
                </div>
              </div>
            ) : null}
          </CardContent>
        </Card>

        <div className="grid grid-cols-12 gap-6">
          {/* Questions List */}
          <div className="col-span-3">
            <Card className="h-[calc(100vh-250px)] overflow-hidden">
              <CardContent className="pt-6 h-full flex flex-col">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-white">Challenges</h2>
                <span className="text-xs text-white/50">{questions.length} items</span>
              </div>
              {loading ? (
                <div className="space-y-2">
                  <Skeleton className="h-10 rounded-lg" />
                  <Skeleton className="h-10 rounded-lg" />
                  <Skeleton className="h-10 rounded-lg" />
                  <Skeleton className="h-10 rounded-lg" />
                </div>
              ) : error ? (
                <div className="bg-red-500/10 border border-red-500/25 rounded-lg p-4 text-sm text-red-200">
                  {error}
                </div>
              ) : questions.length === 0 ? (
                <EmptyState
                  icon={BookOpen}
                  title="No challenges yet"
                  description="Seed the database (see setup docs) or clear filters to see available problems."
                />
              ) : (
                <div className="space-y-2 overflow-y-auto pr-1">
                  {questions.map((q) => (
                    <button
                      key={q.id}
                      onClick={() => setSelectedQuestion(q)}
                      className={`w-full text-left p-3 rounded-lg transition-colors border ${
                        selectedQuestion?.id === q.id
                          ? 'bg-white/8 border-white/15 text-white'
                          : 'bg-white/5 border-white/10 hover:border-white/15 hover:bg-white/6 text-white/80'
                      }`}
                    >
                      <div className="flex items-start justify-between mb-1">
                        <span className="font-medium text-sm">{q.title}</span>
                        <Badge variant={difficultyVariant(q.difficulty)}>{q.difficulty}</Badge>
                      </div>
                      <div className="flex flex-wrap gap-1 mt-2">
                        {q.topics?.slice(0, 2).map((topic, i) => (
                          <Badge key={i} variant="neutral" className="text-[11px]">
                            {topic}
                          </Badge>
                        ))}
                      </div>
                    </button>
                  ))}
                </div>
              )}
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <div className="col-span-9">
            {selectedQuestion ? (
              <div className="grid grid-cols-2 gap-6 h-[calc(100vh-250px)]">
                {/* Question Panel */}
                <div className="overflow-y-auto">
                  <QuestionPanel question={selectedQuestion} hint={hint} explanation={explanation} />
                  {selectedQuestion && (
                    <div className="mt-4 flex gap-2">
                      <Button variant="secondary" onClick={handleGetHint} className="flex-1">
                        <Lightbulb className="w-4 h-4" />
                        Get Hint
                      </Button>
                    </div>
                  )}
                </div>

                {/* Code Editor */}
                <div className="flex flex-col">
                  <Card className="flex-1 flex flex-col overflow-hidden">
                    <CardContent className="pt-6 flex-1 flex flex-col">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold text-white">Editor</h3>
                      <select
                        value={language}
                        onChange={(e) => {
                          setLanguage(e.target.value);
                          if (selectedQuestion?.solutionTemplate) {
                            const template = selectedQuestion.solutionTemplate[e.target.value] || '';
                            setCode(template);
                          }
                        }}
                        className="cp-select w-auto"
                      >
                        <option value="python">Python</option>
                        <option value="javascript">JavaScript</option>
                        <option value="java">Java</option>
                        <option value="cpp">C++</option>
                      </select>
                    </div>

                    <div className="flex-1 mb-4">
                      <CodeEditor
                        value={code}
                        onChange={setCode}
                        language={language}
                        theme="vs-dark"
                      />
                    </div>

                    {error && (
                      <div className="mb-4 p-3 bg-red-500/10 border border-red-500/25 rounded-lg text-red-200 text-sm">
                        {error}
                      </div>
                    )}

                    <div className="flex gap-2">
                      <Button variant="secondary" onClick={handleRunCode} disabled={executing || !code.trim()} className="flex-1">
                        {executing ? (
                          <>
                            <Clock className="w-4 h-4 animate-spin" />
                            Running...
                          </>
                        ) : (
                          <>
                            <Code className="w-4 h-4" />
                            Run Code
                          </>
                        )}
                      </Button>
                      <Button onClick={handleSubmit} disabled={executing || !code.trim()} className="flex-1">
                        {executing ? (
                          <>
                            <Clock className="w-4 h-4 animate-spin" />
                            Submitting...
                          </>
                        ) : (
                          <>
                            <CheckCircle className="w-4 h-4" />
                            Submit
                          </>
                        )}
                      </Button>
                    </div>
                    </CardContent>
                  </Card>

                  {/* Test Results */}
                  {testResults && (
                    <div className="mt-4">
                      <TestResults results={testResults} />
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <Card>
                <CardContent className="pt-6">
                  <EmptyState
                    icon={BookOpen}
                    title="Select a challenge"
                    description="Pick a problem from the left to start practicing."
                  />
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

