import { createContext, useContext, type ReactNode } from 'react'

interface AuthContextValue {
  token: string | null
  user: null
  isAuthenticated: boolean
  isLoading: boolean
  login: (token: string) => void
  logout: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  // TODO: Task 7.0 will implement actual auth state management
  const value: AuthContextValue = {
    token: null,
    user: null,
    isAuthenticated: false,
    isLoading: false,
    login: () => {},
    logout: () => {},
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
