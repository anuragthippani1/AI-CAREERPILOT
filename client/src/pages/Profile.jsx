import { useState, useEffect } from 'react';
import { User, Edit2, Award, TrendingUp, Calendar, Code, MessageSquare, Save, X, Trophy, Star, Flame } from 'lucide-react';
import { userAPI } from '../services/api';

export default function Profile() {
  const [userId] = useState(1); // Demo user
  const [user, setUser] = useState(null);
  const [stats, setStats] = useState(null);
  const [achievements, setAchievements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    name: '',
    bio: '',
    title: '',
    avatarUrl: ''
  });

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      setLoading(true);
      const [userRes, statsRes, achievementsRes] = await Promise.allSettled([
        userAPI.get(userId),
        userAPI.getStats(userId),
        userAPI.getAchievements(userId)
      ]);

      if (userRes.status === 'fulfilled') {
        const userData = userRes.value.data.data;
        setUser(userData);
        setEditForm({
          name: userData.name || '',
          bio: userData.bio || '',
          title: userData.title || '',
          avatarUrl: userData.avatar_url || ''
        });
      }

      if (statsRes.status === 'fulfilled') {
        setStats(statsRes.value.data.data);
      }

      if (achievementsRes.status === 'fulfilled') {
        setAchievements(achievementsRes.value.data.data || []);
      }
    } catch (error) {
      console.error('Error loading profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      const response = await userAPI.updateProfile(userId, editForm);
      setUser(response.data.data);
      setEditing(false);
    } catch (error) {
      console.error('Error updating profile:', error);
      alert('Failed to update profile');
    }
  };

  const handleCancel = () => {
    setEditForm({
      name: user?.name || '',
      bio: user?.bio || '',
      title: user?.title || '',
      avatarUrl: user?.avatar_url || ''
    });
    setEditing(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-200">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <h1 className="text-xl font-bold text-gray-900">Profile</h1>
        </div>
      </header>

      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 max-w-6xl">
        {/* Profile Header */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex items-start justify-between mb-6">
            <div className="flex items-center gap-4">
              <div className="w-20 h-20 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-full flex items-center justify-center text-white text-2xl font-bold">
                {user?.avatar_url ? (
                  <img src={user.avatar_url} alt={user.name} className="w-20 h-20 rounded-full object-cover" />
                ) : (
                  <User className="w-10 h-10" />
                )}
              </div>
              <div>
                {editing ? (
                  <div className="space-y-3">
                    <input
                      type="text"
                      value={editForm.name}
                      onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                      className="text-2xl font-bold text-gray-900 border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
                      placeholder="Name"
                    />
                    <input
                      type="text"
                      value={editForm.title}
                      onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                      className="text-lg text-gray-600 border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
                      placeholder="Title (e.g., Software Engineer)"
                    />
                    <textarea
                      value={editForm.bio}
                      onChange={(e) => setEditForm({ ...editForm, bio: e.target.value })}
                      className="text-sm text-gray-600 border border-gray-300 rounded-lg px-3 py-2 w-full focus:ring-2 focus:ring-blue-500"
                      placeholder="Bio"
                      rows={3}
                    />
                    <input
                      type="url"
                      value={editForm.avatarUrl}
                      onChange={(e) => setEditForm({ ...editForm, avatarUrl: e.target.value })}
                      className="text-sm text-gray-600 border border-gray-300 rounded-lg px-3 py-2 w-full focus:ring-2 focus:ring-blue-500"
                      placeholder="Avatar URL"
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={handleSave}
                        className="px-4 py-2 bg-gray-900 text-white rounded-lg text-sm font-semibold hover:bg-gray-800 flex items-center gap-2"
                      >
                        <Save className="w-4 h-4" />
                        Save
                      </button>
                      <button
                        onClick={handleCancel}
                        className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-semibold hover:bg-gray-200 flex items-center gap-2"
                      >
                        <X className="w-4 h-4" />
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <h2 className="text-2xl font-bold text-gray-900">{user?.name || 'User'}</h2>
                    {user?.title && <p className="text-lg text-gray-600 mt-1">{user.title}</p>}
                    {user?.bio && <p className="text-sm text-gray-600 mt-2">{user.bio}</p>}
                  </>
                )}
              </div>
            </div>
            {!editing && (
              <button
                onClick={() => setEditing(true)}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-semibold hover:bg-gray-200 flex items-center gap-2"
              >
                <Edit2 className="w-4 h-4" />
                Edit Profile
              </button>
            )}
          </div>
        </div>

        {/* Stats Grid */}
        {stats && (
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <StatCard
              icon={<Star className="w-6 h-6" />}
              label="Level"
              value={stats.level}
              subValue={`${stats.xp} XP`}
            />
            <StatCard
              icon={<Flame className="w-6 h-6" />}
              label="Current Streak"
              value={`${stats.currentStreak} days`}
              subValue={`Longest: ${stats.longestStreak}`}
            />
            <StatCard
              icon={<MessageSquare className="w-6 h-6" />}
              label="Interviews"
              value={stats.interviewStats.completed}
              subValue={`Avg: ${stats.interviewStats.avgScore}%`}
            />
            <StatCard
              icon={<Code className="w-6 h-6" />}
              label="Problems Solved"
              value={stats.codingStats.solved}
              subValue={`Attempted: ${stats.codingStats.attempted}`}
            />
          </div>
        )}

        {/* XP Progress */}
        {stats && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-lg font-semibold text-gray-900">Level Progress</h3>
              <span className="text-sm text-gray-600">
                {stats.xpNeeded} XP to Level {stats.level + 1}
              </span>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-3">
              <div
                className="bg-gradient-to-r from-blue-600 to-indigo-600 h-3 rounded-full transition-all duration-500"
                style={{ width: `${stats.progressToNextLevel}%` }}
              ></div>
            </div>
            <div className="mt-2 text-sm text-gray-600">
              Level {stats.level} • {stats.xp} / {stats.xpForNextLevel} XP
            </div>
          </div>
        )}

        {/* Achievements */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center gap-2 mb-4">
            <Trophy className="w-6 h-6 text-yellow-500" />
            <h3 className="text-lg font-semibold text-gray-900">Achievements</h3>
            <span className="text-sm text-gray-600">
              ({achievements.length} unlocked)
            </span>
          </div>
          {achievements.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No achievements unlocked yet. Keep practicing!</p>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {achievements.map((achievement) => (
                <div
                  key={achievement.id}
                  className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-12 h-12 bg-yellow-50 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Award className="w-6 h-6 text-yellow-600" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-900">{achievement.name}</h4>
                      <p className="text-sm text-gray-600 mt-1">{achievement.description}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <span className="text-xs text-gray-500">
                          +{achievement.xpReward} XP
                        </span>
                        <span className="text-xs text-gray-400">•</span>
                        <span className="text-xs text-gray-500">
                          {new Date(achievement.unlockedAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

function StatCard({ icon, label, value, subValue }) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
      <div className="flex items-center gap-3 mb-2">
        <div className="text-blue-600">{icon}</div>
        <span className="text-sm text-gray-600">{label}</span>
      </div>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
      {subValue && <p className="text-xs text-gray-500 mt-1">{subValue}</p>}
    </div>
  );
}

