'use client'

import { useState, useEffect, useRef, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

// ============ TYPES ============
interface KnowledgeGraphProps {
  darkMode: boolean
}

interface GraphNode {
  id: string
  label: string
  type: 'concept' | 'paper' | 'author' | 'dataset' | 'method' | 'domain' | 'institution' | 'gene' | 'compound'
  size?: number
  color?: string
  x?: number
  y?: number
  fx?: number | null
  fy?: number | null
}

interface GraphLink {
  source: string | GraphNode
  target: string | GraphNode
  type: string
  strength?: number
}

interface SearchResult {
  id: string
  type: string
  label: string
  description: string
  connections: number
}

// ============ KNOWLEDGE GRAPH DATA ============
const graphNodes: GraphNode[] = [
  // Core Concepts
  { id: 'crispr', label: 'CRISPR-Cas9', type: 'concept', size: 40 },
  { id: 'ml', label: 'Machine Learning', type: 'concept', size: 45 },
  { id: 'quantum', label: 'Quantum Computing', type: 'concept', size: 35 },
  { id: 'genomics', label: 'Genomics', type: 'domain', size: 42 },
  { id: 'cheminfo', label: 'Cheminformatics', type: 'domain', size: 38 },
  { id: 'materials', label: 'Materials Science', type: 'domain', size: 35 },
  
  // Papers
  { id: 'paper1', label: 'Attention Is All You Need (2017)', type: 'paper', size: 30 },
  { id: 'paper2', label: 'AlphaFold Protein Structure (2021)', type: 'paper', size: 35 },
  { id: 'paper3', label: 'CRISPR Gene Editing Review (2019)', type: 'paper', size: 28 },
  { id: 'paper4', label: 'GPT-4 Technical Report (2023)', type: 'paper', size: 32 },
  { id: 'paper5', label: 'Materials Project Database (2015)', type: 'paper', size: 25 },
  { id: 'paper6', label: 'Climate Change IPCC Report (2023)', type: 'paper', size: 28 },
  
  // Authors
  { id: 'author1', label: 'Vaswani et al.', type: 'author', size: 22 },
  { id: 'author2', label: 'Jumper et al.', type: 'author', size: 24 },
  { id: 'author3', label: 'Doudna & Charpentier', type: 'author', size: 26 },
  { id: 'author4', label: 'OpenAI Team', type: 'author', size: 23 },
  { id: 'author5', label: 'Ceder Group (MIT)', type: 'author', size: 20 },
  
  // Methods
  { id: 'transformer', label: 'Transformer Architecture', type: 'method', size: 32 },
  { id: 'alphafold', label: 'AlphaFold Algorithm', type: 'method', size: 34 },
  { id: 'dft', label: 'DFT Calculations', type: 'method', size: 26 },
  { id: 'blast', label: 'BLAST Alignment', type: 'method', size: 24 },
  { id: 'gnn', label: 'Graph Neural Networks', type: 'method', size: 28 },
  { id: 'molecular_dynamics', label: 'Molecular Dynamics', type: 'method', size: 25 },
  
  // Datasets
  { id: 'pdb', label: 'Protein Data Bank', type: 'dataset', size: 28 },
  { id: 'genbank', label: 'GenBank NCBI', type: 'dataset', size: 30 },
  { id: 'pubchem', label: 'PubChem', type: 'dataset', size: 27 },
  { id: 'materials_project', label: 'Materials Project', type: 'dataset', size: 25 },
  { id: 'arxiv', label: 'arXiv Preprints', type: 'dataset', size: 29 },
  
  // Genes/Compounds
  { id: 'brca1', label: 'BRCA1 Gene', type: 'gene', size: 20 },
  { id: 'tp53', label: 'TP53 Gene', type: 'gene', size: 22 },
  { id: 'aspirin', label: 'Aspirin Compound', type: 'compound', size: 18 },
  { id: 'perovskite', label: 'Perovskite Materials', type: 'compound', size: 20 },
  
  // Institutions
  { id: 'mit', label: 'MIT', type: 'institution', size: 24 },
  { id: 'deepmind', label: 'DeepMind', type: 'institution', size: 26 },
  { id: 'ncbi', label: 'NCBI/NIH', type: 'institution', size: 25 },
  { id: 'cern', label: 'CERN', type: 'institution', size: 23 },
]

const graphLinks: GraphLink[] = [
  // CRISPR connections
  { source: 'crispr', target: 'genomics', type: 'belongs_to' },
  { source: 'crispr', target: 'paper3', type: 'described_in' },
  { source: 'crispr', target: 'author3', type: 'pioneered_by' },
  { source: 'crispr', target: 'brca1', type: 'targets_gene' },
  { source: 'crispr', target: 'tp53', type: 'targets_gene' },
  { source: 'crispr', target: 'blast', type: 'uses_method' },
  
  // ML connections
  { source: 'ml', target: 'transformer', type: 'includes' },
  { source: 'ml', target: 'gnn', type: 'includes' },
  { source: 'ml', target: 'alphafold', type: 'powers' },
  { source: 'ml', target: 'paper1', type: 'introduced_in' },
  { source: 'ml', target: 'paper4', type: 'advanced_in' },
  { source: 'ml', target: 'quantum', type: 'applies_to' },
  
  // Paper-author links
  { source: 'paper1', target: 'author1', type: 'authored_by' },
  { source: 'paper2', target: 'author2', type: 'authored_by' },
  { source: 'paper3', target: 'author3', type: 'authored_by' },
  { source: 'paper4', target: 'author4', type: 'authored_by' },
  { source: 'paper5', target: 'author5', type: 'authored_by' },
  
  // Paper-method links
  { source: 'paper1', target: 'transformer', type: 'introduces' },
  { source: 'paper2', target: 'alphafold', type: 'describes' },
  { source: 'paper5', target: 'dft', type: 'uses' },
  
  // Dataset connections
  { source: 'pdb', target: 'alphafold', type: 'trains_on' },
  { source: 'genbank', target: 'genomics', type: 'serves' },
  { source: 'pubchem', target: 'cheminfo', type: 'serves' },
  { source: 'materials_project', target: 'materials', type: 'serves' },
  { source: 'materials_project', target: 'dft', type: 'uses' },
  { source: 'arxiv', target: 'ml', type: 'feeds' },
  
  // Domain connections
  { source: 'genomics', target: 'brca1', type: 'studies' },
  { source: 'genomics', target: 'tp53', type: 'studies' },
  { source: 'cheminfo', target: 'aspirin', type: 'studies' },
  { source: 'materials', target: 'perovskite', type: 'studies' },
  { source: 'cheminfo', target: 'molecular_dynamics', type: 'uses' },
  
  // Institution connections
  { source: 'deepmind', target: 'paper2', type: 'published' },
  { source: 'deepmind', target: 'alphafold', type: 'developed' },
  { source: 'mit', target: 'author5', type: 'hosts' },
  { source: 'ncbi', target: 'genbank', type: 'maintains' },
  { source: 'cern', target: 'quantum', type: 'researches' },
  
  // Cross-domain connections
  { source: 'ml', target: 'genomics', type: 'applies_to' },
  { source: 'ml', target: 'cheminfo', type: 'applies_to' },
  { source: 'ml', target: 'materials', type: 'applies_to' },
  { source: 'quantum', target: 'materials', type: 'simulates' },
  { source: 'gnn', target: 'cheminfo', type: 'used_in' },
]

// ============ NODE TYPE CONFIG ============
const nodeTypeConfig: Record<string, { color: string; icon: string }> = {
  concept: { color: '#8B5CF6', icon: '💡' },
  paper: { color: '#F59E0B', icon: '📄' },
  author: { color: '#10B981', icon: '👤' },
  dataset: { color: '#3B82F6', icon: '📊' },
  method: { color: '#EC4899', icon: '⚙️' },
  domain: { color: '#06B6D4', icon: '🌐' },
  institution: { color: '#6366F1', icon: '🏛️' },
  gene: { color: '#22C55E', icon: '🧬' },
  compound: { color: '#F97316', icon: '⚗️' },
}

// ============ SEARCH RESULTS MOCK ============
const mockSearchResults: SearchResult[] = [
  { id: 'search1', type: 'concept', label: 'CRISPR-Cas9 Gene Editing', description: 'Revolutionary genome editing technology enabling precise DNA modifications', connections: 47 },
  { id: 'search2', type: 'method', label: 'Transformer Architecture', description: 'Neural network architecture based on self-attention mechanisms', connections: 89 },
  { id: 'search3', type: 'dataset', label: 'Protein Data Bank', description: 'Archive of 200K+ experimentally-determined protein structures', connections: 63 },
  { id: 'search4', type: 'paper', label: 'AlphaFold Protein Structure Prediction', description: 'Deep learning system that predicts protein 3D structure from amino acid sequences', connections: 112 },
  { id: 'search5', type: 'gene', label: 'BRCA1 Tumor Suppressor', description: 'Human gene associated with hereditary breast and ovarian cancer', connections: 34 },
  { id: 'search6', type: 'compound', label: 'Aspirin (Acetylsalicylic Acid)', description: 'Nonsteroidal anti-inflammatory drug used for pain relief and cardiovascular protection', connections: 28 },
]

// ============ ICONS ============
const Icons = {
  Search: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>
    </svg>
  ),
  ZoomIn: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8"/><line x1="21" x2="16.65" y1="21" y2="16.65"/><line x1="11" x2="11" y1="8" y2="14"/><line x1="8" x2="14" y1="11" y2="11"/>
    </svg>
  ),
  ZoomOut: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8"/><line x1="21" x2="16.65" y1="21" y2="16.65"/><line x1="8" x2="14" y1="11" y2="11"/>
    </svg>
  ),
  Maximize: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"/>
    </svg>
  ),
  Refresh: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/><path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/><path d="M8 16H3v5"/>
    </svg>
  ),
  Network: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="5" r="3"/><circle cx="5" cy="19" r="3"/><circle cx="19" cy="19" r="3"/><line x1="12" x2="5" y1="8" y2="16"/><line x1="12" x2="19" y1="8" y2="16"/>
    </svg>
  ),
  Filter: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/>
    </svg>
  ),
  Info: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/>
    </svg>
  ),
}

// ============ MAIN COMPONENT ============
export default function KnowledgeGraph({ darkMode }: KnowledgeGraphProps) {
  const svgRef = useRef<SVGSVGElement>(null)
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<SearchResult[]>([])
  const [showSearch, setShowSearch] = useState(false)
  const [filterType, setFilterType] = useState<string>('all')
  const [scale, setScale] = useState(1)
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const [nodePositions, setNodePositions] = useState<Map<string, { x: number; y: number }>>(new Map())

  // Initialize node positions with simple layout
  useEffect(() => {
    const positions = new Map<string, { x: number; y: number }>()
    const centerX = 500
    const centerY = 350
    
    graphNodes.forEach((node, i) => {
      const angle = (i / graphNodes.length) * Math.PI * 2
      const radius = 150 + Math.random() * 150
      positions.set(node.id, {
        x: centerX + Math.cos(angle) * radius + (Math.random() - 0.5) * 100,
        y: centerY + Math.sin(angle) * radius + (Math.random() - 0.5) * 100,
      })
    })
    
    setNodePositions(positions)
  }, [])

  // Search handler
  const handleSearch = (query: string) => {
    setSearchQuery(query)
    if (query.length > 1) {
      setSearchResults(mockSearchResults.filter(r =>
        r.label.toLowerCase().includes(query.toLowerCase()) ||
        r.description.toLowerCase().includes(query.toLowerCase())
      ))
    } else {
      setSearchResults([])
    }
  }

  // Filter nodes by type
  const filteredNodes = useMemo(() => {
    if (filterType === 'all') return graphNodes
    return graphNodes.filter(n => n.type === filterType)
  }, [filterType])

  // Get node connections
  const getNodeConnections = (nodeId: string) => {
    return graphLinks.filter(l => 
      (typeof l.source === 'string' ? l.source : l.source.id) === nodeId ||
      (typeof l.target === 'string' ? l.target : l.target.id) === nodeId
    )
  }

  // Get connected nodes
  const getConnectedNodes = (nodeId: string): GraphNode[] => {
    const connections = getNodeConnections(nodeId)
    const connectedIds = new Set<string>()
    
    connections.forEach(link => {
      if (typeof link.source === 'string') connectedIds.add(link.source)
      else connectedIds.add(link.source.id)
      if (typeof link.target === 'string') connectedIds.add(link.target)
      else connectedIds.add(link.target.id)
    })
    
    connectedIds.delete(nodeId)
    
    return graphNodes.filter(n => connectedIds.has(n.id))
  }

  // SVG handlers
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault()
    const delta = e.deltaY > 0 ? 0.9 : 1.1
    setScale(prev => Math.min(Math.max(prev * delta, 0.3), 3))
  }

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true)
    setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y })
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return
    setPosition({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    })
  }

  const handleMouseUp = () => {
    setIsDragging(false)
  }

  // Stats
  const stats = {
    totalNodes: graphNodes.length,
    totalLinks: graphLinks.length,
    domains: new Set(graphNodes.filter(n => n.type === 'domain').map(n => n.label)).size,
    papers: graphNodes.filter(n => n.type === 'paper').length,
  }

  return (
    <div className="space-y-6">
      
      {/* ===== HEADER ===== */}
      <Card className={`relative overflow-hidden ${
        darkMode ? 'bg-gradient-to-br from-purple-900/30 to-pink-900/30 border-purple-500/20' : 'bg-gradient-to-br from-purple-50 to-pink-50 border-purple-200'
      }`}>
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-400 via-pink-500 to-red-500 flex items-center justify-center text-white shadow-lg shadow-purple-500/25">
              <Icons.Network />
            </div>
            
            <div className="flex-1">
              <h2 className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                Scientific Knowledge Graph
              </h2>
              <p className={`mt-1 text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                Explore relationships between concepts, papers, authors, datasets, methods, and genes across all scientific domains
              </p>
              
              <div className="flex items-center gap-4 mt-3">
                <Badge variant="outline" className="bg-purple-500/10 text-purple-400 border-purple-500/20">
                  {stats.totalNodes} Nodes
                </Badge>
                <Badge variant="outline" className="bg-pink-500/10 text-pink-400 border-pink-500/20">
                  {stats.totalLinks} Links
                </Badge>
                <Badge variant="outline" className="bg-blue-500/10 text-blue-400 border-blue-500/20">
                  {stats.domains} Domains
                </Badge>
              </div>
            </div>

            {/* Controls */}
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setScale(prev => Math.min(prev * 1.2, 3))}
                className={darkMode ? 'hover:bg-white/10 text-white' : ''}
              >
                <Icons.ZoomIn />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setScale(prev => Math.max(prev * 0.8, 0.3))}
                className={darkMode ? 'hover:bg-white/10 text-white' : ''}
              >
                <Icons.ZoomOut />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => { setScale(1); setPosition({ x: 0, y: 0 }) }}
                className={darkMode ? 'hover:bg-white/10 text-white' : ''}
              >
                <Icons.Refresh />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ===== TOOLBAR ===== */}
      <Card className={`${darkMode ? 'bg-black/30 backdrop-blur-xl border-white/10' : 'bg-white border-gray-200'}`}>
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            {/* Search */}
            <div className="relative flex-1 max-w-md">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                <Icons.Search />
              </div>
              <Input
                placeholder="Search knowledge graph... (CRISPR, AlphaFold, BRCA1)"
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                onFocus={() => setShowSearch(true)}
                onBlur={() => setTimeout(() => setShowSearch(false), 200)}
                className={`pl-10 ${darkMode ? 'bg-white/5 border-white/10' : ''}`}
              />
              
              {/* Search Results Dropdown */}
              {showSearch && searchResults.length > 0 && (
                <div className={`absolute top-full left-0 right-0 mt-2 rounded-lg border shadow-xl z-50 max-h-64 overflow-auto ${
                  darkMode ? 'bg-gray-900 border-white/20' : 'bg-white border-gray-200'
                }`}>
                  {searchResults.map(result => (
                    <button
                      key={result.id}
                      onMouseDown={() => {
                        const node = graphNodes.find(n => n.label.includes(result.label.split(' ')[0]))
                        if (node) setSelectedNode(node)
                      }}
                      className={`w-full text-left p-3 hover:bg-black/5 transition-colors ${
                        darkMode ? 'text-white' : ''
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <span>{nodeTypeConfig[result.type]?.icon || '📌'}</span>
                        <span className="font-medium text-sm">{result.label}</span>
                        <Badge variant="outline" className="text-[10px] ml-auto">
                          {result.connections} connections
                        </Badge>
                      </div>
                      <p className={`text-xs truncate ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                        {result.description}
                      </p>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Type Filter */}
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className={`w-40 ${darkMode ? 'bg-white/5 border-white/10' : ''}`}>
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                {Object.entries(nodeTypeConfig).map(([type, config]) => (
                  <SelectItem key={type} value={type}>
                    {config.icon} {type.charAt(0).toUpperCase() + type.slice(1)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Legend */}
            <div className="hidden md:flex items-center gap-3 ml-auto">
              {Object.entries(nodeTypeConfig).slice(0, 5).map(([type, config]) => (
                <button
                  key={type}
                  onClick={() => setFilterType(type)}
                  className={`flex items-center gap-1.5 px-2 py-1 rounded-full text-xs transition-colors ${
                    filterType === type
                      ? 'ring-2 ring-offset-2'
                      : 'opacity-70 hover:opacity-100'
                  }`}
                  style={{ 
                    backgroundColor: `${config.color}20`,
                    color: config.color,
                    ...(filterType === type ? { '--tw-ring-color': config.color } as React.CSSProperties : {})
                  }}
                >
                  <span>{config.icon}</span>
                  <span>{type}</span>
                </button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ===== GRAPH VISUALIZATION ===== */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        
        {/* Main Graph Area */}
        <div className="lg:col-span-3">
          <Card className={`overflow-hidden ${darkMode ? 'bg-black/30 backdrop-blur-xl border-white/10' : 'bg-white border-gray-200'}`}>
            <CardContent className="p-0 relative" style={{ minHeight: '550px' }}>
              {/* SVG Canvas */}
              <svg
                ref={svgRef}
                width="100%"
                height="550"
                className={`cursor-grab active:cursor-grabbing ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
                onWheel={handleWheel}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
              >
                <g transform={`translate(${position.x}, ${position.y}) scale(${scale})`}>
                  
                  {/* Links */}
                  {graphLinks.map((link, i) => {
                    const sourcePos = typeof link.source === 'string' 
                      ? nodePositions.get(link.source) 
                      : nodePositions.get(link.source.id)
                    const targetPos = typeof link.target === 'string' 
                      ? nodePositions.get(link.target) 
                      : nodePositions.get(link.target.id)
                    
                    if (!sourcePos || !targetPos) return null
                    
                    const isHighlighted = selectedNode && (
                      (typeof link.source === 'string' ? link.source : link.source.id) === selectedNode.id ||
                      (typeof link.target === 'string' ? link.target : link.target.id) === selectedNode.id
                    )
                    
                    return (
                      <line
                        key={i}
                        x1={sourcePos.x}
                        y1={sourcePos.y}
                        x2={targetPos.x}
                        y2={targetPos.y}
                        stroke={isHighlighted ? '#8B5CF6' : (darkMode ? '#374151' : '#E5E7EB')}
                        strokeWidth={isHighlighted ? 2 : 1}
                        opacity={isHighlighted ? 1 : 0.6}
                        markerEnd={isHighlighted ? "url(#arrowhead)" : undefined}
                      />
                    )
                  })}
                  
                  {/* Arrow Marker */}
                  <defs>
                    <marker
                      id="arrowhead"
                      markerWidth="10"
                      markerHeight="7"
                      refX="9"
                      refY="3.5"
                      orient="auto"
                    >
                      <polygon points="0 0, 10 3.5, 0 7" fill="#8B5CF6" />
                    </marker>
                  </defs>
                  
                  {/* Nodes */}
                  {filteredNodes.map((node) => {
                    const pos = nodePositions.get(node.id)
                    if (!pos) return null
                    
                    const config = nodeTypeConfig[node.type]
                    const isSelected = selectedNode?.id === node.id
                    const isConnected = selectedNode && getConnectedNodes(selectedNode.id).some(n => n.id === node.id)
                    const isDimmed = selectedNode && !isSelected && !isConnected
                    
                    return (
                      <g
                        key={node.id}
                        transform={`translate(${pos.x}, ${pos.y})`}
                        onClick={(e) => {
                          e.stopPropagation()
                          setSelectedNode(isSelected ? null : node)
                        }}
                        className="cursor-pointer"
                        style={{ transition: 'transform 0.15s ease' }}
                      >
                        {/* Glow effect for selected */}
                        {isSelected && (
                          <circle
                            r={node.size || 25 + 5}
                            fill={`${config?.color || '#888'}30`}
                            className="animate-pulse"
                          />
                        )}
                        
                        {/* Node circle */}
                        <circle
                          r={node.size || 25}
                          fill={isDimmed ? (darkMode ? '#374151' : '#E5E7EB') : (config?.color || '#888')}
                          opacity={isDimmed ? 0.3 : 1}
                          stroke={isSelected ? '#fff' : undefined}
                          strokeWidth={isSelected ? 3 : 0}
                          style={{
                            filter: isSelected ? `drop-shadow(0 0 10px ${config?.color})` : undefined,
                          }}
                        />
                        
                        {/* Node label background */}
                        {scale > 0.7 && (
                          <text
                            y={(node.size || 25) + 18}
                            textAnchor="middle"
                            className="pointer-events-none select-none"
                            fontSize="11"
                            fontWeight="500"
                            fill={isDimmed ? (darkMode ? '#555' : '#999') : (darkMode ? '#E5E7EB' : '#374151')}
                          >
                            {node.label.length > 20 ? node.label.substring(0, 18) + '...' : node.label}
                          </text>
                        )}
                        
                        {/* Icon */}
                        <text
                          y={5}
                          textAnchor="middle"
                          dominantBaseline="central"
                          className="pointer-events-none select-none"
                          fontSize={Math.min((node.size || 25) * 0.8, 16)}
                        >
                          {config?.icon || '📌'}
                        </text>
                      </g>
                    )
                  })}
                </g>
              </svg>
              
              {/* Empty state overlay when filtered */}
              {filteredNodes.length === 0 && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                  <p className="text-white">No nodes match this filter</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Panel: Node Details */}
        <div className="space-y-4">
          
          {/* Selected Node Details */}
          {selectedNode ? (
            <Card className={`${darkMode ? 'bg-black/30 backdrop-blur-xl border-white/10' : 'bg-white border-gray-200'}`}>
              <CardHeader className="pb-3">
                <div className="flex items-start gap-3">
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center text-xl shrink-0"
                    style={{ backgroundColor: `${nodeTypeConfig[selectedNode.type]?.color || '#888'}20` }}
                  >
                    {nodeTypeConfig[selectedNode.type]?.icon || '📌'}
                  </div>
                  <div className="min-w-0">
                    <CardTitle className={`text-base leading-tight ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                      {selectedNode.label}
                    </CardTitle>
                    <Badge variant="outline" className={`mt-1 text-xs capitalize ${
                      darkMode ? 'border-white/20' : ''
                    }`} style={{ 
                      backgroundColor: `${nodeTypeConfig[selectedNode.type]?.color}20`,
                      color: nodeTypeConfig[selectedNode.type]?.color,
                      borderColor: `${nodeTypeConfig[selectedNode.type]?.color}40`
                    }}>
                      {selectedNode.type}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-4">
                {/* Connections */}
                <div>
                  <p className={`text-xs font-medium mb-2 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    Connections ({getNodeConnections(selectedNode.id).length})
                  </p>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {getConnectedNodes(selectedNode.id).map(node => {
                      const connection = getNodeConnections(selectedNode.id).find(l =>
                        (typeof l.source === 'string' ? l.source : l.source.id) === node.id ||
                        (typeof l.target === 'string' ? l.target : l.target.id) === node.id
                      )
                      
                      return (
                        <button
                          key={node.id}
                          onClick={() => setSelectedNode(node)}
                          className={`w-full flex items-center gap-2 p-2 rounded-lg text-left transition-colors ${
                            darkMode ? 'hover:bg-white/5' : 'hover:bg-gray-50'
                          }`}
                        >
                          <span>{nodeTypeConfig[node.type]?.icon}</span>
                          <span className={`text-xs truncate flex-1 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                            {node.label}
                          </span>
                          <Badge variant="outline" className="text-[10px]">
                            {connection?.type.replace('_', ' ')}
                          </Badge>
                        </button>
                      )
                    })}
                  </div>
                </div>
                
                <Separator />
                
                {/* Actions */}
                <div className="space-y-2">
                  <Button variant="outline" size="sm" className={`w-full text-xs ${darkMode ? 'border-white/20' : ''}`}>
                    View Related Papers
                  </Button>
                  <Button variant="outline" size="sm" className={`w-full text-xs ${darkMode ? 'border-white/20' : ''}`}>
                    Expand Subgraph
                  </Button>
                  <Button size="sm" className="w-full text-xs bg-gradient-to-r from-purple-500 to-pink-500">
                    Add to Analysis
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            /* Placeholder */
            <Card className={`${darkMode ? 'bg-black/30 backdrop-blur-xl border-white/10 border-dashed' : 'bg-white border-gray-200 border-dashed'}`}>
              <CardContent className="py-12 text-center">
                <Icons.Network />
                <p className={`mt-4 text-sm font-medium ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  Select a Node
                </p>
                <p className={`text-xs mt-1 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                  Click any node to explore connections
                </p>
              </CardContent>
            </Card>
          )}

          {/* Legend */}
          <Card className={`${darkMode ? 'bg-black/30 backdrop-blur-xl border-white/10' : 'bg-white border-gray-200'}`}>
            <CardHeader className="pb-3">
              <CardTitle className={`text-sm ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                Node Types
              </CardTitle>
            </CardHeader>
            
            <CardContent className="space-y-2">
              {Object.entries(nodeTypeConfig).map(([type, config]) => (
                <div key={type} className="flex items-center gap-3">
                  <div
                    className="w-4 h-4 rounded-full shrink-0"
                    style={{ backgroundColor: config.color }}
                  />
                  <span className="text-xs capitalize">{config.icon} {type}</span>
                  <span className={`text-[10px] ml-auto ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                    {graphNodes.filter(n => n.type === type).length}
                  </span>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Quick Stats */}
          <Card className={`${darkMode ? 'bg-gradient-to-br from-purple-900/20 to-pink-900/20 border-purple-500/20' : 'bg-gradient-to-br from-purple-50 to-pink-50 border-purple-200'}`}>
            <CardContent className="pt-6 space-y-3">
              <div className="flex justify-between text-sm">
                <span className={darkMode ? 'text-gray-400' : 'text-gray-600'}>Total Knowledge Entities</span>
                <span className="font-semibold text-purple-400">{graphNodes.length}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className={darkMode ? 'text-gray-400' : 'text-gray-600'}>Relationship Edges</span>
                <span className="font-semibold text-pink-400">{graphLinks.length}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className={darkMode ? 'text-gray-400' : 'text-gray-600'}>Scientific Domains</span>
                <span className="font-semibold text-blue-400">{stats.domains}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className={darkMode ? 'text-gray-400' : 'text-gray-600'}>Key Publications</span>
                <span className="font-semibold text-amber-400">{stats.papers}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
