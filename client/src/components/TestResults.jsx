import { CheckCircle, XCircle, Clock, AlertCircle } from 'lucide-react';

export default function TestResults({ results }) {
  if (!results) {
    return null;
  }

  const passedCount = results.passedTests || 0;
  const totalCount = results.totalTests || 0;
  const success = results.success || false;
  const executionTime = results.executionTime || 0;
  const memoryUsage = results.memoryUsage || 0;

  return (
    <div className="glass-card p-6 rounded-xl">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-white">Test Results</h3>
        <div className={`px-4 py-2 rounded-lg font-semibold ${
          success 
            ? 'bg-green-500/20 text-green-400' 
            : 'bg-red-500/20 text-red-400'
        }`}>
          {passedCount} / {totalCount} Passed
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-white/5 p-3 rounded-lg">
          <div className="text-xs text-gray-400 mb-1">Status</div>
          <div className={`font-semibold ${success ? 'text-green-400' : 'text-red-400'}`}>
            {success ? 'All Tests Passed' : 'Some Tests Failed'}
          </div>
        </div>
        <div className="bg-white/5 p-3 rounded-lg">
          <div className="text-xs text-gray-400 mb-1">Execution Time</div>
          <div className="text-white font-semibold">{executionTime.toFixed(2)} ms</div>
        </div>
        <div className="bg-white/5 p-3 rounded-lg">
          <div className="text-xs text-gray-400 mb-1">Memory Usage</div>
          <div className="text-white font-semibold">
            {memoryUsage > 0 ? `${(memoryUsage / 1024).toFixed(2)} MB` : 'N/A'}
          </div>
        </div>
      </div>

      {/* Test Cases */}
      {results.results && results.results.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-sm font-semibold text-white">Test Cases</h4>
          {results.results.map((test, index) => (
            <div
              key={index}
              className={`p-4 rounded-lg border ${
                test.passed
                  ? 'bg-green-500/10 border-green-500/30'
                  : 'bg-red-500/10 border-red-500/30'
              }`}
            >
              <div className="flex items-center gap-3 mb-3">
                {test.passed ? (
                  <CheckCircle className="w-5 h-5 text-green-400" />
                ) : (
                  <XCircle className="w-5 h-5 text-red-400" />
                )}
                <span className={`font-semibold ${
                  test.passed ? 'text-green-400' : 'text-red-400'
                }`}>
                  Test Case {index + 1} - {test.status || (test.passed ? 'Passed' : 'Failed')}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <div className="text-gray-400 mb-1">Input</div>
                  <code className="block bg-white/5 p-2 rounded text-gray-300 break-all">
                    {test.input || 'N/A'}
                  </code>
                </div>
                <div>
                  <div className="text-gray-400 mb-1">Expected Output</div>
                  <code className="block bg-white/5 p-2 rounded text-green-300 break-all">
                    {test.expectedOutput || 'N/A'}
                  </code>
                </div>
                <div className="col-span-2">
                  <div className="text-gray-400 mb-1">Your Output</div>
                  <code className={`block bg-white/5 p-2 rounded break-all ${
                    test.passed ? 'text-green-300' : 'text-red-300'
                  }`}>
                    {test.actualOutput || 'N/A'}
                  </code>
                </div>
                {test.error && (
                  <div className="col-span-2">
                    <div className="text-gray-400 mb-1 flex items-center gap-2">
                      <AlertCircle className="w-4 h-4" />
                      Error
                    </div>
                    <code className="block bg-red-500/20 p-2 rounded text-red-300 break-all text-xs">
                      {test.error}
                    </code>
                  </div>
                )}
                {test.executionTime > 0 && (
                  <div className="col-span-2 flex items-center gap-2 text-xs text-gray-400">
                    <Clock className="w-3 h-3" />
                    Execution time: {test.executionTime.toFixed(2)} ms
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Success Message */}
      {success && (
        <div className="mt-4 p-4 bg-green-500/20 border border-green-500/50 rounded-lg">
          <div className="flex items-center gap-2 text-green-400">
            <CheckCircle className="w-5 h-5" />
            <span className="font-semibold">Congratulations! All test cases passed.</span>
          </div>
        </div>
      )}
    </div>
  );
}

