import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

const AUTH_TOKEN_KEY = 'auth_token';

interface AuthContextValue {
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (token: string) => void;
  logout: () => void;
  getToken: () => string | null;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(() => {
    try {
      return localStorage.getItem(AUTH_TOKEN_KEY);
    } catch {
      return null;
    }
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Finished initializing from localStorage
    setIsLoading(false);
  }, []);

  const login = useCallback((newToken: string) => {
    setToken(newToken);
    try {
      localStorage.setItem(AUTH_TOKEN_KEY, newToken);
    } catch {
      // localStorage unavailable, token stays in memory only
    }
  }, []);

  const logout = useCallback(() => {
    setToken(null);
    try {
      localStorage.removeItem(AUTH_TOKEN_KEY);
    } catch {
      // ignore
    }
  }, []);

  const getToken = useCallback(() => token, [token]);

  const value = useMemo<AuthContextValue>(
    () => ({
      token,
      isAuthenticated: !!token,
      isLoading,
      login,
      logout,
      getToken,
    }),
    [token, isLoading, login, logout, getToken],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
