import { useEffect, useState } from 'react';
import { Star, Award, TrendingUp, X } from 'lucide-react';

export default function XPNotification({ xpGained, leveledUp, newLevel, unlockedAchievements, onClose }) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    if (xpGained || leveledUp || (unlockedAchievements && unlockedAchievements.length > 0)) {
      setVisible(true);
      const timer = setTimeout(() => {
        setVisible(false);
        if (onClose) onClose();
      }, 5000); // Auto-close after 5 seconds

      return () => clearTimeout(timer);
    }
  }, [xpGained, leveledUp, unlockedAchievements, onClose]);

  if (!visible) return null;

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2 max-w-sm">
      {/* XP Gained Notification */}
      {xpGained && (
        <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-4 animate-slide-in">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-50 rounded-full flex items-center justify-center">
              <Star className="w-5 h-5 text-blue-600" />
            </div>
            <div className="flex-1">
              <p className="font-semibold text-gray-900">XP Gained!</p>
              <p className="text-sm text-gray-600">+{xpGained} experience points</p>
            </div>
            <button
              onClick={() => {
                setVisible(false);
                if (onClose) onClose();
              }}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Level Up Notification */}
      {leveledUp && newLevel && (
        <div className="bg-gradient-to-r from-yellow-50 to-orange-50 rounded-lg shadow-lg border border-yellow-200 p-4 animate-slide-in">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-yellow-600" />
            </div>
            <div className="flex-1">
              <p className="font-bold text-gray-900">Level Up!</p>
              <p className="text-sm text-gray-700">You reached Level {newLevel}</p>
            </div>
            <button
              onClick={() => {
                setVisible(false);
                if (onClose) onClose();
              }}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Achievement Unlocked Notifications */}
      {unlockedAchievements && unlockedAchievements.length > 0 && unlockedAchievements.map((achievement, index) => (
        <div
          key={achievement.id || index}
          className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg shadow-lg border border-purple-200 p-4 animate-slide-in"
          style={{ animationDelay: `${index * 0.1}s` }}
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
              <Award className="w-5 h-5 text-purple-600" />
            </div>
            <div className="flex-1">
              <p className="font-bold text-gray-900">Achievement Unlocked!</p>
              <p className="text-sm font-semibold text-gray-700">{achievement.name}</p>
              {achievement.xpReward > 0 && (
                <p className="text-xs text-gray-600 mt-1">+{achievement.xpReward} XP</p>
              )}
            </div>
            <button
              onClick={() => {
                setVisible(false);
                if (onClose) onClose();
              }}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}



