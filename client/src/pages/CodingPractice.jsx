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
      case 'easy': return 'text-green-700 bg-green-50';
      case 'medium': return 'text-yellow-700 bg-yellow-50';
      case 'hard': return 'text-red-700 bg-red-50';
      default: return 'text-gray-700 bg-gray-50';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-blue-50 rounded-xl">
                <Code className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Coding Practice</h1>
                <p className="text-gray-600 text-sm">Solve problems from GeeksforGeeks & LeetCode</p>
              </div>
            </div>
            {progress && (
              <div className="flex items-center gap-4 bg-white border border-gray-200 p-4 rounded-xl shadow-sm">
                <div className="text-center">
                  <div className="text-xl font-bold text-gray-900">{progress.solvedCount || 0}</div>
                  <div className="text-xs text-gray-600">Solved</div>
                </div>
                <div className="text-center">
                  <div className="text-xl font-bold text-gray-900">{progress.totalAttempts || 0}</div>
                  <div className="text-xs text-gray-600">Attempts</div>
                </div>
                <div className="text-center">
                  <div className="text-xl font-bold text-gray-900">{progress.accuracy || 0}%</div>
                  <div className="text-xs text-gray-600">Accuracy</div>
                </div>
              </div>
            )}
          </div>

          {/* Filters */}
          <div className="bg-white border border-gray-200 p-4 rounded-xl shadow-sm">
            <div className="flex items-center gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search questions..."
                  value={filters.search}
                  onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                  className="w-full pl-10 pr-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="px-4 py-2 bg-gray-100 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-200 transition-colors flex items-center gap-2 text-sm font-medium"
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
                    className="w-full px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">All</option>
                    <option value="easy">Easy</option>
                    <option value="medium">Medium</option>
                    <option value="hard">Hard</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-gray-700 mb-2">Topic</label>
                  <select
                    value={filters.topic}
                    onChange={(e) => setFilters({ ...filters, topic: e.target.value })}
                    className="w-full px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
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
            <div className="bg-white border border-gray-200 p-4 rounded-xl h-[calc(100vh-250px)] overflow-y-auto shadow-sm">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Problems</h2>
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
                      className={`w-full text-left p-3 rounded-lg transition-all border ${
                        selectedQuestion?.id === q.id
                          ? 'bg-blue-50 border-blue-200 text-gray-900'
                          : 'bg-white border-gray-200 hover:border-gray-300 hover:bg-gray-50 text-gray-700'
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
                          <span key={i} className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded">
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
                        className="flex-1 px-4 py-2 bg-gray-100 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-200 transition-colors flex items-center justify-center gap-2 text-sm font-medium"
                      >
                        <Lightbulb className="w-4 h-4" />
                        Get Hint
                      </button>
                    </div>
                  )}
                </div>

                {/* Code Editor */}
                <div className="flex flex-col">
                  <div className="bg-white border border-gray-200 p-4 rounded-xl flex-1 flex flex-col shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold text-gray-900">Code Editor</h3>
                      <select
                        value={language}
                        onChange={(e) => {
                          setLanguage(e.target.value);
                          if (selectedQuestion?.solutionTemplate) {
                            const template = selectedQuestion.solutionTemplate[e.target.value] || '';
                            setCode(template);
                          }
                        }}
                        className="px-3 py-1.5 bg-white border border-gray-300 rounded-lg text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                        className="flex-1 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm font-medium border border-gray-300"
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
                        className="flex-1 px-4 py-2 bg-gray-900 hover:bg-gray-800 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm font-semibold shadow-sm hover:shadow-md"
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
              <div className="bg-white border border-gray-200 p-8 rounded-xl text-center shadow-sm">
                <BookOpen className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">Select a question to start practicing</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

