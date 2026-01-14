import { createContext, useContext, useState, useEffect } from 'react';
import { authAPI } from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(() => {
    return localStorage.getItem('careerpilot_token');
  });

  // Load user on mount if token exists
  useEffect(() => {
    const loadUser = async () => {
      if (token) {
        try {
          const response = await authAPI.me();
          if (response.data.success) {
            setUser(response.data.data);
          } else {
            // Invalid token, clear it
            localStorage.removeItem('careerpilot_token');
            setToken(null);
          }
        } catch (error) {
          // Token invalid or expired
          localStorage.removeItem('careerpilot_token');
          setToken(null);
        }
      }
      setLoading(false);
    };

    loadUser();
  }, [token]);

  const login = async (email, password) => {
    const response = await authAPI.login({ email, password });
    if (response.data.success) {
      const { user: userData, token: newToken } = response.data.data;
      localStorage.setItem('careerpilot_token', newToken);
      setToken(newToken);
      setUser(userData);
      return { success: true };
    }
    return { success: false, error: response.data.error || 'Login failed' };
  };

  const signup = async (email, name, password) => {
    const response = await authAPI.signup({ email, name, password });
    if (response.data.success) {
      const { user: userData, token: newToken } = response.data.data;
      localStorage.setItem('careerpilot_token', newToken);
      setToken(newToken);
      setUser(userData);
      return { success: true };
    }
    return { success: false, error: response.data.error || 'Signup failed' };
  };

  const logout = () => {
    localStorage.removeItem('careerpilot_token');
    setToken(null);
    setUser(null);
  };

  const value = {
    user,
    token,
    loading,
    login,
    signup,
    logout,
    isAuthenticated: !!user && !!token
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
