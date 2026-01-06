import { CheckCircle, XCircle, Lightbulb, BookOpen, AlertCircle } from 'lucide-react';
import { Card, CardContent } from './ui/Card';
import Badge from './ui/Badge';

export default function QuestionPanel({ question, hint, explanation }) {
  if (!question) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-white/70 text-sm">No challenge selected</p>
        </CardContent>
      </Card>
    );
  }

  const difficultyVariant = (difficulty) => {
    switch ((difficulty || '').toLowerCase()) {
      case 'easy': return 'success';
      case 'medium': return 'warning';
      case 'hard': return 'danger';
      default: return 'neutral';
    }
  };

  return (
    <Card>
      <CardContent className="pt-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-start justify-between mb-3">
          <h2 className="text-xl font-semibold text-white flex-1">{question.title}</h2>
          <Badge className="ml-3" variant={difficultyVariant(question.difficulty)}>
            {question.difficulty}
          </Badge>
        </div>
        <div className="flex flex-wrap gap-2">
          {question.topics?.map((topic, i) => (
            <Badge key={i} variant="info">{topic}</Badge>
          ))}
        </div>
      </div>

      {/* Description */}
      <div className="mb-6">
        <h3 className="text-base font-semibold text-white mb-3">Problem</h3>
        <div
          className="text-white/75 whitespace-pre-wrap leading-relaxed text-sm"
          dangerouslySetInnerHTML={{ __html: (question.description || '').replace(/\n/g, '<br/>') }}
        />
      </div>

      {/* Constraints */}
      {question.constraints && (
        <div className="mb-6">
          <h3 className="text-base font-semibold text-white mb-3">Constraints</h3>
          <div className="text-white/75 whitespace-pre-wrap bg-white/5 p-4 rounded-lg border border-white/10 text-sm">
            {question.constraints}
          </div>
        </div>
      )}

      {/* Examples */}
      {question.examples && question.examples.length > 0 && (
        <div className="mb-6">
          <h3 className="text-base font-semibold text-white mb-3">Examples</h3>
          <div className="space-y-4">
            {question.examples.map((example, i) => (
              <div key={i} className="bg-white/5 p-4 rounded-lg border border-white/10">
                <div className="text-sm text-white/60 mb-2 font-medium">Example {i + 1}</div>
                {example.input && (
                  <div className="mb-2">
                    <span className="text-white/60 text-sm">Input: </span>
                    <code className="text-white bg-black/20 px-2 py-1 rounded text-sm font-mono border border-white/10">{example.input}</code>
                  </div>
                )}
                {example.output && (
                  <div className="mb-2">
                    <span className="text-white/60 text-sm">Output: </span>
                    <code className="text-white bg-black/20 px-2 py-1 rounded text-sm font-mono border border-white/10">{example.output}</code>
                  </div>
                )}
                {example.explanation && (
                  <div className="mt-2 text-sm text-white/70">
                    <span className="text-white/60 font-medium">Explanation: </span>
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
          <h3 className="text-base font-semibold text-white mb-3">Expected approach</h3>
          <div className="text-white/75 whitespace-pre-wrap bg-primary-500/10 p-4 rounded-lg border border-primary-400/20 text-sm">
            {question.expectedApproach}
          </div>
        </div>
      )}

      {/* Hint */}
      {hint && (
        <div className="mb-6 p-4 bg-yellow-500/10 border border-yellow-500/25 rounded-lg">
          <div className="flex items-start gap-3">
            <Lightbulb className="w-5 h-5 text-yellow-300 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <h4 className="text-yellow-200 font-semibold mb-2 text-sm">Hint</h4>
              <p className="text-yellow-100/90 text-sm">{hint.hint}</p>
              {hint.concepts && hint.concepts.length > 0 && (
                <div className="mt-2">
                  <span className="text-yellow-200 text-xs font-medium">Key concepts: </span>
                  <span className="text-yellow-100/90 text-xs">{hint.concepts.join(', ')}</span>
                </div>
              )}
              {hint.nextStep && (
                <div className="mt-2 text-yellow-100/90 text-xs">
                  <span className="text-yellow-200 font-medium">Next step: </span>
                  {hint.nextStep}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Explanation */}
      {explanation && (
        <div className="mb-6 p-4 bg-primary-500/10 border border-primary-400/20 rounded-lg">
          <div className="flex items-start gap-3">
            <BookOpen className="w-5 h-5 text-primary-200 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <h4 className="text-white font-semibold mb-2 text-sm">Solution explanation</h4>
              <p className="text-white/75 text-sm whitespace-pre-wrap">{explanation.explanation}</p>
              {explanation.keyConcepts && explanation.keyConcepts.length > 0 && (
                <div className="mt-3">
                  <span className="text-white text-xs font-semibold">Key concepts: </span>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {explanation.keyConcepts.map((concept, i) => (
                      <Badge key={i} variant="info" className="text-[11px]">
                        {concept}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
              {explanation.improvements && explanation.improvements.length > 0 && (
                <div className="mt-3">
                  <span className="text-white text-xs font-semibold">Improvements: </span>
                  <ul className="list-disc list-inside mt-1 text-white/75 text-xs space-y-1">
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
      </CardContent>
    </Card>
  );
}
