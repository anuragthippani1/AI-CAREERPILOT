import { CheckCircle, XCircle, Lightbulb, BookOpen, AlertCircle } from 'lucide-react';

export default function QuestionPanel({ question, hint, explanation }) {
  if (!question) {
    return (
      <div className="glass-card p-6 rounded-xl">
        <p className="text-gray-400">No question selected</p>
      </div>
    );
  }

  const getDifficultyColor = (difficulty) => {
    switch (difficulty?.toLowerCase()) {
      case 'easy': return 'text-green-400 bg-green-400/20';
      case 'medium': return 'text-yellow-400 bg-yellow-400/20';
      case 'hard': return 'text-red-400 bg-red-400/20';
      default: return 'text-gray-400 bg-gray-400/20';
    }
  };

  return (
    <div className="glass-card p-6 rounded-xl">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-start justify-between mb-3">
          <h2 className="text-2xl font-bold text-white flex-1">{question.title}</h2>
          <span className={`px-3 py-1 rounded-lg text-sm font-medium ml-3 ${getDifficultyColor(question.difficulty)}`}>
            {question.difficulty}
          </span>
        </div>
        <div className="flex flex-wrap gap-2">
          {question.topics?.map((topic, i) => (
            <span key={i} className="px-2 py-1 bg-purple-500/20 text-purple-300 rounded text-xs">
              {topic}
            </span>
          ))}
        </div>
      </div>

      {/* Description */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-white mb-3">Description</h3>
        <div className="text-gray-300 whitespace-pre-wrap leading-relaxed" dangerouslySetInnerHTML={{ __html: question.description.replace(/\n/g, '<br/>') }} />
      </div>

      {/* Constraints */}
      {question.constraints && (
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-white mb-3">Constraints</h3>
          <div className="text-gray-300 whitespace-pre-wrap bg-white/5 p-4 rounded-lg">
            {question.constraints}
          </div>
        </div>
      )}

      {/* Examples */}
      {question.examples && question.examples.length > 0 && (
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-white mb-3">Examples</h3>
          <div className="space-y-4">
            {question.examples.map((example, i) => (
              <div key={i} className="bg-white/5 p-4 rounded-lg">
                <div className="text-sm text-gray-400 mb-2">Example {i + 1}:</div>
                {example.input && (
                  <div className="mb-2">
                    <span className="text-gray-400 text-sm">Input: </span>
                    <code className="text-purple-300 bg-white/5 px-2 py-1 rounded">{example.input}</code>
                  </div>
                )}
                {example.output && (
                  <div className="mb-2">
                    <span className="text-gray-400 text-sm">Output: </span>
                    <code className="text-green-300 bg-white/5 px-2 py-1 rounded">{example.output}</code>
                  </div>
                )}
                {example.explanation && (
                  <div className="mt-2 text-sm text-gray-400">
                    <span className="text-gray-400">Explanation: </span>
                    {example.explanation}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Hint */}
      {hint && (
        <div className="mb-6 p-4 bg-yellow-500/20 border border-yellow-500/50 rounded-lg">
          <div className="flex items-start gap-3">
            <Lightbulb className="w-5 h-5 text-yellow-400 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <h4 className="text-yellow-400 font-semibold mb-2">Hint</h4>
              <p className="text-yellow-200 text-sm">{hint.hint}</p>
              {hint.concepts && hint.concepts.length > 0 && (
                <div className="mt-2">
                  <span className="text-yellow-300 text-xs">Key concepts: </span>
                  <span className="text-yellow-200 text-xs">{hint.concepts.join(', ')}</span>
                </div>
              )}
              {hint.nextStep && (
                <div className="mt-2 text-yellow-200 text-xs">
                  <span className="text-yellow-300">Next step: </span>
                  {hint.nextStep}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Explanation */}
      {explanation && (
        <div className="mb-6 p-4 bg-blue-500/20 border border-blue-500/50 rounded-lg">
          <div className="flex items-start gap-3">
            <BookOpen className="w-5 h-5 text-blue-400 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <h4 className="text-blue-400 font-semibold mb-2">Solution Explanation</h4>
              <p className="text-blue-200 text-sm whitespace-pre-wrap">{explanation.explanation}</p>
              {explanation.keyConcepts && explanation.keyConcepts.length > 0 && (
                <div className="mt-3">
                  <span className="text-blue-300 text-xs font-semibold">Key Concepts: </span>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {explanation.keyConcepts.map((concept, i) => (
                      <span key={i} className="px-2 py-1 bg-blue-500/30 text-blue-200 rounded text-xs">
                        {concept}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              {explanation.improvements && explanation.improvements.length > 0 && (
                <div className="mt-3">
                  <span className="text-blue-300 text-xs font-semibold">Improvements: </span>
                  <ul className="list-disc list-inside mt-1 text-blue-200 text-xs space-y-1">
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

