import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { UserPlus, Mail, Lock, User, AlertCircle, Loader } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import PageHeader from '../components/ui/PageHeader';
import Button from '../components/ui/Button';
import { Card, CardContent } from '../components/ui/Card';

export default function Signup() {
  const navigate = useNavigate();
  const { signup } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const passwordMismatch = confirmPassword.length > 0 && password !== confirmPassword;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setLoading(true);

    try {
      const result = await signup(email, name, password);
      if (result.success) {
        navigate('/dashboard');
      } else {
        setError(result.error || 'Signup failed');
      }
    } catch (err) {
      setError(err.response?.data?.error || 'An error occurred during signup');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="cp-page">
      <main className="cp-page-inner max-w-md mx-auto">
        <PageHeader
          title="Create account"
          description="Start your career journey with AI-powered insights and practice."
        />

        <Card className="mt-6">
          <CardContent className="pt-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="signup-name" className="block text-sm font-medium text-white/80 mb-2">
                  Name
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" aria-hidden="true" />
                  <input
                    id="signup-name"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="John Doe"
                    className="cp-input pl-10"
                    required
                    disabled={loading}
                    autoComplete="name"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="signup-email" className="block text-sm font-medium text-white/80 mb-2">
                  Email
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" aria-hidden="true" />
                  <input
                    id="signup-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="cp-input pl-10"
                    required
                    disabled={loading}
                    autoComplete="email"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="signup-password" className="block text-sm font-medium text-white/80 mb-2">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" aria-hidden="true" />
                  <input
                    id="signup-password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="cp-input pl-10"
                    required
                    disabled={loading}
                    minLength={6}
                    autoComplete="new-password"
                  />
                </div>
                <p className="text-xs text-white/50 mt-1">At least 6 characters</p>
              </div>

              <div>
                <label htmlFor="signup-confirm-password" className="block text-sm font-medium text-white/80 mb-2">
                  Confirm Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" aria-hidden="true" />
                  <input
                    id="signup-confirm-password"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    className={`cp-input pl-10 ${passwordMismatch ? 'border-red-500/40 focus:border-red-500/60' : ''}`}
                    required
                    disabled={loading}
                    minLength={6}
                    autoComplete="new-password"
                    aria-invalid={passwordMismatch}
                    aria-describedby={passwordMismatch ? 'confirm-password-error' : undefined}
                  />
                </div>
                {passwordMismatch && (
                  <p id="confirm-password-error" className="text-xs text-red-300 mt-1">
                    Passwords do not match.
                  </p>
                )}
              </div>

              {error && (
                <div role="alert" className="bg-red-500/10 border border-red-500/25 rounded-lg p-4 flex items-start gap-2">
                  <AlertCircle className="w-5 h-5 text-red-300 mt-0.5 flex-shrink-0" aria-hidden="true" />
                  <p className="text-red-200 text-sm">{error}</p>
                </div>
              )}

              <Button type="submit" disabled={loading} className="w-full">
                {loading ? (
                  <>
                    <Loader className="w-5 h-5 animate-spin" aria-hidden="true" />
                    Creating account...
                  </>
                ) : (
                  <>
                    <UserPlus className="w-5 h-5" aria-hidden="true" />
                    Create account
                  </>
                )}
              </Button>

              <div className="text-center text-sm text-white/60">
                Already have an account?{' '}
                <Link to="/login" className="text-primary-300 hover:text-primary-200 font-medium">
                  Sign in
                </Link>
              </div>
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
