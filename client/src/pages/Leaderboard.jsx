import { useState, useEffect } from 'react';
import { Trophy, Medal, Award, TrendingUp, Flame, MessageSquare, Code, Star, Crown } from 'lucide-react';
import { leaderboardAPI } from '../services/api';

export default function Leaderboard() {
  const [userId] = useState(1); // Demo user
  const [activeTab, setActiveTab] = useState('xp');
  const [xpLeaderboard, setXpLeaderboard] = useState([]);
  const [interviewLeaderboard, setInterviewLeaderboard] = useState([]);
  const [streakLeaderboard, setStreakLeaderboard] = useState([]);
  const [userRank, setUserRank] = useState(null);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, totalPages: 0 });

  useEffect(() => {
    loadLeaderboard();
    loadUserRank();
  }, [activeTab]);

  const loadLeaderboard = async () => {
    try {
      setLoading(true);
      let response;

      if (activeTab === 'xp') {
        response = await leaderboardAPI.getTopUsers(pagination.page, pagination.limit);
        if (response.data.success) {
          setXpLeaderboard(response.data.data);
          setPagination(response.data.pagination);
        }
      } else if (activeTab === 'interviews') {
        response = await leaderboardAPI.getTopByInterviews(pagination.page, pagination.limit);
        if (response.data.success) {
          setInterviewLeaderboard(response.data.data);
          setPagination(response.data.pagination);
        }
      } else if (activeTab === 'streaks') {
        response = await leaderboardAPI.getTopByStreaks(pagination.page, pagination.limit);
        if (response.data.success) {
          setStreakLeaderboard(response.data.data);
          setPagination(response.data.pagination);
        }
      }
    } catch (error) {
      console.error('Error loading leaderboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadUserRank = async () => {
    try {
      const response = await leaderboardAPI.getUserRank(userId);
      if (response.data.success) {
        setUserRank(response.data.data);
      }
    } catch (error) {
      console.error('Error loading user rank:', error);
    }
  };

  const getCurrentLeaderboard = () => {
    if (activeTab === 'xp') return xpLeaderboard;
    if (activeTab === 'interviews') return interviewLeaderboard;
    if (activeTab === 'streaks') return streakLeaderboard;
    return [];
  };

  const getRankIcon = (rank) => {
    if (rank === 1) return <Crown className="w-6 h-6 text-yellow-500" />;
    if (rank === 2) return <Medal className="w-6 h-6 text-gray-400" />;
    if (rank === 3) return <Award className="w-6 h-6 text-orange-500" />;
    return <span className="text-lg font-bold text-gray-400">#{rank}</span>;
  };

  if (loading && getCurrentLeaderboard().length === 0) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading leaderboard...</p>
        </div>
      </div>
    );
  }

  const currentLeaderboard = getCurrentLeaderboard();

  return (
    <div className="min-h-screen">
      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 max-w-6xl">
        <h1 className="text-xl font-bold text-gray-900 mb-6">Leaderboard</h1>
        {/* User Rank Card */}
        {userRank && (
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-200 p-6 mb-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Your Rank</p>
                <p className="text-3xl font-bold text-gray-900">#{userRank.rank}</p>
                <p className="text-sm text-gray-600 mt-1">
                  Top {userRank.percentile}% • {userRank.xp} XP • Level {userRank.level}
                </p>
              </div>
              <div className="text-right">
                <Trophy className="w-12 h-12 text-yellow-500" />
              </div>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-1 mb-6 flex gap-1">
          <button
            onClick={() => setActiveTab('xp')}
            className={`flex-1 px-4 py-2 rounded-lg font-semibold transition-colors ${
              activeTab === 'xp'
                ? 'bg-gray-900 text-white'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <div className="flex items-center justify-center gap-2">
              <Star className="w-4 h-4" />
              XP Leaderboard
            </div>
          </button>
          <button
            onClick={() => setActiveTab('interviews')}
            className={`flex-1 px-4 py-2 rounded-lg font-semibold transition-colors ${
              activeTab === 'interviews'
                ? 'bg-gray-900 text-white'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <div className="flex items-center justify-center gap-2">
              <MessageSquare className="w-4 h-4" />
              Interviews
            </div>
          </button>
          <button
            onClick={() => setActiveTab('streaks')}
            className={`flex-1 px-4 py-2 rounded-lg font-semibold transition-colors ${
              activeTab === 'streaks'
                ? 'bg-gray-900 text-white'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <div className="flex items-center justify-center gap-2">
              <Flame className="w-4 h-4" />
              Streaks
            </div>
          </button>
        </div>

        {/* Leaderboard Table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          {currentLeaderboard.length === 0 ? (
            <div className="p-12 text-center">
              <Trophy className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">No rankings yet. Be the first to compete!</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Rank</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">User</th>
                      {activeTab === 'xp' && (
                        <>
                          <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">XP</th>
                          <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Level</th>
                        </>
                      )}
                      {activeTab === 'interviews' && (
                        <>
                          <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Completed</th>
                          <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Avg Score</th>
                        </>
                      )}
                      {activeTab === 'streaks' && (
                        <>
                          <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Current</th>
                          <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Longest</th>
                        </>
                      )}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {currentLeaderboard.map((user) => (
                      <tr
                        key={user.id}
                        className={`hover:bg-gray-50 transition-colors ${
                          user.id === userId ? 'bg-blue-50' : ''
                        }`}
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-center">
                            {getRankIcon(user.rank)}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-full flex items-center justify-center text-white text-sm font-bold">
                              {user.avatar_url ? (
                                <img src={user.avatar_url} alt={user.name} className="w-10 h-10 rounded-full object-cover" />
                              ) : (
                                user.name?.charAt(0).toUpperCase() || 'U'
                              )}
                            </div>
                            <div>
                              <p className="font-semibold text-gray-900">{user.name}</p>
                              {user.title && <p className="text-sm text-gray-500">{user.title}</p>}
                            </div>
                          </div>
                        </td>
                        {activeTab === 'xp' && (
                          <>
                            <td className="px-6 py-4">
                              <span className="font-semibold text-gray-900">{user.xp.toLocaleString()}</span>
                            </td>
                            <td className="px-6 py-4">
                              <span className="px-2 py-1 bg-blue-50 text-blue-700 rounded text-sm font-medium">
                                Level {user.level}
                              </span>
                            </td>
                          </>
                        )}
                        {activeTab === 'interviews' && (
                          <>
                            <td className="px-6 py-4">
                              <span className="font-semibold text-gray-900">{user.completedInterviews}</span>
                            </td>
                            <td className="px-6 py-4">
                              <span className="font-semibold text-gray-900">{user.avgScore}%</span>
                            </td>
                          </>
                        )}
                        {activeTab === 'streaks' && (
                          <>
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-2">
                                <Flame className="w-4 h-4 text-orange-500" />
                                <span className="font-semibold text-gray-900">{user.currentStreak} days</span>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <span className="font-semibold text-gray-900">{user.longestStreak} days</span>
                            </td>
                          </>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {pagination.totalPages > 1 && (
                <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
                  <div className="text-sm text-gray-600">
                    Showing {((pagination.page - 1) * pagination.limit) + 1} to{' '}
                    {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} users
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        setPagination({ ...pagination, page: pagination.page - 1 });
                        loadLeaderboard();
                      }}
                      disabled={pagination.page === 1}
                      className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-semibold hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Previous
                    </button>
                    <button
                      onClick={() => {
                        setPagination({ ...pagination, page: pagination.page + 1 });
                        loadLeaderboard();
                      }}
                      disabled={pagination.page >= pagination.totalPages}
                      className="px-4 py-2 bg-gray-900 text-white rounded-lg text-sm font-semibold hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  );
}



