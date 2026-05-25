import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { getTokenExpiration, isTokenExpired } from '@/utils/expirationGetter';

import type { SignupRequest, User } from '../types';
import { authApi } from '../api/auth';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isInitialized: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  signup: (request: SignupRequest) => Promise<void>;
  logout: () => void;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

type ApiError = {
  response?: { data?: { detail?: string } };
  request?: unknown;
};

const isApiError = (error: unknown): error is ApiError => {
  return typeof error === 'object' && error !== null;
};

const clearStoredSession = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('access_token');
  localStorage.removeItem('user');
};

const readStoredSession = (): { token: string; user: User } | null => {
  const storedToken = localStorage.getItem('token') || localStorage.getItem('access_token');
  const storedUser = localStorage.getItem('user');

  if (!storedToken || !storedUser) return null;

  try {
    if (isTokenExpired(storedToken)) {
      clearStoredSession();
      return null;
    }

    localStorage.setItem('token', storedToken);
    return { token: storedToken, user: JSON.parse(storedUser) };
  } catch {
    clearStoredSession();
    return null;
  }
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [initialSession] = useState(readStoredSession);
  const [user, setUser] = useState<User | null>(() => initialSession?.user ?? null);
  const [token, setToken] = useState<string | null>(() => initialSession?.token ?? null);
  const [isLoading, setIsLoading] = useState(false);
  const [isInitialized] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const persistSession = useCallback((accessToken: string, nextUser: User) => {
    setToken(accessToken);
    setUser(nextUser);
    localStorage.setItem('token', accessToken);
    localStorage.setItem('access_token', accessToken);
    localStorage.setItem('user', JSON.stringify(nextUser));
  }, []);

  const logout = useCallback(() => {
    try {
      authApi.logout();
    } catch {
      // Local cleanup still happens below.
    }

    setUser(null);
    setToken(null);
    setError(null);
    clearStoredSession();
  }, []);

  useEffect(() => {
    if (!token) return;

    const expiration = getTokenExpiration(token);
    if (!expiration) {
      const timer = window.setTimeout(logout, 0);
      return () => window.clearTimeout(timer);
    }

    const timeout = expiration - Date.now();

    if (timeout <= 0) {
      const timer = window.setTimeout(logout, 0);
      return () => window.clearTimeout(timer);
    }

    const timer = window.setTimeout(() => {
      logout();
    }, timeout);

    return () => window.clearTimeout(timer);
  }, [logout, token]);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await authApi.login(email, password);
      persistSession(response.access_token, response.user);
    } catch (err: unknown) {
      let message = 'An unexpected error occurred during login.';
      if (isApiError(err) && err.response) {
        message = err.response.data?.detail || 'Invalid email or password.';
      } else if (isApiError(err) && err.request) {
        message = 'Cannot reach the server. Please check your connection.';
      }
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const signup = async (request: SignupRequest) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await authApi.signup(request);
      persistSession(response.access_token, response.user);
    } catch (err: unknown) {
      let message = 'An unexpected error occurred during signup.';
      if (isApiError(err) && err.response) {
        message = err.response.data?.detail || 'Could not create the workspace.';
      } else if (isApiError(err) && err.request) {
        message = 'Cannot reach the server. Please check your connection.';
      }
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const clearError = () => setError(null);

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        isInitialized,
        error,
        login,
        signup,
        logout,
        clearError,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }

  return context;
};
