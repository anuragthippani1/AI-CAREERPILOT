import { CheckCircle, XCircle, Clock, AlertCircle } from 'lucide-react';
import { Card, CardContent } from './ui/Card';
import Badge from './ui/Badge';

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
    <Card>
      <CardContent className="pt-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-white">Test results</h3>
        <Badge variant={success ? 'success' : 'danger'} className="px-3 py-1.5 rounded-lg">
          {passedCount} / {totalCount} passed
        </Badge>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-white/5 p-3 rounded-lg border border-white/10">
          <div className="text-xs text-white/60 mb-1">Status</div>
          <div className={`font-semibold text-sm ${success ? 'text-green-200' : 'text-red-200'}`}>
            {success ? 'All tests passed' : 'Some tests failed'}
          </div>
        </div>
        <div className="bg-white/5 p-3 rounded-lg border border-white/10">
          <div className="text-xs text-white/60 mb-1">Execution time</div>
          <div className="text-white font-semibold text-sm">{executionTime.toFixed(2)} ms</div>
        </div>
        <div className="bg-white/5 p-3 rounded-lg border border-white/10">
          <div className="text-xs text-white/60 mb-1">Memory usage</div>
          <div className="text-white font-semibold text-sm">
            {memoryUsage > 0 ? `${(memoryUsage / 1024).toFixed(2)} MB` : 'N/A'}
          </div>
        </div>
      </div>

      {/* Test Cases */}
      {results.results && results.results.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-sm font-semibold text-white">Test cases</h4>
          {results.results.map((test, index) => (
            <div
              key={index}
              className={`p-4 rounded-lg border ${
                test.passed
                  ? 'bg-green-500/10 border-green-500/25'
                  : 'bg-red-500/10 border-red-500/25'
              }`}
            >
              <div className="flex items-center gap-3 mb-3">
                {test.passed ? (
                  <CheckCircle className="w-5 h-5 text-green-300" />
                ) : (
                  <XCircle className="w-5 h-5 text-red-300" />
                )}
                <span className={`font-semibold text-sm ${
                  test.passed ? 'text-green-200' : 'text-red-200'
                }`}>
                  Test {index + 1} — {test.status || (test.passed ? 'Passed' : 'Failed')}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <div className="text-white/60 mb-1 text-xs">Input</div>
                  <code className="block bg-black/20 p-2 rounded border border-white/10 text-white/80 break-all text-xs font-mono">
                    {test.input || 'N/A'}
                  </code>
                </div>
                <div>
                  <div className="text-white/60 mb-1 text-xs">Expected output</div>
                  <code className="block bg-black/20 p-2 rounded border border-white/10 text-white/80 break-all text-xs font-mono">
                    {test.expectedOutput || 'N/A'}
                  </code>
                </div>
                <div className="col-span-2">
                  <div className="text-white/60 mb-1 text-xs">Your output</div>
                  <code className={`block bg-black/20 p-2 rounded border border-white/10 break-all text-xs font-mono ${
                    test.passed ? 'text-green-200' : 'text-red-200'
                  }`}>
                    {test.actualOutput || 'N/A'}
                  </code>
                </div>
                {test.error && (
                  <div className="col-span-2">
                    <div className="text-white/60 mb-1 flex items-center gap-2 text-xs">
                      <AlertCircle className="w-4 h-4 text-red-200" />
                      Error
                    </div>
                    <code className="block bg-red-500/10 p-2 rounded border border-red-500/25 text-red-200 break-all text-xs">
                      {test.error}
                    </code>
                  </div>
                )}
                {test.executionTime > 0 && (
                  <div className="col-span-2 flex items-center gap-2 text-xs text-white/60">
                    <Clock className="w-3 h-3 text-white/50" />
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
        <div className="mt-4 p-4 bg-green-500/10 border border-green-500/25 rounded-lg">
          <div className="flex items-center gap-2 text-green-200">
            <CheckCircle className="w-5 h-5 text-green-300" />
            <span className="font-semibold text-sm">All test cases passed.</span>
          </div>
        </div>
      )}
      </CardContent>
    </Card>
  );
}
