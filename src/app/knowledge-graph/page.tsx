'use client'

import { useTheme } from '@/components/site/ThemeProvider'
import KnowledgeGraph from '@/components/visualization/KnowledgeGraph'

export default function KnowledgeGraphPage() {
  const { theme } = useTheme()
  return (
    <main className="min-h-screen">
      <KnowledgeGraph darkMode={theme === 'dark'} />
    </main>
  )
}
