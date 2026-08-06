'use client'

import { useState, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'

// ============ TYPES ============
interface QueryExecutorProps {
  darkMode: boolean
}

interface QueryResultRow {
  [key: string]: string | number
}

interface QueryExecutionPlan {
  step: string
  type: string
  cost: string
  rows: string
  time: string
}

// ============ MOCK DATABASE TABLES ============
const mockTables = [
  { name: 'publications', columns: ['id', 'title', 'authors', 'year', 'doi', 'citations', 'field', 'journal'], rowCount: 2500000 },
  { name: 'genomic_sequences', columns: ['id', 'organism', 'gene_name', 'sequence_length', 'gc_content', 'chromosome', 'function'], rowCount: 300000000 },
  { name: 'molecular_compounds', columns: ['id', 'name', 'smiles', 'molecular_weight', 'logp', 'hba', 'hbd', 'rotatable_bonds'], rowCount: 111000000 },
  { name: 'climate_data', columns: ['id', 'station', 'latitude', 'longitude', 'date', 'temperature', 'precipitation', 'pressure', 'humidity'], rowCount: 50000000 },
  { name: 'materials', columns: ['id', 'formula', 'crystal_system', 'band_gap', 'formation_energy', 'density', 'space_group'], rowCount: 150000 },
  { name: 'experiments', columns: ['id', 'researcher_id', 'type', 'status', 'created_at', 'compute_hours', 'storage_used'], rowCount: 89000 },
]

// ============ MOCK DATA GENERATORS ============
const generateMockData = (table: string, limit: number): QueryResultRow[] => {
  const generators: Record<string, () => QueryResultRow> = {
    publications: () => ({
      id: `PUB${Math.floor(Math.random() * 9000000) + 1000000}`,
      title: [
        'Deep Learning for Protein Structure Prediction',
        'CRISPR-Cas9 Gene Editing: A Comprehensive Review',
        'Climate Change Impacts on Biodiversity Hotspots',
        'Quantum Computing Applications in Drug Discovery',
        'Machine Learning Accelerated Materials Discovery',
        'Single-Cell RNA Sequencing Analysis Methods',
        'Federated Learning for Privacy-Preserving Healthcare',
        'Transformer Models for Scientific Literature Mining',
        'Graph Neural Networks for Molecular Property Prediction',
        'Reinforcement Learning for Laboratory Automation',
      ][Math.floor(Math.random() * 10)],
      authors: ['Zhang Y et al.', 'Smith J, Johnson A', 'Garcia M et al.', 'Chen L, Wang H', 'Brown K et al.'][Math.floor(Math.random() * 5)],
      year: 2020 + Math.floor(Math.random() * 5),
      doi: `10.${Math.floor(Math.random() * 9999)}/${['arXiv', 'Nature', 'Science', 'Cell', 'PLOS ONE'][Math.floor(Math.random() * 5)].toLowerCase()}.${Math.floor(Math.random() * 100000)}`,
      citations: Math.floor(Math.random() * 10000),
      field: ['Bioinformatics', 'Physics', 'Chemistry', 'Materials Science', 'Climate Science'][Math.floor(Math.random() * 5)],
      journal: ['Nature', 'Science', 'Cell', 'PLOS ONE', 'arXiv preprint'][Math.floor(Math.random() * 5)],
    }),
    genomic_sequences: () => ({
      id: `NC_${Math.floor(Math.random() * 900000000) + 100000000}`,
      organism: ['Homo sapiens', 'Mus musculus', 'Drosophila melanogaster', 'Saccharomyces cerevisiae', 'Arabidopsis thaliana'][Math.floor(Math.random() * 5)],
      gene_name: ['BRCA1', 'TP53', 'EGFR', 'MYC', 'KRAS', 'PIK3CA', 'PTEN', 'ATM'][Math.floor(Math.random() * 8)],
      sequence_length: Math.floor(Math.random() * 50000) + 500,
      gc_content: (Math.random() * 30 + 40).toFixed(1),
      chromosome: [`Chr${Math.floor(Math.random() * 22) + 1}`, 'ChrX', 'ChrY', 'Mt'][Math.floor(Math.random() * 25)],
      function: ['Tumor suppressor', 'Oncogene', 'Kinase', 'Transcription factor', 'Receptor'][Math.floor(Math.random() * 5)],
    }),
    molecular_compounds: () => ({
      id: `CID:${Math.floor(Math.random() * 90000000) + 10000000}`,
      name: ['Aspirin', 'Ibuprofen', 'Acetaminophen', 'Caffeine', 'Dopamine', 'Serotonin', 'Adrenaline', 'Insulin'][Math.floor(Math.random() * 8)],
      smiles: ['CC(=O)OCc1ccccc1C(=O)O', 'CC(C)Cc1ccc(cc1)C(C)C(=O)O', 'CC(=O)Nc1ccc(O)cc1', 'Cn1cnc2c1c(=O)n(c(=O)n2C)C'][Math.floor(Math.random() * 4)],
      molecular_weight: (Math.random() * 800 + 50).toFixed(2),
      logp: (Math.random() * 6 - 2).toFixed(2),
      hba: Math.floor(Math.random() * 8),
      hbd: Math.floor(Math.random() * 6),
      rotatable_bonds: Math.floor(Math.random() * 12),
    }),
    climate_data: () => ({
      id: `CLIM-${Math.floor(Date.now() / 1000) - Math.floor(Math.random() * 31536000)}`,
      station: ['Mauna Loa', 'South Pole', 'Barrow', 'Maui', 'American Samoa', 'Alert'][Math.floor(Math.random() * 6)],
      latitude: (Math.random() * 180 - 90).toFixed(4),
      longitude: (Math.random() * 360 - 180).toFixed(4),
      date: new Date(Date.now() - Math.floor(Math.random() * 31536000000000)).toISOString().split('T')[0],
      temperature: (Math.random() * 60 - 20).toFixed(2),
      precipitation: (Math.random() * 200).toFixed(2),
      pressure: (Math.random() * 100 + 980).toFixed(2),
      humidity: (Math.floor(Math.random() * 100)).toString(),
    }),
    materials: () => ({
      id: `mp-${Math.floor(Math.random() * 900000) + 100000}`,
      formula: ['SiO2', 'TiO2', 'Fe2O3', 'Al2O3', 'CaCO3', 'NaCl', 'MAPbI3', 'CsPbBr3'][Math.floor(Math.random() * 8)],
      crystal_system: ['Cubic', 'Tetragonal', 'Orthorhombic', 'Hexagonal', 'Monoclinic', 'Trigonal'][Math.floor(Math.random() * 6)],
      band_gap: (Math.random() * 6).toFixed(3),
      formation_energy: (Math.random() * 4 - 2).toFixed(3),
      density: (Math.random() * 8 + 1).toFixed(3),
      space_group: ['Fm-3m', 'P63/mmc', 'R-3c', 'Pnma', 'I4/mmm'][Math.floor(Math.random() * 5)],
    }),
    experiments: () => ({
      id: `EXP-${Math.floor(Math.random() * 90000) + 10000}`,
      researcher_id: `USR${Math.floor(Math.random() * 9000) + 1000}`,
      type: ['Genomics Pipeline', 'ML Training', 'Molecular Dynamics', 'Quantum Chemistry', 'Data Ingestion'][Math.floor(Math.random() * 5)],
      status: ['Running', 'Completed', 'Queued', 'Failed', 'Paused'][Math.floor(Math.random() * 5)],
      created_at: new Date(Date.now() - Math.floor(Math.random() * 2592000000)).toISOString().split('T')[0],
      compute_hours: (Math.random() * 1000).toFixed(1),
      storage_used: `${(Math.random() * 500).toFixed(1)} GB`,
    }),
  }

  const generator = generators[table]
  if (!generator) return []

  return Array.from({ length: limit }, generator)
}

// ============ QUERY PARSER (Simple SQL-like) ============
const parseQuery = (sql: string): { table?: string; conditions: string[]; limit: number; error?: string } => {
  const trimmed = sql.trim()
  
  // Simple SELECT parser
  const selectMatch = trimmed.match(/SELECT\s+.*?\s+FROM\s+(\w+)/i)
  
  if (!selectMatch) {
    return { conditions: [], limit: 10, error: 'Query must start with SELECT ... FROM' }
  }

  const table = selectMatch[1]
  const tableExists = mockTables.find(t => t.name === table)
  
  if (!tableExists) {
    return { conditions: [], limit: 10, error: `Table "${table}" not found. Available tables: ${mockTables.map(t => t.name).join(', ')}` }
  }

  // Extract WHERE conditions
  const whereMatch = trimmed.match(/WHERE\s+(.+?)(?:\s+ORDER\s+BY|\s+LIMIT|$)/i)
  const conditions = whereMatch ? [whereMatch[1]] : []

  // Extract LIMIT
  const limitMatch = trimmed.match(/LIMIT\s+(\d+)/i)
  const limit = limitMatch ? parseInt(limitMatch[1]) : 10

  return { table, conditions, limit }
}

// ============ ICONS ============
const Icons = {
  Play: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="5 3 19 12 5 21 5 3"/>
    </svg>
  ),
  Clear: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 6 6 18"/><path d="m6 6 12 12"/>
    </svg>
  ),
  Table: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="2"/><line x1="3" x2="21" y1="9" y2="9"/><line x1="3" x2="21" y1="15" y2="15"/><line x1="9" x2="9" y1="9" y2="21"/>
    </svg>
  ),
  Clock: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
    </svg>
  ),
  Database: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M3 5V19A9 3 0 0 0 21 19V5"/><path d="M3 12A9 3 0 0 0 21 12"/>
    </svg>
  ),
  CheckCircle: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>
    </svg>
  ),
  AlertCircle: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/><line x1="12" x2="12" y1="8" y2="12"/><line x1="12" x2="12.01" y1="16" y2="16"/>
    </svg>
  ),
  Download: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/>
    </svg>
  ),
  Zap: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
    </svg>
  ),
  ChevronDown: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m6 9 6 6 6-6"/>
    </svg>
  ),
}

// ============ SAMPLE QUERIES ============
const sampleQueries = [
  {
    label: 'Recent Publications',
    sql: 'SELECT * FROM publications WHERE year >= 2023 ORDER BY citations DESC LIMIT 10',
  },
  {
    label: 'Human Genes',
    sql: "SELECT * FROM genomic_sequences WHERE organism = 'Homo sapiens' LIMIT 15",
  },
  {
    label: 'Drug Compounds',
    sql: "SELECT * FROM molecular_compounds WHERE molecular_weight < 500 AND logp < 5 LIMIT 10",
  },
  {
    label: 'Temperature Data',
    sql: 'SELECT * FROM climate_data WHERE temperature > 25 LIMIT 20',
  },
  {
    label: 'Semiconductor Materials',
    sql: "SELECT * FROM materials WHERE band_gap BETWEEN 1 AND 3 AND crystal_system = 'Cubic' LIMIT 10",
  },
  {
    label: 'Running Experiments',
    sql: "SELECT * FROM experiments WHERE status = 'Running' ORDER BY compute_hours DESC LIMIT 10",
  },
]

// ============ MAIN COMPONENT ============
export default function QueryExecutor({ darkMode }: QueryExecutorProps) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<QueryResultRow[]>([])
  const [columns, setColumns] = useState<string[]>([])
  const [isExecuting, setIsExecuting] = useState(false)
  const [executionTime, setExecutionTime] = useState<number>(0)
  const [error, setError] = useState<string | null>(null)
  const [queryHistory, setQueryHistory] = useState<string[]>([])
  const [showPlan, setShowPlan] = useState(false)
  const [selectedTable, setSelectedTable] = useState<string>('')

  // Execute query
  const executeQuery = async (sql: string) => {
    setIsExecuting(true)
    setError(null)
    setResults([])
    
    const startTime = performance.now()

    // Simulate processing delay based on complexity
    await new Promise(resolve => setTimeout(resolve, 300 + Math.random() * 700))

    const parsed = parseQuery(sql)

    if (parsed.error) {
      setError(parsed.error)
      setIsExecuting(false)
      return
    }

    if (!parsed.table) {
      setError('No table specified')
      setIsExecuting(false)
      return
    }

    // Generate mock data
    const data = generateMockData(parsed.table, parsed.limit || 10)
    
    const endTime = performance.now()
    setExecutionTime(endTime - startTime)

    if (data.length > 0) {
      setColumns(Object.keys(data[0]))
      setResults(data)
      
      // Add to history
      setQueryHistory(prev => [sql, ...prev.slice(0, 9)])
    } else {
      setError('No results found')
    }

    setIsExecuting(false)
  }

  // Handle table selection for schema browser
  const handleTableSelect = (tableName: string) => {
    setSelectedTable(tableName)
    const table = mockTables.find(t => t.name === tableName)
    if (table) {
      setQuery(`-- Schema: ${table.name}\n-- Columns: ${table.columns.join(', ')}\n-- Row count: ${table.rowCount.toLocaleString()}\n\nSELECT * FROM ${table.name} LIMIT 20;`)
    }
  }

  // Generate execution plan (mock)
  const executionPlan: QueryExecutionPlan[] = useMemo(() => {
    if (!query) return []
    
    return [
      { step: 'Parse & Analyze', type: 'Parser', cost: '0ms', rows: '-', time: '1ms' },
      { step: 'Table Scan', type: 'Seq Scan', cost: `${(Math.random() * 100 + 10).toFixed(1)}MB`, rows: `${Math.floor(Math.random() * 100000)}`, time: `${(Math.random() * 50 + 5).toFixed(0)}ms` },
      { step: 'Filter Conditions', type: 'Filter', cost: '-', rows: `${Math.floor(Math.random() * 10000)}`, time: `${(Math.random() * 20 + 2).toFixed(0)}ms` },
      { step: 'Sort Operation', type: 'Sort', cost: `${(Math.random() * 10 + 1).toFixed(1)}MB`, rows: `${results.length}`, time: `${(Math.random() * 10 + 1).toFixed(0)}ms` },
      { step: 'Limit Results', type: 'Limit', cost: '-', rows: `${results.length}`, time: '<1ms' },
    ]
  }, [query, results])

  return (
    <TooltipProvider>
      <div className="space-y-6">
        
        {/* ===== HEADER ===== */}
        <Card className={`relative overflow-hidden ${
          darkMode ? 'bg-gradient-to-br from-emerald-900/30 to-cyan-900/30 border-emerald-500/20' : 'bg-gradient-to-br from-emerald-50 to-cyan-50 border-emerald-200'
        }`}>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-400 via-cyan-500 to-blue-500 flex items-center justify-center text-white shadow-lg shadow-cyan-500/25">
                <Icons.Database />
              </div>
              
              <div className="flex-1">
                <h2 className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                  Cross-Domain Query Engine
                </h2>
                <p className={`mt-1 text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  Execute SQL queries across genomics, literature, chemistry, climate, and materials databases
                </p>
                
                <div className="flex items-center gap-4 mt-3">
                  <Badge variant="outline" className="bg-green-500/10 text-green-400 border-green-500/20">
                    {mockTables.reduce((acc, t) => acc + t.rowCount, 0).toLocaleString()} Total Records
                  </Badge>
                  <Badge variant="outline" className="bg-blue-500/10 text-blue-400 border-blue-500/20">
                    {mockTables.length} Tables
                  </Badge>
                  <Badge variant="outline" className="bg-purple-500/10 text-purple-400 border-purple-500/20">
                    Polyglot Backend
                  </Badge>
                </div>
              </div>

              {/* Stats */}
              <div className="hidden lg:flex items-center gap-6">
                {[
                  { label: 'Avg Latency', value: '~24ms' },
                  { label: 'Cache Hit', value: '94%' },
                  { label: 'Uptime', value: '99.97%' },
                ].map((stat, i) => (
                  <div key={i} className="text-right">
                    <p className="text-xl font-bold text-cyan-400">{stat.value}</p>
                    <p className={`text-[10px] uppercase ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>{stat.label}</p>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          
          {/* LEFT: QUERY EDITOR */}
          <div className="lg:col-span-3 space-y-4">
            
            {/* Query Input */}
            <Card className={`${darkMode ? 'bg-black/30 backdrop-blur-xl border-white/10' : 'bg-white border-gray-200'}`}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className={`text-sm flex items-center gap-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                    <Icons.Zap /> SQL Editor
                  </CardTitle>
                  
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowPlan(!showPlan)}
                      className={darkMode ? 'text-gray-400 hover:text-white' : ''}
                    >
                      Plan
                    </Button>
                    
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => { setQuery(''); setResults([]); setError(null); }}
                      className={darkMode ? 'text-gray-400 hover:text-white' : ''}
                    >
                      <Icons.Clear />
                    </Button>
                    
                    <Button
                      onClick={() => executeQuery(query)}
                      disabled={!query.trim() || isExecuting}
                      size="sm"
                      className="bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-600 hover:to-cyan-600"
                    >
                      {isExecuting ? (
                        <span className="flex items-center gap-2">
                          <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                          </svg>
                          Executing...
                        </span>
                      ) : (
                        <span className="flex items-center gap-2"><Icons.Play /> Run</span>
                      )}
                    </Button>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-4">
                <Textarea
                  placeholder="-- Enter your SQL query here&#10;-- Example: SELECT * FROM publications WHERE year >= 2023 LIMIT 10"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className={`min-h-[140px] font-mono text-sm resize-none ${
                    darkMode ? 'bg-black/30 border-white/10 placeholder:text-gray-600' : ''
                  }`}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                      executeQuery(query)
                    }
                  }}
                />
                
                {/* Sample Queries */}
                <div>
                  <p className={`text-xs mb-2 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                    Sample queries:
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {sampleQueries.map((sq, i) => (
                      <button
                        key={i}
                        onClick={() => setQuery(sq.sql)}
                        className={`text-xs px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer truncate max-w-[200px] ${
                          darkMode 
                            ? 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white' 
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200 hover:text-gray-900'
                        }`}
                      >
                        {sq.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Execution Plan */}
                {showPlan && (
                  <div className={`rounded-lg p-4 ${darkMode ? 'bg-black/30' : 'bg-gray-50'}`}>
                    <p className={`text-xs font-medium mb-3 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                      Execution Plan:
                    </p>
                    <div className="space-y-2">
                      {executionPlan.map((step, i) => (
                        <div key={i} className={`flex items-center gap-4 p-2 rounded text-xs ${
                          darkMode ? 'bg-white/5' : 'bg-white'
                        }`}>
                          <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                            darkMode ? 'bg-cyan-500/20 text-cyan-400' : 'bg-cyan-100 text-cyan-600'
                          }`}>
                            {i + 1}
                          </span>
                          <span className={`font-medium w-32 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                            {step.step}
                          </span>
                          <Badge variant="outline" className="text-[10px]">
                            {step.type}
                          </Badge>
                          <span className={`${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>{step.cost}</span>
                          <span className={`${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>{step.rows} rows</span>
                          <span className="text-cyan-400 ml-auto">{step.time}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Error Display */}
            {error && (
              <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/20">
                <div className="flex items-start gap-3">
                  <Icons.AlertCircle />
                  <div>
                    <p className="font-medium text-sm text-red-400">Query Error</p>
                    <p className="text-xs text-red-300 mt-1">{error}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Results Table */}
            {results.length > 0 && (
              <Card className={`${darkMode ? 'bg-black/30 backdrop-blur-xl border-white/10' : 'bg-white border-gray-200'}`}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className={`text-sm ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                        <Icons.Table /> Query Results
                      </CardTitle>
                      <CardDescription className="flex items-center gap-3 mt-1">
                        <span>{results.length} rows returned</span>
                        <span className={darkMode ? 'text-gray-600' : 'text-gray-400'}>&middot;</span>
                        <span className="flex items-center gap-1">
                          <Icons.Clock /> {executionTime.toFixed(0)}ms
                        </span>
                      </CardDescription>
                    </div>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      className={darkMode ? 'border-white/20' : ''}
                    >
                      <Icons.Download /> Export CSV
                    </Button>
                  </div>
                </CardHeader>
                
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className={darkMode ? 'border-b border-white/10' : 'border-b border-gray-200'}>
                          {columns.map((col) => (
                            <th
                              key={col}
                              className={`text-left px-4 py-3 font-medium text-xs uppercase tracking-wider ${
                                darkMode ? 'text-gray-400' : 'text-gray-500'
                              }`}
                            >
                              {col.replace(/_/g, ' ')}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {results.map((row, i) => (
                          <tr
                            key={i}
                            className={`${
                              darkMode ? 'border-b border-white/5 hover:bg-white/5' : 'border-b border-gray-100 hover:bg-gray-50'
                            } transition-colors`}
                          >
                            {columns.map((col) => (
                              <td
                                key={col}
                                className={`px-4 py-3 text-xs max-w-[200px] truncate ${
                                  darkMode ? 'text-gray-300' : 'text-gray-700'
                                } ${typeof row[col] === 'number' ? 'font-mono text-cyan-400' : ''}`}
                                title={String(row[col])}
                              >
                                {String(row[col])}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  
                  {/* Result Stats */}
                  <div className={`flex items-center justify-between mt-4 pt-4 border-t ${
                    darkMode ? 'border-white/10' : 'border-gray-200'
                  }`}>
                    <span className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                      Showing {results.length} of {results.length.toLocaleString()} rows
                    </span>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs bg-green-500/10 text-green-400 border-green-500/20">
                        <Icons.CheckCircle /> Query Successful
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* RIGHT: SCHEMA BROWSER & HISTORY */}
          <div className="space-y-4">
            
            {/* Schema Browser */}
            <Card className={`${darkMode ? 'bg-black/30 backdrop-blur-xl border-white/10' : 'bg-white border-gray-200'}`}>
              <CardHeader className="pb-3">
                <CardTitle className={`text-sm ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                  Schema Browser
                </CardTitle>
              </CardHeader>
              
              <CardContent className="space-y-2">
                {mockTables.map((table) => (
                  <button
                    key={table.name}
                    onClick={() => handleTableSelect(table.name)}
                    className={`w-full text-left p-3 rounded-lg transition-colors ${
                      selectedTable === table.name
                        ? darkMode ? 'bg-cyan-500/20 text-cyan-400' : 'bg-cyan-50 text-cyan-700'
                        : darkMode ? 'hover:bg-white/5 text-gray-300' : 'hover:bg-gray-50 text-gray-700'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium text-xs font-mono">{table.name}</span>
                      <Badge variant="outline" className="text-[10px]">
                        {(table.rowCount / 1e6).toFixed(1)}M
                      </Badge>
                    </div>
                    <p className={`text-[10px] truncate ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                      {table.columns.join(', ')}
                    </p>
                  </button>
                ))}
              </CardContent>
            </Card>

            {/* Query History */}
            {queryHistory.length > 0 && (
              <Card className={`${darkMode ? 'bg-black/30 backdrop-blur-xl border-white/10' : 'bg-white border-gray-200'}`}>
                <CardHeader className="pb-3">
                  <CardTitle className={`text-sm ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                    Query History
                  </CardTitle>
                </CardHeader>
                
                <CardContent className="space-y-2">
                  {queryHistory.map((q, i) => (
                    <button
                      key={i}
                      onClick={() => setQuery(q)}
                      className={`w-full text-left p-2 rounded-lg text-xs font-mono truncate transition-colors ${
                        darkMode ? 'hover:bg-white/5 text-gray-400' : 'hover:bg-gray-50 text-gray-600'
                      }`}
                      title={q}
                    >
                      {q.substring(0, 50)}...
                    </button>
                  ))}
                </CardContent>
              </Card>
            )}

            {/* Keyboard Shortcuts */}
            <Card className={`${darkMode ? 'bg-black/30 backdrop-blur-xl border-white/10' : 'bg-white border-gray-200'}`}>
              <CardContent className="pt-6">
                <p className={`text-xs font-medium mb-3 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  Shortcuts
                </p>
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className={darkMode ? 'text-gray-500' : 'text-gray-400'}>Run Query</span>
                    <kbd className={`px-2 py-0.5 rounded font-mono ${darkMode ? 'bg-white/10 text-gray-300' : 'bg-gray-100 text-gray-700'}`}>
                      Ctrl+Enter
                    </kbd>
                  </div>
                  <div className="flex justify-between">
                    <span className={darkMode ? 'text-gray-500' : 'text-gray-400'}>Clear</span>
                    <kbd className={`px-2 py-0.5 rounded font-mono ${darkMode ? 'bg-white/10 text-gray-300' : 'bg-gray-100 text-gray-700'}`}>
                      Esc
                    </kbd>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </TooltipProvider>
  )
}
