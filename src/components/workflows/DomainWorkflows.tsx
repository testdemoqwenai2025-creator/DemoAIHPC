'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Progress } from '@/components/ui/progress'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

// ============ TYPES ============
interface DomainWorkflowsProps {
  darkMode: boolean
}

interface WorkflowStep {
  id: string
  name: string
  tool: string
  description: string
  status?: 'pending' | 'running' | 'completed' | 'error'
  duration?: string
}

interface WorkflowTemplate {
  id: string
  domain: string
  icon: string
  color: string
  title: string
  description: string
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced'
  estimatedTime: string
  computeHours: number
  steps: WorkflowStep[]
  inputs: string[]
  outputs: string[]
  tags: string[]
  popularity: number
}

// ============ WORKFLOW TEMPLATES ============
const workflowTemplates: WorkflowTemplate[] = [
  // === BIOINFORMATICS ===
  {
    id: 'bio-1',
    domain: 'Bioinformatics',
    icon: '🧬',
    color: '#22C55E',
    title: 'Variant Calling Pipeline (GATK)',
    description: 'End-to-end pipeline for identifying genetic variants from raw sequencing data. Includes quality control, alignment, variant calling, and annotation.',
    difficulty: 'Intermediate',
    estimatedTime: '4-6 hours',
    computeHours: 24,
    inputs: ['FASTQ files', 'Reference genome (FASTA)', 'Known variants (VCF)'],
    outputs: ['VCF with variants', 'QC reports', 'Statistics summary'],
    tags: ['GATK', 'BWA', 'SAMtools', 'Variant calling'],
    popularity: 95,
    steps: [
      { id: 'b1s1', name: 'Quality Control', tool: 'FastQC', description: 'Assess read quality, adapter content, GC distribution' },
      { id: 'b1s2', name: 'Read Trimming', tool: 'Trimmomatic', description: 'Remove adapters, low-quality bases, short reads' },
      { id: 'b1s3', name: 'Sequence Alignment', tool: 'BWA-MEM2', description: 'Align reads to reference genome' },
      { id: 'b1s4', name: 'Post-processing', tool: 'Picard', description: 'Mark duplicates, sort, index BAM files' },
      { id: 'b1s5', name: 'Base Recalibration', tool: 'GATK BQSR', description: 'Recalibrate base quality scores' },
      { id: 'b1s6', name: 'Variant Calling', tool: 'GATK HaplotypeCaller', description: 'Call SNPs and indels across genome' },
      { id: 'b1s7', name: 'Variant Filtering', tool: 'GATK VariantFiltration', description: 'Apply hard filters or VQSR' },
      { id: 'b1s8', name: 'Annotation', tool: 'VEP/SnpEff', description: 'Annotate functional effects of variants' },
    ],
  },
  {
    id: 'bio-2',
    domain: 'Bioinformatics',
    icon: '📊',
    color: '#16A34A',
    title: 'Differential Gene Expression (RNA-seq)',
    description: 'Analyze RNA-seq data to identify differentially expressed genes between conditions. Includes alignment, quantification, normalization, and statistical testing.',
    difficulty: 'Beginner',
    estimatedTime: '2-3 hours',
    computeHours: 8,
    inputs: ['FASTQ files', 'Sample metadata (TSV)', 'Annotation GTF'],
    outputs: ['DE gene list', 'Volcano plot', 'Heatmap', 'PCA plot'],
    tags: ['STAR', 'featureCounts', 'DESeq2', 'RNA-seq'],
    popularity: 92,
    steps: [
      { id: 'b2s1', name: 'Quality Assessment', tool: 'FastQC + MultiQC', description: 'Generate QC report for all samples' },
      { id: 'b2s2', name: 'Read Alignment', tool: 'STAR', description: 'Splice-aware alignment to reference' },
      { id: 'b2s3', name: 'Gene Quantification', tool: 'featureCounts', description: 'Count reads per gene' },
      { id: 'b2s4', name: 'Quality Filtering', tool: 'Custom R script', description: 'Filter low-count genes, outliers' },
      { id: 'b2s5', name: 'Normalization', tool: 'DESeq2', description: 'Normalize for library size, composition' },
      { id: 'b2s6', name: 'Differential Analysis', tool: 'DESeq2', description: 'Identify DE genes (adjusted p < 0.05)' },
      { id: 'b2s7', name: 'Visualization', tool: 'ggplot2/pheatmap', description: 'Create volcano plots, heatmaps, PCA' },
    ],
  },
  {
    id: 'bio-3',
    domain: 'Bioinformatics',
    icon: '🔗',
    color: '#15803D',
    title: 'Phylogenetic Tree Construction',
    description: 'Build evolutionary trees from multiple sequence alignments. Covers MSA, model selection, tree inference, and visualization.',
    difficulty: 'Advanced',
    estimatedTime: '3-5 hours',
    computeHours: 12,
    inputs: ['Sequences (FASTA)', 'Outgroup sequence'],
    outputs: ['Phylogenetic tree (Newick)', 'Alignment file', 'Bootstrap values'],
    tags: ['MAFFT', 'IQ-TREE', 'FigTree', 'Phylogenetics'],
    popularity: 78,
    steps: [
      { id: 'b3s1', name: 'Sequence Retrieval', tool: 'NCBI Entrez', description: 'Download homologous sequences' },
      { id: 'b3s2', name: 'Multiple Sequence Alignment', tool: 'MAFFT L-INS-i', description: 'High-accuracy MSA with iterative refinement' },
      { id: 'b3s3', name: 'Alignment Trimming', tool: 'trimAl', description: 'Remove poorly aligned regions' },
      { id: 'b3s4', name: 'Model Selection', tool: 'ModelTest-NG / IQ-TREE', description: 'Find best substitution model' },
      { id: 'b3s5', name: 'Tree Inference', tool: 'IQ-TREE 2', description: 'Maximum likelihood tree with ultrafast bootstrap' },
      { id: 'b3s6', name: 'Tree Visualization', tool: 'iTOL / FigTree', description: 'Annotate and export publication-ready tree' },
    ],
  },

  // === CHEMINFORMATICS ===
  {
    id: 'chem-1',
    domain: 'Cheminformatics',
    icon: '⚗️',
    color: '#F97316',
    title: 'Virtual Screening Pipeline',
    description: 'Screen large compound libraries against a protein target. Includes library preparation, docking, scoring, and hit prioritization.',
    difficulty: 'Advanced',
    estimatedTime: '8-24 hours',
    computeHours: 100,
    inputs: ['Protein structure (PDB)', 'Compound library (SDF)', 'Binding site definition'],
    outputs: ['Ranked hits list', 'Docking poses', 'Interaction profiles', 'ADMET predictions'],
    tags: ['AutoDock Vina', 'RDKit', 'OpenBabel', 'Virtual screening'],
    popularity: 88,
    steps: [
      { id: 'c1s1', name: 'Target Preparation', tool: 'AutoDock Tools', description: 'Add hydrogens, assign charges, define grid box' },
      { id: 'c1s2', name: 'Library Preparation', tool: 'RDKit', description: 'Standardize molecules, generate 3D conformers' },
      { id: 'c1s3', name: 'Property Filtering', tool: 'RDKit', description: 'Apply Lipinski, PAINS filters' },
      { id: 'c1s4', name: 'Molecular Docking', tool: 'AutoDock Vina/GNINA', description: 'Dock compounds to binding site' },
      { id: 'c1s5', name: 'Rescoring', tool: 'MM-GBSA/NNScore', description: 'Rescore top poses with better scoring function' },
      { id: 'c1s6', name: 'Interaction Analysis', tool: 'PLIP/LigPlot+', description: 'Analyze protein-ligand interactions' },
      { id: 'c1s7', name: 'ADMET Prediction', tool: 'pkCSM/admetSAR', description: 'Predict pharmacokinetics, toxicity' },
      { id: 'c1s8', name: 'Hit Prioritization', tool: 'Custom script', description: 'Rank by docking score, diversity, drug-likeness' },
    ],
  },
  {
    id: 'chem-2',
    domain: 'Cheminformatics',
    icon: '📈',
    color: '#EA580C',
    title: 'QSAR Model Development',
    description: 'Build Quantitative Structure-Activity Relationship models to predict biological activity from molecular descriptors.',
    difficulty: 'Intermediate',
    estimatedTime: '3-5 hours',
    computeHours: 16,
    inputs: ['Compound dataset (SMILES + activity)', 'Activity endpoint'],
    outputs: ['Trained QSAR model', 'Feature importance', 'Validation metrics', 'Predictions'],
    tags: ['RDKit', 'Scikit-learn', 'QSAR', 'Machine Learning'],
    popularity: 75,
    steps: [
      { id: 'c2s1', name: 'Data Curation', tool: 'RDKit/Pandas', description: 'Standardize structures, remove duplicates' },
      { id: 'c2s2', name: 'Descriptor Calculation', tool: 'RDKit/Mordred', description: 'Calculate 200+ molecular descriptors' },
      { id: 'c2s3', name: 'Feature Selection', tool: 'Scikit-learn', description: 'Remove correlated, low-variance features' },
      { id: 'c2s4', name: 'Dataset Splitting', tool: 'Scikit-learn', description: 'Train/test split, scaffold split for validation' },
      { id: 'c2s5', name: 'Model Training', tool: 'Random Forest/XGBoost', description: 'Train regression/classification model' },
      { id: 'c2s6', name: 'Model Validation', tool: 'Cross-validation', description: 'R², RMSE, MAE for regression; AUC, F1 for classification' },
      { id: 'c2s7', name: 'Interpretation', tool: 'SHAP/LIME', description: 'Explain predictions, feature importance' },
    ],
  },

  // === PHYSICS ===
  {
    id: 'phys-1',
    domain: 'Physics',
    icon: '⚛️',
    color: '#3B82F6',
    title: 'Higgs Boson Analysis (ATLAS/CMS)',
    description: 'Reproduce Higgs boson discovery analysis using open data from CERN. Process collision events, apply selections, and measure properties.',
    difficulty: 'Advanced',
    estimatedTime: '6-10 hours',
    computeHours: 50,
    inputs: ['ROOT ntuples (DAOD_PHYS)', 'Luminosity files', 'Analysis config'],
    outputs: ['Invariant mass plots', 'Signal yields', 'Cross-section measurement', 'Publication figures'],
    tags: ['ROOT', 'CERN Open Data', 'Higgs', 'Particle Physics'],
    popularity: 85,
    steps: [
      { id: 'p1s1', name: 'Data Access', tool: 'CERN Open Data Portal', description: 'Download ATLAS/CMS Higgs datasets' },
      { id: 'p1s2', name: 'Event Selection', tool: 'ROOT/C++', description: 'Select events passing trigger requirements' },
      { id: 'p1s3', name: 'Object Reconstruction', tool: 'ROOT', description: 'Reconstruct electrons, muons, photons, jets' },
      { id: 'p1s4', name: 'Pair Selection', tool: 'ROOT', description: 'Form dilepton/diphoton candidates' },
      { id: 'p1s5', name: 'Background Estimation', tool: 'ROOT/Fit', description: 'Fit background model to sidebands' },
      { id: 'p1s6', name: 'Signal Extraction', tool: 'RooFit', description: 'Simultaneous fit for signal + background' },
      { id: 'p1s7', name: 'Systematic Uncertainties', tool: 'Custom scripts', description: 'Evaluate experimental systematics' },
      { id: 'p1s8', name: 'Result Interpretation', tool: 'ROOT/Matplotlib', description: 'Calculate significance, compare to SM prediction' },
    ],
  },
  {
    id: 'phys-2',
    domain: 'Physics',
    icon: '🌌',
    color: '#2563EB',
    title: 'Cosmological Parameter Estimation',
    description: 'Analyze cosmic microwave background and large-scale structure data to constrain cosmological parameters (ΛCDM model).',
    difficulty: 'Advanced',
    estimatedTime: '8-12 hours',
    computeHours: 80,
    inputs: ['CMB power spectra (Planck)', 'BAO measurements', 'Supernova distances'],
    outputs: ['Parameter constraints (Ωm, ΩΛ, H0)', 'Corner plots', 'Best-fit cosmology'],
    tags: ['CAMB', 'MontePython', 'Cosmology', 'CMB'],
    popularity: 65,
    steps: [
      { id: 'p2s1', name: 'Theory Prediction', tool: 'CAMB/CLASS', description: 'Compute CMB power spectrum for given parameters' },
      { id: 'p2s2', name: 'Likelihood Setup', tool: 'MontePython/cobaya', description: 'Configure Planck, BAO, SN likelihoods' },
      { id: 'p2s3', name: 'MCMC Sampling', tool: 'emcee/MontePython', description: 'Run Markov Chain Monte Carlo' },
      { id: 'p2s4', name: 'Convergence Check', tool: 'GetDist', description: 'Check R-1 statistic, chain length' },
      { id: 'p2s5', name: 'Posterior Analysis', tool: 'GetDist', description: 'Compute marginalized constraints' },
      { id: 'p2s6', name: 'Visualization', tool: 'GetDist/triangle', description: 'Create corner plots, 1D marginals' },
    ],
  },

  // === MATERIALS SCIENCE ===
  {
    id: 'mat-1',
    domain: 'Materials Science',
    icon: '💎',
    color: '#8B5CF6',
    title: 'DFT Calculations Workflow',
    description: 'Perform Density Functional Theory calculations to predict material properties. From structure optimization to electronic structure analysis.',
    difficulty: 'Intermediate',
    estimatedTime: '4-8 hours',
    computeHours: 48,
    inputs: ['Crystal structure (CIF)', 'Pseudopotentials', 'k-point mesh'],
    outputs: ['Optimized geometry', 'Band structure', 'Density of states', 'Total energy'],
    tags: ['VASP', 'Quantum ESPRESSO', 'DFT', 'Materials'],
    popularity: 82,
    steps: [
      { id: 'm1s1', name: 'Structure Preparation', tool: 'ASE/pymatgen', description: 'Convert CIF, generate input files' },
      { id: 'm1s2', name: 'Geometry Optimization', tool: 'VASP/QE', description: 'Relax atomic positions and cell' },
      { id: 'm1s3', name: 'Self-Consistent Field', tool: 'VASP/QE', description: 'Converge electron density' },
      { id: 'm1s4', name: 'Band Structure', tool: 'VASP/QE/bandup', description: 'Calculate along high-symmetry path' },
      { id: 'm1s5', name: 'Density of States', tool: 'VASP/QE', description: 'Total and projected DOS' },
      { id: 'm1s6', name: 'Charge Analysis', tool: 'Bader/CHGCAR', description: 'Bader charges, electron localization' },
      { id: 'm1s7', name: 'Optical Properties', tool: 'VASP/optic', description: 'Dielectric function, absorption' },
    ],
  },

  // === CLIMATE SCIENCE ===
  {
    id: 'climate-1',
    domain: 'Climate Science',
    icon: '🌍',
    color: '#06B6D4',
    title: 'Climate Data Analysis & Visualization',
    description: 'Analyze global climate datasets to identify trends, anomalies, and patterns. Create publication-quality visualizations.',
    difficulty: 'Beginner',
    estimatedTime: '2-4 hours',
    computeHours: 6,
    inputs: ['NetCDF climate data', 'Shapefile (optional)', 'Time period'],
    outputs: ['Trend maps', 'Time series plots', 'Anomaly maps', 'Statistical summary'],
    tags: ['xarray', 'Cartopy', 'Climate', 'NetCDF'],
    popularity: 80,
    steps: [
      { id: 'cl1s1', name: 'Data Loading', tool: 'xarray', description: 'Open NetCDF/GRIB files, inspect metadata' },
      { id: 'cl1s2', name: 'Quality Control', tool: 'xarray', description: 'Check for missing values, outliers' },
      { id: 'cl1s3', name: 'Spatial Subsetting', tool: 'xarray/regionmask', description: 'Extract region of interest' },
      { id: 'cl1s4', name: 'Temporal Aggregation', tool: 'xarray', description: 'Compute monthly/annual means' },
      { id: 'cl1s5', name: 'Trend Calculation', tool: 'scipy/xarray', description: 'Linear trend, Mann-Kendall test' },
      { id: 'cl1s6', name: 'Anomaly Computation', tool: 'xarray', description: 'Calculate climatology and anomalies' },
      { id: 'cl1s7', name: 'Visualization', tool: 'Matplotlib/Cartopy', description: 'Create maps, time series, heatmaps' },
    ],
  },

  // === MACHINE LEARNING FOR SCIENCE ===
  {
    id: 'ml-1',
    domain: 'ML/AI',
    icon: '🤖',
    color: '#EC4899',
    title: 'Scientific ML Pipeline (PyTorch)',
    description: 'Build end-to-end machine learning pipeline for scientific data. From data preprocessing to model deployment.',
    difficulty: 'Intermediate',
    estimatedTime: '5-8 hours',
    computeHours: 32,
    inputs: ['Training dataset', 'Labels/targets', 'Validation set'],
    outputs: ['Trained model', 'Training curves', 'Test metrics', 'Predictions'],
    tags: ['PyTorch', 'scikit-learn', 'MLflow', 'Deep Learning'],
    popularity: 90,
    steps: [
      { id: 'ml1s1', name: 'Data Loading', tool: 'PyTorch DataLoader', description: 'Create custom Dataset, handle batching' },
      { id: 'ml1s2', name: 'Preprocessing', tool: 'sklearn/torchvision', description: 'Normalization, augmentation, tokenization' },
      { id: 'ml1s3', name: 'Model Architecture', tool: 'PyTorch nn.Module', description: 'Define neural network layers' },
      { id: 'ml1s4', name: 'Loss & Optimizer', tool: 'PyTorch', description: 'Configure training hyperparameters' },
      { id: 'ml1s5', name: 'Training Loop', tool: 'PyTorch', description: 'Implement forward/backward pass' },
      { id: 'ml1s6', name: 'Validation', tool: 'PyTorch', description: 'Monitor loss, early stopping' },
      { id: 'ml1s7', name: 'Evaluation', tool: 'sklearn/torchmetrics', description: 'Compute test metrics, confusion matrix' },
      { id: 'ml1s8', name: 'Experiment Tracking', tool: 'MLflow/W&B', description: 'Log parameters, metrics, artifacts' },
    ],
  },
]

// ============ ICONS ============
const Icons = {
  Play: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="5 3 19 12 5 21 5 3"/>
    </svg>
  ),
  Clock: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
    </svg>
  ),
  Cpu: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="4" y="4" width="16" height="16" rx="2" ry="2"/><rect x="9" y="9" width="6" height="6"/><path d="M15 2v2"/><path d="M15 20v2"/><path d="M2 15h2"/><path d="M2 9h2"/><path d="M20 15h2"/><path d="M20 9h2"/><path d="M9 2v2"/><path d="M9 20v2"/>
    </svg>
  ),
  Download: () => (
    <svg xmlns="http://www.w3.org/2000/svg" size="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/>
    </svg>
  ),
  Star: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
    </svg>
  ),
  ChevronRight: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m9 18 6-6-6-6"/>
    </svg>
  ),
  CheckCircle: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>
    </svg>
  ),
  Zap: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
    </svg>
  ),
}

// ============ MAIN COMPONENT ============
export default function DomainWorkflows({ darkMode }: DomainWorkflowsProps) {
  const [selectedDomain, setSelectedDomain] = useState<string>('all')
  const [selectedWorkflow, setSelectedWorkflow] = useState<WorkflowTemplate | null>(null)
  const [runningWorkflow, setRunningWorkflow] = useState<string | null>(null)
  const [stepStatuses, setStepStatuses] = useState<Record<string, 'pending' | 'running' | 'completed' | 'error'>>({})

  // Get unique domains
  const domains = [...new Set(workflowTemplates.map(w => w.domain))]

  // Filter workflows
  const filteredWorkflows = selectedDomain === 'all' 
    ? workflowTemplates 
    : workflowTemplates.filter(w => w.domain === selectedDomain)

  // Run workflow simulation
  const runWorkflow = async (workflowId: string) => {
    setRunningWorkflow(workflowId)
    const workflow = workflowTemplates.find(w => w.id === workflowId)
    if (!workflow) return

    // Reset statuses
    const initialStatuses: Record<string, 'pending' | 'running' | 'completed' | 'error'> = {}
    workflow.steps.forEach(step => { initialStatuses[step.id] = 'pending' })
    setStepStatuses(initialStatuses)

    // Simulate running each step
    for (const step of workflow.steps) {
      setStepStatuses(prev => ({ ...prev, [step.id]: 'running' }))
      await new Promise(resolve => setTimeout(resolve, 800 + Math.random() * 1200))
      setStepStatuses(prev => ({ ...prev, [step.id]: 'completed' }))
    }

    setRunningWorkflow(null)
  }

  return (
    <div className="space-y-6">
      
      {/* ===== HEADER ===== */}
      <Card className={`relative overflow-hidden ${
        darkMode ? 'bg-gradient-to-br from-emerald-900/30 via-cyan-900/30 to-blue-900/30 border-emerald-500/20' : 'bg-gradient-to-br from-emerald-50 via-cyan-50 to-blue-50 border-emerald-200'
      }`}>
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-400 via-cyan-500 to-blue-500 flex items-center justify-center text-white shadow-lg shadow-cyan-500/25 text-2xl">
              ⚡
            </div>
            
            <div className="flex-1">
              <h2 className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                Scientific Workflow Templates
              </h2>
              <p className={`mt-1 text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                Pre-built computational pipelines for genomics, chemistry, physics, materials science, and more.
                One-click execution with AETHEL-accelerated computing.
              </p>
              
              <div className="flex items-center gap-4 mt-3">
                <Badge variant="outline" className="bg-green-500/10 text-green-400 border-green-500/20">
                  {workflowTemplates.length} Templates
                </Badge>
                <Badge variant="outline" className="bg-blue-500/10 text-blue-400 border-blue-500/20">
                  {domains.length} Domains
                </Badge>
                <Badge variant="outline" className="bg-purple-500/10 text-purple-400 border-purple-500/20">
                  AETHEL Ready
                </Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ===== DOMAIN FILTER ===== */}
      <div className="flex items-center gap-3 flex-wrap">
        <button
          onClick={() => setSelectedDomain('all')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            selectedDomain === 'all'
              ? 'bg-gradient-to-r from-cyan-500 to-violet-500 text-white shadow-lg'
              : darkMode ? 'bg-white/10 text-gray-300 hover:bg-white/20' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          All Workflows ({workflowTemplates.length})
        </button>
        
        {domains.map(domain => {
          const count = workflowTemplates.filter(w => w.domain === domain).length
          const wf = workflowTemplates.find(w => w.domain === domain)
          
          return (
            <button
              key={domain}
              onClick={() => setSelectedDomain(domain)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
                selectedDomain === domain
                  ? 'text-white shadow-lg'
                  : darkMode ? 'bg-white/10 text-gray-300 hover:bg-white/20' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
              style={selectedDomain === domain ? { backgroundColor: wf?.color || '#888' } : {}}
            >
              <span>{wf?.icon}</span>
              <span>{domain}</span>
              <span className={`text-xs opacity-70`}>({count})</span>
            </button>
          )
        })}
      </div>

      {/* ===== WORKFLOW GRID ===== */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        
        {/* Workflow Cards */}
        {filteredWorkflows.map((workflow) => (
          <Card
            key={workflow.id}
            className={`group cursor-pointer transition-all duration-300 hover:scale-[1.02] hover:shadow-xl overflow-hidden ${
              darkMode 
                ? 'bg-black/30 backdrop-blur-xl border-white/10 hover:border-opacity-40' 
                : 'bg-white border-gray-200 hover:border-gray-300'
            } ${selectedWorkflow?.id === workflow.id ? 'ring-2 ring-offset-2' : ''}`}
            style={selectedWorkflow?.id === workflow.id ? { '--tw-ring-color': workflow.color } as React.CSSProperties : {}}
            onClick={() => setSelectedWorkflow(selectedWorkflow?.id === workflow.id ? null : workflow)}
          >
            {/* Color accent bar */}
            <div className="h-1.5 w-full" style={{ backgroundColor: workflow.color }} />
            
            <CardContent className="p-5">
              {/* Header */}
              <div className="flex items-start gap-3 mb-4">
                <div 
                  className="w-12 h-12 rounded-xl flex items-center justify-center text-xl shrink-0"
                  style={{ backgroundColor: `${workflow.color}20` }}
                >
                  {workflow.icon}
                </div>
                
                <div className="flex-1 min-w-0">
                  <h3 className={`font-semibold text-sm leading-tight mb-1 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                    {workflow.title}
                  </h3>
                  
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge variant="outline" className="text-[10px]" style={{
                      backgroundColor: `${workflow.color}20`,
                      color: workflow.color,
                      borderColor: `${workflow.color}40`
                    }}>
                      {workflow.difficulty}
                    </Badge>
                    
                    <span className={`text-[10px] flex items-center gap-1 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                      <Icons.Clock /> {workflow.estimatedTime}
                    </span>
                    
                    <span className={`text-[10px] flex items-center gap-1 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                      <Icons.Cpu /> {workflow.computeHours} CU
                    </span>
                  </div>
                </div>

                {/* Popularity */}
                <div className="flex items-center gap-1 text-yellow-400 shrink-0">
                  <Icons.Star />
                  <span className="text-xs">{workflow.popularity}%</span>
                </div>
              </div>
              
              {/* Description */}
              <p className={`text-xs leading-relaxed line-clamp-2 mb-4 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                {workflow.description}
              </p>
              
              {/* Tags */}
              <div className="flex flex-wrap gap-1.5 mb-4">
                {workflow.tags.slice(0, 4).map(tag => (
                  <span
                    key={tag}
                    className={`text-[10px] px-2 py-0.5 rounded-full ${
                      darkMode ? 'bg-white/5 text-gray-400' : 'bg-gray-100 text-gray-600'
                    }`}
                  >
                    {tag}
                  </span>
                ))}
                {workflow.tags.length > 4 && (
                  <span className={`text-[10px] px-2 py-0.5 rounded-full ${
                    darkMode ? 'bg-white/5 text-gray-500' : 'bg-gray-100 text-gray-400'
                  }`}>
                    +{workflow.tags.length - 4}
                  </span>
                )}
              </div>
              
              {/* Action Button */}
              <Button
                size="sm"
                variant={runningWorkflow === workflow.id ? "default" : "default"}
                disabled={runningWorkflow !== null && runningWorkflow !== workflow.id}
                onClick={(e) => {
                  e.stopPropagation()
                  runWorkflow(workflow.id)
                }}
                className={`w-full text-xs ${
                  runningWorkflow === workflow.id
                    ? 'animate-pulse bg-gradient-to-r from-violet-500 to-fuchsia-500'
                    : `bg-gradient-to-r opacity-90 hover:opacity-100`
                }`}
                style={!runningWorkflow || runningWorkflow === workflow.id ? { 
                  backgroundImage: `linear-gradient(to right, ${workflow.color}, ${workflow.color}cc)` 
                } : {}}
              >
                {runningWorkflow === workflow.id ? (
                  <span className="flex items-center gap-2">
                    <svg className="animate-spin h-3 w-3" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                    </svg>
                    Running...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <Icons.Play /> Launch Workflow
                  </span>
                )}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* ===== SELECTED WORKFLOW DETAIL ===== */}
      {selectedWorkflow && (
        <Card className={`${darkMode ? 'bg-black/30 backdrop-blur-xl border-white/10' : 'bg-white border-gray-200'}`}>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-4">
                <div 
                  className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl"
                  style={{ backgroundColor: `${selectedWorkflow.color}20` }}
                >
                  {selectedWorkflow.icon}
                </div>
                
                <div>
                  <CardTitle className={`text-xl ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                    {selectedWorkflow.title}
                  </CardTitle>
                  <CardDescription className="mt-1">
                    {selectedWorkflow.description}
                  </CardDescription>
                  
                  <div className="flex items-center gap-3 mt-3">
                    <Badge style={{
                      backgroundColor: `${selectedWorkflow.color}20`,
                      color: selectedWorkflow.color,
                      borderColor: `${selectedWorkflow.color}40`
                    }}>
                      {selectedWorkflow.domain}
                    </Badge>
                    <Badge variant="outline">{selectedWorkflow.difficulty}</Badge>
                    <span className={`text-sm flex items-center gap-1 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                      <Icons.Clock /> {selectedWorkflow.estimatedTime}
                    </span>
                    <span className={`text-sm flex items-center gap-1 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                      <Icons.Cpu /> ~{selectedWorkflow.computeHours} compute hours
                    </span>
                  </div>
                </div>
              </div>
              
              <Button
                variant="ghost"
                onClick={() => setSelectedWorkflow(null)}
                className={darkMode ? 'text-gray-400 hover:text-white' : ''}
              >
                ✕
              </Button>
            </div>
          </CardHeader>
          
          <CardContent className="space-y-6">
            {/* Inputs/Outputs */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className={`p-4 rounded-lg ${darkMode ? 'bg-blue-500/10 border border-blue-500/20' : 'bg-blue-50 border-blue-200'}`}>
                <h4 className={`text-sm font-medium mb-2 flex items-center gap-2 ${darkMode ? 'text-blue-400' : 'text-blue-700'}`}>
                  📥 Inputs Required
                </h4>
                <ul className="space-y-1">
                  {selectedWorkflow.inputs.map((input, i) => (
                    <li key={i} className={`text-xs flex items-center gap-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                      {input}
                    </li>
                  ))}
                </ul>
              </div>
              
              <div className={`p-4 rounded-lg ${darkMode ? 'bg-green-500/10 border border-green-500/20' : 'bg-green-50 border-green-200'}`}>
                <h4 className={`text-sm font-medium mb-2 flex items-center gap-2 ${darkMode ? 'text-green-400' : 'text-green-700'}`}>
                  📤 Outputs Generated
                </h4>
                <ul className="space-y-1">
                  {selectedWorkflow.outputs.map((output, i) => (
                    <li key={i} className={`text-xs flex items-center gap-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                      <span className="w-1.5 h-1.5 rounded-full bg-green-400" />
                      {output}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
            
            <Separator />
            
            {/* Steps Progress */}
            <div>
              <h4 className={`text-sm font-medium mb-4 flex items-center gap-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                ⚙️ Pipeline Steps ({selectedWorkflow.steps.length})
                {runningWorkflow === selectedWorkflow.id && (
                  <Badge variant="outline" className="ml-2 animate-pulse bg-yellow-500/10 text-yellow-400 border-yellow-500/20">
                    Running...
                  </Badge>
                )}
              </h4>
              
              <div className="space-y-3">
                {selectedWorkflow.steps.map((step, i) => {
                  const status = stepStatuses[step.id] || 'pending'
                  
                  return (
                    <div
                      key={step.id}
                      className={`flex items-start gap-4 p-3 rounded-lg transition-all ${
                        darkMode ? 'bg-white/5' : 'bg-gray-50'
                      } ${status === 'completed' ? '' : ''}`}
                    >
                      {/* Step Number & Status */}
                      <div className="shrink-0">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                          status === 'completed' 
                            ? 'bg-green-500 text-white' 
                            : status === 'running'
                              ? 'bg-yellow-500 text-white animate-pulse'
                              : status === 'error'
                                ? 'bg-red-500 text-white'
                                : darkMode ? 'bg-white/10 text-gray-400' : 'bg-gray-200 text-gray-600'
                        }`}>
                          {status === 'completed' ? '✓' : status === 'running' ? '⏳' : status === 'error' ? '!' : i + 1}
                        </div>
                      </div>
                      
                      {/* Step Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h5 className={`text-sm font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                            {step.name}
                          </h5>
                          <Badge variant="outline" className="text-[10px]">
                            {step.tool}
                          </Badge>
                        </div>
                        <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                          {step.description}
                        </p>
                        
                        {/* Progress bar for running step */}
                        {status === 'running' && (
                          <Progress value={Math.random() * 80 + 10} className="mt-2 h-1" />
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
            
            {/* Actions */}
            <Separator />
            
            <div className="flex items-center gap-3">
              <Button
                onClick={() => runWorkflow(selectedWorkflow.id)}
                disabled={runningWorkflow !== null}
                className="bg-gradient-to-r from-cyan-500 to-violet-500"
              >
                {runningWorkflow === selectedWorkflow.id ? (
                  <>
                    <svg className="animate-spin h-4 w-4 mr-2" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                    </svg>
                    Running...
                  </>
                ) : (
                  <>
                    <Icons.Play /> Run Full Pipeline
                  </>
                )}
              </Button>
              
              <Button variant="outline" className={darkMode ? 'border-white/20' : ''}>
                <Icons.Download /> Export as Notebook
              </Button>
              
              <Button variant="outline" className={darkMode ? 'border-white/20' : ''}>
                Customize Steps
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
