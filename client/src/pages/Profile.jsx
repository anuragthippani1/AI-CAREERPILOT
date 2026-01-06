import { useState, useEffect } from 'react';
import { User, Edit2, Award, TrendingUp, Calendar, Code, MessageSquare, Save, X, Trophy, Star, Flame } from 'lucide-react';
import { userAPI } from '../services/api';
import PageHeader from '../components/ui/PageHeader';
import Button from '../components/ui/Button';
import { Card, CardContent } from '../components/ui/Card';
import EmptyState from '../components/ui/EmptyState';
import { PageSkeleton } from '../components/ui/Skeleton';

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
    return <PageSkeleton />;
  }

  return (
    <div className="cp-page">
      <main className="cp-page-inner max-w-6xl space-y-6">
        <PageHeader
          title="Profile"
          description="Manage your details and track progress across interviews and practice."
          actions={
            editing ? (
              <>
                <Button onClick={handleSave}>
                  <Save className="w-4 h-4" />
                  Save
                </Button>
                <Button variant="secondary" onClick={handleCancel}>
                  <X className="w-4 h-4" />
                  Cancel
                </Button>
              </>
            ) : (
              <Button onClick={() => setEditing(true)}>
                <Edit2 className="w-4 h-4" />
                Edit profile
              </Button>
            )
          }
        />

        {/* Profile Header */}
        <Card>
          <CardContent className="pt-6">
          <div className="flex items-start justify-between mb-6">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center text-white text-xl font-semibold overflow-hidden">
                {user?.avatar_url ? (
                  <img src={user.avatar_url} alt={user.name} className="w-full h-full object-cover" />
                ) : (
                  <User className="w-8 h-8 text-white/70" />
                )}
              </div>
              <div>
                {editing ? (
                  <div className="space-y-3">
                    <input
                      type="text"
                      value={editForm.name}
                      onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                      className="cp-input text-lg font-semibold"
                      placeholder="Name"
                    />
                    <input
                      type="text"
                      value={editForm.title}
                      onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                      className="cp-input"
                      placeholder="Title (e.g., Software Engineer)"
                    />
                    <textarea
                      value={editForm.bio}
                      onChange={(e) => setEditForm({ ...editForm, bio: e.target.value })}
                      className="cp-input min-h-[90px]"
                      placeholder="Bio"
                      rows={3}
                    />
                    <input
                      type="url"
                      value={editForm.avatarUrl}
                      onChange={(e) => setEditForm({ ...editForm, avatarUrl: e.target.value })}
                      className="cp-input"
                      placeholder="Avatar URL"
                    />
                  </div>
                ) : (
                  <>
                    <h2 className="text-xl font-semibold text-white">{user?.name || 'User'}</h2>
                    {user?.title && <p className="text-sm text-white/70 mt-1">{user.title}</p>}
                    {user?.bio && <p className="text-sm text-white/70 mt-2">{user.bio}</p>}
                  </>
                )}
              </div>
            </div>
          </div>
          </CardContent>
        </Card>

        {/* Stats Grid */}
        {stats && (
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
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
          <Card>
            <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-lg font-semibold text-white">Level progress</h3>
              <span className="text-sm text-white/60">
                {stats.xpNeeded} XP to Level {stats.level + 1}
              </span>
            </div>
            <div className="w-full bg-white/5 rounded-full h-3 border border-white/10 overflow-hidden">
              <div
                className="bg-primary-500/80 h-3 rounded-full transition-all duration-200"
                style={{ width: `${stats.progressToNextLevel}%` }}
              ></div>
            </div>
            <div className="mt-2 text-sm text-white/60">
              Level {stats.level} • {stats.xp} / {stats.xpForNextLevel} XP
            </div>
            </CardContent>
          </Card>
        )}

        {/* Achievements */}
        <Card>
          <CardContent className="pt-6">
          <div className="flex items-center gap-2 mb-4">
            <Trophy className="w-5 h-5 text-yellow-300" />
            <h3 className="text-lg font-semibold text-white">Achievements</h3>
            <span className="text-sm text-white/60">({achievements.length} unlocked)</span>
          </div>
          {achievements.length === 0 ? (
            <EmptyState
              icon={Award}
              title="No achievements yet"
              description="Complete your first interview or solve a coding challenge to start unlocking milestones."
            />
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {achievements.map((achievement) => (
                <div
                  key={achievement.id}
                  className="rounded-xl border border-white/10 bg-white/5 p-4 modern-card hover:border-white/15 transition-colors"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 bg-white/5 rounded-lg border border-white/10 flex items-center justify-center flex-shrink-0">
                      <Award className="w-5 h-5 text-yellow-300" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-white">{achievement.name}</h4>
                      <p className="text-sm text-white/70 mt-1">{achievement.description}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <span className="text-xs text-white/60">
                          +{achievement.xpReward} XP
                        </span>
                        <span className="text-xs text-white/30">•</span>
                        <span className="text-xs text-white/60">
                          {new Date(achievement.unlockedAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}

function StatCard({ icon, label, value, subValue }) {
  return (
    <Card className="p-4">
      <div className="flex items-center gap-3 mb-2">
        <div className="text-primary-300">{icon}</div>
        <span className="text-sm text-white/70">{label}</span>
      </div>
      <p className="text-2xl font-semibold text-white">{value}</p>
      {subValue && <p className="text-xs text-white/60 mt-1">{subValue}</p>}
    </Card>
  );
}



