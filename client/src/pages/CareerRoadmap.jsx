import { useState, useEffect } from 'react';
import { Map, Calendar, CheckCircle, Loader, Target } from 'lucide-react';
import { roadmapAPI, skillsAPI } from '../services/api';

export default function CareerRoadmap() {
  const [userId] = useState(1);
  const [loading, setLoading] = useState(false);
  const [roadmap, setRoadmap] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadRoadmap();
  }, []);

  const loadRoadmap = async () => {
    try {
      setLoading(true);
      const response = await roadmapAPI.get(userId);
      setRoadmap(response.data.data);
    } catch (err) {
      if (err.response?.status === 404) {
        // No roadmap yet, try to generate one
        await generateRoadmap();
      } else {
        setError(err.response?.data?.error || 'Failed to load roadmap');
      }
    } finally {
      setLoading(false);
    }
  };

  const generateRoadmap = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Get skill gap first
      const skillGapRes = await skillsAPI.analyze({ userId });
      const skillGap = skillGapRes.data.data;

      // Generate roadmap
      const response = await roadmapAPI.generate({
        userId,
        skillGap,
      });

      setRoadmap(response.data.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to generate roadmap');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <Loader className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Generating your career roadmap...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-gray-200">
        <div className="container mx-auto px-6 py-4">
          <h1 className="text-2xl font-bold text-gray-900">Career Roadmap</h1>
        </div>
      </header>

      <main className="container mx-auto px-6 py-8 max-w-6xl">
        {error ? (
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <p className="text-red-800">{error}</p>
            <button
              onClick={generateRoadmap}
              className="mt-4 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
            >
              Try Generating Roadmap
            </button>
          </div>
        ) : roadmap ? (
          <div className="space-y-8">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
              <div className="flex items-center gap-3 mb-6">
                <Map className="w-8 h-8 text-blue-600" />
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Your Career Roadmap</h2>
                  <p className="text-gray-600">{roadmap.roadmap_json?.overallTimeline || 'Personalized timeline'}</p>
                </div>
              </div>

              {roadmap.roadmap_json?.shortTerm && roadmap.roadmap_json.shortTerm.length > 0 && (
                <MilestoneSection
                  title="Short-Term Goals (0-3 months)"
                  milestones={roadmap.roadmap_json.shortTerm}
                  color="blue"
                />
              )}

              {roadmap.roadmap_json?.mediumTerm && roadmap.roadmap_json.mediumTerm.length > 0 && (
                <MilestoneSection
                  title="Medium-Term Goals (3-6 months)"
                  milestones={roadmap.roadmap_json.mediumTerm}
                  color="green"
                />
              )}

              {roadmap.roadmap_json?.longTerm && roadmap.roadmap_json.longTerm.length > 0 && (
                <MilestoneSection
                  title="Long-Term Goals (6-12+ months)"
                  milestones={roadmap.roadmap_json.longTerm}
                  color="purple"
                />
              )}

              {roadmap.roadmap_json?.recommendations && roadmap.roadmap_json.recommendations.length > 0 && (
                <div className="mt-8 p-6 bg-blue-50 rounded-lg">
                  <h3 className="font-semibold text-gray-900 mb-3">Recommendations</h3>
                  <ul className="space-y-2">
                    {roadmap.roadmap_json.recommendations.map((rec, i) => (
                      <li key={i} className="flex items-start gap-2 text-gray-700">
                        <Target className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                        <span>{rec}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
            <Map className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No Roadmap Yet</h3>
            <p className="text-gray-600 mb-6">Generate your personalized career roadmap</p>
            <button
              onClick={generateRoadmap}
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
            >
              Generate Roadmap
            </button>
          </div>
        )}
      </main>
    </div>
  );
}

function MilestoneSection({ title, milestones, color }) {
  const colorClasses = {
    blue: 'border-blue-200 bg-blue-50',
    green: 'border-green-200 bg-green-50',
    purple: 'border-purple-200 bg-purple-50',
  };

  return (
    <div className="mb-8">
      <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
        <Calendar className="w-6 h-6" />
        {title}
      </h3>
      <div className="space-y-4">
        {milestones.map((milestone, i) => (
          <div
            key={i}
            className={`border rounded-lg p-6 ${colorClasses[color]}`}
          >
            <div className="flex items-start justify-between mb-3">
              <h4 className="text-lg font-semibold text-gray-900">{milestone.title}</h4>
              <span className="text-sm text-gray-600">{milestone.timeline}</span>
            </div>
            <p className="text-gray-700 mb-4">{milestone.description}</p>
            
            {milestone.actionItems && milestone.actionItems.length > 0 && (
              <div className="mb-4">
                <p className="text-sm font-medium text-gray-700 mb-2">Action Items:</p>
                <ul className="space-y-1">
                  {milestone.actionItems.map((item, j) => (
                    <li key={j} className="flex items-start gap-2 text-sm text-gray-600">
                      <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {milestone.successMetrics && milestone.successMetrics.length > 0 && (
              <div>
                <p className="text-sm font-medium text-gray-700 mb-2">Success Metrics:</p>
                <ul className="space-y-1">
                  {milestone.successMetrics.map((metric, j) => (
                    <li key={j} className="text-sm text-gray-600">• {metric}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

