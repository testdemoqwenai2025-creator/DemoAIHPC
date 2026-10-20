'use client'

import { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger 
} from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'
import { useAuth, type User } from '@/components/auth/AuthContext'

// ============ TYPES ============
interface GlobalNavbarProps {
  darkMode: boolean
  setDarkMode: (v: boolean) => void
  viewMode: 'landing' | 'microservices'
  setViewMode: (v: 'landing' | 'microservices') => void
  activeTab?: string
  setActiveTab?: (v: string) => void
}

// ============ ICONS ============
const Icons = {
  Logo: () => (
    <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-cyan-400 via-violet-500 to-fuchsia-500 flex items-center justify-center text-white font-bold text-lg shadow-lg shadow-violet-500/25">
      S
    </div>
  ),
  Sun: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m6.34 17.66-1.41 1.41"/><path d="m19.07 4.93-1.41 1.41"/>
    </svg>
  ),
  Moon: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/>
    </svg>
  ),
  Search: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>
    </svg>
  ),
  GitHub: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
    </svg>
  ),
  Star: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
    </svg>
  ),
  Users: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
    </svg>
  ),
  LogIn: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/><polyline points="10 17 15 12 10 7"/><line x1="15" x2="3" y1="12" y2="12"/>
    </svg>
  ),
  LogOut: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" x2="9" y1="12" y2="12"/>
    </svg>
  ),
  Settings: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/>
    </svg>
  ),
  User: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
    </svg>
  ),
  Zap: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
    </svg>
  ),
  Rocket: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z"/><path d="m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z"/><path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0"/><path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5"/>
    </svg>
  ),
  Menu: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="4" x2="20" y1="12" y2="12"/><line x1="4" x2="20" y1="6" y2="6"/><line x1="4" x2="20" y1="18" y2="18"/>
    </svg>
  ),
  X: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 6 6 18"/><path d="m6 6 12 12"/>
    </svg>
  ),
  ChevronDown: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m6 9 6 6 6-6"/>
    </svg>
  ),
}

// ============ LOGIN MODAL ============
function LoginModal({ 
  isOpen, 
  onClose, 
  onLogin, 
  onRegister,
  darkMode 
}: { 
  isOpen: boolean
  onClose: () => void
  onLogin: (email: string, password: string) => Promise<void>
  onRegister: (name: string, email: string, password: string) => Promise<void>
  darkMode: boolean
}) {
  const [isLogin, setIsLogin] = useState(true)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!isOpen) {
      setEmail('')
      setPassword('')
      setName('')
      setError('')
      setIsLogin(true)
    }
  }, [isOpen])

  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    
    try {
      if (isLogin) {
        await onLogin(email, password)
        onClose()
      } else {
        await onRegister(name, email, password)
        onClose()
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className={`relative w-full max-w-md mx-4 rounded-2xl shadow-2xl ${
        darkMode ? 'bg-gray-900 border border-white/10' : 'bg-white border border-gray-200'
      }`}>
        {/* Close button */}
        <button
          onClick={onClose}
          className={`absolute top-4 right-4 p-2 rounded-lg transition-colors ${
            darkMode ? 'hover:bg-white/10 text-gray-400' : 'hover:bg-gray-100 text-gray-500'
          }`}
        >
          <Icons.X />
        </button>

        <div className="p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-cyan-400 via-violet-500 to-fuchsia-500 flex items-center justify-center text-white font-bold text-xl mx-auto mb-4 shadow-lg shadow-violet-500/25">
              S
            </div>
            <h2 className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              {isLogin ? 'Welcome Back' : 'Join SciHub Pro'}
            </h2>
            <p className={`mt-2 text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              {isLogin 
                ? 'Sign in to access your research workspace' 
                : 'Create your free account to get started'
              }
            </p>
          </div>

          {/* Error message */}
          {error && (
            <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20">
              <p className="text-sm text-red-400">{error}</p>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <div>
                <label className={`block text-sm font-medium mb-1.5 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Full Name
                </label>
                <Input
                  type="text"
                  placeholder="Dr. Jane Smith"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required={!isLogin}
                  className={darkMode ? 'bg-white/5 border-white/10' : ''}
                />
              </div>
            )}
            
            <div>
              <label className={`block text-sm font-medium mb-1.5 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                Email Address
              </label>
              <Input
                type="email"
                placeholder="you@institution.edu"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className={darkMode ? 'bg-white/5 border-white/10' : ''}
              />
            </div>
            
            <div>
              <label className={`block text-sm font-medium mb-1.5 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                Password
              </label>
              <Input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                className={darkMode ? 'bg-white/5 border-white/10' : ''}
              />
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-cyan-500 to-violet-500 hover:from-cyan-600 hover:to-violet-600 text-white font-semibold py-3"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                  </svg>
                  Processing...
                </span>
              ) : isLogin ? 'Sign In' : 'Create Account'}
            </Button>
          </form>

          {/* Demo credentials hint */}
          {isLogin && (
            <div className={`mt-4 p-3 rounded-lg text-xs ${darkMode ? 'bg-white/5 text-gray-400' : 'bg-gray-100 text-gray-600'}`}>
              <p className="font-medium mb-1">Demo Credentials:</p>
              <p>Email: <code className="px-1 py-0.5 rounded bg-black/20">demo@scihub.pro</code></p>
              <p>Password: <code className="px-1 py-0.5 rounded bg-black/20">demo123</code></p>
            </div>
          )}

          {/* Toggle */}
          <div className="mt-6 text-center">
            <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              {isLogin ? "Don't have an account? " : 'Already have an account? '}
              <button
                type="button"
                onClick={() => setIsLogin(!isLogin)}
                className="text-cyan-400 hover:text-cyan-300 font-medium"
              >
                {isLogin ? 'Sign up free' : 'Sign in'}
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

// ============ USER MENU ============
function UserMenu({ user, darkMode, onLogout }: { user: User; darkMode: boolean; onLogout: () => void }) {
  const roleColors: Record<string, string> = {
    researcher: 'bg-purple-500/20 text-purple-300',
    developer: 'bg-blue-500/20 text-blue-300',
    admin: 'bg-red-500/20 text-red-300',
    community: 'bg-green-500/20 text-green-300',
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="ghost" 
          size="sm" 
          className={`gap-2 px-3 ${
            darkMode ? 'hover:bg-white/10 text-white' : 'hover:bg-gray-100 text-gray-700'
          }`}
        >
          <Avatar className="w-7 h-7">
            <AvatarFallback className="text-xs bg-gradient-to-br from-cyan-500 to-violet-500 text-white font-medium">
              {user.name.split(' ').map(n => n[0]).join('')}
            </AvatarFallback>
          </Avatar>
          <span className="hidden sm:inline text-sm font-medium max-w-[120px] truncate">
            {user.name.split(' ')[0]}
          </span>
          <Icons.ChevronDown />
        </Button>
      </DropdownMenuTrigger>
      
      <DropdownMenuContent 
        align="end" 
        className={`w-72 ${darkMode ? 'bg-gray-900 border-white/10' : 'bg-white'}`}
      >
        {/* User Info Header */}
        <DropdownMenuLabel className="border-b pb-3">
          <div className="flex items-center gap-3">
            <Avatar className="w-11 h-11">
              <AvatarFallback className="bg-gradient-to-br from-cyan-500 to-violet-500 text-white font-semibold">
                {user.name.split(' ').map(n => n[0]).join('')}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className={`font-semibold text-sm truncate ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                {user.name}
              </p>
              <p className={`text-xs truncate ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                {user.email}
              </p>
              <Badge variant="outline" className={`mt-1.5 text-[10px] ${roleColors[user.role]} border-current`}>
                {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
              </Badge>
            </div>
          </div>
        </DropdownMenuLabel>

        {/* Stats */}
        <div className={`grid grid-cols-3 gap-2 px-2 py-3 border-b ${darkMode ? 'border-white/10' : 'border-gray-100'}`}>
          <div className="text-center">
            <p className={`text-lg font-bold ${darkMode ? 'text-cyan-400' : 'text-cyan-600'}`}>
              {user.computeHours.toLocaleString()}
            </p>
            <p className={`text-[10px] uppercase tracking-wider ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
              CPU Hours
            </p>
          </div>
          <div className="text-center">
            <p className={`text-lg font-bold ${darkMode ? 'text-violet-400' : 'text-violet-600'}`}>
              {user.storageUsed}
            </p>
            <p className={`text-[10px] uppercase tracking-wider ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
              Storage
            </p>
          </div>
          <div className="text-center">
            <p className={`text-lg font-bold ${darkMode ? 'text-fuchsia-400' : 'text-fuchsia-600'}`}>
              {user.publications}
            </p>
            <p className={`text-[10px] uppercase tracking-wider ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
              Papers
            </p>
          </div>
        </div>

        {/* Menu Items */}
        <div className="py-2">
          <DropdownMenuItem className={`${darkMode ? 'focus:bg-white/10 text-gray-300' : 'focus:bg-gray-100 text-gray-700'} cursor-pointer`}>
            <Icons.User />
            <span className="ml-2">My Profile</span>
          </DropdownMenuItem>
          <DropdownMenuItem className={`${darkMode ? 'focus:bg-white/10 text-gray-300' : 'focus:bg-gray-100 text-gray-700'} cursor-pointer`}>
            <Icons.Settings />
            <span className="ml-2">Settings</span>
          </DropdownMenuItem>
          
          <DropdownMenuSub>
            <DropdownMenuSubTrigger className={`${darkMode ? 'focus:bg-white/10 text-gray-300' : 'focus:bg-gray-100 text-gray-700'}`}>
              <Icons.Zap />
              <span className="ml-2">Compute Resources</span>
            </DropdownMenuSubTrigger>
            <DropdownMenuSubContent className={darkMode ? 'bg-gray-900 border-white/10' : ''}>
              <DropdownMenuItem className={`${darkMode ? 'focus:bg-white/10 text-gray-300' : 'focus:bg-gray-100'} cursor-pointer`}>
                GPU Clusters
              </DropdownMenuItem>
              <DropdownMenuItem className={`${darkMode ? 'focus:bg-white/10 text-gray-300' : 'focus:bg-gray-100'} cursor-pointer`}>
                Quantum Simulator
              </DropdownMenuItem>
              <DropdownMenuItem className={`${darkMode ? 'focus:bg-white/10 text-gray-300' : 'focus:bg-gray-100'} cursor-pointer`}>
                AETHEL AI Engine
              </DropdownMenuItem>
            </DropdownMenuSubContent>
          </DropdownMenuSub>
        </div>

        <DropdownMenuSeparator />
        
        <DropdownMenuItem 
          onClick={onLogout}
          className={`${darkMode ? 'focus:bg-white/10 text-red-400' : 'focus:bg-gray-100 text-red-600'} cursor-pointer`}
        >
          <Icons.LogOut />
          <span className="ml-2">Sign Out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

// ============ MAIN NAVBAR COMPONENT ============
export default function GlobalNavbar({
  darkMode,
  setDarkMode,
  viewMode,
  setViewMode,
  activeTab,
  setActiveTab,
}: GlobalNavbarProps) {
  const { user, isAuthenticated, login, logout, register } = useAuth()
  const [showLoginModal, setShowLoginModal] = useState(false)
  const [showMobileMenu, setShowMobileMenu] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const searchRef = useRef<HTMLDivElement>(null)

  // Navigation tabs for microservices view
  const navTabs = [
    { id: 'dashboard', label: 'Dashboard', icon: '📊' },
    { id: 'architecture', label: 'Architecture', icon: '🏗️' },
    { id: 'connectors', label: 'Connectors', icon: '🔌' },
    { id: 'ide', label: 'IDE Studio', icon: '💻' },
    { id: 'datalake', label: 'Data Lake', icon: '🏔️' },
    { id: 'publish', label: 'Publish', icon: '📚' },
  ]

  // Close mobile menu on resize
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) setShowMobileMenu(false)
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  return (
    <>
      {/* ===== MAIN NAVBAR ===== */}
      <nav className={`sticky top-0 z-50 w-full border-b backdrop-blur-xl ${
        darkMode 
          ? 'bg-gray-950/80 border-white/10' 
          : 'bg-white/80 border-gray-200'
      }`}>
        <div className="max-w-[1920px] mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            
            {/* ===== LEFT SECTION: Logo + Nav ===== */}
            <div className="flex items-center gap-6">
              {/* Logo */}
              <button 
                onClick={() => setViewMode('landing')}
                className="flex items-center gap-2.5 group"
              >
                <Icons.Logo />
                <div className="hidden sm:block">
                  <p className={`font-bold text-lg leading-tight group-hover:text-cyan-400 transition-colors ${
                    darkMode ? 'text-white' : 'text-gray-900'
                  }`}>
                    SciHub Pro
                  </p>
                  <p className={`text-[10px] leading-tight ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                    Scientific GitHub
                  </p>
                </div>
              </button>

              {/* Desktop Navigation Tabs - Only show in microservices mode */}
              {viewMode === 'microservices' && (
                <div className="hidden lg:flex items-center gap-1">
                  {navTabs.map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab?.(tab.id)}
                      className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                        activeTab === tab.id
                          ? darkMode
                            ? 'bg-cyan-500/20 text-cyan-400'
                            : 'bg-cyan-100 text-cyan-700'
                          : darkMode
                            ? 'text-gray-400 hover:text-white hover:bg-white/5'
                            : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                      }`}
                    >
                      <span className="mr-1.5">{tab.icon}</span>
                      {tab.label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* ===== CENTER SECTION: Search ===== */}
            <div className="hidden md:flex flex-1 max-w-md mx-6" ref={searchRef}>
              <div className={`relative w-full group`}>
                <Icons.Search />
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-cyan-400 transition-colors">
                  <Icons.Search />
                </div>
                <input
                  type="text"
                  placeholder="Search services, datasets, papers..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className={`w-full pl-10 pr-4 py-2 rounded-xl text-sm border transition-all ${
                    darkMode 
                      ? 'bg-white/5 border-white/10 text-white placeholder:text-gray-500 focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/25' 
                      : 'bg-gray-50 border-gray-200 text-gray-900 placeholder:text-gray-400 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/25'
                  }`}
                />
                <kbd className={`absolute right-3 top-1/2 -translate-y-1/2 hidden group-focus-with:inline-flex items-center gap-1 px-2 py-0.5 text-[10px] rounded border ${
                  darkMode ? 'border-white/20 text-gray-400 bg-white/5' : 'border-gray-200 text-gray-500 bg-gray-100'
                }`}>
                  ⌘K
                </kbd>
              </div>
            </div>

            {/* ===== RIGHT SECTION: Actions ===== */}
            <div className="flex items-center gap-3">
              
              {/* Badges - Visible Always */}
              <div className="hidden xl:flex items-center gap-2">
                {/* Open Source Badge */}
                <a
                  href="#opensource"
                  className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-xs font-medium transition-all hover:scale-105 ${
                    darkMode 
                      ? 'bg-green-500/10 text-green-400 border border-green-500/20 hover:bg-green-500/20' 
                      : 'bg-green-50 text-green-600 border border-green-200 hover:bg-green-100'
                  }`}
                >
                  <Icons.GitHub />
                  Open Source
                </a>

                {/* Community Edition Badge */}
                <a
                  href="#community"
                  className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-xs font-medium transition-all hover:scale-105 ${
                    darkMode 
                      ? 'bg-violet-500/10 text-violet-400 border border-violet-500/20 hover:bg-violet-500/20' 
                      : 'bg-violet-50 text-violet-600 border border-violet-200 hover:bg-violet-100'
                  }`}
                >
                  <Icons.Star />
                  Community Free
                </a>
              </div>

              {/* CTA Button - for landing page or non-authenticated users */}
              {!isAuthenticated && viewMode === 'landing' && (
                <Button
                  onClick={() => {
                    setViewMode('microservices')
                    setActiveTab?.('dashboard')
                  }}
                  className="hidden sm:flex bg-gradient-to-r from-cyan-500 to-violet-500 hover:from-cyan-600 hover:to-violet-600 text-white font-semibold text-sm shadow-lg shadow-violet-500/25"
                >
                  <Icons.Rocket />
                  <span className="ml-1.5">Launch Platform</span>
                </Button>
              )}

              {/* Theme Toggle */}
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setDarkMode(!darkMode)}
                className={`rounded-lg ${
                  darkMode ? 'hover:bg-white/10 text-yellow-400' : 'hover:bg-gray-100 text-gray-600'
                }`}
              >
                {darkMode ? <Icons.Sun /> : <Icons.Moon />}
              </Button>

              {/* Auth Button / User Menu */}
              {isAuthenticated && user ? (
                <UserMenu 
                  user={user} 
                  darkMode={darkMode} 
                  onLogout={() => logout()} 
                />
              ) : (
                <Button
                  onClick={() => setShowLoginModal(true)}
                  variant={viewMode === 'microservices' ? 'default' : 'outline'}
                  className={`${
                    viewMode === 'microservices'
                      ? 'bg-gradient-to-r from-cyan-500 to-violet-500 hover:from-cyan-600 hover:to-violet-600 text-white'
                      : darkMode 
                        ? 'border-white/20 text-white hover:bg-white/10'
                        : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                  } font-medium text-sm`}
                >
                  <Icons.LogIn />
                  <span className="hidden sm:inline ml-1.5">Sign In</span>
                </Button>
              )}

              {/* Mobile Menu Toggle */}
              <Button
                variant="ghost"
                size="icon"
                className={`lg:hidden rounded-lg ${
                  darkMode ? 'hover:bg-white/10 text-white' : 'hover:bg-gray-100 text-gray-700'
                }`}
                onClick={() => setShowMobileMenu(!showMobileMenu)}
              >
                {showMobileMenu ? <Icons.X /> : <Icons.Menu />}
              </Button>
            </div>
          </div>

          {/* ===== MOBILE MENU ===== */}
          {showMobileMenu && (
            <div className={`lg:hidden border-t mt-2 pb-4 ${
              darkMode ? 'border-white/10' : 'border-gray-200'
            }`}>
              {/* Mobile Search */}
              <div className="pt-3 pb-2">
                <div className="relative">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                    <Icons.Search />
                  </div>
                  <input
                    type="text"
                    placeholder="Search..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className={`w-full pl-10 pr-4 py-2.5 rounded-xl text-sm border ${
                      darkMode 
                        ? 'bg-white/5 border-white/10 text-white placeholder:text-gray-500' 
                        : 'bg-gray-50 border-gray-200 text-gray-900 placeholder:text-gray-400'
                    }`}
                  />
                </div>
              </div>

              {/* Mobile Navigation Tabs */}
              {viewMode === 'microservices' && (
                <div className="flex flex-wrap gap-2 pt-2">
                  {navTabs.map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => {
                        setActiveTab?.(tab.id)
                        setShowMobileMenu(false)
                      }}
                      className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                        activeTab === tab.id
                          ? darkMode
                            ? 'bg-cyan-500/20 text-cyan-400'
                            : 'bg-cyan-100 text-cyan-700'
                          : darkMode
                            ? 'text-gray-400 hover:text-white hover:bg-white/5'
                            : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                      }`}
                    >
                      <span className="mr-1.5">{tab.icon}</span>
                      {tab.label}
                    </button>
                  ))}
                </div>
              )}

              {/* Mobile Badges & CTAs */}
              <div className="flex flex-wrap gap-2 pt-3 mt-2 border-t border-dashed">
                <span className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-xs font-medium ${
                  darkMode ? 'bg-green-500/10 text-green-400' : 'bg-green-50 text-green-600'
                }`}>
                  <Icons.GitHub /> Open Source
                </span>
                <span className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-xs font-medium ${
                  darkMode ? 'bg-violet-500/10 text-violet-400' : 'bg-violet-50 text-violet-600'
                }`}>
                  <Icons.Star /> Free
                </span>
                
                {!isAuthenticated && (
                  <Button
                    onClick={() => {
                      setShowLoginModal(true)
                      setShowMobileMenu(false)
                    }}
                    size="sm"
                    className="bg-gradient-to-r from-cyan-500 to-violet-500 text-white"
                  >
                    Sign In
                  </Button>
                )}
              </div>
            </div>
          )}
        </div>
      </nav>

      {/* ===== LOGIN MODAL ===== */}
      <LoginModal
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
        onLogin={login}
        onRegister={register}
        darkMode={darkMode}
      />
    </>
  )
}
