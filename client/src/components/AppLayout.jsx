import { useEffect, useMemo, useRef, useState } from 'react';
import { Outlet, Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { Sparkles, LayoutDashboard, FileText, Map as MapIcon, MessageSquare, Terminal, Trophy, Target, User, ChevronDown, LogOut } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { cn } from '../utils/cn';
import Button from './ui/Button';

const primaryNav = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/practice', label: 'Practice', icon: Terminal },
  { to: '/interview', label: 'Interview', icon: MessageSquare },
  { to: '/roadmap', label: 'Roadmap', icon: MapIcon },
  { to: '/resume', label: 'Resume', icon: FileText },
  { to: '/profile', label: 'Profile', icon: User },
];

const moreNav = [
  { to: '/roadmap-generator', label: 'AI Roadmap', icon: Sparkles },
  { to: '/skills', label: 'Skill Gap', icon: Target },
  { to: '/leaderboard', label: 'Leaderboard', icon: Trophy },
];

export default function AppLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [moreOpen, setMoreOpen] = useState(false);
  const moreDesktopRef = useRef(null);
  const moreMobileRef = useRef(null);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const bg = useMemo(() => {
    const p = location.pathname || '/';
    if (p.startsWith('/dashboard')) return 'dashboard';
    if (p.startsWith('/practice')) return 'practice';
    if (p.startsWith('/roadmap-generator')) return 'roadmap';
    if (p.startsWith('/leaderboard')) return 'leaderboard';
    if (p.startsWith('/profile')) return 'profile';
    if (p.startsWith('/interview')) return 'practice'; // focused
    return 'default';
  }, [location.pathname]);

  const isMoreActive = useMemo(() => {
    return moreNav.some((i) => i.to === location.pathname);
  }, [location.pathname]);

  useEffect(() => {
    document.body.dataset.cpBg = bg;
  }, [bg]);

  useEffect(() => {
    return () => {
      // When leaving the app shell (e.g. going back to landing), allow that page to set its own background.
      delete document.body.dataset.cpBg;
    };
  }, []);

  useEffect(() => {
    const onDocClick = (e) => {
      const inDesktop = moreDesktopRef.current && moreDesktopRef.current.contains(e.target);
      const inMobile = moreMobileRef.current && moreMobileRef.current.contains(e.target);
      if (inDesktop || inMobile) return;
      setMoreOpen(false);
    };
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, []);

  useEffect(() => {
    // Close menus on navigation
    setMoreOpen(false);
  }, [location.pathname]);

  const navLinkClass = ({ isActive }) =>
    cn(
      'px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 cp-focus-ring',
      isActive ? 'bg-white/8 text-white' : 'text-white/70 hover:text-white hover:bg-white/5'
    );

  return (
    <div className="min-h-screen relative">

      <header className="sticky top-0 z-50 border-b border-white/10 bg-[#070A12]/80 backdrop-blur">
        <div className="cp-container py-4 relative z-10">
          <div className="flex items-center justify-between gap-4">
            <Link to="/" className="flex items-center gap-3 group">
              <div className="w-9 h-9 bg-white/5 border border-white/10 rounded-xl flex items-center justify-center transition-colors group-hover:bg-white/8">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <span className="text-base font-semibold text-white tracking-[-0.01em]">CareerPilot</span>
            </Link>

            <nav className="hidden md:flex items-center gap-1">
              {primaryNav.map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    className={navLinkClass}
                  >
                    <Icon className="w-4 h-4" />
                    {item.label}
                  </NavLink>
                );
              })}

              <div className="relative" ref={moreDesktopRef}>
                <button
                  type="button"
                  onClick={() => setMoreOpen((v) => !v)}
                  className={cn(
                    'px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 cp-focus-ring',
                    isMoreActive ? 'bg-white/8 text-white' : 'text-white/70 hover:text-white hover:bg-white/5'
                  )}
                  aria-haspopup="menu"
                  aria-expanded={moreOpen}
                >
                  More
                  <ChevronDown className="w-4 h-4 text-white/60" />
                </button>
                {moreOpen ? (
                  <div
                    role="menu"
                    className="absolute right-0 mt-2 w-52 rounded-xl border border-white/10 glass-card overflow-hidden shadow-lg"
                  >
                    <div className="p-2">
                      {moreNav.map((item) => {
                        const Icon = item.icon;
                        return (
                          <NavLink
                            key={item.to}
                            to={item.to}
                            className={({ isActive }) =>
                              cn(
                                'w-full px-3 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors',
                                isActive
                                  ? 'bg-white/8 text-white'
                                  : 'text-white/70 hover:text-white hover:bg-white/5'
                              )
                            }
                          >
                            <Icon className="w-4 h-4" />
                            {item.label}
                          </NavLink>
                        );
                      })}
                    </div>
                  </div>
                ) : null}
              </div>

              {/* User menu */}
              <div className="flex items-center gap-3 ml-4 pl-4 border-l border-white/10">
                <span className="text-sm text-white/70">{user?.name || user?.email}</span>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={handleLogout}
                  className="flex items-center gap-2"
                >
                  <LogOut className="w-4 h-4" />
                  Logout
                </Button>
              </div>
            </nav>
          </div>

          {/* Mobile nav (scrollable) */}
          <nav className="md:hidden mt-4 -mx-2 px-2 overflow-x-auto">
            <div className="flex items-center gap-2 min-w-max">
              {primaryNav.map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    className={navLinkClass}
                  >
                    <Icon className="w-4 h-4" />
                    {item.label}
                  </NavLink>
                );
              })}

              <div className="relative" ref={moreMobileRef}>
                <button
                  type="button"
                  onClick={() => setMoreOpen((v) => !v)}
                  className={cn(
                    'px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 cp-focus-ring',
                    isMoreActive ? 'bg-white/8 text-white' : 'text-white/70 hover:text-white hover:bg-white/5'
                  )}
                  aria-haspopup="menu"
                  aria-expanded={moreOpen}
                >
                  More
                  <ChevronDown className="w-4 h-4 text-white/60" />
                </button>
                {moreOpen ? (
                  <div
                    role="menu"
                    className="absolute left-0 mt-2 w-52 rounded-xl border border-white/10 glass-card overflow-hidden shadow-lg"
                  >
                    <div className="p-2">
                      {moreNav.map((item) => {
                        const Icon = item.icon;
                        return (
                          <NavLink
                            key={item.to}
                            to={item.to}
                            className={({ isActive }) =>
                              cn(
                                'w-full px-3 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors',
                                isActive
                                  ? 'bg-white/8 text-white'
                                  : 'text-white/70 hover:text-white hover:bg-white/5'
                              )
                            }
                          >
                            <Icon className="w-4 h-4" />
                            {item.label}
                          </NavLink>
                        );
                      })}
                    </div>
                  </div>
                ) : null}
              </div>
            </div>
          </nav>
        </div>
      </header>

      <main className="relative z-10">
        <Outlet />
      </main>

      <footer className="border-t border-white/10 glass-card py-6 relative z-10">
        <div className="cp-container text-sm text-white/60">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <span>© {new Date().getFullYear()} CareerPilot</span>
            <span className="text-white/40">Enterprise demo-ready • Calm UI</span>
          </div>
        </div>
      </footer>
    </div>
  );
}




