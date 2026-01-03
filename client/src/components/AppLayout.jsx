import { Outlet, Link, NavLink } from 'react-router-dom';
import { Sparkles, LayoutDashboard, FileText, Target, Map, MessageSquare, Terminal, Trophy, User } from 'lucide-react';

const navItems = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/resume', label: 'Resume', icon: FileText },
  { to: '/skills', label: 'Skill Gap', icon: Target },
  { to: '/roadmap', label: 'Roadmap', icon: Map },
  { to: '/interview', label: 'Interview', icon: MessageSquare },
  { to: '/practice', label: 'Practice', icon: Terminal },
  { to: '/leaderboard', label: 'Leaderboard', icon: Trophy },
  { to: '/profile', label: 'Profile', icon: User },
];

export default function AppLayout() {
  return (
    <div className="min-h-screen bg-[#0a0a0a] relative">
      <div className="fixed inset-0 bg-grid-pattern opacity-30 pointer-events-none z-0"></div>

      <header className="sticky top-0 z-50 glass-card border-b border-white/10">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4 relative z-10">
          <div className="flex items-center justify-between gap-4">
            <Link to="/" className="flex items-center gap-3 group">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 via-indigo-500 to-purple-500 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/30 group-hover:scale-110 transition-transform duration-300">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <span className="text-xl font-bold text-white">CareerPilot</span>
            </Link>

            <nav className="hidden md:flex items-center gap-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    className={({ isActive }) =>
                      `px-3 py-2 rounded-xl text-sm font-semibold transition-all flex items-center gap-2 ${
                        isActive
                          ? 'bg-white/10 text-white border border-white/10'
                          : 'text-gray-300 hover:text-white hover:bg-white/5'
                      }`
                    }
                  >
                    <Icon className="w-4 h-4" />
                    {item.label}
                  </NavLink>
                );
              })}
            </nav>
          </div>

          {/* Mobile nav (scrollable) */}
          <nav className="md:hidden mt-4 -mx-2 px-2 overflow-x-auto">
            <div className="flex items-center gap-2 min-w-max">
              {navItems.map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    className={({ isActive }) =>
                      `px-3 py-2 rounded-xl text-sm font-semibold transition-all flex items-center gap-2 ${
                        isActive
                          ? 'bg-white/10 text-white border border-white/10'
                          : 'text-gray-300 hover:text-white hover:bg-white/5'
                      }`
                    }
                  >
                    <Icon className="w-4 h-4" />
                    {item.label}
                  </NavLink>
                );
              })}
            </div>
          </nav>
        </div>
      </header>

      <main className="relative z-10">
        <Outlet />
      </main>

      <footer className="border-t border-white/10 glass-card py-6 relative z-10">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-sm text-gray-400">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <span>© {new Date().getFullYear()} CareerPilot</span>
            <span className="text-gray-500">Demo-ready UI • Dark glass theme</span>
          </div>
        </div>
      </footer>
    </div>
  );
}



