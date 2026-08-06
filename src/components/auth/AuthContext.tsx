'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'

// ============ TYPES ============
interface User {
  id: string
  name: string
  email: string
  avatar?: string
  role: 'researcher' | 'developer' | 'admin' | 'community'
  institution?: string
  orcid?: string
  joinedAt: string
  computeHours: number
  storageUsed: string
  publications: number
}

interface AuthState {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
}

interface AuthContextType extends AuthState {
  login: (email: string, password: string) => Promise<void>
  logout: () => void
  register: (name: string, email: string, password: string) => Promise<void>
  updateProfile: (updates: Partial<User>) => void
}

// ============ MOCK USERS DATABASE ============
const mockUsers: Record<string, { password: string; user: User }> = {
  'demo@scihub.pro': {
    password: 'demo123',
    user: {
      id: 'usr_demo001',
      name: 'Dr. Alex Chen',
      email: 'demo@scihub.pro',
      avatar: undefined,
      role: 'researcher',
      institution: 'MIT Computational Biology',
      orcid: '0000-0001-2345-6789',
      joinedAt: '2024-01-15',
      computeHours: 1247,
      storageUsed: '2.4 GB',
      publications: 12,
    },
  },
  'admin@scihub.pro': {
    password: 'admin123',
    user: {
      id: 'usr_admin001',
      name: 'Admin User',
      email: 'admin@scihub.pro',
      avatar: undefined,
      role: 'admin',
      institution: 'SciHub Pro Foundation',
      joinedAt: '2023-06-01',
      computeHours: 99999,
      storageUsed: '128 GB',
      publications: 0,
    },
  },
}

// ============ CONTEXT ============
const AuthContext = createContext<AuthContextType | undefined>(undefined)

// ============ PROVIDER ============
export function AuthProvider({ children }: { children: ReactNode }) {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    isAuthenticated: false,
    isLoading: true,
  })

  // Check localStorage on mount
  useEffect(() => {
    try {
      const storedUser = localStorage.getItem('scihub_user')
      if (storedUser) {
        const user = JSON.parse(storedUser)
        setAuthState({
          user,
          isAuthenticated: true,
          isLoading: false,
        })
      } else {
        setAuthState(prev => ({ ...prev, isLoading: false }))
      }
    } catch {
      setAuthState(prev => ({ ...prev, isLoading: false }))
    }
  }, [])

  // Login function
  const login = async (email: string, password: string): Promise<void> => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 800))
    
    const mockUser = mockUsers[email]
    
    if (!mockUser || mockUser.password !== password) {
      throw new Error('Invalid email or password. Try demo@scihub.pro / demo123')
    }
    
    const user = { ...mockUser.user }
    localStorage.setItem('scihub_user', JSON.stringify(user))
    
    setAuthState({
      user,
      isAuthenticated: true,
      isLoading: false,
    })
  }

  // Register function
  const register = async (name: string, email: string, _password: string): Promise<void> => {
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    if (mockUsers[email]) {
      throw new Error('Email already registered')
    }
    
    const newUser: User = {
      id: `usr_${Date.now()}`,
      name,
      email,
      role: 'community',
      joinedAt: new Date().toISOString().split('T')[0],
      computeHours: 100, // Free tier hours
      storageUsed: '0 MB',
      publications: 0,
    }
    
    // Store in mock DB for session
    mockUsers[email] = { password: _password, user: newUser }
    localStorage.setItem('scihub_user', JSON.stringify(newUser))
    
    setAuthState({
      user: newUser,
      isAuthenticated: true,
      isLoading: false,
    })
  }

  // Logout function
  const logout = (): void => {
    localStorage.removeItem('scihub_user')
    setAuthState({
      user: null,
      isAuthenticated: false,
      isLoading: false,
    })
  }

  // Update profile
  const updateProfile = (updates: Partial<User>): void => {
    if (!authState.user) return
    
    const updatedUser = { ...authState.user, ...updates }
    localStorage.setItem('scihub_user', JSON.stringify(updatedUser))
    
    setAuthState(prev => ({
      ...prev,
      user: updatedUser,
    }))
  }

  return (
    <AuthContext.Provider
      value={{
        ...authState,
        login,
        logout,
        register,
        updateProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

// ============ HOOK ============
export function useAuth(): AuthContextType {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

// ============ EXPORTS ============
export type { User, AuthContextType }
