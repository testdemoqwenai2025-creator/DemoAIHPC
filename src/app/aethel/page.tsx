'use client'

import { useTheme } from '@/components/site/ThemeProvider'
import AETHELConnector from '@/components/aethel/AETHELConnector'

/**
 * /aethel — AETHEL Connector.
 *
 * Migrated out of the home page tab system so it is deep-linkable. Wraps
 * the original component, feeding it the current global theme so the
 * ribbon dark/light toggle still drives its inline conditional styles.
 *
 * Route is a client component because the AETHEL connector takes a
 * `darkMode: boolean` prop and the value comes from the `useTheme()`
 * hook at render time.
 */
export default function AETHELPage() {
  const { theme } = useTheme()
  return (
    <main className="min-h-screen">
      <AETHELConnector darkMode={theme === 'dark'} />
    </main>
  )
}
