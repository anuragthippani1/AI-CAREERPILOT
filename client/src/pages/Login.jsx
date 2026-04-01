import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { LogIn, Mail, Lock, AlertCircle, Loader } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import PageHeader from '../components/ui/PageHeader';
import Button from '../components/ui/Button';
import { Card, CardContent } from '../components/ui/Card';

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const result = await login(email, password);
      if (result.success) {
        navigate('/dashboard');
      } else {
        setError(result.error || 'Login failed');
      }
    } catch (err) {
      setError(err.response?.data?.error || 'An error occurred during login');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="cp-page">
      <main className="cp-page-inner max-w-md mx-auto">
        <PageHeader
          title="Sign in"
          description="Welcome back! Sign in to continue your career journey."
        />

        <Card className="mt-6">
          <CardContent className="pt-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="login-email" className="block text-sm font-medium text-white/80 mb-2">
                  Email
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" aria-hidden="true" />
                  <input
                    id="login-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="cp-input pl-10"
                    required
                    disabled={loading}
                    autoComplete="email"
                    aria-describedby={error ? 'login-error' : undefined}
                  />
                </div>
              </div>

              <div>
                <label htmlFor="login-password" className="block text-sm font-medium text-white/80 mb-2">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" aria-hidden="true" />
                  <input
                    id="login-password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="cp-input pl-10"
                    required
                    disabled={loading}
                    minLength={6}
                    autoComplete="current-password"
                    aria-describedby={error ? 'login-error' : undefined}
                  />
                </div>
              </div>

              {error && (
                <div id="login-error" role="alert" className="bg-red-500/10 border border-red-500/25 rounded-lg p-4 flex items-start gap-2">
                  <AlertCircle className="w-5 h-5 text-red-300 mt-0.5 flex-shrink-0" aria-hidden="true" />
                  <p className="text-red-200 text-sm">{error}</p>
                </div>
              )}

              <Button type="submit" disabled={loading} className="w-full">
                {loading ? (
                  <>
                    <Loader className="w-5 h-5 animate-spin" aria-hidden="true" />
                    Signing in...
                  </>
                ) : (
                  <>
                    <LogIn className="w-5 h-5" aria-hidden="true" />
                    Sign in
                  </>
                )}
              </Button>

              <div className="text-center text-sm text-white/60">
                Don't have an account?{' '}
                <Link to="/signup" className="text-primary-300 hover:text-primary-200 font-medium">
                  Sign up
                </Link>
              </div>
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
