'use client'

import { useTheme } from '@/components/site/ThemeProvider'
import DomainWorkflows from '@/components/workflows/DomainWorkflows'

export default function WorkflowsPage() {
  const { theme } = useTheme()
  return (
    <main className="min-h-screen">
      <DomainWorkflows darkMode={theme === 'dark'} />
    </main>
  )
}
