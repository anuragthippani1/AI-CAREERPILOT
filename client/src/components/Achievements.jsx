import { useState, useEffect } from 'react';
import { Award, Lock, Star, Trophy, Flame, Code, Target, CheckCircle, MessageSquare } from 'lucide-react';
import { userAPI } from '../services/api';

export default function Achievements({ userId }) {
  const [achievements, setAchievements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    loadAchievements();
  }, [userId]);

  const loadAchievements = async () => {
    try {
      setLoading(true);
      const response = await userAPI.getAchievements(true);
      if (response.data.success) {
        setAchievements(response.data.data || []);
      }
    } catch (error) {
      console.error('Error loading achievements:', error);
    } finally {
      setLoading(false);
    }
  };

  const getCategoryIcon = (category) => {
    switch (category) {
      case 'interviews': return <MessageSquare className="w-5 h-5" />;
      case 'streaks': return <Flame className="w-5 h-5" />;
      case 'coding': return <Code className="w-5 h-5" />;
      case 'milestones': return <Trophy className="w-5 h-5" />;
      default: return <Award className="w-5 h-5" />;
    }
  };

  const getCategoryColor = (category) => {
    switch (category) {
      case 'interviews': return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'streaks': return 'bg-orange-50 text-orange-700 border-orange-200';
      case 'coding': return 'bg-green-50 text-green-700 border-green-200';
      case 'milestones': return 'bg-purple-50 text-purple-700 border-purple-200';
      default: return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  const filteredAchievements = filter === 'all' 
    ? achievements 
    : achievements.filter(a => a.category === filter);

  const categories = ['all', 'interviews', 'streaks', 'coding', 'milestones'];
  const categoryLabels = {
    all: 'All',
    interviews: 'Interviews',
    streaks: 'Streaks',
    coding: 'Coding',
    milestones: 'Milestones'
  };

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-2 text-gray-600">Loading achievements...</p>
      </div>
    );
  }

  const unlockedCount = achievements.filter(a => a.unlocked).length;
  const totalCount = achievements.length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Achievements</h3>
          <p className="text-sm text-gray-600 mt-1">
            {unlockedCount} of {totalCount} unlocked
          </p>
        </div>
      </div>

      {/* Category Filters */}
      <div className="flex flex-wrap gap-2">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setFilter(cat)}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
              filter === cat
                ? 'bg-gray-900 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {categoryLabels[cat]}
          </button>
        ))}
      </div>

      {/* Achievements Grid */}
      {filteredAchievements.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
          <Award className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">No achievements in this category</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredAchievements.map((achievement) => (
            <div
              key={achievement.id}
              className={`border rounded-xl p-4 transition-all ${
                achievement.unlocked
                  ? 'bg-white border-gray-200 hover:shadow-md'
                  : 'bg-gray-50 border-gray-200 opacity-60'
              }`}
            >
              <div className="flex items-start gap-3">
                <div className={`w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0 ${
                  achievement.unlocked
                    ? 'bg-yellow-50 text-yellow-600'
                    : 'bg-gray-100 text-gray-400'
                }`}>
                  {achievement.unlocked ? (
                    <Award className="w-6 h-6" />
                  ) : (
                    <Lock className="w-6 h-6" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className={`font-semibold ${
                      achievement.unlocked ? 'text-gray-900' : 'text-gray-500'
                    }`}>
                      {achievement.name}
                    </h4>
                    {achievement.unlocked && (
                      <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                    )}
                  </div>
                  <p className={`text-sm mb-2 ${
                    achievement.unlocked ? 'text-gray-600' : 'text-gray-400'
                  }`}>
                    {achievement.description}
                  </p>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`px-2 py-1 rounded text-xs font-medium border ${
                      getCategoryColor(achievement.category)
                    }`}>
                      <span className="inline-flex items-center gap-1">
                        {getCategoryIcon(achievement.category)}
                        {achievement.category}
                      </span>
                    </span>
                    <span className="text-xs text-gray-500">
                      +{achievement.xpReward} XP
                    </span>
                  </div>
                  {achievement.unlocked && achievement.unlockedAt && (
                    <p className="text-xs text-gray-400 mt-2">
                      Unlocked {new Date(achievement.unlockedAt).toLocaleDateString()}
                    </p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

