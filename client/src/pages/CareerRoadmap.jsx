import { useState, useEffect } from 'react';
import { Map, Calendar, CheckCircle, Loader, Target } from 'lucide-react';
import { roadmapAPI, skillsAPI } from '../services/api';

function getUserIdFromStorageOrUrl() {
  try {
    const params = new URLSearchParams(window.location.search);
    const fromUrl = params.get('userId');
    const fromStorage =
      localStorage.getItem('careerpilot_user_id') ||
      localStorage.getItem('careerpilotUserId') ||
      localStorage.getItem('userId');

    const raw = (fromUrl || fromStorage || '').toString().trim();
    const id = parseInt(raw, 10);
    return Number.isFinite(id) && id > 0 ? id : null;
  } catch {
    return null;
  }
}

export default function CareerRoadmap() {
  // Demo-safe default while the app has no auth. Supports overriding via ?userId=123 or localStorage.
  const [userId] = useState(() => getUserIdFromStorageOrUrl() ?? 1);
  const [loading, setLoading] = useState(false);
  const [roadmap, setRoadmap] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadRoadmap();
  }, []);

  const fetchRoadmap = async () => {
    const response = await roadmapAPI.get(userId);
    if (response?.data?.success) return response.data.data;
    throw new Error(response?.data?.error || 'Failed to load roadmap');
  };

  const loadRoadmap = async () => {
    try {
      setError(null);
      setLoading(true);
      const data = await fetchRoadmap();
      setRoadmap(data);
    } catch (err) {
      if (err.response?.status === 404) {
        // No roadmap yet
        setRoadmap(null);
      } else {
        setError(err.response?.data?.error || err.message || 'Failed to load roadmap');
      }
    } finally {
      setLoading(false);
    }
  };

  const generateRoadmap = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Try to get skill gap, but don't fail if it doesn't exist
      let skillGap = null;
      try {
        const skillGapRes = await skillsAPI.analyze({ userId });
        // Orchestrator response shape: { success, data: { success, data } }
        const gap = skillGapRes?.data?.data?.data;
        skillGap = gap || null;
      } catch (err) {
        console.warn('Skill gap not available, generating roadmap without it');
      }

      // Generate roadmap (will work even without skill gap)
      const response = await roadmapAPI.generate({
        userId,
        skillGap,
        targetRole: 'Software Engineer', // Default if no goal set
      });

      // Orchestrator response shape: { success, data: { success, data: { roadmapId, roadmap } } }
      if (!response?.data?.success) {
        setError(response?.data?.error || 'Failed to generate roadmap');
        return;
      }

      const agentResult = response.data.data;
      const generatedRoadmap = agentResult?.data?.roadmap || null;
      const agentOk = !!agentResult?.success;

      if (!agentOk) {
        setError(agentResult?.error || 'Failed to generate roadmap');
        return;
      }

      // Preferred: fetch the saved roadmap row (consistent shape used by UI)
      try {
        const saved = await fetchRoadmap();
        setRoadmap(saved);
      } catch {
        // Fallback: show generated roadmap in a compatible shape
        if (generatedRoadmap) {
          setRoadmap({ roadmap_json: generatedRoadmap });
        } else {
          setError('Generated roadmap could not be loaded');
        }
      }
    } catch (err) {
      const errorMsg =
        err.response?.data?.error ||
        err.response?.data?.data?.error ||
        err.message ||
        'Failed to generate roadmap';
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <Loader className="w-12 h-12 animate-spin text-white/70 mx-auto mb-4" />
          <p className="text-white/70">Generating your career roadmap...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 max-w-6xl">
        <h1 className="text-xl font-bold text-white mb-6">Career Roadmap</h1>
        {error ? (
          <div className="glass-card border border-red-500/30 rounded-lg p-6">
            <p className="text-red-200">{error}</p>
            <button
              onClick={generateRoadmap}
              className="mt-4 bg-blue-500/80 hover:bg-blue-500 text-white px-4 py-2 rounded-lg text-sm font-semibold shadow-sm hover:shadow-md"
            >
              Try Generating Roadmap
            </button>
          </div>
        ) : roadmap ? (
          <div className="space-y-8">
            <div className="glass-card rounded-xl border border-white/10 p-8">
              <div className="flex items-center gap-3 mb-6">
                <Map className="w-8 h-8 text-blue-400" />
                <div>
                  <h2 className="text-2xl font-bold text-white">Your Career Roadmap</h2>
                  <p className="text-white/70">{roadmap.roadmap_json?.overallTimeline || 'Personalized timeline'}</p>
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
                <div className="mt-8 p-6 bg-white/5 border border-white/10 rounded-lg">
                  <h3 className="font-semibold text-white mb-3">Recommendations</h3>
                  <ul className="space-y-2">
                    {roadmap.roadmap_json.recommendations.map((rec, i) => (
                      <li key={i} className="flex items-start gap-2 text-white/80">
                        <Target className="w-5 h-5 text-blue-400 mt-0.5 flex-shrink-0" />
                        <span>{rec}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="glass-card rounded-xl border border-white/10 p-8 text-center">
            <Map className="w-16 h-16 text-white/40 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">No Roadmap Yet</h3>
            <p className="text-white/70 mb-6">Generate your personalized career roadmap</p>
            <button
              onClick={generateRoadmap}
              className="bg-blue-500/80 hover:bg-blue-500 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
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
    blue: 'border-white/10 bg-white/5',
    green: 'border-white/10 bg-white/5',
    purple: 'border-white/10 bg-white/5',
  };

  return (
    <div className="mb-8">
      <h3 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
        <Calendar className="w-6 h-6 text-white/70" />
        {title}
      </h3>
      <div className="space-y-4">
        {milestones.map((milestone, i) => (
          <div
            key={i}
            className={`border rounded-lg p-6 ${colorClasses[color]}`}
          >
            <div className="flex items-start justify-between mb-3">
              <h4 className="text-lg font-semibold text-white">{milestone.title}</h4>
              <span className="text-sm text-white/60">{milestone.timeline}</span>
            </div>
            <p className="text-white/80 mb-4">{milestone.description}</p>
            
            {milestone.actionItems && milestone.actionItems.length > 0 && (
              <div className="mb-4">
                <p className="text-sm font-medium text-white/80 mb-2">Action Items:</p>
                <ul className="space-y-1">
                  {milestone.actionItems.map((item, j) => (
                    <li key={j} className="flex items-start gap-2 text-sm text-white/70">
                      <CheckCircle className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {milestone.successMetrics && milestone.successMetrics.length > 0 && (
              <div>
                <p className="text-sm font-medium text-white/80 mb-2">Success Metrics:</p>
                <ul className="space-y-1">
                  {milestone.successMetrics.map((metric, j) => (
                    <li key={j} className="text-sm text-white/70">• {metric}</li>
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

