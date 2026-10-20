'use client'

import { useTheme } from '@/components/site/ThemeProvider'
import ScientificConnectorsHub from '@/components/connectors/ScientificConnectorsHub'

export default function ConnectorsPage() {
  const { theme } = useTheme()
  return (
    <main className="min-h-screen">
      <ScientificConnectorsHub darkMode={theme === 'dark'} />
    </main>
  )
}
