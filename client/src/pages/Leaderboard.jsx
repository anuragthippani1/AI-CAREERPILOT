import { useMemo, useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Trophy, Medal, Award, Flame, MessageSquare, Star, Crown, Info, Search, X } from 'lucide-react';
import { leaderboardAPI } from '../services/api';
import PageHeader from '../components/ui/PageHeader';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import { Card, CardContent } from '../components/ui/Card';
import { Skeleton } from '../components/ui/Skeleton';

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

function makeDemoUsers(tab) {
  const baseNames = [
    'Aarav', 'Maya', 'Noah', 'Isha', 'Liam', 'Zara', 'Ethan', 'Anika', 'Arjun', 'Sofia', 'Kai', 'Nina', 'Rohan', 'Leah', 'Sam'
  ];

  if (tab === 'xp') {
    return baseNames.slice(0, 12).map((name, idx) => ({
      id: 1000 + idx,
      name,
      title: ['SWE', 'Frontend Dev', 'Backend Dev', 'Full-stack', 'Data Eng'][idx % 5],
      xp: 14500 - idx * 900,
      level: 12 - Math.floor(idx / 2),
      avatar_url: null,
      rank: idx + 1
    }));
  }

  if (tab === 'interviews') {
    return baseNames.slice(0, 12).map((name, idx) => ({
      id: 2000 + idx,
      name,
      title: ['SWE', 'Frontend Dev', 'Backend Dev', 'Full-stack'][idx % 4],
      avatar_url: null,
      completedInterviews: Math.max(1, 18 - idx * 2),
      avgScore: Math.max(55, 92 - idx * 3),
      rank: idx + 1
    }));
  }

  // streaks
  return baseNames.slice(0, 12).map((name, idx) => ({
    id: 3000 + idx,
    name,
    title: ['SWE', 'Frontend Dev', 'Backend Dev', 'Full-stack'][idx % 4],
    avatar_url: null,
    currentStreak: Math.max(1, 14 - idx),
    longestStreak: Math.max(3, 30 - idx * 2),
    rank: idx + 1
  }));
}

function XPInfoTooltip() {
  return (
    <span className="relative inline-flex items-center ml-2 group">
      <Info className="w-4 h-4 text-white/60 hover:text-white/80" />
      <span className="pointer-events-none absolute left-1/2 -translate-x-1/2 top-full mt-2 z-20 w-64 opacity-0 group-hover:opacity-100 transition-opacity">
        <span className="block glass-card rounded-lg p-3 text-xs text-white/90 border border-white/10 shadow-lg">
          <span className="block font-semibold text-white mb-1">How XP is earned</span>
          <span className="block text-white/80">- Resume: upload + analysis</span>
          <span className="block text-white/80">- Challenges: solving + submissions</span>
          <span className="block text-white/80">- Interviews: completing mock sessions</span>
        </span>
      </span>
    </span>
  );
}

export default function Leaderboard() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [userId] = useState(() => getUserIdFromStorageOrUrl());
  const [activeTab, setActiveTab] = useState(() => {
    const fromUrl = String(searchParams.get('tab') || '').trim().toLowerCase();
    return fromUrl === 'interviews' || fromUrl === 'streaks' || fromUrl === 'xp' ? fromUrl : 'xp';
  });
  const [leaderboard, setLeaderboard] = useState([]);
  const [userRank, setUserRank] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isDemo, setIsDemo] = useState(false);
  const [query, setQuery] = useState('');

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      await loadLeaderboard(() => cancelled);
    };

    run();
    return () => {
      cancelled = true;
    };
  }, [activeTab]);

  useEffect(() => {
    const current = String(searchParams.get('tab') || '').trim().toLowerCase();
    if (current === activeTab) return;
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.set('tab', activeTab);
      return next;
    }, { replace: true });
  }, [activeTab, searchParams, setSearchParams]);

  useEffect(() => {
    document.body.dataset.cpBg = 'leaderboard';
    return () => {
      delete document.body.dataset.cpBg;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        if (!userId) {
          if (!cancelled) setUserRank(null);
          return;
        }
        const response = await leaderboardAPI.getUserRank(userId);
        if (!cancelled && response?.data?.success) setUserRank(response.data.data);
      } catch (err) {
        console.error('Error loading user rank:', err);
        if (!cancelled) setUserRank(null);
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [userId]);

  const loadLeaderboard = async (isCancelled = () => false) => {
    try {
      setLoading(true);
      setError(null);

      const limit = 50;
      const page = 1;

      let response = null;
      if (activeTab === 'xp') response = await leaderboardAPI.getTopUsers(page, limit);
      if (activeTab === 'interviews') response = await leaderboardAPI.getTopByInterviews(page, limit);
      if (activeTab === 'streaks') response = await leaderboardAPI.getTopByStreaks(page, limit);

      if (isCancelled()) return;

      if (response?.data?.success) {
        const rows = Array.isArray(response.data.data) ? response.data.data : [];
        if (rows.length > 0) {
          setLeaderboard(rows);
          setIsDemo(false);
        } else {
          setLeaderboard(makeDemoUsers(activeTab));
          setIsDemo(true);
        }
      } else {
        setLeaderboard([]);
        setError('Failed to load leaderboard');
      }
    } catch (err) {
      console.error('Error loading leaderboard:', err);
      if (isCancelled()) return;
      setLeaderboard([]);
      setError(err?.response?.data?.error || 'Failed to load leaderboard');
    } finally {
      if (!isCancelled()) setLoading(false);
    }
  };

  const filteredLeaderboard = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return leaderboard;
    return leaderboard.filter((u) => {
      const name = String(u?.name || '').toLowerCase();
      const title = String(u?.title || '').toLowerCase();
      return name.includes(q) || title.includes(q);
    });
  }, [leaderboard, query]);

  const top3 = useMemo(() => filteredLeaderboard.slice(0, 3), [filteredLeaderboard]);
  const rest = useMemo(() => filteredLeaderboard.slice(3, 50), [filteredLeaderboard]);

  const youInList = useMemo(() => {
    if (!userId) return null;
    return leaderboard.find((u) => parseInt(u.id, 10) === userId) || null;
  }, [leaderboard, userId]);

  const isUnranked = !userRank || userRank.total === 0 || (userRank.xp || 0) <= 0;

  const getRankIcon = (rank) => {
    if (rank === 1) return <Trophy className="w-6 h-6 text-yellow-400" />;
    if (rank === 2) return <Medal className="w-6 h-6 text-white/70" />;
    if (rank === 3) return <Award className="w-6 h-6 text-orange-400" />;
    return <span className="text-sm font-bold text-white/70">#{rank}</span>;
  };

  return (
    <div className="cp-page">
      <main className="cp-page-inner max-w-6xl space-y-6">
        <PageHeader
          title="Leaderboard"
          description="A snapshot of consistent practice — and where you stand."
          actions={isDemo ? <Badge variant="neutral">Preview data</Badge> : null}
        />

        {/* Tabs */}
        <div className="glass-card rounded-xl p-1 mb-6 flex gap-1 cp-fade-in">
          <button
            onClick={() => setActiveTab('xp')}
            className={`flex-1 px-4 py-2 rounded-lg font-semibold transition-colors ${
              activeTab === 'xp' ? 'bg-white/10 text-white' : 'text-white/70 hover:bg-white/5'
            }`}
          >
            <div className="flex items-center justify-center gap-2">
              <Star className="w-4 h-4" />
              XP
            </div>
          </button>
          <button
            onClick={() => setActiveTab('interviews')}
            className={`flex-1 px-4 py-2 rounded-lg font-semibold transition-colors ${
              activeTab === 'interviews' ? 'bg-white/10 text-white' : 'text-white/70 hover:bg-white/5'
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
              activeTab === 'streaks' ? 'bg-white/10 text-white' : 'text-white/70 hover:bg-white/5'
            }`}
          >
            <div className="flex items-center justify-center gap-2">
              <Flame className="w-4 h-4" />
              Streaks
            </div>
          </button>
        </div>

        {/* Search */}
        {leaderboard.length > 0 ? (
          <div className="glass-card rounded-xl border border-white/10 bg-white/5 px-4 py-3 flex items-center gap-3 cp-fade-in">
            <Search className="w-4 h-4 text-white/60" aria-hidden="true" />
            <label className="sr-only" htmlFor="leaderboard-search">
              Search leaderboard
            </label>
            <input
              id="leaderboard-search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by name or title..."
              className="flex-1 bg-transparent outline-none text-sm text-white placeholder:text-white/40"
            />
            {query ? (
              <button
                type="button"
                onClick={() => setQuery('')}
                className="p-1 rounded-lg hover:bg-white/10 text-white/70 hover:text-white"
                aria-label="Clear search"
              >
                <X className="w-4 h-4" aria-hidden="true" />
              </button>
            ) : null}
            <div className="text-xs text-white/55">
              Showing {Math.min(filteredLeaderboard.length, 50)} of {Math.min(leaderboard.length, 50)}
            </div>
          </div>
        ) : null}

        {/* Loading / Error / Empty */}
        {loading && leaderboard.length === 0 && (
          <Card>
            <CardContent className="pt-6">
              <div className="space-y-3">
                <Skeleton className="h-4 w-40" />
                <Skeleton className="h-12 rounded-xl" />
                <Skeleton className="h-12 rounded-xl" />
                <Skeleton className="h-12 rounded-xl" />
              </div>
            </CardContent>
          </Card>
        )}

        {!loading && error && leaderboard.length === 0 && (
          <div className="glass-card rounded-xl p-10 text-center">
            <Trophy className="w-14 h-14 text-white/30 mx-auto mb-3" />
            <p className="text-white font-semibold">Leaderboard temporarily unavailable</p>
            <p className="text-white/70 text-sm mt-1">{error}</p>
            <div className="mt-5 flex items-center justify-center gap-2">
              <Button variant="secondary" onClick={loadLeaderboard}>Retry</Button>
              <Button onClick={() => navigate('/practice')}>Practice challenges</Button>
            </div>
          </div>
        )}

        {/* Top 3 */}
        {leaderboard.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 cp-fade-in-delay-1">
            {top3.map((u, idx) => {
              const place = idx + 1;
              const isYou = userId && parseInt(u.id, 10) === userId;
              const ring =
                place === 1
                  ? 'border-yellow-400/30 shadow-[0_0_30px_rgba(234,179,8,0.12)]'
                  : place === 2
                    ? 'border-white/15 shadow-[0_0_24px_rgba(255,255,255,0.08)]'
                    : 'border-orange-400/25 shadow-[0_0_24px_rgba(249,115,22,0.10)]';

              const primaryStat =
                activeTab === 'xp'
                  ? { label: 'XP', value: (u.xp || 0).toLocaleString() }
                  : activeTab === 'interviews'
                    ? { label: 'Completed', value: u.completedInterviews || 0 }
                    : { label: 'Current streak', value: `${u.currentStreak || 0}d` };

              const secondaryStat =
                activeTab === 'xp'
                  ? { label: 'Level', value: u.level || 1 }
                  : activeTab === 'interviews'
                    ? { label: 'Avg score', value: `${u.avgScore || 0}%` }
                    : { label: 'Longest', value: `${u.longestStreak || 0}d` };

              return (
                <div key={u.id} className={`glass-card rounded-xl p-5 border ${ring}`}>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-full bg-white/10 border border-white/10 flex items-center justify-center text-white font-bold">
                        {u.name?.charAt(0)?.toUpperCase() || 'U'}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 min-w-0">
                          <p className="font-semibold text-white truncate">{u.name || 'Unknown'}</p>
                          {isYou && (
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-200 border border-blue-400/20 flex-shrink-0">
                              You
                            </span>
                          )}
                        </div>
                        {u.title && <p className="text-xs text-white/60 truncate">{u.title}</p>}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {place === 1 ? <Crown className="w-5 h-5 text-yellow-300" /> : null}
                      {getRankIcon(place)}
                    </div>
                  </div>

                  <div className="mt-4 grid grid-cols-2 gap-3">
                    <div className="rounded-lg bg-white/5 border border-white/10 p-3">
                      <p className="text-xs text-white/60">{primaryStat.label}</p>
                      <p className="text-lg font-bold text-white">{primaryStat.value}</p>
                    </div>
                    <div className="rounded-lg bg-white/5 border border-white/10 p-3">
                      <p className="text-xs text-white/60">{secondaryStat.label}</p>
                      <p className="text-lg font-bold text-white">{secondaryStat.value}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Ranked list (4-50) */}
        {leaderboard.length > 0 && (
          <div className="glass-card rounded-xl border border-white/10 overflow-hidden">
            <div className="px-5 py-4 border-b border-white/10 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <p className="text-sm font-semibold text-white">Ranks 4–50</p>
                {activeTab === 'xp' && <XPInfoTooltip />}
              </div>
              <p className="text-xs text-white/60">Showing top {Math.min(50, leaderboard.length)}</p>
            </div>
            {rest.length === 0 ? (
              <div className="p-8 text-center">
                <p className="text-white/70 text-sm">More ranks will appear as more people compete.</p>
              </div>
            ) : (
              <div className="divide-y divide-white/10">
                {rest.map((u) => {
                  const isYou = userId && parseInt(u.id, 10) === userId;
                  const rowStyle = isYou ? 'bg-blue-500/10' : 'hover:bg-white/5';

                  return (
                    <div key={u.id} className={`px-5 py-4 flex items-center justify-between gap-4 ${rowStyle}`}>
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-10 flex items-center justify-start">{getRankIcon(u.rank)}</div>
                        <div className="w-9 h-9 rounded-full bg-white/10 border border-white/10 flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                          {u.name?.charAt(0)?.toUpperCase() || 'U'}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 min-w-0">
                            <p className="text-white font-semibold truncate">{u.name || 'Unknown'}</p>
                            {isYou && (
                              <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-200 border border-blue-400/20 flex-shrink-0">
                                You
                              </span>
                            )}
                          </div>
                          {u.title && <p className="text-xs text-white/60 truncate">{u.title}</p>}
                        </div>
                      </div>

                      <div className="flex items-center gap-6 flex-shrink-0">
                        {activeTab === 'xp' && (
                          <>
                            <div className="text-right">
                              <p className="text-xs text-white/60">XP</p>
                              <p className="text-white font-bold">{(u.xp || 0).toLocaleString()}</p>
                            </div>
                            <div className="text-right">
                              <p className="text-xs text-white/60">Level</p>
                              <p className="text-white font-bold">{u.level || 1}</p>
                            </div>
                          </>
                        )}

                        {activeTab === 'interviews' && (
                          <>
                            <div className="text-right">
                              <p className="text-xs text-white/60">Completed</p>
                              <p className="text-white font-bold">{u.completedInterviews || 0}</p>
                            </div>
                            <div className="text-right">
                              <p className="text-xs text-white/60">Avg</p>
                              <p className="text-white font-bold">{u.avgScore || 0}%</p>
                            </div>
                          </>
                        )}

                        {activeTab === 'streaks' && (
                          <>
                            <div className="text-right">
                              <p className="text-xs text-white/60">Current</p>
                              <p className="text-white font-bold">{u.currentStreak || 0}d</p>
                            </div>
                            <div className="text-right">
                              <p className="text-xs text-white/60">Longest</p>
                              <p className="text-white font-bold">{u.longestStreak || 0}d</p>
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Sticky "Your Rank" */}
        <div className="sticky bottom-4 mt-8">
          <div className="glass-card rounded-xl border border-white/10 p-5">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <p className="text-xs text-white/60 mb-1">Your Rank</p>
                {!userId ? (
                  <>
                    <p className="text-white font-semibold">Connect your profile to compete</p>
                    <p className="text-white/70 text-sm mt-1">
                      Your rank appears once you have a user profile and earn XP.
                    </p>
                  </>
                ) : isUnranked ? (
                  <>
                    <p className="text-white font-semibold">Not ranked yet</p>
                    <p className="text-white/70 text-sm mt-1">
                      Earn XP by completing challenges or interviews to enter the leaderboard.
                    </p>
                  </>
                ) : (
                  <>
                    <div className="flex items-center gap-3">
                      <p className="text-2xl font-bold text-white">#{userRank.rank}</p>
                      {youInList ? (
                        <span className="text-xs text-white/60">You’re in the top list.</span>
                      ) : (
                        <span className="text-xs text-white/60">Not in top 50 yet — keep going.</span>
                      )}
                    </div>
                    <p className="text-white/70 text-sm mt-1">
                      Top {userRank.percentile}% • {(userRank.xp || 0).toLocaleString()} XP • Level {userRank.level || 1}
                    </p>
                  </>
                )}
              </div>

              <div className="flex items-center gap-2 flex-shrink-0">
                <button
                  onClick={() => navigate('/practice')}
                  className="px-4 py-2 rounded-lg bg-blue-500/80 hover:bg-blue-500 text-white text-sm font-semibold"
                >
                  Practice challenges
                </button>
                <button
                  onClick={loadLeaderboard}
                  className="px-4 py-2 rounded-lg bg-white/10 hover:bg-white/15 text-white text-sm font-semibold border border-white/10"
                >
                  Refresh
                </button>
              </div>
            </div>
            {isDemo && (
              <div className="mt-4 text-xs text-white/60">
                This is a preview leaderboard. It disappears automatically once real rankings exist.
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}



