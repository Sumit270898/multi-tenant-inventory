import { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const TOKEN_KEY = 'token';

const AuthContext = createContext(null);

function decodeToken(token) {
  try {
    const payload = token.split('.')[1];
    if (!payload) return null;
    return JSON.parse(atob(payload));
  } catch {
    return null;
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem(TOKEN_KEY));
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // Restore user from token on mount/refresh
  useEffect(() => {
    const stored = localStorage.getItem(TOKEN_KEY);
    if (stored) {
      const decoded = decodeToken(stored);
      if (decoded) {
        setUser({
          id: decoded.userId,
          tenantId: decoded.tenantId,
          role: decoded.role,
          ...(decoded.name && { name: decoded.name }),
          ...(decoded.email && { email: decoded.email }),
        });
      }
      setToken(stored);
    }
    setLoading(false);
  }, []);

  const login = (userData, tokenValue) => {
    localStorage.setItem(TOKEN_KEY, tokenValue);
    setToken(tokenValue);
    setUser(userData);
  };

  const logout = () => {
    localStorage.removeItem(TOKEN_KEY);
    setToken(null);
    setUser(null);
    navigate('/login', { replace: true });
  };

  const value = {
    user,
    token,
    login,
    logout,
    isAuthenticated: !!token,
    loading,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return ctx;
}
