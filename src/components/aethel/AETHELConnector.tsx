'use client'

import { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Switch } from '@/components/ui/switch'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Separator } from '@/components/ui/separator'
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from '@/components/ui/tooltip'

// ============ TYPES ============
interface AETHELConnectorProps {
  darkMode: boolean
}

interface AETHELStatus {
  connected: boolean
  latency: number
  uptime: string
  version: string
  computeUnits: number
  queueDepth: number
  activeJobs: number
}

interface AIModel {
  id: string
  name: string
  type: 'llm' | 'vision' | 'multimodal' | 'quantum' | 'scientific'
  parameters: string
  speed: string // tokens/sec
  description: string
  status: 'available' | 'busy' | 'offline'
  specialty: string
}

interface JobSubmission {
  prompt: string
  modelId: string
  priority: 'low' | 'normal' | 'high' | 'critical'
  computeBudget: number
}

interface CompletedJob {
  id: string
  model: string
  prompt: string
  result: string
  timestamp: Date
  computeTime: number
  tokensUsed: number
}

// ============ MOCK DATA ============
const mockModels: AIModel[] = [
  {
    id: 'aethel-gpt-turbo',
    name: 'AETHEL-GPT Turbo',
    type: 'llm',
    parameters: '220B',
    speed: '45K',
    description: 'General-purpose large language model optimized for scientific reasoning',
    status: 'available',
    specialty: 'Scientific Analysis & Code Generation',
  },
  {
    id: 'aethel-vision-pro',
    name: 'AETHEL-Vision Pro',
    type: 'vision',
    parameters: '85B',
    speed: '32K',
    description: 'Multimodal vision model for image analysis and molecular visualization',
    status: 'available',
    specialty: 'Microscopy & Molecular Imaging',
  },
  {
    id: 'aethel-quantum-sim',
    name: 'AETHEL-Quantum Sim',
    type: 'quantum',
    parameters: 'Quantum',
    speed: '∞',
    description: 'Quantum-inspired simulation engine for materials and chemistry',
    status: 'available',
    specialty: 'Quantum Chemistry & Materials',
  },
  {
    id: 'aethel-bio-intel',
    name: 'AETHEL-Bio Intel',
    type: 'scientific',
    parameters: '150B',
    speed: '28K',
    description: 'Specialized bioinformatics model for genomics and proteomics',
    status: 'busy',
    specialty: 'Genomics & Drug Discovery',
  },
  {
    id: 'aethel-multi-modal',
    name: 'AETHEL-MultiModal',
    type: 'multimodal',
    parameters: '300B',
    speed: '22K',
    description: 'Unified multimodal model handling text, image, and structured data',
    status: 'available',
    specialty: 'Cross-Domain Research',
  },
]

const mockResponses: Record<string, string[]> = {
  'aethel-gpt-turbo': [
    'Based on my analysis of the protein sequence data, I identify three potential binding domains that could serve as drug targets. The primary binding pocket shows a hydrophobic core with key residues at positions 142, 156, and 189. Recommended next steps include molecular docking simulations using AutoDock Vina with a search space of 25×25×25 Å centered on residue 156.',
    'The genomic variant analysis reveals 847 SNPs of which 23 are missense mutations with high PolyPhen scores (>0.9). The most significant finding is rs123456 in gene BRCA2, showing strong association (p=2.3e-12) with the phenotype. I recommend functional validation via CRISPR-Cas9 knockout in HEK293 cells.',
  ],
  'aethel-vision-pro': [
    'Analysis of the microscopy image reveals cellular morphology consistent with apoptotic indicators. Cell membrane blebbing is visible in 34% of cells, with chromatin condensation observed in region coordinates (245, 180) to (390, 310). Recommended staining: Annexin V-FITC for confirmation.',
  ],
  'aethel-quantum-sim': [
    'Quantum mechanical simulation of the molecular system converged after 847 SCF iterations. Ground state energy: -1247.83 Hartree. HOMO-LUMO gap: 4.21 eV (indicating kinetic stability). Vibrational frequency analysis confirms no imaginary frequencies (true minimum). Dipole moment: 2.847 Debye along the z-axis.',
  ],
  'aethel-bio-intel': [
    'Transcriptomic analysis of RNA-seq data identifies 1,247 differentially expressed genes (|log2FC| > 1, FDR < 0.05). Pathway enrichment reveals significant upregulation in p53 signaling pathway (p=3.2e-8) and downregulation in cell cycle G1/S transition. Key biomarkers: CDKN1A (+4.7 fold), MCM2 (-3.2 fold).',
  ],
  'aethel-multi-modal': [
    'Cross-modal integration of experimental data and literature analysis suggests a novel mechanism linking the observed phenotypic changes to metabolic pathway alterations. The combined evidence from proteomics (downregulation of TCA cycle enzymes) and metabolomics (accumulation of citrate) indicates mitochondrial dysfunction as the primary driver. Confidence score: 87%.',
  ],
}

// ============ ICONS ============
const Icons = {
  Zap: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
    </svg>
  ),
  Wifi: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 12.55a11 11 0 0 1 14.08 0"/><path d="M1.42 9a16 16 0 0 1 21.16 0"/><path d="M8.53 16.11a6 6 0 0 1 6.95 0"/><line x1="12" x2="12.01" y1="20" y2="20"/>
    </svg>
  ),
  Server: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect width="20" height="8" x="2" y="2" rx="2" ry="2"/><rect width="20" height="8" x="2" y="14" rx="2" ry="2"/><line x1="6" x2="6.01" y1="6" y2="6"/><line x1="6" x2="6.01" y1="18" y2="18"/>
    </svg>
  ),
  Activity: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 12h-4l-3 9L9 3l-3 9H2"/>
    </svg>
  ),
  Send: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m22 2-7 20-4-9-9-4Z"/><path d="M22 2 11 13"/>
    </svg>
  ),
  CheckCircle: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>
    </svg>
  ),
  Clock: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
    </svg>
  ),
  Cpu: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="4" y="4" width="16" height="16" rx="2" ry="2"/><rect x="9" y="9" width="6" height="6"/><path d="M15 2v2"/><path d="M15 20v2"/><path d="M2 15h2"/><path d="M2 9h2"/><path d="M20 15h2"/><path d="M20 9h2"/><path d="M9 2v2"/><path d="M9 20v2"/>
    </svg>
  ),
  Brain: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.96.44 2.5 2.5 0 0 1-2.96-3.08 3 3 0 0 1-.34-5.58 2.5 2.5 0 0 1 1.32-4.24 2.5 2.5 0 0 1 1.98-3A2.5 2.5 0 0 1 9.5 2Z"/><path d="M14.5 2A2.5 2.5 0 0 0 12 4.5v15a2.5 2.5 0 0 0 4.96.44 2.5 2.5 0 0 0 2.96-3.08 3 3 0 0 0 .34-5.58 2.5 2.5 0 0 0-1.32-4.24 2.5 2.5 0 0 0-1.98-3A2.5 2.5 0 0 0 14.5 2Z"/>
    </svg>
  ),
  Atom: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="1"/><path d="M20.2 20.2c2.04-2.03.02-7.36-4.5-11.9-4.54-4.52-9.87-6.54-11.9-4.5-2.04 2.03-.02 7.36 4.5 11.9 4.54 4.52 9.87 6.54 11.9 4.5Z"/><path d="M15.7 15.7c4.52-4.54 6.54-9.87 4.5-11.9-2.03-2.04-7.36-.02-11.9 4.5-4.52 4.54-6.54 9.87-4.5 11.9 2.03 2.04 7.36.02 11.9-4.5Z"/>
    </svg>
  ),
}

// ============ STATUS INDICATOR ============
function StatusIndicator({ connected, latency }: { connected: boolean; latency: number }) {
  return (
    <div className="flex items-center gap-3">
      <div className={`w-3 h-3 rounded-full ${connected ? 'bg-green-400 animate-pulse' : 'bg-red-400'}`} />
      <div>
        <span className={`text-sm font-medium ${connected ? 'text-green-400' : 'text-red-400'}`}>
          {connected ? 'Connected' : 'Disconnected'}
        </span>
        {connected && (
          <span className="text-xs text-gray-500 ml-2">{latency}ms latency</span>
        )}
      </div>
    </div>
  )
}

// ============ MAIN COMPONENT ============
export default function AETHELConnector({ darkMode }: AETHELConnectorProps) {
  const [status, setStatus] = useState<AETHELStatus>({
    connected: false,
    latency: 0,
    uptime: '--',
    version: '--',
    computeUnits: 0,
    queueDepth: 0,
    activeJobs: 0,
  })
  
  const [isConnecting, setIsConnecting] = useState(false)
  const [selectedModel, setSelectedModel] = useState<string>(mockModels[0].id)
  const [jobPrompt, setJobPrompt] = useState('')
  const [priority, setPriority] = useState<JobSubmission['priority']>('normal')
  const [computeBudget, setComputeBudget] = useState(100)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [completedJobs, setCompletedJobs] = useState<CompletedJob[]>([])
  const [autoConnect, setAutoConnect] = useState(true)
  const [metricsHistory, setMetricsHistory] = useState<number[]>([])

  // Simulate connection
  const connect = useCallback(async () => {
    setIsConnecting(true)
    
    // Simulate connection delay
    await new Promise(resolve => setTimeout(resolve, 1500))
    
    setStatus({
      connected: true,
      latency: Math.floor(Math.random() * 30) + 12,
      uptime: '99.97%',
      version: 'AETHEL v3.2.1',
      computeUnits: 12847,
      queueDepth: 23,
      activeJobs: 7,
    })
    setIsConnecting(false)
  }, [])

  const disconnect = useCallback(() => {
    setStatus(prev => ({
      ...prev,
      connected: false,
      latency: 0,
    }))
    setMetricsHistory([])
  }, [])

  // Auto-connect on mount if enabled
  useEffect(() => {
    if (autoConnect && !status.connected) {
      connect()
    }
  }, [autoConnect]) // eslint-disable-line react-hooks/exhaustive-deps

  // Simulate live metrics
  useEffect(() => {
    if (!status.connected) return
    
    const interval = setInterval(() => {
      setMetricsHistory(prev => {
        const newHistory = [...prev, Math.floor(Math.random() * 40) + 60]
        return newHistory.slice(-20) // Keep last 20 data points
      })
      
      setStatus(prev => ({
        ...prev,
        latency: Math.floor(Math.random() * 30) + 10,
        queueDepth: Math.max(0, prev.queueDepth + Math.floor(Math.random() * 3) - 1),
        activeJobs: Math.max(0, prev.activeJobs + Math.floor(Math.random() * 3) - 1),
      }))
    }, 2000)

    return () => clearInterval(interval)
  }, [status.connected])

  // Submit job
  const submitJob = async () => {
    if (!jobPrompt.trim()) return
    
    setIsSubmitting(true)
    
    // Simulate processing time based on complexity
    const processingTime = Math.min(jobPrompt.length * 20, 5000) + Math.random() * 2000
    await new Promise(resolve => setTimeout(resolve, processingTime))
    
    const model = mockModels.find(m => m.id === selectedModel)!
    const responses = mockResponses[selectedModel] || mockResponses['aethel-gpt-turbo']
    const response = responses[Math.floor(Math.random() * responses.length)]
    
    const newJob: CompletedJob = {
      id: `job_${Date.now()}`,
      model: model.name,
      prompt: jobPrompt,
      result: response,
      timestamp: new Date(),
      computeTime: Math.round(processingTime / 1000),
      tokensUsed: Math.floor(Math.random() * 500) + 200,
    }
    
    setCompletedJobs(prev => [newJob, ...prev].slice(0, 10)) // Keep last 10 jobs
    setJobPrompt('')
    setIsSubmitting(false)
  }

  const selectedModelData = mockModels.find(m => m.id === selectedModel)

  return (
    <TooltipProvider>
      <div className="space-y-6">
        
        {/* ===== HEADER CARD ===== */}
        <Card className={`${darkMode ? 'bg-gradient-to-br from-violet-900/30 to-cyan-900/30 border-violet-500/20' : 'bg-gradient-to-br from-violet-50 to-cyan-50 border-violet-200'} overflow-hidden`}>
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxwYXRoIGQ9Ik0zNiAxOGMtOS45NDEgMC0xOCA4LjA1OS0xOCAyczguMDU5IDE4IDE4IDE4IDE4LTguMDU5IDE4LTE4YzAtOS45NDEtOC4wNTktMTgtMTgtOHptMCAzMmMtNy43MzIgMC0xNC02LjI2OC0xNC0xNHM2LjI2OC0xNCAxNC0xNCAxNCA2LjI2OCAxNCAxNC02LjI2OCAxNC0xNCAxNHoiIGZpbGw9InJnYmEoMTM5LDkyLDI0NiwwLjA1KSIvPjwvZz48L3N2Zz4=')] opacity-50" />
          
          <CardHeader className="relative">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-4">
                <div className="relative">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-cyan-400 via-violet-500 to-fuchsia-500 flex items-center justify-center text-white shadow-xl shadow-violet-500/30">
                    <Icons.Atom />
                  </div>
                  {status.connected && (
                    <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-400 rounded-full border-2 border-gray-900 flex items-center justify-center">
                      <Icons.CheckCircle />
                    </div>
                  )}
                </div>
                
                <div>
                  <CardTitle className={`text-2xl font-bold flex items-center gap-3 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                    <Icons.Zap />
                    AETHEL Integration
                    <Badge className={
                      status.connected 
                        ? 'bg-green-500/20 text-green-400 border-green-500/30' 
                        : 'bg-gray-500/20 text-gray-400 border-gray-500/30'
                    }>
                      {status.version}
                    </Badge>
                  </CardTitle>
                  <CardDescription className="mt-1 text-base">
                    Advanced Experimental Theoretical Hypercomputing Emulation Layer
                  </CardDescription>
                  
                  <div className="flex items-center gap-4 mt-3">
                    <StatusIndicator connected={status.connected} latency={status.latency} />
                    
                    {status.connected && (
                      <>
                        <span className={`text-xs px-2 py-1 rounded-full ${darkMode ? 'bg-white/10 text-gray-300' : 'bg-gray-100 text-gray-600'}`}>
                          Uptime: {status.uptime}
                        </span>
                        <span className={`text-xs px-2 py-1 rounded-full ${darkMode ? 'bg-white/10 text-gray-300' : 'bg-gray-100 text-gray-600'}`}>
                          {status.computeUnits.toLocaleString()} CU
                        </span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Connect/Disconnect Button */}
              <div className="flex items-center gap-3">
                <label className="flex items-center gap-2 cursor-pointer">
                  <Switch 
                    checked={autoConnect} 
                    onCheckedChange={setAutoConnect}
                  />
                  <span className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Auto-connect</span>
                </label>
                
                <Button
                  onClick={status.connected ? disconnect : connect}
                  disabled={isConnecting}
                  variant={status.connected ? 'destructive' : 'default'}
                  className={`${
                    !status.connected && !isConnecting
                      ? 'bg-gradient-to-r from-cyan-500 to-violet-500 hover:from-cyan-600 hover:to-violet-600'
                      : ''
                  }`}
                >
                  {isConnecting ? (
                    <span className="flex items-center gap-2">
                      <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                      </svg>
                      Connecting...
                    </span>
                  ) : status.connected ? (
                    <span className="flex items-center gap-2">Disconnect</span>
                  ) : (
                    <span className="flex items-center gap-2"><Icons.Wifi /> Connect</span>
                  )}
                </Button>
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* ===== MAIN GRID ===== */}
        {status.connected && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* ===== LEFT: MODEL SELECTION & JOB SUBMISSION ===== */}
            <div className="lg:col-span-2 space-y-6">
              
              {/* Model Selection */}
              <Card className={`${darkMode ? 'bg-black/30 backdrop-blur-xl border-white/10' : 'bg-white border-gray-200'}`}>
                <CardHeader>
                  <CardTitle className={`flex items-center gap-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                    <Icons.Brain />
                    AI Model Selection
                  </CardTitle>
                  <CardDescription>Choose the optimal AI model for your scientific task</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {mockModels.map((model) => (
                      <button
                        key={model.id}
                        onClick={() => setSelectedModel(model.id)}
                        className={`p-4 rounded-xl border text-left transition-all ${
                          selectedModel === model.id
                            ? darkMode
                              ? 'border-cyan-500 bg-cyan-500/10 shadow-lg shadow-cyan-500/20'
                              : 'border-cyan-500 bg-cyan-50 shadow-lg shadow-cyan-500/20'
                            : darkMode
                              ? 'border-white/10 hover:border-white/20 hover:bg-white/5'
                              : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <h4 className={`font-semibold text-sm ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                              {model.name}
                            </h4>
                            <p className={`text-xs mt-0.5 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                              {model.specialty}
                            </p>
                          </div>
                          <Badge 
                            variant="outline" 
                            className={`text-[10px] ${
                              model.status === 'available' 
                                ? 'text-green-400 border-green-500/30 bg-green-500/10'
                                : model.status === 'busy'
                                  ? 'text-yellow-400 border-yellow-500/30 bg-yellow-500/10'
                                  : 'text-gray-400 border-gray-500/30 bg-gray-500/10'
                            }`}
                          >
                            {model.status}
                          </Badge>
                        </div>
                        
                        <div className="flex items-center gap-3 mt-3 text-xs">
                          <span className={darkMode ? 'text-gray-400' : 'text-gray-500'}>
                            {model.parameters} params
                          </span>
                          <span className={darkMode ? 'text-gray-500' : 'text-gray-400'}>&middot;</span>
                          <span className={darkMode ? 'text-cyan-400' : 'text-cyan-600'}>
                            {model.speed} tok/s
                          </span>
                          <span className={darkMode ? 'text-gray-500' : 'text-gray-400'}>&middot;</span>
                          <span className={`px-1.5 py-0.5 rounded capitalize ${
                            model.type === 'llm' ? 'bg-blue-500/20 text-blue-300' :
                            model.type === 'vision' ? 'bg-purple-500/20 text-purple-300' :
                            model.type === 'quantum' ? 'bg-fuchsia-500/20 text-fuchsia-300' :
                            model.type === 'scientific' ? 'bg-green-500/20 text-green-300' :
                            'bg-orange-500/20 text-orange-300'
                          }`}>
                            {model.type}
                          </span>
                        </div>
                      </button>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Job Submission */}
              <Card className={`${darkMode ? 'bg-black/30 backdrop-blur-xl border-white/10' : 'bg-white border-gray-200'}`}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className={`flex items-center gap-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                        <Icons.Send />
                        Task Submission
                      </CardTitle>
                      <CardDescription>Submit computational tasks to AETHEL AI</CardDescription>
                    </div>
                    {selectedModelData && (
                      <Badge variant="outline" className="bg-cyan-500/10 text-cyan-400 border-cyan-500/30">
                        {selectedModelData.name}
                      </Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Textarea
                    placeholder="Describe your scientific task...&#10;&#10;Examples:&#10;- Analyze this protein sequence for binding sites&#10;- Predict molecular properties for SMILES: CCOc1ccc2nc(N)[nH]c2c1&#10;- Generate hypothesis for differential expression results"
                    value={jobPrompt}
                    onChange={(e) => setJobPrompt(e.target.value)}
                    className={`min-h-[140px] font-mono text-sm resize-none ${
                      darkMode ? 'bg-white/5 border-white/10 placeholder:text-gray-600' : ''
                    }`}
                  />

                  <div className="flex flex-wrap items-center gap-4">
                    {/* Priority Selector */}
                    <div className="flex items-center gap-2">
                      <label className={`text-xs font-medium ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                        Priority:
                      </label>
                      <select
                        value={priority}
                        onChange={(e) => setPriority(e.target.value as JobSubmission['priority'])}
                        className={`px-2 py-1.5 rounded-lg text-xs border ${
                          darkMode ? 'bg-white/5 border-white/10 text-gray-300' : 'bg-gray-50 border-gray-200'
                        }`}
                      >
                        <option value="low">Low</option>
                        <option value="normal">Normal</option>
                        <option value="high">High</option>
                        <option value="critical">Critical</option>
                      </select>
                    </div>

                    {/* Compute Budget */}
                    <div className="flex items-center gap-2 flex-1 max-w-xs">
                      <label className={`text-xs font-medium ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                        Budget:
                      </label>
                      <Input
                        type="number"
                        min={10}
                        max={10000}
                        value={computeBudget}
                        onChange={(e) => setComputeBudget(Number(e.target.value))}
                        className={`h-8 text-xs ${
                          darkMode ? 'bg-white/5 border-white/10' : ''
                        }`}
                      />
                      <span className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>CU</span>
                    </div>

                    {/* Submit Button */}
                    <Button
                      onClick={submitJob}
                      disabled={!jobPrompt.trim() || isSubmitting}
                      className="ml-auto bg-gradient-to-r from-cyan-500 to-violet-500 hover:from-cyan-600 hover:to-violet-600"
                    >
                      {isSubmitting ? (
                        <span className="flex items-center gap-2">
                          <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                          </svg>
                          Processing...
                        </span>
                      ) : (
                        <span className="flex items-center gap-2">
                          <Icons.Send /> Submit to AETHEL
                        </span>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Results History */}
              {completedJobs.length > 0 && (
                <Card className={`${darkMode ? 'bg-black/30 backdrop-blur-xl border-white/10' : 'bg-white border-gray-200'}`}>
                  <CardHeader>
                    <CardTitle className={`flex items-center gap-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                      <Icons.Activity />
                      Recent Results
                    </CardTitle>
                    <CardDescription>AETHEL AI task execution history</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {completedJobs.map((job) => (
                      <div 
                        key={job.id}
                        className={`p-4 rounded-xl border ${
                          darkMode ? 'bg-white/5 border-white/10' : 'bg-gray-50 border-gray-200'
                        }`}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <Badge variant="outline" className="text-xs bg-cyan-500/10 text-cyan-400 border-cyan-500/30 mb-1">
                              {job.model}
                            </Badge>
                            <p className={`text-xs mt-1 line-clamp-2 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                              {job.prompt}
                            </p>
                          </div>
                          <div className="flex items-center gap-3 text-xs text-gray-500 ml-4 whitespace-nowrap">
                            <span className="flex items-center gap-1">
                              <Icons.Clock /> {job.computeTime}s
                            </span>
                            <span>{job.tokensUsed} tok</span>
                          </div>
                        </div>
                        <Separator className="my-3" />
                        <p className={`text-sm leading-relaxed ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                          {job.result}
                        </p>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}
            </div>

            {/* ===== RIGHT: METRICS & STATS ===== */}
            <div className="space-y-6">
              
              {/* Live Metrics */}
              <Card className={`${darkMode ? 'bg-black/30 backdrop-blur-xl border-white/10' : 'bg-white border-gray-200'}`}>
                <CardHeader className="pb-3">
                  <CardTitle className={`text-sm flex items-center gap-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                    <Icons.Server />
                    System Metrics
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Compute Units Usage */}
                  <div>
                    <div className="flex justify-between text-xs mb-1.5">
                      <span className={darkMode ? 'text-gray-400' : 'text-gray-600'}>Compute Utilization</span>
                      <span className="font-medium text-cyan-400">{Math.round((status.activeJobs / 20) * 100)}%</span>
                    </div>
                    <Progress value={(status.activeJobs / 20) * 100} className="h-2" />
                  </div>

                  {/* Queue Depth */}
                  <div>
                    <div className="flex justify-between text-xs mb-1.5">
                      <span className={darkMode ? 'text-gray-400' : 'text-gray-600'}>Queue Depth</span>
                      <span className="font-medium text-violet-400">{status.queueDepth}</span>
                    </div>
                    <Progress value={(status.queueDepth / 100) * 100} className="h-2" />
                  </div>

                  {/* Active Jobs */}
                  <div className="grid grid-cols-2 gap-3 pt-2">
                    <div className={`p-3 rounded-lg text-center ${darkMode ? 'bg-white/5' : 'bg-gray-50'}`}>
                      <p className="text-2xl font-bold text-cyan-400">{status.activeJobs}</p>
                      <p className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>Active Jobs</p>
                    </div>
                    <div className={`p-3 rounded-lg text-center ${darkMode ? 'bg-white/5' : 'bg-gray-50'}`}>
                      <p className="text-2xl font-bold text-violet-400">{status.computeUnits.toLocaleString()}</p>
                      <p className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>Compute Units</p>
                    </div>
                  </div>

                  {/* Latency Chart (Mini) */}
                  {metricsHistory.length > 0 && (
                    <div className="pt-2">
                      <p className={`text-xs mb-2 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Latency (last 20 checks)</p>
                      <div className="flex items-end gap-1 h-12">
                        {metricsHistory.map((val, i) => (
                          <div
                            key={i}
                            className="flex-1 bg-gradient-to-t from-cyan-500 to-violet-500 rounded-sm opacity-80"
                            style={{ height: `${val}%` }}
                          />
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Quick Actions */}
              <Card className={`${darkMode ? 'bg-black/30 backdrop-blur-xl border-white/10' : 'bg-white border-gray-200'}`}>
                <CardHeader className="pb-3">
                  <CardTitle className={`text-sm ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                    Quick Templates
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {[
                    { label: 'Protein Analysis', prompt: 'Analyze protein sequence for binding domains and drug targets', icon: '🧬' },
                    { label: 'Molecular Properties', prompt: 'Predict physicochemical properties for given molecule', icon: '⚗️' },
                    { label: 'Genomic Variant', prompt: 'Identify pathogenic variants and their clinical significance', icon: '🧬' },
                    { label: 'Literature Search', prompt: 'Find relevant papers on this research topic', icon: '📚' },
                    { label: 'Code Generation', prompt: 'Generate Python code for this analysis pipeline', icon: '💻' },
                  ].map((template, i) => (
                    <button
                      key={i}
                      onClick={() => setJobPrompt(template.prompt)}
                      className={`w-full flex items-center gap-3 p-2.5 rounded-lg text-left text-sm transition-colors ${
                        darkMode ? 'hover:bg-white/5 text-gray-300' : 'hover:bg-gray-50 text-gray-700'
                      }`}
                    >
                      <span>{template.icon}</span>
                      <span className="flex-1">{template.label}</span>
                      <span className={`text-xs ${darkMode ? 'text-gray-600' : 'text-gray-400'}`}>→</span>
                    </button>
                  ))}
                </CardContent>
              </Card>

              {/* API Info */}
              <Card className={`${darkMode ? 'bg-gradient-to-br from-cyan-900/20 to-violet-900/20 border-cyan-500/20' : 'bg-gradient-to-br from-cyan-50 to-violet-50 border-cyan-200'}`}>
                <CardContent className="pt-6">
                  <div className="text-center">
                    <Icons.Cpu />
                    <p className={`font-semibold mt-2 text-sm ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                      API Access Available
                    </p>
                    <p className={`text-xs mt-1 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                      REST & gRPC endpoints ready
                    </p>
                    <code className={`inline-block mt-3 px-3 py-1.5 rounded-lg text-xs font-mono ${
                      darkMode ? 'bg-black/30 text-cyan-400' : 'bg-white text-cyan-600'
                    }`}>
                      api.aethel.scihub.pro/v3
                    </code>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {/* Disconnected State */}
        {!status.connected && !isConnecting && (
          <Card className={`${darkMode ? 'bg-black/30 backdrop-blur-xl border-white/10' : 'bg-white border-gray-200'}`}>
            <CardContent className="py-16 text-center">
              <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-gray-700 to-gray-800 flex items-center justify-center text-gray-400">
                <Icons.Wifi />
              </div>
              <h3 className={`text-xl font-semibold mb-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                AETHEL Platform Disconnected
              </h3>
              <p className={`text-sm mb-6 max-w-md mx-auto ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                Connect to the AETHEL hypercomputing platform to access AI-powered scientific computing capabilities including quantum simulation, molecular modeling, and intelligent data analysis.
              </p>
              <Button
                onClick={connect}
                size="lg"
                className="bg-gradient-to-r from-cyan-500 to-violet-500 hover:from-cyan-600 hover:to-violet-600"
              >
                <Icons.Wifi />
                <span className="ml-2">Initialize AETHEL Connection</span>
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Connecting State */}
        {isConnecting && (
          <Card className={`${darkMode ? 'bg-black/30 backdrop-blur-xl border-white/10' : 'bg-white border-gray-200'}`}>
            <CardContent className="py-16 text-center">
              <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-cyan-500/20 to-violet-500/20 flex items-center justify-center">
                <svg className="animate-spin h-10 w-10 text-cyan-400" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                </svg>
              </div>
              <h3 className={`text-xl font-semibold mb-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                Establishing Secure Connection...
              </h3>
              <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                Authenticating with AETHEL platform • Initializing quantum kernels • Loading ML models
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </TooltipProvider>
  )
}
