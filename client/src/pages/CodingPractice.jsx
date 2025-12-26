import { useState, useEffect } from 'react';
import { Code, Filter, Search, TrendingUp, Clock, CheckCircle, XCircle, Lightbulb, BookOpen, Trophy } from 'lucide-react';
import CodeEditor from '../components/CodeEditor';
import QuestionPanel from '../components/QuestionPanel';
import TestResults from '../components/TestResults';
import { practiceAPI } from '../services/api';

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

  useEffect(() => {
    loadQuestions();
    loadProgress();
  }, [filters]);

  useEffect(() => {
    if (selectedQuestion) {
      loadQuestionDetails(selectedQuestion.id);
      loadUserCode(selectedQuestion.id);
    }
  }, [selectedQuestion]);

  const loadQuestions = async () => {
    try {
      setLoading(true);
      const response = await practiceAPI.getQuestions(filters);
      if (response.data.success) {
        setQuestions(response.data.data || []);
        if (response.data.data && response.data.data.length > 0 && !selectedQuestion) {
          setSelectedQuestion(response.data.data[0]);
        }
      }
    } catch (err) {
      console.error('Error loading questions:', err);
      setError('Failed to load questions');
    } finally {
      setLoading(false);
    }
  };

  const loadQuestionDetails = async (questionId) => {
    try {
      const response = await practiceAPI.getQuestion(questionId);
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

  const getDifficultyColor = (difficulty) => {
    switch (difficulty?.toLowerCase()) {
      case 'easy': return 'text-green-400 bg-green-400/20';
      case 'medium': return 'text-yellow-400 bg-yellow-400/20';
      case 'hard': return 'text-red-400 bg-red-400/20';
      default: return 'text-gray-400 bg-gray-400/20';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a0a0a] via-purple-900/30 to-[#0a0a0a]">
      <div className="container mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-gradient-to-br from-purple-600 to-indigo-600 rounded-xl">
                <Code className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-white">Coding Practice</h1>
                <p className="text-gray-400">Solve problems from GeeksforGeeks & LeetCode</p>
              </div>
            </div>
            {progress && (
              <div className="flex items-center gap-4 glass-card p-4 rounded-xl">
                <div className="text-center">
                  <div className="text-2xl font-bold text-white">{progress.solvedCount || 0}</div>
                  <div className="text-xs text-gray-400">Solved</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-white">{progress.totalAttempts || 0}</div>
                  <div className="text-xs text-gray-400">Attempts</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-white">{progress.accuracy || 0}%</div>
                  <div className="text-xs text-gray-400">Accuracy</div>
                </div>
              </div>
            )}
          </div>

          {/* Filters */}
          <div className="glass-card p-4 rounded-xl">
            <div className="flex items-center gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search questions..."
                  value={filters.search}
                  onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                  className="w-full pl-10 pr-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white hover:bg-white/10 transition-colors flex items-center gap-2"
              >
                <Filter className="w-5 h-5" />
                Filters
              </button>
            </div>

            {showFilters && (
              <div className="mt-4 grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-2">Difficulty</label>
                  <select
                    value={filters.difficulty}
                    onChange={(e) => setFilters({ ...filters, difficulty: e.target.value })}
                    className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="">All</option>
                    <option value="easy">Easy</option>
                    <option value="medium">Medium</option>
                    <option value="hard">Hard</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-2">Topic</label>
                  <select
                    value={filters.topic}
                    onChange={(e) => setFilters({ ...filters, topic: e.target.value })}
                    className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="">All Topics</option>
                    <option value="Arrays">Arrays</option>
                    <option value="Strings">Strings</option>
                    <option value="Trees">Trees</option>
                    <option value="Graphs">Graphs</option>
                    <option value="Dynamic Programming">Dynamic Programming</option>
                    <option value="Greedy">Greedy</option>
                    <option value="Math">Math</option>
                  </select>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-12 gap-6">
          {/* Questions List */}
          <div className="col-span-3">
            <div className="glass-card p-4 rounded-xl h-[calc(100vh-250px)] overflow-y-auto">
              <h2 className="text-lg font-semibold text-white mb-4">Problems</h2>
              {loading ? (
                <div className="text-center text-gray-400 py-8">Loading...</div>
              ) : questions.length === 0 ? (
                <div className="text-center text-gray-400 py-8">No questions found</div>
              ) : (
                <div className="space-y-2">
                  {questions.map((q) => (
                    <button
                      key={q.id}
                      onClick={() => setSelectedQuestion(q)}
                      className={`w-full text-left p-3 rounded-lg transition-all ${
                        selectedQuestion?.id === q.id
                          ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white'
                          : 'bg-white/5 hover:bg-white/10 text-gray-300'
                      }`}
                    >
                      <div className="flex items-start justify-between mb-1">
                        <span className="font-medium text-sm">{q.title}</span>
                        <span className={`px-2 py-0.5 rounded text-xs font-medium ${getDifficultyColor(q.difficulty)}`}>
                          {q.difficulty}
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-1 mt-2">
                        {q.topics?.slice(0, 2).map((topic, i) => (
                          <span key={i} className="text-xs px-2 py-0.5 bg-white/10 rounded">
                            {topic}
                          </span>
                        ))}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
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
                      <button
                        onClick={handleGetHint}
                        className="flex-1 px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white hover:bg-white/10 transition-colors flex items-center justify-center gap-2"
                      >
                        <Lightbulb className="w-4 h-4" />
                        Get Hint
                      </button>
                    </div>
                  )}
                </div>

                {/* Code Editor */}
                <div className="flex flex-col">
                  <div className="glass-card p-4 rounded-xl flex-1 flex flex-col">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold text-white">Code Editor</h3>
                      <select
                        value={language}
                        onChange={(e) => {
                          setLanguage(e.target.value);
                          if (selectedQuestion?.solutionTemplate) {
                            const template = selectedQuestion.solutionTemplate[e.target.value] || '';
                            setCode(template);
                          }
                        }}
                        className="px-3 py-1.5 bg-white/5 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
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
                      <div className="mb-4 p-3 bg-red-500/20 border border-red-500/50 rounded-lg text-red-300 text-sm">
                        {error}
                      </div>
                    )}

                    <div className="flex gap-2">
                      <button
                        onClick={handleRunCode}
                        disabled={executing || !code.trim()}
                        className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                      >
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
                      </button>
                      <button
                        onClick={handleSubmit}
                        disabled={executing || !code.trim()}
                        className="flex-1 px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                      >
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
                      </button>
                    </div>
                  </div>

                  {/* Test Results */}
                  {testResults && (
                    <div className="mt-4">
                      <TestResults results={testResults} />
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="glass-card p-8 rounded-xl text-center">
                <BookOpen className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-400">Select a question to start practicing</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

