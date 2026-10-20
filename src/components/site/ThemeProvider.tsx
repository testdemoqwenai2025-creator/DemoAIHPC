'use client'

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'

type Theme = 'light' | 'dark'

interface ThemeContextValue {
  theme: Theme
  setTheme: (t: Theme) => void
  toggleTheme: () => void
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined)

const STORAGE_KEY = 'aihpc-theme'

/**
 * Global theme provider.
 *
 * Persists the chosen theme to localStorage and reflects it by toggling the
 * `dark` class on the <html> element. The shadcn/ui tokens in globals.css
 * already define both `:root` (light) and `.dark` (dark) variants, so any
 * component that uses the standard `bg-background`, `text-foreground`,
 * `bg-card`, ... classes will automatically re-theme on toggle.
 *
 * Pages that historically carried their own dark-mode state (e.g. the main
 * `app/page.tsx` microservices view) continue to work — they simply read the
 * initial theme from this provider on mount so the global toggle and the
 * in-page toggle stay in sync.
 */
export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>('dark')

  // hydrate from localStorage / system preference on mount
  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY) as Theme | null
      if (stored === 'light' || stored === 'dark') {
        setThemeState(stored)
        return
      }
    } catch {
      // ignore (private mode etc.)
    }
    if (
      typeof window !== 'undefined' &&
      window.matchMedia &&
      window.matchMedia('(prefers-color-scheme: light)').matches
    ) {
      setThemeState('light')
    }
  }, [])

  // reflect theme onto <html> + persist
  useEffect(() => {
    const root = document.documentElement
    if (theme === 'dark') {
      root.classList.add('dark')
    } else {
      root.classList.remove('dark')
    }
    try {
      window.localStorage.setItem(STORAGE_KEY, theme)
    } catch {
      // ignore
    }
  }, [theme])

  const value = useMemo<ThemeContextValue>(
    () => ({
      theme,
      setTheme: setThemeState,
      toggleTheme: () =>
        setThemeState((prev) => (prev === 'dark' ? 'light' : 'dark')),
    }),
    [theme],
  )

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext)
  if (!ctx) {
    // safe fallback so pages rendered outside the provider don't crash
    return {
      theme: 'dark',
      setTheme: () => undefined,
      toggleTheme: () => undefined,
    }
  }
  return ctx
}
