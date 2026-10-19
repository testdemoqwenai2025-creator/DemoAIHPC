'use client'

import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Progress } from '@/components/ui/progress'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { AuthProvider } from '@/components/auth/AuthContext'
import { useTheme } from '@/components/site/ThemeProvider'
import GlobalNavbar from '@/components/layout/GlobalNavbar'
import EnhancedLandingPage from '@/components/layout/EnhancedLandingPage'
import AETHELConnector from '@/components/aethel/AETHELConnector'
import ScientificConnectorsHub from '@/components/connectors/ScientificConnectorsHub'
import QueryExecutor from '@/components/query/QueryExecutor'
import KnowledgeGraph from '@/components/visualization/KnowledgeGraph'
import DomainWorkflows from '@/components/workflows/DomainWorkflows'

// ============ VIEW MODES ============
type ViewMode = 'landing' | 'microservices'

// ============ POLYGLOT TECHNOLOGY STACK ============
const PolyglotStack: Record<string, { name: string; color: string; icon: string; useCase: string; version: string; performance: string }> = {
  golang: { name: 'Golang', color: '#00ADD8', icon: '⚡', useCase: 'High-performance API Gateway & gRPC Services', version: '1.24', performance: '99.7th percentile latency < 1ms' },
  elixir: { name: 'Elixir', color: '#4B275F', icon: '✦', useCase: 'Real-time Concurrency & WebSocket Infrastructure', version: '1.17', performance: '2M+ concurrent connections' },
  python: { name: 'Python', color: '#3776AB', icon: '🐍', useCase: 'ML/AI Pipeline & Scientific Computing Core', version: '3.13', performance: 'NumPy/CUDA accelerated' },
  scala: { name: 'Scala', color: '#DC322F', icon: '◈', useCase: 'Apache Spark/Flink Streaming Engine', version: '3.4', performance: 'Petabyte-scale stream processing' },
  rust: { name: 'Rust', color: '#DEA584', icon: '🦀', useCase: 'Query Engine Core & Memory-Safe Compute', version: '1.82', performance: 'Zero-cost abstractions, WebAssembly' },
  c: { name: 'C', color: '#555555', icon: '⌗', useCase: 'Low-level System Calls & BLAS/LAPACK Integration', version: 'C23', performance: 'Hardware-level optimization' }
}

// ============ AETHEL PLATFORM CONFIGURATION ============
const AethelConfig = {
  name: 'AETHEL',
  fullName: 'Advanced Experimental Theoretical Hypercomputing Emulation Layer',
  version: 'AETH-1.v2',
  status: 'connected',
  capabilities: [
    'Quantum Circuit Simulation',
    'Neural Architecture Search',
    'Automated Hypothesis Generation',
    'Cross-Domain Knowledge Graph',
    'Predictive Model Ensemble',
    'Citation Network Analysis'
  ],
  metrics: {
    inferenceLatency: '12ms',
    modelAccuracy: '94.7%',
    knowledgeNodes: '2.4M',
    activeConnections: '847',
    computeUnits: '12,450 GPU-hours'
  }
}

// ============ MICROSERVICE DEFINITIONS ============
interface Microservice {
  id: string
  name: string
  category: string
  technology: string
  status: 'running' | 'scaling' | 'degraded' | 'stopped'
  cpu: number
  memory: number
  requests: number
  latency: string
  uptime: string
  description: string
  endpoints: number
  dependencies: string[]
}

const Microservices: Microservice[] = [
  // === CORE INFRASTRUCTURE ===
  { id: 'api-gateway', name: 'API Gateway', category: 'Core Infrastructure', technology: 'golang', status: 'running', cpu: 34, memory: 52, requests: 145000, latency: '0.8ms', uptime: '99.99%', description: 'High-throughput gRPC/REST gateway with rate limiting and circuit breaking', endpoints: 47, dependencies: ['service-discovery', 'config-server'] },
  { id: 'service-discovery', name: 'Service Discovery', category: 'Core Infrastructure', technology: 'elixir', status: 'running', cpu: 18, memory: 28, requests: 89000, latency: '0.3ms', uptime: '100%', description: 'Real-time service registry with health checking and DNS-based discovery', endpoints: 12, dependencies: [] },
  { id: 'config-server', name: 'Configuration Server', category: 'Core Infrastructure', technology: 'rust', status: 'running', cpu: 8, memory: 16, requests: 12000, latency: '0.1ms', uptime: '100%', description: 'Distributed configuration management with hot-reload and encryption', endpoints: 8, dependencies: [] },
  
  // === DATA LAYER ===
  { id: 'query-engine', name: 'BigQuery Engine', category: 'Data Layer', technology: 'rust', status: 'running', cpu: 67, memory: 78, requests: 23000, latency: '45ms', uptime: '99.97%', description: 'Columnar distributed query engine with SQL dialect and ML integration', endpoints: 24, dependencies: ['metadata-service', 'storage-coordinator'] },
  { id: 'nosql-cluster', name: 'NoSQL Cluster Manager', category: 'Data Layer', technology: 'scala', status: 'scaling', cpu: 45, memory: 62, requests: 67000, latency: '12ms', uptime: '99.95%', description: 'Multi-model NoSQL coordination (Document, Graph, Key-Value, Time-Series)', endpoints: 31, dependencies: ['query-engine'] },
  { id: 'metadata-service', name: 'Metadata Service', category: 'Data Layer', technology: 'golang', status: 'running', cpu: 22, memory: 34, requests: 45000, latency: '2ms', uptime: '99.99%', description: 'Data catalog with lineage tracking, schema evolution, and governance', endpoints: 18, dependencies: [] },
  { id: 'storage-coordinator', name: 'Storage Coordinator', category: 'Data Layer', technology: 'python', status: 'running', cpu: 29, memory: 41, requests: 34000, latency: '8ms', uptime: '99.98%', description: 'Multi-format storage orchestration (Parquet, Avro, ORC, Delta Lake)', endpoints: 15, dependencies: [] },
  
  // === DATA LAKE ===
  { id: 'data-lake-ingest', name: 'Data Lake Ingestion', category: 'Data Lake', technology: 'scala', status: 'running', cpu: 56, memory: 72, requests: 18000, latency: '120ms', uptime: '99.9%', description: 'Bulk data ingestion from satellites, LHC, government repositories', endpoints: 22, dependencies: ['schema-registry'] },
  { id: 'binary-parser', name: 'Binary Data Parser', category: 'Data Lake', technology: 'c', status: 'running', cpu: 41, memory: 35, requests: 28000, latency: '25ms', uptime: '99.95%', description: 'High-performance binary format parsing for scientific instruments', endpoints: 14, dependencies: [] },
  { id: 'schema-registry', name: 'Schema Registry', category: 'Data Lake', technology: 'golang', status: 'running', cpu: 15, memory: 24, requests: 52000, latency: '1ms', uptime: '100%', description: 'Avro/Protobuf schema management with compatibility checking', endpoints: 11, dependencies: [] },
  
  // === STREAMING ===
  { id: 'kafka-cluster', name: 'Kafka Streaming Hub', category: 'Streaming', technology: 'scala', status: 'running', cpu: 72, memory: 85, requests: 890000, latency: '5ms', uptime: '99.99%', description: 'Distributed event streaming with exactly-once semantics', endpoints: 45, dependencies: ['zookeeper-alt'] },
  { id: 'flink-processor', name: 'Flink Stream Processor', category: 'Streaming', technology: 'scala', status: 'running', cpu: 58, memory: 68, requests: 156000, latency: '15ms', uptime: '99.97%', description: 'Complex event processing with stateful windowed computations', endpoints: 28, dependencies: ['kafka-cluster'] },
  { id: 'spark-engine', name: 'Spark Analytics Engine', category: 'Streaming', technology: 'scala', status: 'scaling', cpu: 81, memory: 92, requests: 42000, latency: '200ms', uptime: '99.9%', description: 'Batch and micro-batch processing with MLlib integration', endpoints: 33, dependencies: ['kafka-cluster', 'data-lake-ingest'] },
  
  // === CONNECTORS ===
  { id: 'platform-connector', name: 'Platform Connector Hub', category: 'Connectors', technology: 'python', status: 'running', cpu: 38, memory: 48, requests: 78000, latency: '35ms', uptime: '99.95%', description: 'Universal adapter layer for research platforms (arXiv, PubMed, GitHub, etc.)', endpoints: 67, dependencies: ['cache-layer'] },
  { id: 'aethel-bridge', name: 'AETHEL Bridge Service', category: 'Connectors', technology: 'elixir', status: 'running', cpu: 44, memory: 56, requests: 23000, latency: '18ms', uptime: '99.98%', description: 'Bidirectional AETHEL platform integration with quantum-classical bridge', endpoints: 19, dependencies: ['platform-connector'] },
  { id: 'cache-layer', name: 'Distributed Cache Layer', category: 'Connectors', technology: 'rust', status: 'running', cpu: 25, memory: 64, requests: 234000, latency: '0.2ms', uptime: '100%', description: 'Multi-tier caching with intelligent invalidation and prefetching', endpoints: 16, dependencies: [] },
  
  // === IDE STUDIO ===
  { id: 'ide-core', name: 'IDE Studio Core', category: 'IDE Studio', technology: 'python', status: 'running', cpu: 52, memory: 74, requests: 34000, latency: '50ms', uptime: '99.96%', description: 'Browser-based development environment with auto-parsing and IntelliSense', endpoints: 42, dependencies: ['file-processor', 'execution-runtime'] },
  { id: 'file-processor', name: 'File Auto-Parser', category: 'IDE Studio', technology: 'rust', status: 'running', cpu: 48, memory: 39, requests: 67000, latency: '8ms', uptime: '99.97%', description: 'Automatic file parsing (Jupyter, PDF, CSV, Images) with metadata extraction', endpoints: 24, dependencies: [] },
  { id: 'execution-runtime', name: 'Execution Runtime', category: 'IDE Studio', technology: 'python', status: 'running', cpu: 63, memory: 82, requests: 19000, latency: '150ms', uptime: '99.94%', description: 'Sandboxed code execution with resource limits and result visualization', endpoints: 18, dependencies: ['container-orchestrator'] },
  { id: 'collab-service', name: 'Collaboration Service', category: 'IDE Studio', technology: 'elixir', status: 'running', cpu: 31, memory: 45, requests: 89000, latency: '3ms', uptime: '99.99%', description: 'Real-time collaboration with OT/CRDT conflict resolution', endpoints: 21, dependencies: [] },
  
  // === PUBLISHING ===
  { id: 'cms-core', name: 'Publishing CMS', category: 'Publishing', technology: 'golang', status: 'running', cpu: 19, memory: 28, requests: 12000, latency: '12ms', uptime: '100%', description: 'Content management for blogs, whitepapers, and datasets with DOI minting', endpoints: 29, dependencies: ['asset-cdn'] },
  { id: 'asset-cdn', name: 'Asset CDN', category: 'Publishing', technology: 'rust', status: 'running', cpu: 12, memory: 22, requests: 178000, latency: '15ms', uptime: '100%', description: 'Global content delivery with image optimization and edge caching', endpoints: 14, dependencies: [] },
  { id: 'doi-service', name: 'DOI Minting Service', category: 'Publishing', technology: 'python', status: 'running', cpu: 8, memory: 15, requests: 3500, latency: '500ms', uptime: '99.99%', description: 'Digital Object Identifier registration and citation tracking', endpoints: 9, dependencies: ['cms-core'] },
  
  // === ML/AI ===
  { id: 'ml-orchestrator', name: 'ML Orchestrator', category: 'AI/ML', technology: 'python', status: 'running', cpu: 76, memory: 88, requests: 8000, latency: '250ms', uptime: '99.9%', description: 'Model training/inference scheduling with GPU pool management', endpoints: 26, dependencies: ['model-registry', 'feature-store'] },
  { id: 'model-registry', name: 'Model Registry', category: 'AI/ML', technology: 'golang', status: 'running', cpu: 14, memory: 32, requests: 22000, latency: '4ms', uptime: '100%', description: 'Versioned model storage with A/B testing and rollback support', endpoints: 17, dependencies: ['artifact-storage'] },
  { id: 'feature-store', name: 'Feature Store', category: 'AI/ML', technology: 'scala', status: 'running', cpu: 37, memory: 54, requests: 41000, latency: '8ms', uptime: '99.97%', description: 'Online/offline feature serving with point-in-time correctness', endpoints: 22, dependencies: [] },
]

// ============ EXTERNAL PLATFORMS ============
interface ExternalPlatform {
  id: string
  name: string
  category: string
  status: 'connected' | 'available' | 'configured' | 'error'
  dataTypes: string[]
  syncFrequency: string
  recordsCount: string
  icon: string
}

const ExternalPlatforms: ExternalPlatform[] = [
  { id: 'arxiv', name: 'arXiv', category: 'Preprint Servers', status: 'connected', dataTypes: ['PDF', 'TeX', 'Metadata'], syncFrequency: 'Hourly', recordsCount: '2.4M+', icon: '📄' },
  { id: 'pubmed', name: 'PubMed Central', category: 'Literature Databases', status: 'connected', dataTypes: ['XML', 'Full Text', 'Citations'], syncFrequency: 'Daily', recordsCount: '35M+', icon: '🧬' },
  { id: 'github', name: 'GitHub', category: 'Code Repositories', status: 'connected', dataTypes: ['Code', 'Notebooks', 'Datasets'], syncFrequency: 'Real-time', recordsCount: '∞', icon: '💻' },
  { id: 'zenodo', name: 'Zenodo', category: 'Research Data', status: 'connected', dataTypes: ['Datasets', 'Software', 'Reports'], syncFrequency: 'On-demand', recordsCount: '15M+', icon: '📊' },
  { id: 'figshare', name: 'Figshare', category: 'Research Data', status: 'available', dataTypes: ['Datasets', 'Figures', 'Media'], syncFrequency: 'Daily', recordsCount: '500K+', icon: '📈' },
  { id: 'cern-open', name: 'CERN Open Data', category: 'Physics Data', status: 'connected', dataTypes: ['ROOT', 'HEPDATA', 'DAQ'], syncFrequency: 'Weekly', recordsCount: '3.2PB', icon: '⚛️' },
  { id: 'nasa-pds', name: 'NASA PDS', category: 'Space Data', status: 'configured', dataTypes: ['Imagery', 'Spectra', 'Telemetry'], syncFrequency: 'Daily', recordsCount: '150PB', icon: '🛰️' },
  { id: 'esa-eo', name: 'ESA Earth Observation', category: 'Satellite Data', status: 'available', dataTypes: ['Sentinel', 'Envisat', 'SMOS'], syncFrequency: 'Hourly', recordsCount: '80PB', icon: '🌍' },
  { id: 'noaa', name: 'NOAA NCEI', category: 'Climate Data', status: 'connected', dataTypes: ['Climate', 'Oceanic', 'Geophysical'], syncFrequency: 'Hourly', recordsCount: '40PB', icon: '🌊' },
  { id: 'genbank', name: 'GenBank', category: 'Genomics', status: 'connected', dataTypes: ['Sequences', 'Annotations', 'Structures'], syncFrequency: 'Daily', recordsCount: '250B bp', icon: '🧬' },
  { id: 'pdb', name: 'Protein Data Bank', category: 'Structural Biology', status: 'connected', dataTypes: ['PDB', 'mmCIF', 'EMDB'], syncFrequency: 'Weekly', recordsCount: '200K+', icon: '🔬' },
  { id: 'materials-project', name: 'Materials Project', category: 'Materials Science', status: 'available', dataTypes: ['Structures', 'Properties', 'Phase Diagrams'], syncFrequency: 'Weekly', recordsCount: '150K+', icon: '⚗️' },
  { id: 'world-bank', name: 'World Bank Open Data', category: 'Economic Data', status: 'connected', dataTypes: ['Indicators', 'Time Series', 'GIS'], syncFrequency: 'Monthly', recordsCount: '10K+', icon: '🌐' },
  { id: 'aethel', name: 'AETHEL Platform', category: 'AI/Hypercompute', status: 'connected', dataTypes: ['Knowledge Graphs', 'Inferences', 'Simulations'], syncFrequency: 'Real-time', recordsCount: '2.4M nodes', icon: '🔮' },
]

// ============ FILE FORMATS SUPPORTED ============
const FileFormats = [
  { name: 'Parquet', extension: '.parquet', category: 'Columnar', engine: 'Arrow', compression: ['Snappy', 'Gzip', 'Zstd', 'LZ4'], useCase: 'Analytics, ML Training', sizeReduction: '75%' },
  { name: 'Avro', extension: '.avro', category: 'Row-based', engine: 'Native', compression: ['Snappy', 'Deflate', 'Bzip2'], useCase: 'Streaming, Schema Evolution', sizeReduction: '60%' },
  { name: 'ORC', extension: '.orc', category: 'Columnar', engine: 'Hive', compression: ['Zlib', 'Snappy', 'LZO'], useCase: 'Hadoop Ecosystem', sizeReduction: '73%' },
  { name: 'Delta Lake', extension: '.delta', category: 'Table Format', engine: 'Spark', compression: ['Snappy', 'Zstd'], useCase: 'ACID Transactions, Time Travel', sizeReduction: '70%' },
  { name: 'HDF5', extension: '.h5/.hdf5', category: 'Scientific', engine: 'HDF Group', compression: ['Gzip', 'LZF', 'SZip'], useCase: 'Scientific Computing, Arrays', sizeReduction: '65%' },
  { name: 'NetCDF', extension: '.nc/.nc4', category: 'Scientific', engine: 'UCAR', compression: ['Deflate'], useCase: 'Climate, Oceanography', sizeReduction: '60%' },
  { name: 'Zarr', extension: '.zarr', category: 'Chunked Array', engine: 'NumPy', compression: ['Blosc', 'Zstd', 'LZMA'], useCase: 'Cloud-Native Arrays', sizeReduction: '70%' },
  { name: 'FASTQ/FASTA', extension: '.fastq/.fasta', category: 'Bioinformatics', engine: 'BioPython', compression: ['Gzip'], useCase: 'Genomics Sequencing', sizeReduction: '80%' },
  { name: 'ROOT', extension: '.root', category: 'Physics', engine: 'CERN', compression: ['LZMA', 'Zlib'], useCase: 'HEP Data Analysis', sizeReduction: '68%' },
  { name: 'GeoTIFF', extension: '.tif/.tiff', category: 'Geospatial', engine: 'GDAL', compression: ['LZW', 'DEFLATE', 'JPEG'], useCase: 'Satellite Imagery', sizeReduction: '55%' },
  { name: 'MessagePack', extension: '.msgpack', category: 'Binary Serialization', engine: 'Native', compression: ['None'], useCase: 'RPC, Caching', sizeReduction: '40%' },
  { name: "Cap'n Proto", extension: '.capnp', category: 'Binary Serialization', engine: 'Native', compression: ['None'], useCase: 'High-Performance IPC', sizeReduction: '35%' },
]

// ============ STREAMING PIPELINE EXAMPLES ============
const StreamingPipelines = [
  {
    id: 'satellite-ingestion',
    name: 'Satellite Imagery Ingestion',
    source: 'ESA Sentinel Hub',
    pipeline: ['Kafka Topic', 'Schema Validation', 'Geo Processing', 'Object Detection', 'Indexing', 'Data Lake'],
    throughput: '2.4 TB/hr',
    latency: '< 5min end-to-end',
    technologies: ['Scala/Kafka', 'Python/GDAL', 'Rust/Parser']
  },
  {
    id: 'genomics-stream',
    name: 'Real-Time Genomics Pipeline',
    source: 'Sequencing Instruments',
    pipeline: ['Flink Source', 'Base Calling', 'Alignment', 'Variant Calling', 'Annotation', 'Knowledge Graph'],
    throughput: '50 GB/hr',
    latency: '< 30min',
    technologies: ['Elixir/Ingest', 'Python/Bio', 'Rust/Index']
  },
  {
    id: 'citation-graph',
    name: 'Citation Network Analysis',
    source: 'Crossref + PubMed',
    pipeline: ['Spark Batch', 'NLP Extraction', 'Entity Resolution', 'Graph Construction', 'Centrality', 'API'],
    throughput: '1.2M papers/day',
    latency: 'Daily batch',
    technologies: ['Scala/Spark', 'Python/NLP', 'Golang/API']
  },
  {
    id: 'aethel-inference',
    name: 'AETHEL Inference Stream',
    source: 'AETHEL Platform',
    pipeline: ['WebSocket', 'Request Queue', 'Model Router', 'Ensemble', 'Result Aggregation', 'Push'],
    throughput: '10K inferences/sec',
    latency: '< 20ms p99',
    technologies: ['Elixir/WS', 'Rust/Router', 'Python/ML']
  }
]

// ============ HELPER FUNCTIONS ============
function getStatusColor(status: string): string {
  switch (status) {
    case 'running': return 'bg-emerald-500'
    case 'scaling': return 'bg-blue-500 animate-pulse'
    case 'degraded': return 'bg-amber-500'
    case 'stopped': return 'bg-red-500'
    default: return 'bg-gray-500'
  }
}

function getPlatformStatusColor(status: string): string {
  switch (status) {
    case 'connected': return 'bg-emerald-500'
    case 'configured': return 'bg-blue-500'
    case 'available': return 'bg-violet-500'
    case 'error': return 'bg-red-500'
    default: return 'bg-gray-500'
  }
}

// ============ QUANTUM BACKGROUND COMPONENT ============
interface QuantumBackgroundProps {
  darkMode: boolean
  enabled: boolean
}

function QuantumBackground({ darkMode, enabled }: QuantumBackgroundProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  
  useEffect(() => {
    if (!enabled) return
    
    const canvas = canvasRef.current
    if (!canvas) return
    
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    
    let animationId: number
    const particles: Array<{
      x: number; y: number; vx: number; vy: number; 
      radius: number; phase: number; frequency: number; amplitude: number
    }> = []
    
    const resizeCanvas = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }
    
    resizeCanvas()
    window.addEventListener('resize', resizeCanvas)
    
    for (let i = 0; i < 80; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.5,
        vy: (Math.random() - 0.5) * 0.5,
        radius: Math.random() * 2 + 1,
        phase: Math.random() * Math.PI * 2,
        frequency: 0.01 + Math.random() * 0.02,
        amplitude: 20 + Math.random() * 40
      })
    }
    
    const animate = (time: number) => {
      ctx.fillStyle = darkMode ? 'rgba(10, 10, 30, 0.15)' : 'rgba(248, 250, 252, 0.15)'
      ctx.fillRect(0, 0, canvas.width, canvas.height)
      
      particles.forEach((p, i) => {
        p.x += p.vx + Math.sin(time * p.frequency + p.phase) * 0.3
        p.y += p.vy + Math.cos(time * p.frequency + p.phase) * 0.3
        
        if (p.x < 0) p.x = canvas.width
        if (p.x > canvas.width) p.x = 0
        if (p.y < 0) p.y = canvas.height
        if (p.y > canvas.height) p.y = 0
        
        const gradient = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.radius * 3)
        const hue = (time * 0.02 + i * 5) % 360
        gradient.addColorStop(0, `hsla(${hue}, 80%, 60%, 0.8)`)
        gradient.addColorStop(0.5, `hsla(${hue}, 70%, 50%, 0.3)`)
        gradient.addColorStop(1, 'transparent')
        
        ctx.beginPath()
        ctx.arc(p.x, p.y, p.radius * 3, 0, Math.PI * 2)
        ctx.fillStyle = gradient
        ctx.fill()
        
        particles.slice(i + 1).forEach(p2 => {
          const dx = p.x - p2.x
          const dy = p.y - p2.y
          const dist = Math.sqrt(dx * dx + dy * dy)
          
          if (dist < 150) {
            ctx.beginPath()
            ctx.moveTo(p.x, p.y)
            ctx.lineTo(p2.x, p2.y)
            ctx.strokeStyle = `hsla(${hue}, 60%, 50%, ${0.15 * (1 - dist / 150)})`
            ctx.lineWidth = 0.5
            ctx.stroke()
          }
        })
      })
      
      animationId = requestAnimationFrame(animate)
    }
    
    animate(0)
    
    return () => {
      cancelAnimationFrame(animationId)
      window.removeEventListener('resize', resizeCanvas)
    }
  }, [enabled, darkMode])
  
  if (!enabled) return null
  
  return (
    <canvas 
      ref={canvasRef} 
      className="fixed inset-0 pointer-events-none z-0"
      style={{ opacity: 0.6 }}
    />
  )
}

// ============ MICROSERVICES PLATFORM VIEW ============
interface MicroservicesViewProps {
  searchQuery: string
  setSearchQuery: (q: string) => void
  selectedService: Microservice | null
  setSelectedService: (s: Microservice | null) => void
  activeTab: string
  setActiveTab: (t: string) => void
  darkMode: boolean
  setDarkMode: (d: boolean) => void
  quantumAnimation: boolean
  setQuantumAnimation: (q: boolean) => void
  setViewMode: (v: ViewMode) => void
}

function MicroservicesView({
  searchQuery,
  setSearchQuery,
  selectedService,
  setSelectedService,
  activeTab,
  setActiveTab,
  darkMode,
  setDarkMode,
  quantumAnimation,
  setQuantumAnimation,
  setViewMode
}: MicroservicesViewProps) {
  
  const filteredServices = useMemo(() => {
    if (!searchQuery) return Microservices
    const q = searchQuery.toLowerCase()
    return Microservices.filter(s => 
      s.name.toLowerCase().includes(q) || 
      s.category.toLowerCase().includes(q) ||
      s.technology.toLowerCase().includes(q) ||
      s.description.toLowerCase().includes(q)
    )
  }, [searchQuery])

  const servicesByCategory = useMemo(() => {
    return filteredServices.reduce((acc, service) => {
      if (!acc[service.category]) acc[service.category] = []
      acc[service.category].push(service)
      return acc
    }, {} as Record<string, Microservice[]>)
  }, [filteredServices])

  return (
    <div className={`min-h-screen transition-colors duration-500 ${darkMode ? 'bg-gradient-to-br from-slate-950 via-purple-950/20 to-slate-900' : 'bg-gradient-to-br from-slate-50 via-purple-50/30 to-white'}`}>
      {/* Quantum Background Canvas */}
      <QuantumBackground darkMode={darkMode} enabled={quantumAnimation} />
      
      {/* Header Navigation */}
      <header className="relative z-10 border-b border-white/10 backdrop-blur-xl bg-black/20">
        <div className="max-w-[1920px] mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-400 via-violet-500 to-fuchsia-500 flex items-center justify-center text-white font-bold text-lg shadow-lg shadow-violet-500/30">
                  S
                </div>
                <div>
                  <h1 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>SciHub Pro</h1>
                  <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Microservices Platform</p>
                </div>
              </div>
              <Badge variant="outline" className="border-emerald-500/50 text-emerald-400 bg-emerald-500/10">
                v2.0.0 — AETH-1 Integrated
              </Badge>
            </div>
            
            <div className="flex items-center gap-4">
              <Input
                placeholder="Search services, platforms, APIs..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={`w-80 pl-10 ${darkMode ? 'bg-white/5 border-white/10 text-white placeholder:text-gray-500' : 'bg-white border-gray-200'}`}
              />
              
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="ghost" size="sm" onClick={() => setDarkMode(!darkMode)} className={darkMode ? 'text-gray-300 hover:text-white' : 'text-gray-700'}>
                      {darkMode ? '☀️' : '🌙'}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Toggle Theme</TooltipContent>
                </Tooltip>
              </TooltipProvider>
              
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="ghost" size="sm" onClick={() => setQuantumAnimation(!quantumAnimation)} className={darkMode ? 'text-gray-300 hover:text-white' : 'text-gray-700'}>
                      ✨
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Toggle Animation</TooltipContent>
                </Tooltip>
              </TooltipProvider>
              
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="outline" size="sm" onClick={() => setViewMode('landing')} className="border-white/20 text-gray-300 hover:bg-white/10">
                      ← Landing
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Back to Landing Page</TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 max-w-[1920px] mx-auto px-4 py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          {/* Tab Navigation */}
          <TabsList className={`grid grid-cols-11 w-full h-14 ${darkMode ? 'bg-black/30 backdrop-blur-xl border border-white/10' : 'bg-white border border-gray-200'} overflow-x-auto`}>
            <TabsTrigger value="dashboard" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-cyan-500 data-[state=active]:to-violet-500 data-[state=active]:text-white gap-2">
              📊 Dashboard
            </TabsTrigger>
            <TabsTrigger value="architecture" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-cyan-500 data-[state=active]:to-violet-500 data-[state=active]:text-white gap-2">
              🏗️ Architecture
            </TabsTrigger>
            <TabsTrigger value="connectors" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-cyan-500 data-[state=active]:to-violet-500 data-[state=active]:text-white gap-2">
              🔌 Connectors
            </TabsTrigger>
            <TabsTrigger value="ide-studio" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-cyan-500 data-[state=active]:to-violet-500 data-[state=active]:text-white gap-2">
              💻 IDE Studio
            </TabsTrigger>
            <TabsTrigger value="data-lake" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-cyan-500 data-[state=active]:to-violet-500 data-[state=active]:text-white gap-2">
              🏝️ Data Lake
            </TabsTrigger>
            <TabsTrigger value="publish" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-cyan-500 data-[state=active]:to-violet-500 data-[state=active]:text-white gap-2">
              📝 Publish
            </TabsTrigger>
            <TabsTrigger value="aethel" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-cyan-500 data-[state=active]:to-violet-500 data-[state=active]:text-white gap-2">
              ⚡ AETHEL AI
            </TabsTrigger>
            <TabsTrigger value="connectors" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-green-500 data-[state=active]:to-emerald-500 data-[state=active]:text-white gap-2">
              🔌 Connectors
            </TabsTrigger>
            <TabsTrigger value="query" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-emerald-500 data-[state=active]:to-cyan-500 data-[state=active]:text-white gap-2">
              🗄️ Query Engine
            </TabsTrigger>
            <TabsTrigger value="knowledge" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:to-pink-500 data-[state=active]:text-white gap-2">
              🕸️ Knowledge Graph
            </TabsTrigger>
            <TabsTrigger value="workflows" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-orange-500 data-[state=active]:to-red-500 data-[state=active]:text-white gap-2">
              ⚡ Workflows
            </TabsTrigger>
          </TabsList>

          {/* ======== DASHBOARD TAB ======== */}
          <TabsContent value="dashboard" className="space-y-6">
            {/* Key Metrics Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { label: 'Total Services', value: '28', icon: '🔮', change: '+3 this week', positive: true },
                { label: 'Requests/sec', value: '1.2M', icon: '⚡', change: '+18.2%', positive: true },
                { label: 'Avg Latency', value: '24ms', icon: '🚀', change: '-12%', positive: true },
                { label: 'Uptime SLA', value: '99.97%', icon: '✅', change: '+0.02%', positive: true },
              ].map((metric, i) => (
                <Card key={i} className={`${darkMode ? 'bg-black/30 backdrop-blur-xl border-white/10' : 'bg-white border-gray-200'} hover:border-violet-500/50 transition-all duration-300`}>
                  <CardContent className="p-5">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-2xl">{metric.icon}</span>
                      <Badge variant="secondary" className={metric.positive ? 'text-emerald-400 bg-emerald-500/10' : 'text-red-400 bg-red-500/10'}>
                        {metric.change}
                      </Badge>
                    </div>
                    <div className={`text-3xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{metric.value}</div>
                    <div className={`text-sm mt-1 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>{metric.label}</div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Polyglot Stack Showcase */}
            <Card className={`${darkMode ? 'bg-black/30 backdrop-blur-xl border-white/10' : 'bg-white border-gray-200'}`}>
              <CardHeader>
                <CardTitle className={`flex items-center gap-3 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                  <span className="text-2xl">⚡</span>
                  Polyglot Technology Stack
                  <Badge className="ml-2 bg-gradient-to-r from-cyan-500 to-violet-500">6 Languages</Badge>
                </CardTitle>
                <CardDescription className={darkMode ? 'text-gray-400' : 'text-gray-600'}>
                  Each language chosen for its unique strengths in scientific computing workloads
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {Object.entries(PolyglotStack).map(([key, tech]) => (
                    <div 
                      key={key}
                      className={`group relative p-4 rounded-xl border transition-all duration-300 cursor-pointer hover:scale-[1.02] ${
                        darkMode ? 'bg-white/5 border-white/10 hover:border-white/30' : 'bg-gray-50 border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div 
                          className="w-12 h-12 rounded-lg flex items-center justify-center text-2xl"
                          style={{ backgroundColor: `${tech.color}20`, color: tech.color }}
                        >
                          {tech.icon}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <h4 className={`font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{tech.name}</h4>
                            <Badge variant="outline" className="text-xs">{tech.version}</Badge>
                          </div>
                          <p className={`text-xs mt-1 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>{tech.useCase}</p>
                          <p className="text-xs mt-2 font-mono" style={{ color: tech.color }}>{tech.performance}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Services Overview Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Service List */}
              <div className="lg:col-span-2">
                <Card className={`${darkMode ? 'bg-black/30 backdrop-blur-xl border-white/10' : 'bg-white border-gray-200'}`}>
                  <CardHeader>
                    <CardTitle className={`flex items-center gap-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                      <span>🔧</span> Live Services ({filteredServices.length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ScrollArea className="h-[480px] pr-4">
                      <div className="space-y-2">
                        {Object.entries(servicesByCategory).map(([category, services]) => (
                          <div key={category}>
                            <div className={`sticky top-0 py-2 text-sm font-medium ${darkMode ? 'text-violet-400' : 'text-violet-600'} backdrop-blur-md z-10`}>
                              {category}
                            </div>
                            {services.map((service) => (
                              <div
                                key={service.id}
                                onClick={() => setSelectedService(service)}
                                className={`group flex items-center gap-4 p-3 rounded-lg cursor-pointer transition-all duration-200 ${
                                  selectedService?.id === service.id 
                                    ? 'bg-gradient-to-r from-cyan-500/20 to-violet-500/20 border border-violet-500/30' 
                                    : darkMode ? 'hover:bg-white/5' : 'hover:bg-gray-50'
                                }`}
                              >
                                <div className={`w-2.5 h-2.5 rounded-full ${getStatusColor(service.status)}`} />
                                <div className="flex-1 min-w-0">
                                  <div className={`font-medium text-sm ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                                    {service.name}
                                  </div>
                                  <div className={`text-xs truncate ${darkMode ? 'text-gray-500' : 'text-gray-500'}`}>
                                    {(PolyglotStack as any)[service.technology]?.icon} {(PolyglotStack as any)[service.technology]?.name}
                                  </div>
                                </div>
                                <div className="flex items-center gap-3 text-xs">
                                  <div className="hidden sm:block">
                                    <div className={`text-right ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>CPU</div>
                                    <Progress value={service.cpu} className="w-16 h-1.5" />
                                  </div>
                                  <div className="hidden sm:block">
                                    <div className={`text-right ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>MEM</div>
                                    <Progress value={service.memory} className="w-16 h-1.5" />
                                  </div>
                                  <Badge variant="outline" className="font-mono text-xs">
                                    {service.latency}
                                  </Badge>
                                </div>
                              </div>
                            ))}
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  </CardContent>
                </Card>
              </div>

              {/* Service Detail Panel */}
              <div>
                <Card className={`${darkMode ? 'bg-black/30 backdrop-blur-xl border-white/10' : 'bg-white border-gray-200'} sticky top-6`}>
                  <CardHeader>
                    <CardTitle className={darkMode ? 'text-white' : 'text-gray-900'}>
                      {selectedService ? 'Service Details' : 'Select a Service'}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {selectedService ? (
                      <div className="space-y-4">
                        <div className="flex items-center gap-3">
                          <div 
                            className="w-14 h-14 rounded-xl flex items-center justify-center text-2xl"
                            style={{ backgroundColor: `${(PolyglotStack as any)[selectedService.technology]?.color}20`, color: (PolyglotStack as any)[selectedService.technology]?.color }}
                          >
                            {(PolyglotStack as any)[selectedService.technology]?.icon}
                          </div>
                          <div>
                            <h3 className={`font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{selectedService.name}</h3>
                            <Badge variant="secondary" className="mt-1">{selectedService.category}</Badge>
                          </div>
                        </div>
                        
                        <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>{selectedService.description}</p>
                        
                        <Separator />
                        
                        <div className="grid grid-cols-2 gap-3">
                          {[
                            { label: 'Status', value: selectedService.status.toUpperCase(), highlight: true },
                            { label: 'Technology', value: `${(PolyglotStack as any)[selectedService.technology]?.icon} ${(PolyglotStack as any)[selectedService.technology]?.name}` },
                            { label: 'CPU Usage', value: `${selectedService.cpu}%` },
                            { label: 'Memory', value: `${selectedService.memory}%` },
                            { label: 'Requests/s', value: selectedService.requests.toLocaleString() },
                            { label: 'Latency', value: selectedService.latency },
                            { label: 'Uptime', value: selectedService.uptime },
                            { label: 'Endpoints', value: selectedService.endpoints.toString() },
                          ].map((item, i) => (
                            <div key={i} className={`p-2 rounded-lg ${darkMode ? 'bg-white/5' : 'bg-gray-50'}`}>
                              <div className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-500'}`}>{item.label}</div>
                              <div className={`font-medium text-sm ${item.highlight ? getStatusColor(selectedService.status).replace('bg-', 'text-') : darkMode ? 'text-white' : 'text-gray-900'}`}>
                                {item.value}
                              </div>
                            </div>
                          ))}
                        </div>
                        
                        {selectedService.dependencies.length > 0 && (
                          <>
                            <Separator />
                            <div>
                              <div className={`text-xs mb-2 ${darkMode ? 'text-gray-500' : 'text-gray-500'}`}>Dependencies</div>
                              <div className="flex flex-wrap gap-1">
                                {selectedService.dependencies.map(dep => (
                                  <Badge key={dep} variant="outline" className="text-xs">{dep}</Badge>
                                ))}
                              </div>
                            </div>
                          </>
                        )}
                        
                        <div className="flex gap-2 pt-2">
                          <Button size="sm" className="flex-1 bg-gradient-to-r from-cyan-500 to-violet-500 hover:from-cyan-600 hover:to-violet-600">
                            View Logs
                          </Button>
                          <Button size="sm" variant="outline" className={darkMode ? 'border-white/20 text-gray-300' : ''}>
                            Metrics
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className={`text-center py-12 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                        <div className="text-4xl mb-3">👆</div>
                        <p>Select a service to view details</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* AETHEL Integration Panel */}
            <Card className={`relative overflow-hidden ${darkMode ? 'bg-gradient-to-br from-violet-500/10 via-purple-500/5 to-fuchsia-500/10 backdrop-blur-xl border-violet-500/30' : 'bg-gradient-to-br from-violet-50 to-purple-50 border-violet-200'}`}>
              <div className="absolute top-0 right-0 w-64 h-64 bg-violet-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
              <CardHeader className="relative">
                <CardTitle className={`flex items-center gap-3 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center text-xl animate-pulse">
                    🔮
                  </div>
                  AETHEL Platform Integration
                  <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30">
                    ● Connected — {AethelConfig.version}
                  </Badge>
                </CardTitle>
                <CardDescription className={darkMode ? 'text-gray-400' : 'text-gray-600'}>
                  {AethelConfig.fullName} — Advanced AI-powered research augmentation layer
                </CardDescription>
              </CardHeader>
              <CardContent className="relative">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {/* Capabilities */}
                  <div>
                    <h4 className={`font-semibold mb-3 flex items-center gap-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                      <span>✨</span> Capabilities
                    </h4>
                    <div className="space-y-2">
                      {AethelConfig.capabilities.map((cap, i) => (
                        <div key={i} className={`flex items-center gap-2 text-sm p-2 rounded-lg ${darkMode ? 'bg-white/5' : 'bg-white'}`}>
                          <div className="w-1.5 h-1.5 rounded-full bg-violet-500" />
                          {cap}
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  {/* Live Metrics */}
                  <div>
                    <h4 className={`font-semibold mb-3 flex items-center gap-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                      <span>📈</span> Live Metrics
                    </h4>
                    <div className="grid grid-cols-2 gap-3">
                      {Object.entries(AethelConfig.metrics).map(([key, value]) => (
                        <div key={key} className={`p-3 rounded-lg ${darkMode ? 'bg-white/5' : 'bg-white'}`}>
                          <div className={`text-xs capitalize ${darkMode ? 'text-gray-500' : 'text-gray-500'}`}>{key.replace(/([A-Z])/g, ' $1')}</div>
                          <div className={`font-bold font-mono ${darkMode ? 'text-violet-400' : 'text-violet-600'}`}>{value}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  {/* Quick Actions */}
                  <div>
                    <h4 className={`font-semibold mb-3 flex items-center gap-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                      <span>⚡</span> Quick Actions
                    </h4>
                    <div className="space-y-2">
                      <Button className="w-full justify-start gap-2 bg-gradient-to-r from-violet-500 to-fuchsia-500 hover:from-violet-600 hover:to-fuchsia-600">
                        🔍 Run Inference Query
                      </Button>
                      <Button variant="outline" className={`w-full justify-start gap-2 ${darkMode ? 'border-white/20 text-gray-300' : ''}`}>
                        🧠 Train Custom Model
                      </Button>
                      <Button variant="outline" className={`w-full justify-start gap-2 ${darkMode ? 'border-white/20 text-gray-300' : ''}`}>
                        📊 Export Knowledge Graph
                      </Button>
                      <Button variant="outline" className={`w-full justify-start gap-2 ${darkMode ? 'border-white/20 text-gray-300' : ''}`}>
                        ⚙️ Configure Bridge
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ======== ARCHITECTURE TAB ======== */}
          <TabsContent value="architecture" className="space-y-6">
            {/* Interactive Architecture Diagram */}
            <Card className={`${darkMode ? 'bg-black/30 backdrop-blur-xl border-white/10' : 'bg-white border-gray-200'}`}>
              <CardHeader>
                <CardTitle className={`flex items-center gap-3 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                  <span className="text-2xl">🏗️</span>
                  System Architecture Topology
                  <Badge variant="outline" className="ml-2">Interactive</Badge>
                </CardTitle>
                <CardDescription className={darkMode ? 'text-gray-400' : 'text-gray-600'}>
                  Click on any component to explore its role in the ecosystem
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="relative overflow-x-auto pb-4">
                  <svg viewBox="0 0 1200 700" className="w-full min-w-[900px]" style={{ minHeight: '500px' }}>
                    <defs>
                      <linearGradient id="archGrad1" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.8"/>
                        <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0.8"/>
                      </linearGradient>
                      <linearGradient id="archGrad2" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0.8"/>
                        <stop offset="100%" stopColor="#ec4899" stopOpacity="0.8"/>
                      </linearGradient>
                      <linearGradient id="archGrad3" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#10b981" stopOpacity="0.8"/>
                        <stop offset="100%" stopColor="#06b6d4" stopOpacity="0.8"/>
                      </linearGradient>
                      <filter id="archGlow">
                        <feGaussianBlur stdDeviation="4" result="coloredBlur"/>
                        <feMerge>
                          <feMergeNode in="coloredBlur"/>
                          <feMergeNode in="SourceGraphic"/>
                        </feMerge>
                      </filter>
                      <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
                        <polygon points="0 0, 10 3.5, 0 7" fill="#6366f1" opacity="0.6"/>
                      </marker>
                    </defs>
                    
                    {/* Connection Lines */}
                    <g opacity="0.4">
                      <line x1="100" y1="100" x2="300" y2="150" stroke="#06b6d4" strokeWidth="2" markerEnd="url(#arrowhead)" strokeDasharray="5,5">
                        <animate attributeName="stroke-dashoffset" values="0;10" dur="1s" repeatCount="indefinite"/>
                      </line>
                      {/* API Gateway to Services */}
                      <line x1="380" y1="180" x2="550" y2="280" stroke="#8b5cf6" strokeWidth="2" markerEnd="url(#arrowhead)">
                        <animate attributeName="opacity" values="0.4;0.8;0.4" dur="2s" repeatCount="indefinite"/>
                      </line>
                      <line x1="380" y1="180" x2="550" y2="420" stroke="#8b5cf6" strokeWidth="2" markerEnd="url(#arrowhead)">
                        <animate attributeName="opacity" values="0.4;0.8;0.4" dur="2s" repeatCount="indefinite" begin="0.5s"/>
                      </line>
                      <line x1="380" y1="180" x2="550" y2="560" stroke="#8b5cf6" strokeWidth="2" markerEnd="url(#arrowhead)">
                        <animate attributeName="opacity" values="0.4;0.8;0.4" dur="2s" repeatCount="indefinite" begin="1s"/>
                      </line>
                      {/* Internal Connections */}
                      <line x1="720" y1="310" x2="850" y2="310" stroke="#10b981" strokeWidth="1.5" markerEnd="url(#arrowhead)"/>
                      <line x1="720" y1="450" x2="850" y2="450" stroke="#10b981" strokeWidth="1.5" markerEnd="url(#arrowhead)"/>
                      <line x1="720" y1="590" x2="850" y2="590" stroke="#10b981" strokeWidth="1.5" markerEnd="url(#arrowhead)"/>
                      {/* To Storage */}
                      <line x1="1000" y1="310" x2="1080" y2="450" stroke="#ec4899" strokeWidth="2" markerEnd="url(#arrowhead)"/>
                      <line x1="1000" y1="450" x2="1080" y2="450" stroke="#ec4899" strokeWidth="2" markerEnd="url(#arrowhead)"/>
                      <line x1="1000" y1="590" x2="1080" y2="450" stroke="#ec4899" strokeWidth="2" markerEnd="url(#arrowhead)"/>
                      {/* AETHEL Connection */}
                      <line x1="600" y1="650" x2="600" y2="80" stroke="#a855f7" strokeWidth="3" markerEnd="url(#arrowhead)" strokeDasharray="8,4">
                        <animate attributeName="stroke-dashoffset" values="0;24" dur="2s" repeatCount="indefinite"/>
                      </line>
                    </g>
                    
                    {/* Client Layer */}
                    <g transform="translate(30, 60)">
                      <rect width="140" height="80" rx="12" fill="url(#archGrad1)" filter="url(#archGlow)" opacity="0.9"/>
                      <text x="70" y="35" textAnchor="middle" fill="white" fontSize="12" fontWeight="bold">Clients</text>
                      <text x="70" y="52" textAnchor="middle" fill="white" fontSize="9" opacity="0.8">Web • Mobile • CLI • API</text>
                      <text x="70" y="68" textAnchor="middle" fill="white" fontSize="9" opacity="0.8">IDE Studio • Scripts</text>
                    </g>
                    
                    {/* API Gateway */}
                    <g transform="translate(260, 130)">
                      <rect width="160" height="100" rx="12" fill="url(#archGrad1)" filter="url(#archGlow)"/>
                      <text x="80" y="30" textAnchor="middle" fill="white" fontSize="13" fontWeight="bold">API Gateway</text>
                      <text x="80" y="50" textAnchor="middle" fill="white" fontSize="10" opacity="0.9">⚡ Golang • gRPC/REST</text>
                      <text x="80" y="68" textAnchor="middle" fill="white" fontSize="9" opacity="0.8">Rate Limit • Auth • Routing</text>
                      <text x="80" y="85" textAnchor="middle" fill="white" fontSize="9" opacity="0.8">Circuit Breaker • Load Bal.</text>
                    </g>
                    
                    {/* AETHEL Cloud */}
                    <g transform="translate(500, 20)">
                      <ellipse cx="120" cy="40" rx="110" ry="45" fill="none" stroke="#a855f7" strokeWidth="2" strokeDasharray="5,5" opacity="0.6">
                        <animate attributeName="rx" values="110;115;110" dur="3s" repeatCount="indefinite"/>
                      </ellipse>
                      <text x="120" y="35" textAnchor="middle" fill="#a855f7" fontSize="14" fontWeight="bold">🔮 AETHEL</text>
                      <text x="120" y="52" textAnchor="middle" fill="#a855f7" fontSize="10">AI Hypercompute Layer</text>
                    </g>
                    
                    {/* Service Mesh */}
                    <g transform="translate(520, 250)">
                      <rect width="170" height="120" rx="12" fill="url(#archGrad2)" filter="url(#archGlow)"/>
                      <text x="85" y="25" textAnchor="middle" fill="white" fontSize="12" fontWeight="bold">Core Services</text>
                      <text x="85" y="48" textAnchor="middle" fill="white" fontSize="9" opacity="0.9">✦ Elixir • Discovery</text>
                      <text x="85" y="65" textAnchor="middle" fill="white" fontSize="9" opacity="0.9">🦀 Rust • Config</text>
                      <text x="85" y="82" textAnchor="middle" fill="white" fontSize="9" opacity="0.9">⚡ Golang • Cache</text>
                      <text x="85" y="99" textAnchor="middle" fill="white" fontSize="9" opacity="0.9">✦ Elixir • Collaboration</text>
                      <text x="85" y="114" textAnchor="middle" fill="white" fontSize="9" opacity="0.9">⌗ C • System Interfaces</text>
                    </g>
                    
                    {/* Data Layer */}
                    <g transform="translate(520, 390)">
                      <rect width="170" height="120" rx="12" fill="url(#archGrad3)" filter="url(#archGlow)"/>
                      <text x="85" y="25" textAnchor="middle" fill="white" fontSize="12" fontWeight="bold">Data Layer</text>
                      <text x="85" y="48" textAnchor="middle" fill="white" fontSize="9" opacity="0.9">🦀 Rust • Query Engine</text>
                      <text x="85" y="65" textAnchor="middle" fill="white" fontSize="9" opacity="0.9">◈ Scala • NoSQL Cluster</text>
                      <text x="85" y="82" textAnchor="middle" fill="white" fontSize="9" opacity="0.9">⚡ Golang • Metadata</text>
                      <text x="85" y="99" textAnchor="middle" fill="white" fontSize="9" opacity="0.9">🐍 Python • Storage Coord.</text>
                      <text x="85" y="114" textAnchor="middle" fill="white" fontSize="9" opacity="0.9">🦀 Rust • Schema Registry</text>
                    </g>
                    
                    {/* Compute Layer */}
                    <g transform="translate(520, 530)">
                      <rect width="170" height="120" rx="12" fill="url(#archGrad1)" filter="url(#archGlow)"/>
                      <text x="85" y="25" textAnchor="middle" fill="white" fontSize="12" fontWeight="bold">Compute &amp; Streaming</text>
                      <text x="85" y="48" textAnchor="middle" fill="white" fontSize="9" opacity="0.9">◈ Scala • Kafka/Flink</text>
                      <text x="85" y="65" textAnchor="middle" fill="white" fontSize="9" opacity="0.9">◈ Scala • Spark Engine</text>
                      <text x="85" y="82" textAnchor="middle" fill="white" fontSize="9" opacity="0.9">🐍 Python • ML Orchestrator</text>
                      <text x="85" y="99" textAnchor="middle" fill="white" fontSize="9" opacity="0.9">⚡ Golang • Model Registry</text>
                      <text x="85" y="114" textAnchor="middle" fill="white" fontSize="9" opacity="0.9">◈ Scala • Feature Store</text>
                    </g>
                    
                    {/* Connector Hub */}
                    <g transform="translate(830, 270)">
                      <rect width="150" height="90" rx="12" fill="#1e1b4b" stroke="#6366f1" strokeWidth="2"/>
                      <text x="75" y="28" textAnchor="middle" fill="#c4b5fd" fontSize="11" fontWeight="bold">Connector Hub</text>
                      <text x="75" y="48" textAnchor="middle" fill="#a5b4fc" fontSize="9">🐍 Python Adapters</text>
                      <text x="75" y="63" textAnchor="middle" fill="#a5b4fc" fontSize="9">✦ AETHEL Bridge</text>
                      <text x="75" y="78" textAnchor="middle" fill="#a5b4fc" fontSize="9">14+ Platforms</text>
                    </g>
                    
                    {/* IDE Studio */}
                    <g transform="translate(830, 400)">
                      <rect width="150" height="100" rx="12" fill="#134e4a" stroke="#14b8a6" strokeWidth="2"/>
                      <text x="75" y="25" textAnchor="middle" fill="#5eead4" fontSize="11" fontWeight="bold">IDE Studio</text>
                      <text x="75" y="45" textAnchor="middle" fill="#99f6e4" fontSize="9">🐍 Python Core</text>
                      <text x="75" y="60" textAnchor="middle" fill="#99f6e4" fontSize="9">🦀 Rust Parser</text>
                      <text x="75" y="75" textAnchor="middle" fill="#99f6e4" fontSize="9">✦ Real-time Collab</text>
                      <text x="75" y="90" textAnchor="middle" fill="#99f6e4" fontSize="9">Auto-parse Files</text>
                    </g>
                    
                    {/* Publishing */}
                    <g transform="translate(830, 540)">
                      <rect width="150" height="100" rx="12" fill="#1e1b4b" stroke="#8b5cf6" strokeWidth="2"/>
                      <text x="75" y="25" textAnchor="middle" fill="#c4b5fd" fontSize="11" fontWeight="bold">Publishing</text>
                      <text x="75" y="45" textAnchor="middle" fill="#a5b4fc" fontSize="9">⚡ Golang CMS</text>
                      <text x="75" y="60" textAnchor="middle" fill="#a5b4fc" fontSize="9">🦀 Asset CDN</text>
                      <text x="75" y="75" textAnchor="middle" fill="#a5b4fc" fontSize="9">🐍 DOI Service</text>
                      <text x="75" y="90" textAnchor="middle" fill="#a5b4fc" fontSize="9">Blog • Whitepapers</text>
                    </g>
                    
                    {/* Storage Backend */}
                    <g transform="translate(1040, 390)">
                      <rect width="140" height="120" rx="12" fill="#0c0a09" stroke="#f97316" strokeWidth="2"/>
                      <text x="70" y="25" textAnchor="middle" fill="#fed7aa" fontSize="11" fontWeight="bold">Storage Layer</text>
                      <text x="70" y="48" textAnchor="middle" fill="#fdba74" fontSize="9">PostgreSQL Cluster</text>
                      <text x="70" y="63" textAnchor="middle" fill="#fdba74" fontSize="9">MongoDB Shards</text>
                      <text x="70" y="78" textAnchor="middle" fill="#fdba74" fontSize="9">Redis Cache Tier</text>
                      <text x="70" y="93" textAnchor="middle" fill="#fdba74" fontSize="9">Blob/Object Store</text>
                      <text x="70" y="108" textAnchor="middle" fill="#fdba74" fontSize="9">Data Lake (S3/GCS)</text>
                    </g>
                    
                    {/* External Sources */}
                    <g transform="translate(30, 200)">
                      <rect width="140" height="180" rx="12" fill="none" stroke="#64748b" strokeWidth="1.5" strokeDasharray="4,4"/>
                      <text x="70" y="20" textAnchor="middle" fill="#94a3b8" fontSize="10" fontWeight="bold">External Sources</text>
                      <text x="70" y="45" textAnchor="middle" fill="#cbd5e1" fontSize="8">📄 arXiv • PubMed</text>
                      <text x="70" y="62" textAnchor="middle" fill="#cbd5e1" fontSize="8">💻 GitHub • GitLab</text>
                      <text x="70" y="79" textAnchor="middle" fill="#cbd5e1" fontSize="8">🛰️ NASA • ESA</text>
                      <text x="70" y="96" textAnchor="middle" fill="#cbd5e1" fontSize="8">⚛️ CERN • NOAA</text>
                      <text x="70" y="113" textAnchor="middle" fill="#cbd5e1" fontSize="8">🧬 GenBank • PDB</text>
                      <text x="70" y="130" textAnchor="middle" fill="#cbd5e1" fontSize="8">🌐 World Bank</text>
                      <text x="70" y="147" textAnchor="middle" fill="#cbd5e1" fontSize="8">⚗️ Materials Project</text>
                      <text x="70" y="165" textAnchor="middle" fill="#cbd5e1" fontSize="8">🔮 AETHEL</text>
                    </g>
                    
                    {/* Legend */}
                    <g transform="translate(30, 420)">
                      <rect width="160" height="130" rx="8" fill={darkMode ? 'rgba(0,0,0,0.5)' : 'rgba(255,255,255,0.8)'}/>
                      <text x="80" y="20" textAnchor="middle" fill={darkMode ? '#e2e8f0' : '#334155'} fontSize="10" fontWeight="bold">Technology Legend</text>
                      <text x="15" y="42" fill="#00ADD8" fontSize="9">⚡ Golang</text>
                      <text x="90" y="42" fill="#4B275F" fontSize="9">✦ Elixir</text>
                      <text x="15" y="58" fill="#3776AB" fontSize="9">🐍 Python</text>
                      <text x="90" y="58" fill="#DC322F" fontSize="9">◈ Scala</text>
                      <text x="15" y="74" fill="#DEA584" fontSize="9">🦀 Rust</text>
                      <text x="90" y="74" fill="#888888" fontSize="9">⌗ C</text>
                      <line x1="15" y1="88" x2="145" y2="88" stroke={darkMode ? '#475569' : '#cbd5e1'} strokeWidth="0.5"/>
                      <text x="80" y="105" textAnchor="middle" fill={darkMode ? '#94a3b8' : '#64748b'} fontSize="8">Animated flows show</text>
                      <text x="80" y="118" textAnchor="middle" fill={darkMode ? '#94a3b8' : '#64748b'} fontSize="8">real-time data movement</text>
                    </g>
                  </svg>
                </div>
              </CardContent>
            </Card>

            {/* Middleware Stack */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[
                { name: 'API Gateway Middleware', desc: 'Authentication, Rate Limiting, Request Transformation, CORS', tech: 'Golang', icon: '🚪' },
                { name: 'Service Mesh (Istio)', desc: 'mTLS, Traffic Management, Observability, Policy Enforcement', tech: 'Envoy/XDS', icon: '🕸️' },
                { name: 'Event Bus', pubsub: 'Publish/Subscribe, Event Sourcing, Dead Letter Queues, Replay', tech: 'Elixir + Kafka', icon: '📨' },
                { name: 'Cache Middleware', desc: 'Multi-tier Caching, Cache Invalidation, Prefetching, Write-through', tech: 'Rust', icon: '⚡' },
                { name: 'Circuit Breaker', desc: 'Failure Detection, Fallback Logic, Half-open Recovery, Metrics', tech: 'Golang', icon: '🔌' },
                { name: 'Observability Stack', desc: 'Distributed Tracing, Metrics Collection, Log Aggregation, Alerting', tech: 'OTel + Prometheus', icon: '📊' },
              ].map((mw, i) => (
                <Card key={i} className={`${darkMode ? 'bg-black/30 backdrop-blur-xl border-white/10' : 'bg-white border-gray-200'} hover:border-cyan-500/50 transition-all`}>
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <span className="text-2xl">{mw.icon}</span>
                      <div className="flex-1">
                        <h4 className={`font-semibold text-sm ${darkMode ? 'text-white' : 'text-gray-900'}`}>{mw.name}</h4>
                        <p className={`text-xs mt-1 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>{mw.desc}</p>
                        <Badge variant="outline" className="mt-2 text-xs">{mw.tech}</Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* ======== CONNECTORS TAB ======== */}
          <TabsContent value="connectors" className="space-y-6">
            {/* Platform Connector Marketplace */}
            <Card className={`${darkMode ? 'bg-black/30 backdrop-blur-xl border-white/10' : 'bg-white border-gray-200'}`}>
              <CardHeader>
                <CardTitle className={`flex items-center gap-3 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                  <span className="text-2xl">🔌</span>
                  Research Platform Connectors
                  <Badge className="bg-gradient-to-r from-cyan-500 to-violet-500">{ExternalPlatforms.length} Platforms</Badge>
                </CardTitle>
                <CardDescription className={darkMode ? 'text-gray-400' : 'text-gray-600'}>
                  Unified access to global research data sources — one API to rule them all
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {ExternalPlatforms.map((platform) => (
                    <div
                      key={platform.id}
                      className={`group relative p-4 rounded-xl border transition-all duration-300 cursor-pointer hover:scale-[1.02] ${
                        darkMode ? 'bg-white/5 border-white/10 hover:border-white/30' : 'bg-gray-50 border-gray-200 hover:border-gray-300'
                      } ${platform.id === 'aethel' ? 'ring-2 ring-violet-500/50 ring-offset-2 ring-offset-transparent' : ''}`}
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <span className="text-2xl">{platform.icon}</span>
                          <div>
                            <h4 className={`font-semibold text-sm ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                              {platform.name}
                              {platform.id === 'aethel' && <Badge className="ml-2 bg-violet-500/20 text-violet-400 border-violet-500/30 text-xs">AETHEL</Badge>}
                            </h4>
                            <p className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-500'}`}>{platform.category}</p>
                          </div>
                        </div>
                        <div className={`w-2.5 h-2.5 rounded-full ${getPlatformStatusColor(platform.status)}`} />
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex flex-wrap gap-1">
                          {platform.dataTypes.slice(0, 3).map((dt, i) => (
                            <Badge key={i} variant="secondary" className="text-xs px-1.5 py-0">{dt}</Badge>
                          ))}
                          {platform.dataTypes.length > 3 && (
                            <Badge variant="secondary" className="text-xs px-1.5 py-0">+{platform.dataTypes.length - 3}</Badge>
                          )}
                        </div>
                        
                        <div className={`flex justify-between text-xs ${darkMode ? 'text-gray-500' : 'text-gray-500'}`}>
                          <span>Sync: {platform.syncFrequency}</span>
                          <span>{platform.recordsCount}</span>
                        </div>
                      </div>
                      
                      <div className="mt-3 pt-3 border-t border-white/10 flex gap-2">
                        <Button size="sm" variant="outline" className={`flex-1 text-xs h-7 ${darkMode ? 'border-white/20' : ''}`}>
                          {platform.status === 'connected' ? 'Manage' : 'Connect'}
                        </Button>
                        <Button size="sm" variant="ghost" className="text-xs h-7 px-2">
                          ⋯
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Streaming Pipelines */}
            <Card className={`${darkMode ? 'bg-black/30 backdrop-blur-xl border-white/10' : 'bg-white border-gray-200'}`}>
              <CardHeader>
                <CardTitle className={`flex items-center gap-3 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                  <span className="text-2xl">🔄</span>
                  Active Streaming Pipelines
                  <Badge variant="outline">{StreamingPipelines.length} Running</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {StreamingPipelines.map((pipeline) => (
                    <div key={pipeline.id} className={`p-4 rounded-xl border ${darkMode ? 'bg-white/5 border-white/10' : 'bg-gray-50 border-gray-200'}`}>
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <h4 className={`font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{pipeline.name}</h4>
                          <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Source: {pipeline.source}</p>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <div className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-500'}`}>Throughput</div>
                            <div className={`font-mono font-bold text-sm ${darkMode ? 'text-cyan-400' : 'text-cyan-600'}`}>{pipeline.throughput}</div>
                          </div>
                          <div className="text-right">
                            <div className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-500'}`}>Latency</div>
                            <div className={`font-mono font-bold text-sm ${darkMode ? 'text-emerald-400' : 'text-emerald-600'}`}>{pipeline.latency}</div>
                          </div>
                        </div>
                      </div>
                      
                      {/* Pipeline Visualization */}
                      <div className="flex items-center gap-1 overflow-x-auto pb-2">
                        {pipeline.pipeline.map((step, i) => (
                          <div key={i} className="flex items-center">
                            <div className={`px-3 py-1.5 rounded-lg text-xs whitespace-nowrap font-medium ${
                              i === 0 ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' :
                              i === pipeline.pipeline.length - 1 ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' :
                              darkMode ? 'bg-white/10 text-gray-300 border border-white/20' : 'bg-white text-gray-700 border border-gray-200'
                            }`}>
                              {step}
                            </div>
                            {i < pipeline.pipeline.length - 1 && (
                              <svg className="w-4 h-4 mx-1 flex-shrink-0" viewBox="0 0 16 16" fill="none">
                                <path d="M6 3l5 5-5 5" stroke="currentColor" strokeWidth="2" className={darkMode ? 'text-gray-600' : 'text-gray-400'}/>
                              </svg>
                            )}
                          </div>
                        ))}
                      </div>
                      
                      {/* Technologies Used */}
                      <div className="flex flex-wrap gap-1 mt-2">
                        {pipeline.technologies.map((tech, i) => (
                          <Badge key={i} variant="outline" className="text-xs">{tech}</Badge>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ======== IDE STUDIO TAB ======== */}
          <TabsContent value="ide-studio" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
              {/* File Explorer */}
              <Card className={`${darkMode ? 'bg-black/30 backdrop-blur-xl border-white/10' : 'bg-white border-gray-200'}`}>
                <CardHeader className="pb-3">
                  <CardTitle className={`text-sm ${darkMode ? 'text-white' : 'text-gray-900'}`}>📁 Explorer</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <ScrollArea className="h-[500px]">
                    <div className="space-y-0.5 p-2">
                      <div className={`flex items-center gap-2 px-2 py-1.5 rounded cursor-pointer hover:bg-white/10 text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                        📂 Projects
                      </div>
                      <div className="ml-4 space-y-0.5">
                        <div className={`flex items-center gap-2 px-2 py-1.5 rounded cursor-pointer hover:bg-white/10 text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                          📁 genomics-analysis
                        </div>
                        <div className="ml-4 space-y-0.5">
                          <div className={`flex items-center gap-2 px-2 py-1.5 rounded cursor-pointer hover:bg-cyan-500/20 text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                            📄 sequence_parser.py
                          </div>
                          <div className={`flex items-center gap-2 px-2 py-1.5 rounded cursor-pointer hover:bg-cyan-500/20 text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                            📄 alignment.ipynb
                          </div>
                          <div className={`flex items-center gap-2 px-2 py-1.5 rounded cursor-pointer hover:bg-cyan-500/20 text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                            🖼️ coverage_plot.png
                          </div>
                        </div>
                        <div className={`flex items-center gap-2 px-2 py-1.5 rounded cursor-pointer hover:bg-white/10 text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                          📁 climate-model
                        </div>
                        <div className={`flex items-center gap-2 px-2 py-1.5 rounded cursor-pointer hover:bg-white/10 text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                          📁 ml-experiments
                        </div>
                      </div>
                      <div className={`flex items-center gap-2 px-2 py-1.5 rounded cursor-pointer hover:bg-white/10 text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                        📂 Recent
                      </div>
                      <div className={`flex items-center gap-2 px-2 py-1.5 rounded cursor-pointer hover:bg-white/10 text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                        📂 Shared
                      </div>
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>

              {/* Editor Area */}
              <div className="lg:col-span-2 space-y-4">
                {/* Code Editor Mockup */}
                <Card className={`${darkMode ? 'bg-black/30 backdrop-blur-xl border-white/10' : 'bg-white border-gray-200'}`}>
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className={`text-sm font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>sequence_parser.py</span>
                        <Badge variant="outline" className="text-xs">Python 3.13</Badge>
                        <Badge className="bg-emerald-500/20 text-emerald-400 text-xs">Auto-saved</Badge>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button size="sm" variant="outline" className={`h-7 text-xs ${darkMode ? 'border-white/20' : ''}`}>▶ Run</Button>
                        <Button size="sm" variant="outline" className={`h-7 text-xs ${darkMode ? 'border-white/20' : ''}`}>⚙ Settings</Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className={`rounded-lg p-4 font-mono text-sm leading-relaxed overflow-x-auto ${darkMode ? 'bg-black/50' : 'bg-gray-900'}`}>
                      <pre className="text-gray-300">
{`import Bio.SeqIO
import numpy as np
from scihub import Dataset, Pipeline

# Auto-parsed from uploaded FASTQ file
@dataset.input("sample_data.fastq")
def parse_sequences(file):
    """Parse genomic sequences with quality scores"""
    records = Bio.SeqIO.parse(file, "fastquality")
    return [
        {
            "id": r.id,
            "sequence": str(r.seq),
            "quality": r.letter_annotations["phred_quality"],
            "gc_content": calculate_gc(r.seq),
        }
        for r in records
    ]

# Visualized automatically
@dataset.output("coverage_plot.png")
def plot_coverage(sequences): ...`}
                      </pre>
                    </div>
                  </CardContent>
                </Card>

                {/* Output/Terminal */}
                <Card className={`${darkMode ? 'bg-black/30 backdrop-blur-xl border-white/10' : 'bg-white border-gray-200'}`}>
                  <CardHeader className="pb-2">
                    <div className="flex items-center gap-2">
                      <span className={`text-sm font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>Output</span>
                      <Badge variant="outline" className="text-xs">Terminal</Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className={`rounded-lg p-4 font-mono text-xs space-y-1 ${darkMode ? 'bg-black/50' : 'bg-gray-900 text-green-400'}`}>
                      <div>$ python sequence_parser.py --input sample_data.fastq</div>
                      <div className="text-blue-400">[SciHub] Auto-detected FASTQ format (Illumina 1.8+)</div>
                      <div className="text-blue-400">[SciHub] Found 154,232 sequences</div>
                      <div className="text-blue-400">[SciHub] Parsing with 4 workers...</div>
                      <div>{'[████████████████████] 100% 154K/154K [0:03<0:00]'}</div>
                      <div className="text-emerald-400">✓ Parsed 154,232 sequences (avg length: 151bp)</div>
                      <div className="text-emerald-400">✓ GC Content: 52.3% ± 4.1%</div>
                      <div className="text-emerald-400">✓ Quality score: Q30+ (94.2%)</div>
                      <div className="text-yellow-400">→ Coverage plot generated: coverage_plot.png</div>
                      <div className="text-gray-500">$ _</div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Side Panel */}
              <div className="space-y-4">
                {/* AI Assistant */}
                <Card className={`bg-gradient-to-br from-violet-500/10 to-fuchsia-500/10 backdrop-blur-xl border-violet-500/30`}>
                  <CardHeader className="pb-2">
                    <CardTitle className={`text-sm flex items-center gap-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                      🤖 AI Assistant
                      <Badge className="bg-violet-500/20 text-violet-400 text-xs">AETHEL Powered</Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className={`space-y-3 text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                      <div className="p-3 rounded-lg bg-white/5">
                        <p>I notice your sequence parser could benefit from parallel processing. Would you like me to optimize it using Rust extensions?</p>
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" className={`flex-1 text-xs h-7 ${darkMode ? 'border-white/20' : ''}`}>Yes, optimize</Button>
                        <Button size="sm" variant="outline" className={`flex-1 text-xs h-7 ${darkMode ? 'border-white/20' : ''}`}>Explain more</Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Preview */}
                <Card className={`${darkMode ? 'bg-black/30 backdrop-blur-xl border-white/10' : 'bg-white border-gray-200'}`}>
                  <CardHeader className="pb-2">
                    <CardTitle className={`text-sm ${darkMode ? 'text-white' : 'text-gray-900'}`}>🖼️ Preview</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className={`aspect-video rounded-lg bg-gradient-to-br from-cyan-500/20 to-violet-500/20 flex items-center justify-center ${darkMode ? 'border border-white/10' : 'border border-gray-200'}`}>
                      <div className="text-center">
                        <div className="text-4xl mb-2">📊</div>
                        <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>coverage_plot.png</p>
                        <p className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>Auto-generated visualization</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Dependencies */}
                <Card className={`${darkMode ? 'bg-black/30 backdrop-blur-xl border-white/10' : 'bg-white border-gray-200'}`}>
                  <CardHeader className="pb-2">
                    <CardTitle className={`text-sm ${darkMode ? 'text-white' : 'text-gray-900'}`}>📦 Dependencies</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {[
                        { name: 'biopython', version: '1.84', status: 'installed' },
                        { name: 'numpy', version: '2.0.0', status: 'installed' },
                        { name: 'scihub-sdk', version: '2.0.0', status: 'installed' },
                        { name: 'matplotlib', version: '3.9.0', status: 'auto-added' },
                      ].map((dep, i) => (
                        <div key={i} className="flex items-center justify-between text-xs">
                          <span className={darkMode ? 'text-gray-300' : 'text-gray-700'}>{dep.name}</span>
                          <div className="flex items-center gap-2">
                            <span className={darkMode ? 'text-gray-500' : 'text-gray-500'}>{dep.version}</span>
                            <div className={`w-2 h-2 rounded-full ${dep.status === 'installed' ? 'bg-emerald-500' : 'bg-blue-500'}`} />
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          {/* ======== DATA LAKE TAB ======== */}
          <TabsContent value="data-lake" className="space-y-6">
            {/* Data Sources Overview */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { label: 'Total Data Stored', value: '2.4 PB', icon: '🏝️', sublabel: 'Across all regions' },
                { label: 'Files Indexed', value: '847M', icon: '📄', sublabel: 'Searchable metadata' },
                { label: 'Active Queries', value: '1,234', icon: '🔍', sublabel: 'Running now' },
                { label: 'Data Ingestion Rate', value: '45 TB/day', icon: '📥', sublabel: 'Avg over 7 days' },
              ].map((stat, i) => (
                <Card key={i} className={`${darkMode ? 'bg-black/30 backdrop-blur-xl border-white/10' : 'bg-white border-gray-200'}`}>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{stat.icon}</span>
                      <div>
                        <div className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{stat.value}</div>
                        <div className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>{stat.label}</div>
                        <div className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>{stat.sublabel}</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* File Formats Support */}
            <Card className={`${darkMode ? 'bg-black/30 backdrop-blur-xl border-white/10' : 'bg-white border-gray-200'}`}>
              <CardHeader>
                <CardTitle className={`flex items-center gap-3 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                  <span className="text-2xl">📁</span>
                  Supported File Formats
                  <Badge className="bg-gradient-to-r from-cyan-500 to-violet-500">{FileFormats.length} Formats</Badge>
                </CardTitle>
                <CardDescription className={darkMode ? 'text-gray-400' : 'text-gray-600'}>
                  Native read/write support for scientific and big data formats
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                  {FileFormats.map((format, i) => (
                    <div
                      key={i}
                      className={`p-3 rounded-lg border transition-all hover:scale-[1.02] cursor-pointer ${
                        darkMode ? 'bg-white/5 border-white/10 hover:border-white/30' : 'bg-gray-50 border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <h4 className={`font-semibold text-sm ${darkMode ? 'text-white' : 'text-gray-900'}`}>{format.name}</h4>
                        <code className={`text-xs px-1.5 py-0.5 rounded ${darkMode ? 'bg-white/10 text-gray-400' : 'bg-gray-200 text-gray-600'}`}>{format.extension}</code>
                      </div>
                      <div className={`text-xs mb-2 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                        <span className="inline-block px-1.5 py-0.5 rounded bg-violet-500/20 text-violet-400 mr-1">{format.category}</span>
                        Engine: {format.engine}
                      </div>
                      <div className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-500'}`}>
                        Use: {format.useCase}
                      </div>
                      <div className="flex flex-wrap gap-1 mt-2">
                        {format.compression.slice(0, 2).map((c, j) => (
                          <Badge key={j} variant="secondary" className="text-xs px-1 py-0">{c}</Badge>
                        ))}
                      </div>
                      <div className={`text-xs mt-1 font-medium ${darkMode ? 'text-emerald-400' : 'text-emerald-600'}`}>
                        Compression: {format.sizeReduction}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* BigQuery-like SQL Interface */}
            <Card className={`${darkMode ? 'bg-black/30 backdrop-blur-xl border-white/10' : 'bg-white border-gray-200'}`}>
              <CardHeader>
                <CardTitle className={`flex items-center gap-3 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                  <span className="text-2xl">🔎</span>
                  Distributed Query Engine
                  <Badge variant="outline">SQL Compatible</Badge>
                </CardTitle>
                <CardDescription className={darkMode ? 'text-gray-400' : 'text-gray-600'}>
                  BigQuery-compatible SQL interface with columnar execution engine (Rust-powered)
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* SQL Editor */}
                  <div className={`rounded-lg p-4 font-mono text-sm ${darkMode ? 'bg-black/50' : 'bg-gray-900'}`}>
                    <div className="flex items-center gap-2 mb-3 pb-3 border-b border-white/10">
                      <Badge variant="outline" className="text-xs">SQL Editor</Badge>
                      <Badge className="bg-emerald-500/20 text-emerald-400 text-xs">Ready</Badge>
                      <div className="ml-auto flex gap-2">
                        <Button size="sm" className="h-7 text-xs bg-gradient-to-r from-cyan-500 to-violet-500">▶ Execute</Button>
                        <Button size="sm" variant="outline" className={`h-7 text-xs ${darkMode ? 'border-white/20' : ''}`}>Format</Button>
                        <Button size="sm" variant="outline" className={`h-7 text-xs ${darkMode ? 'border-white/20' : ''}`}>Save</Button>
                      </div>
                    </div>
                    <pre className="text-gray-300 overflow-x-auto">
{`-- Cross-domain query: Find high-impact genomics papers
-- with available satellite data overlap
SELECT 
    p.title,
    p.authors,
    p.citation_count,
    g.species,
    s.satellite,
    s.coverage_area
FROM publications p
JOIN genomics_datasets g ON p.id = g.paper_id
LEFT JOIN satellite_data s 
    ON ST_Intersects(g.location, s.footprint)
WHERE p.published_date >= DATE_SUB(CURRENT_DATE(), INTERVAL 1 YEAR)
    AND p.citation_count > 100
    AND s.resolution <= 10  -- meters
ORDER BY p.citation_count DESC
LIMIT 100`}
                    </pre>
                  </div>
                  
                  {/* Query Results Preview */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <h4 className={`text-sm font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>Results (Preview)</h4>
                      <div className="flex items-center gap-4 text-xs">
                        <span className={darkMode ? 'text-gray-400' : 'text-gray-600'}>Rows: 87 of 12,456</span>
                        <span className={darkMode ? 'text-gray-400' : 'text-gray-600'}>Time: 2.34s</span>
                        <span className={darkMode ? 'text-gray-400' : 'text-gray-600'}>Bytes processed: 4.2 GB</span>
                        <span className="text-emerald-400 font-medium">Cost: $0.08</span>
                      </div>
                    </div>
                    <div className={`rounded-lg border overflow-hidden ${darkMode ? 'border-white/10' : 'border-gray-200'}`}>
                      <table className="w-full text-sm">
                        <thead className={darkMode ? 'bg-white/5' : 'bg-gray-50'}>
                          <tr>
                            {['title', 'authors', 'citations', 'species', 'satellite', 'area'].map((col) => (
                              <th key={col} className={`px-4 py-2 text-left font-medium text-xs uppercase ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>{col}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {[
                            ['CRISPR-Cas9 genome editing...', 'Zhang et al.', '15,432', 'Homo sapiens', 'Sentinel-2', '2,340 km²'],
                            ['Spatial transcriptomics of...', 'Ståhl et al.', '8,721', 'Mus musculus', 'Landsat 8', '890 km²'],
                            ['Deep learning for protein...', 'Jumper et al.', '12,056', 'Multiple', 'MODIS', 'Global'],
                            ['Single-cell atlas of human...', 'Regev et al.', '6,234', 'Homo sapiens', '-', '-'],
                          ].map((row, i) => (
                            <tr key={i} className={`border-t ${darkMode ? 'border-white/5 hover:bg-white/5' : 'border-gray-100 hover:bg-gray-50'}`}>
                              {row.map((cell, j) => (
                                <td key={j} className={`px-4 py-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>{cell}</td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Data Structure Types */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[
                {
                  title: 'Structured Data',
                  icon: '📊',
                  examples: 'SQL tables, CSV, Parquet, ORC',
                  sources: 'Databases, Spreadsheets, APIs',
                  query: 'SQL, BI tools, Direct access',
                  color: 'from-blue-500 to-cyan-500'
                },
                {
                  title: 'Semi-Structured Data',
                  icon: '📋',
                  examples: 'JSON, XML, Avro, Protobuf, YAML',
                  sources: 'APIs, Logs, Config files, NoSQL',
                  query: 'JSONPath, XPath, Schema-aware',
                  color: 'from-violet-500 to-purple-500'
                },
                {
                  title: 'Unstructured Data',
                  icon: '📁',
                  examples: 'PDFs, Images, Audio, Video, Binary',
                  sources: 'Satellites, LHC, Instruments, Papers',
                  query: 'ML extraction, OCR, Indexing, Embeddings',
                  color: 'from-orange-500 to-red-500'
                },
              ].map((type, i) => (
                <Card key={i} className={`${darkMode ? 'bg-black/30 backdrop-blur-xl border-white/10' : 'bg-white border-gray-200'}`}>
                  <CardContent className="p-5">
                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${type.color} flex items-center justify-center text-2xl mb-4`}>
                      {type.icon}
                    </div>
                    <h3 className={`font-bold mb-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>{type.title}</h3>
                    <div className="space-y-2 text-sm">
                      <div>
                        <div className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-500'}`}>Examples</div>
                        <div className={darkMode ? 'text-gray-300' : 'text-gray-700'}>{type.examples}</div>
                      </div>
                      <div>
                        <div className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-500'}`}>Sources</div>
                        <div className={darkMode ? 'text-gray-300' : 'text-gray-700'}>{type.sources}</div>
                      </div>
                      <div>
                        <div className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-500'}`}>Query Methods</div>
                        <div className={darkMode ? 'text-gray-300' : 'text-gray-700'}>{type.query}</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* ======== PUBLISH TAB ======== */}
          <TabsContent value="publish" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Editor */}
              <div className="lg:col-span-2 space-y-4">
                <Card className={`${darkMode ? 'bg-black/30 backdrop-blur-xl border-white/10' : 'bg-white border-gray-200'}`}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className={darkMode ? 'text-white' : 'text-gray-900'}>✍️ Create New Post</CardTitle>
                        <CardDescription className={darkMode ? 'text-gray-400' : 'text-gray-600'}>Write blog posts, whitepapers, or dataset descriptions</CardDescription>
                      </div>
                      <div className="flex gap-2">
                        <Badge variant="outline" className="cursor-pointer">Draft</Badge>
                        <Button size="sm" className="bg-gradient-to-r from-cyan-500 to-violet-500">Publish</Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <Input placeholder="Enter title..." className={`text-lg font-semibold ${darkMode ? 'bg-white/5 border-white/10' : ''}`} defaultValue="Advances in Multi-Omics Integration Using SciHub Pro" />
                    
                    <div className="flex gap-2">
                      <select className={`px-3 py-2 rounded-lg text-sm border ${darkMode ? 'bg-white/5 border-white/10 text-gray-300' : 'bg-white border-gray-200'}`}>
                        <option>📝 Blog Post</option>
                        <option>📄 Whitepaper</option>
                        <option>📊 Dataset Description</option>
                        <option>🔬 Research Note</option>
                        <option>📣 Announcement</option>
                      </select>
                      <select className={`px-3 py-2 rounded-lg text-sm border ${darkMode ? 'bg-white/5 border-white/10 text-gray-300' : 'bg-white border-gray-200'}`}>
                        <option>Bioinformatics</option>
                        <option>Cheminformatics</option>
                        <option>Physics</option>
                        <option>Materials Science</option>
                        <option>Machine Learning</option>
                        <option>Data Engineering</option>
                      </select>
                    </div>
                    
                    <Textarea 
                      placeholder="Write your content in Markdown..." 
                      className={`min-h-[300px] font-mono text-sm ${darkMode ? 'bg-white/5 border-white/10' : ''}`}
                      defaultValue={`## Abstract

In this study, we demonstrate the capabilities of **SciHub Pro** for integrating multi-omics data streams from heterogeneous sources...

## Introduction

The exponential growth of biological data has created unprecedented challenges...

### Methods

We leveraged the following SciHub Pro components:

1. **Data Lake Ingestion** - Automated collection from GEO, SRA, and PRIDE
2. **Streaming Pipeline** - Real-time processing via Apache Flink
3. **Query Engine** - Cross-domain SQL joins across modalities
4. **IDE Studio** - Collaborative analysis notebooks

## Results

\`\`\`python
results = scihub.query("""
    SELECT * FROM multi_omics 
    WHERE significance < 0.001
""")
\`\`\`

## Conclusion

Our findings suggest...`}
                    />
                    
                    <div className="flex items-center justify-between">
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" className={darkMode ? 'border-white/20' : ''}>📎 Attach Files</Button>
                        <Button variant="outline" size="sm" className={darkMode ? 'border-white/20' : ''}>🖼️ Insert Image</Button>
                        <Button variant="outline" size="sm" className={darkMode ? 'border-white/20' : ''}>📊 Insert Chart</Button>
                        <Button variant="outline" size="sm" className={darkMode ? 'border-white/20' : ''}>🔗 Add Citation</Button>
                      </div>
                      <div className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                        Last saved: 2 minutes ago
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Sidebar */}
              <div className="space-y-4">
                {/* DOI Settings */}
                <Card className={`${darkMode ? 'bg-black/30 backdrop-blur-xl border-white/10' : 'bg-white border-gray-200'}`}>
                  <CardHeader className="pb-3">
                    <CardTitle className={`text-sm flex items-center gap-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                      🔖 DOI Settings
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Mint DOI</span>
                      <Switch defaultChecked />
                    </div>
                    <div className={`p-3 rounded-lg text-xs font-mono ${darkMode ? 'bg-white/5 text-gray-400' : 'bg-gray-100 text-gray-600'}`}>
                      10.8429/scihub.2024.001
                    </div>
                    <p className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>DOI will be registered upon publication</p>
                  </CardContent>
                </Card>

                {/* Co-authors */}
                <Card className={`${darkMode ? 'bg-black/30 backdrop-blur-xl border-white/10' : 'bg-white border-gray-200'}`}>
                  <CardHeader className="pb-3">
                    <CardTitle className={`text-sm flex items-center gap-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                      👥 Co-authors
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {[
                        { name: 'Dr. Sarah Chen', role: 'Lead Author', avatar: 'SC' },
                        { name: 'Prof. James Liu', role: 'Co-Author', avatar: 'JL' },
                        { name: 'Dr. Maria Garcia', role: 'Contributor', avatar: 'MG' },
                      ].map((author, i) => (
                        <div key={i} className="flex items-center gap-2">
                          <Avatar className="w-8 h-8">
                            <AvatarFallback className="text-xs bg-gradient-to-br from-cyan-500 to-violet-500 text-white">{author.avatar}</AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <div className={`text-sm font-medium truncate ${darkMode ? 'text-white' : 'text-gray-900'}`}>{author.name}</div>
                            <div className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>{author.role}</div>
                          </div>
                        </div>
                      ))}
                      <Button variant="outline" size="sm" className={`w-full text-xs ${darkMode ? 'border-white/20' : ''}`}>+ Add Author</Button>
                    </div>
                  </CardContent>
                </Card>

                {/* Publishing Options */}
                <Card className={`${darkMode ? 'bg-black/30 backdrop-blur-xl border-white/10' : 'bg-white border-gray-200'}`}>
                  <CardHeader className="pb-3">
                    <CardTitle className={`text-sm flex items-center gap-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                      ⚙️ Publishing Options
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Open Access</span>
                      <Switch defaultChecked />
                    </div>
                    <div className="flex items-center justify-between">
                      <span className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Peer Review</span>
                      <Switch />
                    </div>
                    <div className="flex items-center justify-between">
                      <span className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Allow Comments</span>
                      <Switch defaultChecked />
                    </div>
                    <div className="flex items-center justify-between">
                      <span className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Enable Versions</span>
                      <Switch defaultChecked />
                    </div>
                    <Separator />
                    <div className="flex items-center justify-between">
                      <span className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>License</span>
                      <select className={`text-xs px-2 py-1 rounded border ${darkMode ? 'bg-white/5 border-white/10 text-gray-300' : 'bg-white border-gray-200'}`}>
                        <option>CC BY 4.0</option>
                        <option>CC BY-SA 4.0</option>
                        <option>CC BY-NC 4.0</option>
                        <option>All Rights Reserved</option>
                      </select>
                    </div>
                  </CardContent>
                </Card>

                {/* Recent Posts */}
                <Card className={`${darkMode ? 'bg-black/30 backdrop-blur-xl border-white/10' : 'bg-white border-gray-200'}`}>
                  <CardHeader className="pb-3">
                    <CardTitle className={`text-sm flex items-center gap-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                      📚 Recent Publications
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {[
                        { title: 'Quantum ML Accelerators', date: '2 days ago', views: '1.2K' },
                        { title: 'CRISPR Analysis Pipeline v2', date: '1 week ago', views: '3.4K' },
                        { title: 'Climate Data Standards', date: '2 weeks ago', views: '892' },
                      ].map((post, i) => (
                        <div key={i} className={`p-2 rounded-lg cursor-pointer hover:bg-white/5 ${darkMode ? '' : 'hover:bg-gray-50'}`}>
                          <div className={`text-sm font-medium truncate ${darkMode ? 'text-white' : 'text-gray-900'}`}>{post.title}</div>
                          <div className={`flex justify-between text-xs mt-1 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                            <span>{post.date}</span>
                            <span>{post.views} views</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          {/* ======== AETHEL AI TAB ======== */}
          <TabsContent value="aethel" className="space-y-6">
            <AETHELConnector darkMode={darkMode} />
          </TabsContent>

          {/* ======== SCIENTIFIC CONNECTORS TAB ======== */}
          <TabsContent value="connectors" className="space-y-6">
            <ScientificConnectorsHub darkMode={darkMode} />
          </TabsContent>

          {/* ======== QUERY ENGINE TAB ======== */}
          <TabsContent value="query" className="space-y-6">
            <QueryExecutor darkMode={darkMode} />
          </TabsContent>

          {/* ======== KNOWLEDGE GRAPH TAB ======== */}
          <TabsContent value="knowledge" className="space-y-6">
            <KnowledgeGraph darkMode={darkMode} />
          </TabsContent>

          {/* ======== WORKFLOWS TAB ======== */}
          <TabsContent value="workflows" className="space-y-6">
            <DomainWorkflows darkMode={darkMode} />
          </TabsContent>
        </Tabs>
      </main>

      {/* Footer */}
      <footer className={`relative z-10 border-t mt-12 py-6 ${darkMode ? 'border-white/10 bg-black/20' : 'border-gray-200 bg-gray-50'}`}>
        <div className="max-w-[1920px] mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-400 via-violet-500 to-fuchsia-500 flex items-center justify-center text-white font-bold text-sm">
                S
              </div>
              <div>
                <p className={`text-sm font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>SciHub Pro</p>
                <p className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>The Scientific GitHub for the Modern Age</p>
              </div>
            </div>
            
            <div className="flex items-center gap-6 text-sm">
              <div className="flex items-center gap-2">
                {Object.entries(PolyglotStack).slice(0, 6).map(([key, tech]) => (
                  <TooltipProvider key={key}>
                    <Tooltip>
                      <TooltipTrigger>
                        <div 
                          className="w-6 h-6 rounded flex items-center justify-center text-xs cursor-pointer hover:scale-110 transition-transform"
                          style={{ backgroundColor: `${tech.color}30`, color: tech.color }}
                        >
                          {tech.icon}
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>{tech.name}: {tech.useCase.split(' ')[0]}</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                ))}
              </div>
            </div>
            
            <div className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
              Powered by AETHEL • {Microservices.length} Microservices • 6 Languages
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}

// ============ LANDING PAGE VIEW (Now uses Enhanced Component) ============
// Note: LandingPageView is now replaced by EnhancedLandingPage component

// ============ MAIN APPLICATION ============
export default function SciHubProApp() {
  const [viewMode, setViewMode] = useState<ViewMode>('landing')
  const [selectedService, setSelectedService] = useState<Microservice | null>(null)
  const [activeTab, setActiveTab] = useState('dashboard')
  const [searchQuery, setSearchQuery] = useState('')
  // Keep the in-page dark mode toggle in sync with the global ThemeProvider so
  // the SiteNav toggle and the in-app toggle both reflect the same theme.
  const { theme, setTheme } = useTheme()
  const darkMode = theme === 'dark'
  const setDarkMode = (d: boolean) => setTheme(d ? 'dark' : 'light')
  const [quantumAnimation, setQuantumAnimation] = useState(true)

  return (
    <AuthProvider>
      <TooltipProvider>
        {/* Global Navbar - Always Visible */}
        <GlobalNavbar
          darkMode={darkMode}
          setDarkMode={setDarkMode}
          viewMode={viewMode}
          setViewMode={setViewMode}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
        />
        
        {viewMode === 'microservices' ? (
          <MicroservicesView
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            selectedService={selectedService}
            setSelectedService={setSelectedService}
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            darkMode={darkMode}
            setDarkMode={setDarkMode}
            quantumAnimation={quantumAnimation}
            setQuantumAnimation={setQuantumAnimation}
            setViewMode={setViewMode}
          />
        ) : (
          <EnhancedLandingPage
            darkMode={darkMode}
            onEnterPlatform={() => setViewMode('microservices')}
          />
        )}
      </TooltipProvider>
    </AuthProvider>
  )
}
