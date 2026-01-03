import { CheckCircle, XCircle, Lightbulb, BookOpen, AlertCircle } from 'lucide-react';

export default function QuestionPanel({ question, hint, explanation }) {
  if (!question) {
    return (
      <div className="bg-white border border-gray-200 p-6 rounded-xl shadow-sm">
        <p className="text-gray-600">No question selected</p>
      </div>
    );
  }

  const getDifficultyColor = (difficulty) => {
    switch (difficulty?.toLowerCase()) {
      case 'easy': return 'text-green-700 bg-green-50';
      case 'medium': return 'text-yellow-700 bg-yellow-50';
      case 'hard': return 'text-red-700 bg-red-50';
      default: return 'text-gray-700 bg-gray-50';
    }
  };

  return (
    <div className="bg-white border border-gray-200 p-6 rounded-xl shadow-sm">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-start justify-between mb-3">
          <h2 className="text-xl font-bold text-gray-900 flex-1">{question.title}</h2>
          <span className={`px-3 py-1 rounded-lg text-sm font-medium ml-3 ${getDifficultyColor(question.difficulty)}`}>
            {question.difficulty}
          </span>
        </div>
        <div className="flex flex-wrap gap-2">
          {question.topics?.map((topic, i) => (
            <span key={i} className="px-2 py-1 bg-blue-50 text-blue-700 rounded text-xs font-medium">
              {topic}
            </span>
          ))}
        </div>
      </div>

      {/* Description */}
      <div className="mb-6">
        <h3 className="text-base font-semibold text-gray-900 mb-3">Description</h3>
        <div className="text-gray-700 whitespace-pre-wrap leading-relaxed text-sm" dangerouslySetInnerHTML={{ __html: question.description.replace(/\n/g, '<br/>') }} />
      </div>

      {/* Constraints */}
      {question.constraints && (
        <div className="mb-6">
          <h3 className="text-base font-semibold text-gray-900 mb-3">Constraints</h3>
          <div className="text-gray-700 whitespace-pre-wrap bg-gray-50 p-4 rounded-lg border border-gray-200 text-sm">
            {question.constraints}
          </div>
        </div>
      )}

      {/* Examples */}
      {question.examples && question.examples.length > 0 && (
        <div className="mb-6">
          <h3 className="text-base font-semibold text-gray-900 mb-3">Examples</h3>
          <div className="space-y-4">
            {question.examples.map((example, i) => (
              <div key={i} className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                <div className="text-sm text-gray-600 mb-2 font-medium">Example {i + 1}:</div>
                {example.input && (
                  <div className="mb-2">
                    <span className="text-gray-600 text-sm">Input: </span>
                    <code className="text-blue-700 bg-blue-50 px-2 py-1 rounded text-sm font-mono">{example.input}</code>
                  </div>
                )}
                {example.output && (
                  <div className="mb-2">
                    <span className="text-gray-600 text-sm">Output: </span>
                    <code className="text-green-700 bg-green-50 px-2 py-1 rounded text-sm font-mono">{example.output}</code>
                  </div>
                )}
                {example.explanation && (
                  <div className="mt-2 text-sm text-gray-600">
                    <span className="text-gray-600 font-medium">Explanation: </span>
                    {example.explanation}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Expected Approach */}
      {question.expectedApproach && (
        <div className="mb-6">
          <h3 className="text-base font-semibold text-gray-900 mb-3">Expected Approach</h3>
          <div className="text-gray-700 whitespace-pre-wrap bg-blue-50/60 p-4 rounded-lg border border-blue-200 text-sm">
            {question.expectedApproach}
          </div>
        </div>
      )}

      {/* Hint */}
      {hint && (
        <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <div className="flex items-start gap-3">
            <Lightbulb className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <h4 className="text-yellow-800 font-semibold mb-2 text-sm">Hint</h4>
              <p className="text-yellow-900 text-sm">{hint.hint}</p>
              {hint.concepts && hint.concepts.length > 0 && (
                <div className="mt-2">
                  <span className="text-yellow-800 text-xs font-medium">Key concepts: </span>
                  <span className="text-yellow-900 text-xs">{hint.concepts.join(', ')}</span>
                </div>
              )}
              {hint.nextStep && (
                <div className="mt-2 text-yellow-900 text-xs">
                  <span className="text-yellow-800 font-medium">Next step: </span>
                  {hint.nextStep}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Explanation */}
      {explanation && (
        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-start gap-3">
            <BookOpen className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <h4 className="text-blue-800 font-semibold mb-2 text-sm">Solution Explanation</h4>
              <p className="text-blue-900 text-sm whitespace-pre-wrap">{explanation.explanation}</p>
              {explanation.keyConcepts && explanation.keyConcepts.length > 0 && (
                <div className="mt-3">
                  <span className="text-blue-800 text-xs font-semibold">Key Concepts: </span>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {explanation.keyConcepts.map((concept, i) => (
                      <span key={i} className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">
                        {concept}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              {explanation.improvements && explanation.improvements.length > 0 && (
                <div className="mt-3">
                  <span className="text-blue-800 text-xs font-semibold">Improvements: </span>
                  <ul className="list-disc list-inside mt-1 text-blue-900 text-xs space-y-1">
                    {explanation.improvements.map((improvement, i) => (
                      <li key={i}>{improvement}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
