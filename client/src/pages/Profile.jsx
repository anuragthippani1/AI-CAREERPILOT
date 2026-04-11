import { useState, useEffect } from 'react';
import { User, Edit2, Award, Code, MessageSquare, Save, X, Trophy, Star, Flame, Target, TrendingUp } from 'lucide-react';
import { Link } from 'react-router-dom';
import { userAPI } from '../services/api';
import PageHeader from '../components/ui/PageHeader';
import Button from '../components/ui/Button';
import { Card, CardContent } from '../components/ui/Card';
import EmptyState from '../components/ui/EmptyState';
import { PageSkeleton } from '../components/ui/Skeleton';
import Badge from '../components/ui/Badge';

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

  useEffect(() => {
    document.body.dataset.cpBg = 'profile';
    return () => {
      delete document.body.dataset.cpBg;
    };
  }, []);

  const loadProfile = async () => {
    try {
      setLoading(true);
      const [userRes, statsRes, achievementsRes] = await Promise.allSettled([
        userAPI.get(userId),
        userAPI.getStats(),
        userAPI.getAchievements(),
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
      <main className="cp-page-inner max-w-6xl cp-space-y-8">
        <PageHeader
          title="Your Profile"
          description="Your career identity and progress across practice and interviews."
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
              <Button variant="secondary" size="sm" onClick={() => setEditing(true)}>
                <Edit2 className="w-4 h-4" />
                Edit
              </Button>
            )
          }
        />

        {/* Profile Identity Card */}
        <Card className="cp-fade-in">
          <CardContent className="p-6">
            <div className="flex items-start justify-between cp-gap-6">
              <div className="flex items-start cp-gap-4">
                <div className="w-20 h-20 bg-white/5 border border-white/10 rounded-xl flex items-center justify-center text-white text-xl font-semibold overflow-hidden flex-shrink-0">
                  {user?.avatar_url ? (
                    <img src={user.avatar_url} alt={user.name} className="w-full h-full object-cover" />
                  ) : (
                    <User className="w-10 h-10 text-white/60" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  {editing ? (
                    <div className="cp-space-y-3">
                      <input
                        type="text"
                        value={editForm.name}
                        onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                        className="cp-input cp-text-xl-semibold"
                        placeholder="Name"
                      />
                      <input
                        type="text"
                        value={editForm.title}
                        onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                        className="cp-input"
                        placeholder="Title (e.g., Aspiring AI Engineer)"
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
                      <div className="flex items-center cp-gap-3 mb-2">
                        <h2 className="cp-h2">{user?.name || 'User'}</h2>
                        {stats && (
                          <Badge variant="info" className="text-xs">
                            Level {stats.level}
                          </Badge>
                        )}
                      </div>
                      <p className="cp-text-base-muted mt-1">
                        {user?.title || 'Aspiring Software Engineer'}
                      </p>
                      {user?.bio && <p className="cp-text-sm-muted mt-2">{user.bio}</p>}
                      <p className="cp-text-xs-muted mt-3">
                        This profile reflects your activity across practice and interviews.
                      </p>
                    </>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Career Signals */}
        {stats ? (
          <div className="cp-space-y-4 cp-fade-in-delay-1">
            <h2 className="cp-h2">Career Signals</h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 cp-gap-4">
              <SignalCard
                icon={<Star className="w-5 h-5" />}
                label="Current Level"
                value={stats.level}
                subValue={`${stats.xp.toLocaleString()} XP`}
                explanation="Improves placement readiness"
              />
              <SignalCard
                icon={<Flame className="w-5 h-5" />}
                label="Consistency"
                value={`${stats.currentStreak} days`}
                subValue={`Longest: ${stats.longestStreak} days`}
                explanation="Signals discipline to recruiters"
              />
              <SignalCard
                icon={<MessageSquare className="w-5 h-5" />}
                label="Interview Readiness"
                value={stats.interviewStats.completed}
                subValue={`Avg: ${stats.interviewStats.avgScore}%`}
                explanation="Reflects communication skills"
              />
              <SignalCard
                icon={<Code className="w-5 h-5" />}
                label="Problem Solving Activity"
                value={stats.codingStats.solved}
                subValue={`Attempted: ${stats.codingStats.attempted}`}
                explanation="Builds technical confidence"
              />
            </div>
          </div>
        ) : (
          <Card className="cp-fade-in-delay-1">
            <CardContent className="pt-6">
              <EmptyState
                icon={TrendingUp}
                title="No activity yet"
                description="Start practicing to build your career signals."
                size="sm"
                primaryAction={
                  <Button asChild>
                    <Link to="/practice">Start practicing</Link>
                  </Button>
                }
              />
            </CardContent>
          </Card>
        )}

        {/* Progress Section */}
        {stats ? (
          <Card className="cp-fade-in-delay-2">
            <CardContent className="p-6">
              <div className="cp-space-y-4">
                <div>
                  <h3 className="cp-text-lg-semibold mb-1">Your progress toward the next level</h3>
                  <p className="cp-text-sm-muted">
                    Earn XP by completing challenges, interviews, and milestones.
                  </p>
                </div>
                <div className="cp-space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="cp-text-sm-muted">Level {stats.level}</span>
                    <span className="cp-text-sm-semibold text-white">
                      {stats.xpNeeded} XP to Level {stats.level + 1}
                    </span>
                  </div>
                  <div className="w-full bg-white/10 rounded-full h-3 overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 h-3 rounded-full transition-all duration-500"
                      style={{ width: `${stats.progressToNextLevel}%` }}
                    ></div>
                  </div>
                  <div className="flex items-center justify-between cp-text-xs-metadata">
                    <span>{stats.xp.toLocaleString()} / {stats.xpForNextLevel.toLocaleString()} XP</span>
                    <span>{stats.progressToNextLevel}% complete</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card className="cp-fade-in-delay-2">
            <CardContent className="p-6">
              <div className="cp-space-y-4">
                <div>
                  <h3 className="cp-text-lg-semibold mb-1">Your progress toward the next level</h3>
                  <p className="cp-text-sm-muted">
                    Earn XP by completing challenges, interviews, and milestones.
                  </p>
                </div>
                <EmptyState
                  icon={Target}
                  title="Start your first task to earn XP"
                  description="Complete a coding challenge or interview to begin your journey."
                  size="sm"
                  primaryAction={
                    <Button asChild>
                      <Link to="/practice">Start practicing</Link>
                    </Button>
                  }
                />
              </div>
            </CardContent>
          </Card>
        )}

        {/* Achievements */}
        <Card className="cp-fade-in-delay-3">
          <CardContent className="p-6">
            <div className="flex items-center cp-gap-2 mb-6">
              <Trophy className="w-5 h-5 text-yellow-400" />
              <h3 className="cp-text-lg-semibold">Achievements</h3>
              {achievements.length > 0 && (
                <span className="cp-text-sm-muted">({achievements.length} unlocked)</span>
              )}
            </div>
            {achievements.length === 0 ? (
              <div className="cp-space-y-4">
                <EmptyState
                  icon={Award}
                  title="Complete key milestones to unlock achievements"
                  description="Your first resume upload, interview, or coding challenge will unlock achievements."
                  size="sm"
                />
                <div className="cp-space-y-3 pt-4 border-t border-white/5">
                  <p className="cp-text-sm-semibold text-white/60">Upcoming achievements:</p>
                  <div className="grid sm:grid-cols-3 cp-gap-3">
                    {[
                      { name: 'First Resume Upload', description: 'Upload your resume to get started' },
                      { name: 'First Interview Completed', description: 'Complete your first mock interview' },
                      { name: '7-Day Consistency Streak', description: 'Practice for 7 days in a row' },
                    ].map((preview, idx) => (
                      <div
                        key={idx}
                        className="rounded-xl border border-white/5 bg-white/3 p-4 opacity-60"
                      >
                        <div className="flex items-start cp-gap-3">
                          <div className="w-8 h-8 bg-white/5 rounded-lg border border-white/10 flex items-center justify-center flex-shrink-0">
                            <Award className="w-4 h-4 text-white/40" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="cp-text-sm-semibold text-white/50">{preview.name}</h4>
                            <p className="cp-text-xs-muted mt-1">{preview.description}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 cp-gap-4">
                {achievements.map((achievement) => (
                  <div
                    key={achievement.id}
                    className="rounded-xl border border-white/10 bg-white/5 p-4 cp-card-interactive"
                  >
                    <div className="flex items-start cp-gap-3">
                      <div className="w-10 h-10 bg-yellow-500/10 rounded-lg border border-yellow-500/20 flex items-center justify-center flex-shrink-0">
                        <Award className="w-5 h-5 text-yellow-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="cp-text-sm-semibold">{achievement.name}</h4>
                        <p className="cp-text-sm-muted mt-1">{achievement.description}</p>
                        <div className="flex items-center cp-gap-2 mt-2">
                          <span className="cp-text-xs-metadata">
                            +{achievement.xpReward} XP
                          </span>
                          <span className="cp-text-xs-metadata">•</span>
                          <span className="cp-text-xs-metadata">
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

function SignalCard({ icon, label, value, subValue, explanation }) {
  return (
    <Card depth>
      <CardContent className="p-4">
        <div className="flex items-center cp-gap-2 mb-3">
          <div className="text-blue-400">{icon}</div>
          <span className="cp-text-sm-muted">{label}</span>
        </div>
        <p className="cp-text-2xl-bold text-white mb-1">{value}</p>
        {subValue && <p className="cp-text-xs-metadata mb-2">{subValue}</p>}
        {explanation && (
          <p className="cp-text-xs-muted mt-2 pt-2 border-t border-white/5">{explanation}</p>
        )}
      </CardContent>
    </Card>
  );
}



