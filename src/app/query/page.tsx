'use client'

import { useTheme } from '@/components/site/ThemeProvider'
import QueryExecutor from '@/components/query/QueryExecutor'

export default function QueryPage() {
  const { theme } = useTheme()
  return (
    <main className="min-h-screen">
      <QueryExecutor darkMode={theme === 'dark'} />
    </main>
  )
}
