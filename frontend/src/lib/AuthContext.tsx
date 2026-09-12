'use client'
import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import { login as apiLogin, logout as apiLogout, getSession } from '@/lib/api';

interface AuthState {
  isAuthenticated: boolean;
  userEmail: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthState>({
  isAuthenticated: false,
  userEmail: null,
  loading: true,
  login: async () => {},
  logout: async () => {},
});

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Rehydrate from HttpOnly cookie via server route on mount
  useEffect(() => {
    getSession()
      .then(s => {
        setIsAuthenticated(s.authenticated);
        setUserEmail(s.email);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const data = await apiLogin(email, password);
    setIsAuthenticated(true);
    setUserEmail(data.email || email);
  }, []);

  const logout = useCallback(async () => {
    await apiLogout();
    setIsAuthenticated(false);
    setUserEmail(null);
  }, []);

  return (
    <AuthContext.Provider value={{ isAuthenticated, userEmail, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
