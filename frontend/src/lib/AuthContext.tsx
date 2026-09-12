'use client'
import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';

interface AuthState {
  isAuthenticated: boolean;
  userEmail: string | null;
  /** Call after a successful API login to sync context with localStorage */
  onLoginSuccess: (email: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthState>({
  isAuthenticated: false,
  userEmail: null,
  onLoginSuccess: () => {},
  logout: () => {},
});

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);

  // Rehydrate from localStorage on mount so the session survives a refresh
  useEffect(() => {
    const token = localStorage.getItem('access_token');
    const email = localStorage.getItem('user_email');
    if (token) {
      setIsAuthenticated(true);
      setUserEmail(email);
    }
  }, []);

  const onLoginSuccess = useCallback((email: string) => {
    localStorage.setItem('user_email', email);
    setIsAuthenticated(true);
    setUserEmail(email);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user_email');
    setIsAuthenticated(false);
    setUserEmail(null);
  }, []);

  return (
    <AuthContext.Provider value={{ isAuthenticated, userEmail, onLoginSuccess, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
