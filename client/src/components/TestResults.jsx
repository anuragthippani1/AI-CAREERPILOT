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
    <div className="bg-white border border-gray-200 p-6 rounded-xl shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Test Results</h3>
        <div className={`px-4 py-2 rounded-lg font-semibold text-sm ${
          success 
            ? 'bg-green-50 text-green-700 border border-green-200' 
            : 'bg-red-50 text-red-700 border border-red-200'
        }`}>
          {passedCount} / {totalCount} Passed
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
          <div className="text-xs text-gray-600 mb-1">Status</div>
          <div className={`font-semibold text-sm ${success ? 'text-green-600' : 'text-red-600'}`}>
            {success ? 'All Tests Passed' : 'Some Tests Failed'}
          </div>
        </div>
        <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
          <div className="text-xs text-gray-600 mb-1">Execution Time</div>
          <div className="text-gray-900 font-semibold text-sm">{executionTime.toFixed(2)} ms</div>
        </div>
        <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
          <div className="text-xs text-gray-600 mb-1">Memory Usage</div>
          <div className="text-gray-900 font-semibold text-sm">
            {memoryUsage > 0 ? `${(memoryUsage / 1024).toFixed(2)} MB` : 'N/A'}
          </div>
        </div>
      </div>

      {/* Test Cases */}
      {results.results && results.results.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-sm font-semibold text-gray-900">Test Cases</h4>
          {results.results.map((test, index) => (
            <div
              key={index}
              className={`p-4 rounded-lg border ${
                test.passed
                  ? 'bg-green-50 border-green-200'
                  : 'bg-red-50 border-red-200'
              }`}
            >
              <div className="flex items-center gap-3 mb-3">
                {test.passed ? (
                  <CheckCircle className="w-5 h-5 text-green-600" />
                ) : (
                  <XCircle className="w-5 h-5 text-red-600" />
                )}
                <span className={`font-semibold text-sm ${
                  test.passed ? 'text-green-700' : 'text-red-700'
                }`}>
                  Test Case {index + 1} - {test.status || (test.passed ? 'Passed' : 'Failed')}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <div className="text-gray-600 mb-1 text-xs">Input</div>
                  <code className="block bg-white p-2 rounded border border-gray-200 text-gray-700 break-all text-xs font-mono">
                    {test.input || 'N/A'}
                  </code>
                </div>
                <div>
                  <div className="text-gray-600 mb-1 text-xs">Expected Output</div>
                  <code className="block bg-white p-2 rounded border border-gray-200 text-green-700 break-all text-xs font-mono">
                    {test.expectedOutput || 'N/A'}
                  </code>
                </div>
                <div className="col-span-2">
                  <div className="text-gray-600 mb-1 text-xs">Your Output</div>
                  <code className={`block bg-white p-2 rounded border border-gray-200 break-all text-xs font-mono ${
                    test.passed ? 'text-green-700' : 'text-red-700'
                  }`}>
                    {test.actualOutput || 'N/A'}
                  </code>
                </div>
                {test.error && (
                  <div className="col-span-2">
                    <div className="text-gray-600 mb-1 flex items-center gap-2 text-xs">
                      <AlertCircle className="w-4 h-4" />
                      Error
                    </div>
                    <code className="block bg-red-50 p-2 rounded border border-red-200 text-red-700 break-all text-xs">
                      {test.error}
                    </code>
                  </div>
                )}
                {test.executionTime > 0 && (
                  <div className="col-span-2 flex items-center gap-2 text-xs text-gray-600">
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
        <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-center gap-2 text-green-700">
            <CheckCircle className="w-5 h-5" />
            <span className="font-semibold text-sm">Congratulations! All test cases passed.</span>
          </div>
        </div>
      )}
    </div>
  );
}
