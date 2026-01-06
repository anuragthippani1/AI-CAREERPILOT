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
        <div className="glass-card rounded-xl border border-white/10 p-4 animate-slide-in">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/5 border border-white/10 rounded-xl flex items-center justify-center">
              <Star className="w-5 h-5 text-primary-200" />
            </div>
            <div className="flex-1">
              <p className="font-semibold text-white">XP gained</p>
              <p className="text-sm text-white/70">+{xpGained} XP</p>
            </div>
            <button
              onClick={() => {
                setVisible(false);
                if (onClose) onClose();
              }}
              className="text-white/50 hover:text-white/80 transition-colors cp-focus-ring rounded-md"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Level Up Notification */}
      {leveledUp && newLevel && (
        <div className="glass-card rounded-xl border border-yellow-500/25 p-4 animate-slide-in">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-yellow-500/10 border border-yellow-500/25 rounded-xl flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-yellow-300" />
            </div>
            <div className="flex-1">
              <p className="font-semibold text-white">Level up</p>
              <p className="text-sm text-white/70">You reached Level {newLevel}</p>
            </div>
            <button
              onClick={() => {
                setVisible(false);
                if (onClose) onClose();
              }}
              className="text-white/50 hover:text-white/80 transition-colors cp-focus-ring rounded-md"
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
          className="glass-card rounded-xl border border-purple-500/25 p-4 animate-slide-in"
          style={{ animationDelay: `${index * 0.1}s` }}
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-500/10 border border-purple-500/25 rounded-xl flex items-center justify-center">
              <Award className="w-5 h-5 text-purple-200" />
            </div>
            <div className="flex-1">
              <p className="font-semibold text-white">Achievement unlocked</p>
              <p className="text-sm font-semibold text-white/80">{achievement.name}</p>
              {achievement.xpReward > 0 && (
                <p className="text-xs text-white/60 mt-1">+{achievement.xpReward} XP</p>
              )}
            </div>
            <button
              onClick={() => {
                setVisible(false);
                if (onClose) onClose();
              }}
              className="text-white/50 hover:text-white/80 transition-colors cp-focus-ring rounded-md"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}





