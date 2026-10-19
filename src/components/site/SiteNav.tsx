'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { useTheme } from './ThemeProvider'

/**
 * SiteNav — global top navigation rendered from RootLayout.
 *
 * Visible on every page so that visitors always have:
 *   - brand / home link
 *   - primary navigation (Home / About / Preview1 / Microservices)
 *   - dark/light theme toggle (the user explicitly asked for a toggle on
 *     "each page")
 *
 * It is intentionally lightweight and uses shadcn/ui tokens, so it inherits
 * the current theme automatically.
 */
export function SiteNav() {
  const pathname = usePathname()
  const { theme, toggleTheme } = useTheme()

  const links: { href: string; label: string }[] = [
    { href: '/', label: 'Home' },
    { href: '/about', label: 'About' },
    { href: '/preview1', label: 'Preview 1' },
  ]

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/60 bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4">
        <Link
          href="/"
          className="flex items-center gap-2 font-semibold tracking-tight"
        >
          <span className="inline-flex h-7 w-7 items-center justify-center rounded-md bg-gradient-to-br from-cyan-400 via-violet-500 to-fuchsia-500 text-white text-xs font-bold">
            A
          </span>
          <span className="hidden sm:inline">AIHPC Advanced</span>
        </Link>

        <nav className="flex items-center gap-1 text-sm">
          {links.map((l) => {
            const active =
              l.href === '/'
                ? pathname === '/'
                : pathname?.startsWith(l.href) ?? false
            return (
              <Link
                key={l.href}
                href={l.href}
                className={`rounded-md px-3 py-1.5 transition-colors ${
                  active
                    ? 'bg-accent text-accent-foreground'
                    : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                }`}
              >
                {l.label}
              </Link>
            )
          })}

          <Button
            type="button"
            variant="outline"
            size="sm"
            className="ml-2 gap-2"
            onClick={toggleTheme}
            aria-label="Toggle dark / light theme"
            title="Toggle dark / light theme"
          >
            {theme === 'dark' ? (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="12" cy="12" r="4" />
                <path d="M12 2v2" />
                <path d="M12 20v2" />
                <path d="m4.93 4.93 1.41 1.41" />
                <path d="m17.66 17.66 1.41 1.41" />
                <path d="M2 12h2" />
                <path d="M20 12h2" />
                <path d="m6.34 17.66-1.41 1.41" />
                <path d="m19.07 4.93-1.41 1.41" />
              </svg>
            ) : (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
              </svg>
            )}
            <span className="hidden sm:inline">
              {theme === 'dark' ? 'Light' : 'Dark'}
            </span>
          </Button>
        </nav>
      </div>
    </header>
  )
}
