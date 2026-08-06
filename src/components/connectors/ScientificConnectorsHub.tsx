'use client'

import { useState, useEffect, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import { Switch } from '@/components/ui/switch'
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
interface ScientificConnectorsHubProps {
  darkMode: boolean
}

interface DataSource {
  id: string
  name: string
  category: string
  description: string
  url: string
  icon: string
  color: string
  dataTypes: string[]
  updateFrequency: string
  isFree: boolean
  apiAvailable: boolean
  status: 'connected' | 'available' | 'configuring' | 'error'
  recordCount?: string
  lastSync?: string
  features: string[]
}

interface QueryResult {
  id: string
  source: string
  title: string
  authors: string
  year: number
  doi?: string
  abstract: string
  type: 'paper' | 'dataset' | 'code' | 'sequence' | 'structure' | 'satellite' | 'climate'
  metrics: { downloads: number; citations: number }
  accessUrl: string
}

// ============ DATA SOURCE DEFINITIONS ============
const scientificDataSources: DataSource[] = [
  // === LITERATURE & PREPRINTS ===
  {
    id: 'arxiv',
    name: 'arXiv',
    category: 'Literature & Preprints',
    description: 'Open-access archive for 2M+ scholarly articles in physics, mathematics, CS, biology, and more.',
    url: 'https://arxiv.org',
    icon: '📄',
    color: '#B31B1B',
    dataTypes: ['PDF', 'TeX', 'XML', 'Metadata'],
    updateFrequency: 'Hourly',
    isFree: true,
    apiAvailable: true,
    status: 'available',
    recordCount: '2.4M+ papers',
    features: ['Full-text search', 'Category browsing', 'RSS feeds', 'API access'],
  },
  {
    id: 'pubmed',
    name: 'PubMed Central',
    category: 'Literature & Preprints',
    description: "World's largest free biomedical literature database with 35M+ citations and 8M+ full-text articles.",
    url: 'https://pubmed.ncbi.nlm.nih.gov',
    icon: '🏥',
    color: '#009999',
    dataTypes: ['XML', 'Full Text', 'Citations', 'MeSH Terms'],
    updateFrequency: 'Daily',
    isFree: true,
    apiAvailable: true,
    status: 'available',
    recordCount: '35M+ citations',
    features: ['MeSH ontology', 'Clinical queries', 'LinkOut to full text', 'E-utilities API'],
  },
  {
    id: 'semantic-scholar',
    name: 'Semantic Scholar',
    category: 'Literature & Preprints',
    description: 'AI-powered research paper database with citation network, TLDR summaries, and 211M+ papers.',
    url: 'https://www.semanticscholar.org',
    icon: '🤖',
    color: '#FF6B35',
    dataTypes: ['JSON', 'Citations', 'TLDRs', 'Knowledge Graph'],
    updateFrequency: 'Daily',
    isFree: true,
    apiAvailable: true,
    status: 'available',
    recordCount: '211M+ papers',
    features: ['AI-generated summaries', 'Citation context', 'Author profiles', 'Research topics'],
  },
  {
    id: 'openalex',
    name: 'OpenAlex',
    category: 'Literature & Preprints',
    description: 'Fully open catalog of the global research system with 250M+ works, institutions, and concepts.',
    url: 'https://openalex.org',
    icon: '🌐',
    color: '#4A90D9',
    dataTypes: ['JSON', 'Works', 'Authors', 'Institutions', 'Concepts'],
    updateFrequency: 'Weekly',
    isFree: true,
    apiAvailable: true,
    status: 'available',
    recordCount: '250M+ works',
    features: ['Open knowledge graph', 'No rate limits', 'Institution analytics', 'Funder tracking'],
  },

  // === RESEARCH DATA REPOSITORIES ===
  {
    id: 'zenodo',
    name: 'Zenodo (CERN)',
    category: 'Research Data',
    description: 'CERN-run open repository for all research outputs with DOI minting and 15M+ datasets.',
    url: 'https://zenodo.org',
    icon: '📦',
    color: '#A3C1DA',
    dataTypes: ['Datasets', 'Software', 'Reports', 'Media'],
    updateFrequency: 'Real-time',
    isFree: true,
    apiAvailable: true,
    status: 'available',
    recordCount: '15M+ records',
    features: ['DOI assignment', 'GitHub integration', 'All file formats', '25GB per upload'],
  },
  {
    id: 'figshare',
    name: 'figshare',
    category: 'Research Data',
    description: 'Institutional research data management platform with 100M+ publicly available research outputs.',
    url: 'https://figshare.com',
    icon: '📊',
    color: '#6B5B95',
    dataTypes: ['Datasets', 'Figures', 'Media', 'Papers'],
    updateFrequency: 'Real-time',
    isFree: true,
    apiAvailable: true,
    status: 'available',
    recordCount: '100M+ outputs',
    features: ['Version control', 'Altmetrics', 'Institutional portals', 'Search by metrics'],
  },
  {
    id: 'dryad',
    name: 'Dryad',
    category: 'Research Data',
    description: 'Curated data repository for life and biomedical sciences with peer-reviewed data packages.',
    url: 'https://datadryad.org',
    icon: '🌳',
    color: '#4CAF50',
    dataTypes: ['Datasets', 'Code', 'Workflows'],
    updateFrequency: 'Daily',
    isFree: true,
    apiAvailable: true,
    status: 'available',
    recordCount: '50K+ datasets',
    features: ['Curation service', 'Integration with journals', 'DOI minting', 'CC0 licensing'],
  },

  // === GENOMICS & BIOINFORMATICS ===
  {
    id: 'genbank',
    name: 'GenBank (NCBI)',
    category: 'Genomics & Bioinformatics',
    description: 'NIH genetic sequence database with 250B+ base pairs from 300M+ sequences across all organisms.',
    url: 'https://www.ncbi.nlm.nih.gov/genbank',
    icon: '🧬',
    color: '#2E8B57',
    dataTypes: ['FASTA', 'GBFF', 'Annotations', 'Structures'],
    updateFrequency: 'Daily',
    isFree: true,
    apiAvailable: true,
    status: 'available',
    recordCount: '250B+ bp',
    features: ['BLAST search', 'Sequence retrieval', 'Taxonomy browser', 'Entrez APIs'],
  },
  {
    id: 'sra',
    name: 'Sequence Read Archive',
    category: 'Genomics & Bioinformatics',
    description: "World's largest public repository of high-throughput sequencing data with 100PB+ of raw data.",
    url: 'https://www.ncbi.nlm.nih.gov/sra',
    icon: '🔬',
    color: '#8B4513',
    dataTypes: ['FASTQ', 'SRA', 'Metadata', 'Run Info'],
    updateFrequency: 'Continuous',
    isFree: true,
    apiAvailable: true,
    status: 'available',
    recordCount: '100PB+ data',
    features: ['SRA Toolkit', 'Cloud bucket access', 'Run selector', 'Metadata search'],
  },
  {
    id: 'pdb',
    name: 'Protein Data Bank',
    category: 'Genomics & Bioinformatics',
    description: 'Archive of 200K+ experimentally-determined 3D structures of proteins, nucleic acids, and complexes.',
    url: 'https://www.rcsb.org',
    icon: '🎯',
    color: '#1E90FF',
    dataTypes: ['PDB', 'mmCIF', 'EMDB', 'Structure Factors'],
    updateFrequency: 'Weekly',
    isFree: true,
    apiAvailable: true,
    status: 'available',
    recordCount: '200K+ structures',
    features: ['3D viewer', 'Ligand search', 'Validation reports', 'API access'],
  },
  {
    id: 'uniprot',
    name: 'UniProt',
    category: 'Genomics & Bioinformatics',
    description: 'Comprehensive protein sequence database with 230M+ entries covering function, structure, and taxonomy.',
    url: 'https://www.uniprot.org',
    icon: '⚪',
    color: '#9370DB',
    dataTypes: ['FASTA', 'XML', 'Annotations', 'Pathways'],
    updateFrequency: 'Monthly',
    isFree: true,
    apiAvailable: true,
    status: 'available',
    recordCount: '230M+ proteins',
    features: ['ID mapping', 'BLAST', 'Proteome sets', 'Cross-references'],
  },
  {
    id: 'ensembl',
    name: 'Ensembl Genome Browser',
    category: 'Genomics & Bioinformatics',
    description: 'Genome annotation resource with 50K+ reference genomes across vertebrates and other species.',
    url: 'https://ensembl.org',
    icon: '🧬',
    color: '#E74C3C',
    dataTypes: ['GTF/GFF', 'VCF', 'FASTA', 'Annotation'],
    updateFrequency: 'Quarterly',
    isFree: true,
    apiAvailable: true,
    status: 'available',
    recordCount: '50K+ genomes',
    features: ['Genome browser', 'REST API', 'BioMart', 'Variant effect predictor'],
  },
  {
    id: 'geo',
    name: 'GEO (NCBI)',
    category: 'Genomics & Bioinformatics',
    description: 'Gene Expression Omnibus with 5M+ samples from functional genomics experiments worldwide.',
    url: 'https://www.ncbi.nlm.nih.gov/geo',
    icon: '📈',
    color: '#F39C12',
    dataTypes: ['SOFT', 'MINiML', 'Processed', 'Raw'],
    updateFrequency: 'Daily',
    isFree: true,
    apiAvailable: true,
    status: 'available',
    recordCount: '5M+ samples',
    features: ['GEO2R analysis', 'Dataset browser', 'Profile graphs', 'Series clustering'],
  },

  // === PHYSICS & ASTRONOMY ===
  {
    id: 'cern-opendata',
    name: 'CERN Open Data Portal',
    category: 'Physics & Astronomy',
    description: 'LHC collision data, Higgs discovery datasets, and particle physics software tools from CERN.',
    url: 'https://opendata.cern.ch',
    icon: '⚛️',
    color: '#0053A1',
    dataTypes: ['ROOT', 'HEPDATA', 'DAQ', 'Simulated'],
    updateFrequency: 'Quarterly',
    isFree: true,
    apiAvailable: true,
    status: 'available',
    recordCount: '3PB+ data',
    features: ['CMS/ATLAS data', 'Analysis notebooks', 'VM images', 'Educational resources'],
  },
  {
    id: 'nasa-pds',
    name: 'NASA PDS',
    category: 'Physics & Astronomy',
    description: 'Planetary Data System archive with 100TB+ of space mission data from all NASA planetary missions.',
    url: 'https://pds.nasa.gov',
    icon: '🚀',
    color: '#013D7A',
    dataTypes: ['Imagery', 'Spectra', 'Telemetry', 'Maps'],
    updateFrequency: 'Mission-based',
    isFree: true,
    apiAvailable: true,
    status: 'available',
    recordCount: '100TB+ data',
    features: ['Mission archives', 'PDS4 standards', 'GIS integration', 'Search by target'],
  },
  {
    id: 'esa-earth',
    name: 'ESA Earth Observation',
    category: 'Physics & Astronomy',
    description: 'Copernicus Sentinel satellite data providing free Earth observation imagery globally.',
    url: 'https://www.esa.int/Earth_Observation',
    icon: '🛰️',
    color: '#003E7E',
    dataTypes: ['Sentinel-1/2/3/5P', 'Envisat', 'SMOS', 'CryoSat'],
    updateFrequency: 'Hourly-Daily',
    isFree: true,
    apiAvailable: true,
    status: 'available',
    recordCount: '40PB+ imagery',
    features: ['Sentinel Hub', 'CREODIAS cloud', 'SNAP toolbox', 'API access'],
  },
  {
    id: 'sdss',
    name: 'SDSS SkyServer',
    category: 'Physics & Astronomy',
    description: 'Sloan Digital Sky Survey with 500M+ celestial objects, spectra, and imaging data.',
    url: 'https://skyserver.sdss.org',
    icon: '⭐',
    color: '#8B0000',
    dataTypes: ['Images', 'Spectra', 'Photometry', 'Catalogs'],
    updateFrequency: 'Static + DR updates',
    isFree: true,
    apiAvailable: true,
    status: 'available',
    recordCount: '500M+ objects',
    features: ['SQL query interface', 'Image cutouts', 'Navigation tool', 'Teaching projects'],
  },

  // === CLIMATE & ENVIRONMENTAL ===
  {
    id: 'noaa-ncei',
    name: 'NOAA NCEI',
    category: 'Climate & Environmental',
    description: "World's largest archive of climate, oceanic, geophysical, and atmospheric data spanning centuries.",
    url: 'https://www.ncei.noaa.gov',
    icon: '🌍',
    color: '#0077BE',
    dataTypes: ['NetCDF', 'GeoTIFF', 'GRIB2', 'CSV'],
    updateFrequency: 'Hourly',
    isFree: true,
    apiAvailable: true,
    status: 'available',
    recordCount: '37PB+ data',
    features: ['Climate at a Glance', 'API access', 'Bathymetry data', 'Weather events'],
  },
  {
    id: 'copernicus-cds',
    name: 'Copernicus CDS',
    category: 'Climate & Environmental',
    description: 'Climate Data Store with ERA5 reanalysis, climate projections, and sector-specific datasets.',
    url: 'https://cds.climate.copernicus.eu',
    icon: '🌦️',
    color: '#3498DB',
    dataTypes: ['GRIB', 'NetCDF', 'ASCII', 'Maps'],
    updateFrequency: 'Daily-Monthly',
    isFree: true,
    apiAvailable: true,
    status: 'available',
    recordCount: '10PB+ data',
    features: ['CDSToolbox', 'Python API', 'ERA5 reanalysis', 'Climate projections'],
  },
  {
    id: 'worldclim',
    name: 'WorldClim',
    category: 'Climate & Environmental',
    description: 'Global climate layers for ecological modeling with current and future climate scenarios.',
    url: 'https://worldclim.org',
    icon: '🌡️',
    color: '#27AE60',
    dataTypes: ['GeoTIFF', 'GRID', 'CSV'],
    updateFrequency: 'Annual updates',
    isFree: true,
    apiAvailable: false,
    status: 'available',
    recordCount: '19 bioclim variables',
    features: ['High resolution (30s)', 'Future scenarios', 'Downscaling ready', 'Direct download'],
  },

  // === MATERIALS SCIENCE ===
  {
    id: 'materials-project',
    name: 'Materials Project',
    category: 'Materials Science',
    description: 'Open database of 150K+ inorganic compounds with computed properties using DFT methods.',
    url: 'https://materialsproject.org',
    icon: '⚗️',
    color: '#16A085',
    dataTypes: ['CIF', 'Structure', 'Properties', 'Phase Diagrams'],
    updateFrequency: 'Weekly',
    isFree: true,
    apiAvailable: true,
    status: 'available',
    recordCount: '150K+ materials',
    features: ['Materials API', 'Phase diagrams', 'Band structures', 'Pourbaix diagrams'],
  },
  {
    id: 'crystallography-open',
    name: 'Crystallography Open Database',
    category: 'Materials Science',
    description: 'Open crystallographic database with 500K+ crystal structures from experimental publications.',
    url: 'https://www.crystallography.net/cod',
    icon: '💎',
    color: '#9B59B6',
    dataTypes: ['CIF', 'Structure Factors', 'Powder Patterns'],
    updateFrequency: 'Weekly',
    isFree: true,
    apiAvailable: true,
    status: 'available',
    recordCount: '500K+ crystals',
    features: ['Predicted patterns', 'Geometry calculations', 'REST API', 'Batch download'],
  },
  {
    id: 'nomad',
    name: 'NOMAD Laboratory',
    category: 'Materials Science',
    description: 'FAIR materials science database with 100M+ computational workflows and 50M+ atomistic calculations.',
    url: 'https://nomad-lab.eu',
    icon: '🔬',
    color: '#E67E22',
    dataTypes: ['Archives', 'Workflows', 'Structures', 'Properties'],
    updateFrequency: 'Continuous',
    isFree: true,
    apiAvailable: true,
    status: 'available',
    recordCount: '100M+ calculations',
    features: ['AI/ML toolkit', 'Encyclopedia viewer', ' Oasis API', 'Reproducible runs'],
  },

  // === CODE & SOFTWARE ===
  {
    id: 'github-research',
    name: 'GitHub (Research)',
    category: 'Code & Software',
    description: 'Millions of open-source research repositories including Jupyter notebooks, pipelines, and tools.',
    url: 'https://github.com',
    icon: '🐙',
    color: '#181717',
    dataTypes: ['Code', 'Notebooks', 'Datasets', 'CI/CD'],
    updateFrequency: 'Real-time',
    isFree: true,
    apiAvailable: true,
    status: 'available',
    recordCount: '100M+ repos',
    features: ['Jupyter rendering', 'Actions CI', 'Codespaces', 'API v4'],
  },
  {
    id: 'pypi-science',
    name: 'PyPI Scientific Packages',
    category: 'Code & Software',
    description: '400K+ Python packages specifically for scientific computing, ML, bioinfo, cheminfo, and physics.',
    url: 'https://pypi.org',
    icon: '🐍',
    color: '#3776AB',
    dataTypes: ['Wheels', 'Source', 'Metadata', 'Dependencies'],
    updateFrequency: 'Real-time',
    isFree: true,
    apiAvailable: true,
    status: 'available',
    recordCount: '400K+ packages',
    features: ['pip install', 'Dependency resolution', 'Security scanning', 'API access'],
  },
  {
    id: 'conda-forge',
    name: 'Conda-forge',
    category: 'Code & Software',
    description: 'Community-led distribution of 15K+ scientific software packages across all platforms.',
    url: 'https://conda-forge.org',
    icon: '📦',
    color: '#44A833',
    dataTypes: ['Binaries', 'Environments', 'Recipes'],
    updateFrequency: 'Daily',
    isFree: true,
    apiAvailable: true,
    status: 'available',
    recordCount: '15K+ packages',
    features: ['Multi-platform', 'Environment files', 'CI bot', 'Feedstock recipes'],
  },

  // === CHEMINFORMATICS ===
  {
    id: 'pubchem',
    name: 'PubChem (NCBI)',
    category: 'Cheminformatics',
    description: "World's largest collection of freely accessible chemical information with 111M+ compounds.",
    url: 'https://pubchem.ncbi.nlm.nih.gov',
    icon: '⚗️',
    color: '#3282B8',
    dataTypes: ['SDF', 'SMILES', 'InChI', 'Properties', 'Bioassays'],
    updateFrequency: 'Daily',
    isFree: true,
    apiAvailable: true,
    status: 'available',
    recordCount: '111M+ compounds',
    features: ['PUG REST API', 'Power User Gateway', '3D conformers', 'Biological testing'],
  },
  {
    id: 'chembl',
    name: 'ChEMBL',
    category: 'Cheminformatics',
    description: 'Open bioactivity database with 20M+ compound bioactivities from drug discovery literature.',
    url: 'https://www.ebi.ac.uk/chembl',
    icon: '💊',
    color: '#0066CC',
    dataTypes: ['Activities', 'Targets', 'Assays', 'Binding Data'],
    updateFrequency: 'Quarterly',
    isFree: true,
    apiAvailable: true,
    status: 'available',
    recordCount: '20M+ activities',
    features: ['Target lookup', 'Similarity search', 'Web services', 'Download dumps'],
  },
  {
    id: 'zinc',
    name: 'ZINC20',
    category: 'Cheminformatics',
    description: 'Virtual screening library with 750M+ purchasable compounds in 3D-ready formats.',
    url: 'https://zinc.docking.org',
    icon: '🔶',
    color: '#FF6600',
    dataTypes: ['SDF', '3D Molecules', 'Subsets', 'Properties'],
    updateFrequency: 'Quarterly',
    isFree: true,
    apiAvailable: true,
    status: 'available',
    recordCount: '750M+ molecules',
    features: ['Subsets by property', 'Docking-ready', 'Tranche browser', 'API access'],
  },
]

// ============ MOCK QUERY RESULTS ============
const mockQueryResults: QueryResult[] = [
  {
    id: '1',
    source: 'arXiv',
    title: 'Attention Is All You Need: Transformer Architecture for Sequence Modeling',
    authors: 'Vaswani A, Shazeer N, Parmar N, et al.',
    year: 2017,
    doi: '10.48550/arXiv.1706.03762',
    abstract: 'The dominant sequence transduction models are based on complex recurrent or convolutional neural networks that include an encoder and a decoder. The best performing models also connect the encoder and decoder through an attention mechanism. We propose a new simple network architecture, the Transformer, based solely on attention mechanisms, dispensing with recurrence and convolutions entirely.',
    type: 'paper',
    metrics: { downloads: 450000, citations: 95000 },
    accessUrl: 'https://arxiv.org/abs/1706.03762',
  },
  {
    id: '2',
    source: 'PubChem',
    title: 'Aspirin (Acetylsalicylic Acid) - Compound Summary',
    authors: 'NCBI PubChem Team',
    year: 2024,
    doi: 'CID:2244',
    abstract: 'Aspirin is a nonsteroidal anti-inflammatory drug (NSAID) used to reduce pain, fever, or inflammation. It is a salicylate drug, often used as an analgesic against minor aches and pains, antipyretic, and anti-inflammatory agent. Molecular Formula: C9H8O4, Molecular Weight: 180.16 g/mol.',
    type: 'structure',
    metrics: { downloads: 125000, citations: 8500 },
    accessUrl: 'https://pubchem.ncbi.nlm.nih.gov/compound/2244',
  },
  {
    id: '3',
    source: 'GenBank',
    title: 'Homo sapiens BRCA1 DNA repair associated gene, complete coding sequence',
    authors: 'NCBI GenBank',
    year: 2024,
    doi: 'NG_005905.2',
    abstract: 'BRCA1 (BRCA1 DNA repair associated) is a human gene that produces tumor suppressor protein. Mutations in this gene are implicated in predisposition to breast and ovarian cancer. The encoded protein combines with other tumor suppressors, DNA damage sensors, and signal transducers to form a large multi-subunit protein complex known as the BRCA1-associated genome surveillance complex (BASC).',
    type: 'sequence',
    metrics: { downloads: 89000, citations: 12000 },
    accessUrl: 'https://www.ncbi.nlm.nih.gov/nuccore/NG_005905.2',
  },
  {
    id: '4',
    source: 'NASA PDS',
    title: 'Mars Perseverance Rover - Jezero Crater Multispectral Imagery Collection',
    authors: 'NASA/JPL-Caltech',
    year: 2024,
    abstract: 'Complete collection of Mastcam-Z, SuperCAM, and PIXL instrument data from Sol 1-1000 of the Mars 2020 mission. Includes multispectral visible-NIR imagery, LIBS elemental composition maps, and X-ray fluorescence scans of Jezero crater delta deposits.',
    type: 'satellite',
    metrics: { downloads: 34000, citations: 2100 },
    accessUrl: 'https://pds.nasa.gov/',
  },
  {
    id: '5',
    source: 'PDB',
    title: 'CRISPR-Cas9 Endonuclease Complexed with Guide RNA and Target DNA',
    authors: 'Anders C, Niewoehner O, Duerst A, Jinek M.',
    year: 2014,
    doi: '10.2210/pdb4OO8/pdb',
    abstract: 'Crystal structure of Streptococcus pyogenes Cas9 in complex with sgRNA and its target DNA at 2.5 Å resolution. This structure reveals the conformational changes upon DNA binding and provides insights into the mechanism of RNA-guided DNA targeting by CRISPR-Cas systems.',
    type: 'structure',
    metrics: { downloads: 67000, citations: 15000 },
    accessUrl: 'https://www.rcsb.org/structure/4OO8',
  },
  {
    id: '6',
    source: 'Materials Project',
    title: 'Perovskite Solar Cell Material: MAPbI3 Crystal Structure and Properties',
    authors: 'Materials Project Team',
    year: 2024,
    doi: 'mp-1008698',
    abstract: 'Methylammonium lead triiodide (MAPbI3) is a hybrid organic-inorganic perovskite with exceptional photovoltaic properties. Band gap: 1.55 eV, Formation energy: -0.25 eV/atom, Density: 4.12 g/cm³. This entry includes optimized structure, electronic band structure, density of states, and optical absorption spectrum.',
    type: 'dataset',
    metrics: { downloads: 23000, citations: 3400 },
    accessUrl: 'https://materialsproject.org/materials/mp-1008698',
  },
  {
    id: '7',
    source: 'NOAA NCEI',
    title: 'Global Sea Surface Temperature Anomaly Dataset (1981-Present)',
    authors: 'NOAA National Centers for Environmental Information',
    year: 2024,
    abstract: 'Daily global sea surface temperature anomaly data derived from AVHRR satellite observations and in situ measurements. Resolution: 0.25° grid. Includes ENSO indices, marine heatwave detection, and long-term trend analysis. Updated daily with quality-controlled processing pipeline.',
    type: 'climate',
    metrics: { downloads: 156000, citations: 8900 },
    accessUrl: 'https://www.ncei.noaa.gov/access/metadata/ldg/v4.0.1/ncei-1234',
  },
  {
    id: '8',
    source: 'Zenodo',
    title: 'Large Language Models for Scientific Discovery: A Comprehensive Benchmark Suite',
    authors: 'Taylor R, Chen L, Martinez S, et al.',
    year: 2024,
    doi: '10.5281/zenodo.10452341',
    abstract: 'We present SciLLM-Bench, a comprehensive benchmark suite evaluating large language models on scientific reasoning tasks across 12 domains including molecular property prediction, theorem proving, code generation for simulation, hypothesis generation, and literature synthesis. Includes 50K test cases with ground truth annotations.',
    type: 'dataset',
    metrics: { downloads: 12000, citations: 450 },
    accessUrl: 'https://zenodo.org/record/10452341',
  },
  {
    id: '9',
    source: 'CERN Open Data',
    title: 'ATLAS Higgs Boson Discovery Dataset - Two-Photon Decay Channel',
    authors: 'ATLAS Collaboration',
    year: 2023,
    abstract: 'Primary dataset used in the discovery of the Higgs boson decaying to two photons. Contains reconstructed diphoton invariant mass distributions, event selection criteria, background estimation templates, and statistical analysis framework. Includes both 7 TeV and 8 TeV collision data from Run 1.',
    type: 'dataset',
    metrics: { downloads: 89000, citations: 12000 },
    accessUrl: 'https://opendata.cern.ch/record/5000',
  },
  {
    id: '10',
    source: 'GitHub',
    title: 'scikit-bio: Open-source Bioinformatics Library for Python',
    authors: 'scikit-bio Development Team',
    year: 2024,
    abstract: 'scikit-bio provides functionality for biological sequence analysis, microbiome analysis, and phylogenetics. Supports FASTA/Q parsing, multiple sequence alignment, distance matrix computation, diversity metrics, and ordination methods. Integrates with NumPy, pandas, and matplotlib ecosystems.',
    type: 'code',
    metrics: { downloads: 280000, citations: 1100 },
    accessUrl: 'https://github.com/biocore/scikit-bio',
  },
]

// ============ ICON COMPONENTS ============
const Icons = {
  Search: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>
    </svg>
  ),
  ExternalLink: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" x2="21" y1="14" y2="3"/>
    </svg>
  ),
  CheckCircle: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>
    </svg>
  ),
  Globe: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/><line x1="2" x2="22" y1="12" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
    </svg>
  ),
  Filter: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/>
    </svg>
  ),
  Download: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/>
    </svg>
  ),
  Zap: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
    </svg>
  ),
  Database: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M3 5V19A9 3 0 0 0 21 19V5"/><path d="M3 12A9 3 0 0 0 21 12"/>
    </svg>
  ),
  RefreshCw: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/><path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/><path d="M8 16H3v5"/>
    </svg>
  ),
  Star: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
    </svg>
  ),
  Users: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
    </svg>
  ),
  Clock: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
    </svg>
  ),
  ChevronRight: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m9 18 6-6-6-6"/>
    </svg>
  ),
  Grid: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>
    </svg>
  ),
  List: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="8" x2="21" y1="6" y2="6"/><line x1="8" x2="21" y1="12" y2="12"/><line x1="8" x2="21" y1="18" y2="18"/><line x1="3" x2="3.01" y1="6" y2="6"/><line x1="3" x2="3.01" y1="12" y2="12"/><line x1="3" x2="3.01" y1="18" y2="18"/>
    </svg>
  ),
}

// ============ CATEGORY COLORS ============
const categoryColors: Record<string, string> = {
  'Literature & Preprints': 'from-red-500/20 to-orange-500/20 text-red-400 border-red-500/20',
  'Research Data': 'from-purple-500/20 to-violet-500/20 text-purple-400 border-purple-500/20',
  'Genomics & Bioinformatics': 'from-green-500/20 to-emerald-500/20 text-green-400 border-green-500/20',
  'Physics & Astronomy': 'from-blue-500/20 to-indigo-500/20 text-blue-400 border-blue-500/20',
  'Climate & Environmental': 'from-cyan-500/20 to-teal-500/20 text-cyan-400 border-cyan-500/20',
  'Materials Science': 'from-emerald-500/20 to-green-500/20 text-emerald-400 border-emerald-500/20',
  'Code & Software': 'from-gray-500/20 to-slate-500/20 text-gray-400 border-gray-500/20',
  'Cheminformatics': 'from-amber-500/20 to-yellow-500/20 text-amber-400 border-amber-500/20',
}

// ============ MAIN COMPONENT ============
export default function ScientificConnectorsHub({ darkMode }: ScientificConnectorsHubProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [selectedSource, setSelectedSource] = useState<DataSource | null>(null)
  const [queryResults, setQueryResults] = useState<QueryResult[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [showOnlyConnected, setShowOnlyConnected] = useState(false)
  const [globalSearchInput, setGlobalSearchInput] = useState('')
  const [activeTab, setActiveTab] = useState<'sources' | 'search' | 'results'>('sources')

  // Get unique categories
  const categories = useMemo(() => {
    const cats = [...new Set(scientificDataSources.map(s => s.category))]
    return ['all', ...cats]
  }, [])

  // Filter sources
  const filteredSources = useMemo(() => {
    return scientificDataSources.filter(source => {
      const matchesSearch = source.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        source.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        source.dataTypes.some(t => t.toLowerCase().includes(searchQuery.toLowerCase()))
      
      const matchesCategory = selectedCategory === 'all' || source.category === selectedCategory
      
      return matchesSearch && matchesCategory
    })
  }, [searchQuery, selectedCategory])

  // Global search handler
  const handleGlobalSearch = async () => {
    if (!globalSearchInput.trim()) return
    
    setIsSearching(true)
    setActiveTab('results')
    
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 800))
    
    // Filter mock results based on query
    const filtered = mockQueryResults.filter(r =>
      r.title.toLowerCase().includes(globalSearchInput.toLowerCase()) ||
      r.abstract.toLowerCase().includes(globalSearchInput.toLowerCase()) ||
      r.source.toLowerCase().includes(globalSearchInput.toLowerCase())
    )
    
    setQueryResults(filtered.length > 0 ? filtered : mockQueryResults.slice(0, 5))
    setIsSearching(false)
  }

  // Stats
  const stats = {
    totalSources: scientificDataSources.length,
    totalRecords: scientificDataSources.reduce((acc, s) => acc + parseInt(s.recordCount?.replace(/[^0-9]/g, '') || '0'), 0),
    freeSources: scientificDataSources.filter(s => s.isFree).length,
    apiEnabled: scientificDataSources.filter(s => s.apiAvailable).length,
  }

  return (
    <TooltipProvider>
      <div className="space-y-6">
        
        {/* ===== HEADER ===== */}
        <Card className={`relative overflow-hidden ${
          darkMode ? 'bg-gradient-to-br from-cyan-900/30 via-violet-900/30 to-fuchsia-900/30 border-violet-500/20' : 'bg-gradient-to-br from-cyan-50 via-violet-50 to-fuchsia-50 border-violet-200'
        }`}>
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxwYXRoIGQ9Ik0zNiAxOGMtOS45NDEgMC0xOCA4LjA1OS0xOCAyczguMDU5LTE4IDE4LTE4IDE4IDguMDU5IDE4IDE4YzAgOS45NDEtOC4wNTkgMTgtMTggOHptMCAzMmMtNy43MzIgMC0xNC02LjI2OC0xNC0xNHM2LjI2OC0xNCAxNC0xNCAxNCA2LjI2OCAxNCAxNC02LjI2OCAxNC0xNHoiIGZpbGw9InJnYmEoMTM5LDkyLDI0NiwwLjA1KSIvPjwvZz48L3N2Zz4=')] opacity-30" />
          
          <CardHeader className="relative">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-cyan-400 via-violet-500 to-fuchsia-500 flex items-center justify-center shadow-xl shadow-violet-500/30">
                  <Icons.Globe />
                </div>
                
                <div>
                  <CardTitle className={`text-2xl font-bold flex items-center gap-3 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                    Scientific Data Universe
                    <Badge className="bg-gradient-to-r from-green-500 to-emerald-500 text-white border-0">
                      {stats.freeSources} Free Sources
                    </Badge>
                  </CardTitle>
                  <CardDescription className="mt-2 text-base max-w-2xl">
                    Unified gateway to {stats.totalSources.toLocaleString()} major scientific databases, repositories, and platforms.
                    Access {Math.round(stats.totalRecords / 1e9)}B+ records across all domains — completely free.
                  </CardDescription>
                  
                  {/* Quick Stats */}
                  <div className="flex flex-wrap gap-4 mt-4">
                    <div className="flex items-center gap-2 text-sm">
                      <Icons.Database />
                      <span className={darkMode ? 'text-gray-300' : 'text-gray-700'}>
                        {(stats.totalRecords / 1e9).toFixed(0)}B+ Records
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Icons.Zap />
                      <span className={darkMode ? 'text-gray-300' : 'text-gray-700'}>
                        {stats.apiEnabled} with API Access
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Icons.Star />
                      <span className={darkMode ? 'text-gray-300' : 'text-gray-700'}>
                        All Free Forever
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* View Toggle */}
              <div className={`flex items-center gap-2 p-1 rounded-lg ${darkMode ? 'bg-white/10' : 'bg-gray-100'}`}>
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 rounded-md transition-colors ${viewMode === 'grid' ? (darkMode ? 'bg-white/20 text-white' : 'bg-white text-gray-900 shadow') : (darkMode ? 'text-gray-400' : 'text-gray-500')}`}
                >
                  <Icons.Grid />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 rounded-md transition-colors ${viewMode === 'list' ? (darkMode ? 'bg-white/20 text-white' : 'bg-white text-gray-900 shadow') : (darkMode ? 'text-gray-400' : 'text-gray-500')}`}
                >
                  <Icons.List />
                </button>
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* ===== GLOBAL SEARCH BAR ===== */}
        <Card className={`${darkMode ? 'bg-black/30 backdrop-blur-xl border-white/10' : 'bg-white border-gray-200'}`}>
          <CardContent className="p-4">
            <div className="flex gap-3">
              <div className="relative flex-1">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                  <Icons.Search />
                </div>
                <input
                  type="text"
                  placeholder="Search ALL scientific databases simultaneously... (try: CRISPR, climate change, quantum, aspirin)"
                  value={globalSearchInput}
                  onChange={(e) => setGlobalSearchInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleGlobalSearch()}
                  className={`w-full pl-12 pr-4 py-3.5 rounded-xl text-sm border transition-all ${
                    darkMode 
                      ? 'bg-white/5 border-white/10 text-white placeholder:text-gray-600 focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/25' 
                      : 'bg-gray-50 border-gray-200 text-gray-900 placeholder:text-gray-400 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/25'
                  }`}
                />
              </div>
              
              <Button
                onClick={handleGlobalSearch}
                disabled={isSearching || !globalSearchInput.trim()}
                className="bg-gradient-to-r from-cyan-500 to-violet-500 hover:from-cyan-600 hover:to-violet-600 px-8"
              >
                {isSearching ? (
                  <span className="flex items-center gap-2">
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                    </svg>
                    Searching...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <Icons.Search /> Search All Sources
                  </span>
                )}
              </Button>
            </div>
            
            {/* Quick Search Suggestions */}
            {!globalSearchInput && (
              <div className="flex flex-wrap gap-2 mt-3">
                <span className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>Try:</span>
                {['CRISPR gene editing', 'climate change trends', 'quantum computing', 'protein folding', 'molecular dynamics', 'Higgs boson'].map((term) => (
                  <button
                    key={term}
                    onClick={() => {
                      setGlobalSearchInput(term)
                      setTimeout(() => handleGlobalSearch(), 100)
                    }}
                    className={`text-xs px-2.5 py-1 rounded-full transition-colors cursor-pointer ${
                      darkMode 
                        ? 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white' 
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200 hover:text-gray-900'
                    }`}
                  >
                    {term}
                  </button>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* ===== MAIN CONTENT AREA ===== */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          
          {/* LEFT: SOURCES LIST */}
          <div className="lg:col-span-3 space-y-4">
            
            {/* Filters */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs ${darkMode ? 'bg-white/5 text-gray-300' : 'bg-gray-100 text-gray-700'}`}>
                  <Icons.Filter />
                  <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                    <SelectTrigger className="w-auto h-7 text-xs border-0 bg-transparent p-0 shadow-none focus:ring-0">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map(cat => (
                        <SelectItem key={cat} value={cat} className="text-xs">
                          {cat === 'all' ? 'All Categories' : cat}
                          {cat !== 'all' && ` (${scientificDataSources.filter(s => s.category === cat).length})`}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <label className="flex items-center gap-2 cursor-pointer">
                  <Switch 
                    checked={showOnlyConnected} 
                    onCheckedChange={setShowOnlyConnected}
                  />
                  <span className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Connected Only</span>
                </label>
              </div>
              
              <span className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                Showing {filteredSources.length} of {stats.totalSources} sources
              </span>
            </div>

            {/* Sources Grid/List */}
            {viewMode === 'grid' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {filteredSources.map((source) => (
                  <Card
                    key={source.id}
                    className={`group cursor-pointer transition-all duration-300 hover:scale-[1.02] hover:shadow-xl overflow-hidden ${
                      darkMode 
                        ? 'bg-black/30 backdrop-blur-xl border-white/10 hover:border-cyan-500/30' 
                        : 'bg-white border-gray-200 hover:border-cyan-300 hover:shadow-cyan-500/10'
                    } ${selectedSource?.id === source.id ? 'ring-2 ring-cyan-500' : ''}`}
                    onClick={() => setSelectedSource(source)}
                  >
                    {/* Color accent bar */}
                    <div className="h-1 w-full" style={{ backgroundColor: source.color }} />
                    
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3 mb-3">
                        <div 
                          className="w-11 h-11 rounded-xl flex items-center justify-center text-xl shrink-0"
                          style={{ backgroundColor: `${source.color}20` }}
                        >
                          {source.icon}
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className={`font-semibold text-sm truncate ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                              {source.name}
                            </h4>
                            {source.isFree && (
                              <Badge variant="outline" className="text-[10px] px-1.5 py-0 bg-green-500/10 text-green-400 border-green-500/20">
                                FREE
                              </Badge>
                            )}
                          </div>
                          
                          <Badge 
                            variant="outline" 
                            className={`text-[10px] truncate max-w-full ${categoryColors[source.category]?.split(' ')[2] || ''}`}
                          >
                            {source.category}
                          </Badge>
                        </div>
                      </div>
                      
                      <p className={`text-xs leading-relaxed line-clamp-2 mb-3 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                        {source.description}
                      </p>
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className={`text-xs font-medium ${darkMode ? 'text-cyan-400' : 'text-cyan-600'}`}>
                            {source.recordCount}
                          </span>
                          {source.apiAvailable && (
                            <Badge variant="outline" className="text-[9px] px-1 py-0 bg-blue-500/10 text-blue-400 border-blue-500/20">
                              API
                            </Badge>
                          )}
                        </div>
                        
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            window.open(source.url, '_blank')
                          }}
                          className={`p-1.5 rounded-md transition-colors ${
                            darkMode ? 'hover:bg-white/10 text-gray-400 hover:text-white' : 'hover:bg-gray-100 text-gray-500 hover:text-gray-700'
                          }`}
                        >
                          <Icons.ExternalLink />
                        </button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              /* List View */
              <div className="space-y-2">
                {filteredSources.map((source) => (
                  <Card
                    key={source.id}
                    className={`group cursor-pointer transition-all duration-200 hover:shadow-lg overflow-hidden ${
                      darkMode 
                        ? 'bg-black/30 backdrop-blur-xl border-white/10 hover:border-cyan-500/30' 
                        : 'bg-white border-gray-200 hover:border-cyan-300'
                    } ${selectedSource?.id === source.id ? 'ring-2 ring-cyan-500' : ''}`}
                    onClick={() => setSelectedSource(source)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center gap-4">
                        <div 
                          className="w-12 h-12 rounded-xl flex items-center justify-center text-xl shrink-0"
                          style={{ backgroundColor: `${source.color}20` }}
                        >
                          {source.icon}
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className={`font-semibold text-sm ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                              {source.name}
                            </h4>
                            {source.isFree && (
                              <Badge variant="outline" className="text-[10px] px-1.5 py-0 bg-green-500/10 text-green-400 border-green-500/20">
                                FREE
                              </Badge>
                            )}
                            {source.apiAvailable && (
                              <Badge variant="outline" className="text-[10px] px-1.5 py-0 bg-blue-500/10 text-blue-400 border-blue-500/20">
                                API
                              </Badge>
                            )}
                          </div>
                          <p className={`text-xs line-clamp-1 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                            {source.description}
                          </p>
                        </div>
                        
                        <div className="text-right shrink-0 hidden sm:block">
                          <p className={`text-sm font-medium ${darkMode ? 'text-cyan-400' : 'text-cyan-600'}`}>
                            {source.recordCount}
                          </p>
                          <p className={`text-[10px] ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                            {source.updateFrequency}
                          </p>
                        </div>
                        
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            window.open(source.url, '_blank')
                          }}
                          className={`p-2 rounded-lg shrink-0 transition-colors ${
                            darkMode ? 'hover:bg-white/10 text-gray-400 hover:text-white' : 'hover:bg-gray-100 text-gray-500 hover:text-gray-700'
                          }`}
                        >
                          <Icons.ExternalLink />
                        </button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>

          {/* RIGHT: SELECTED SOURCE DETAIL */}
          <div className="space-y-4">
            {selectedSource ? (
              <>
                {/* Source Detail Card */}
                <Card className={`${darkMode ? 'bg-black/30 backdrop-blur-xl border-white/10' : 'bg-white border-gray-200'}`}>
                  <CardHeader className="pb-3">
                    <div className="flex items-center gap-3 mb-2">
                      <div 
                        className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl"
                        style={{ backgroundColor: `${selectedSource.color}20`, color: selectedSource.color }}
                      >
                        {selectedSource.icon}
                      </div>
                      <div>
                        <CardTitle className={`text-lg ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                          {selectedSource.name}
                        </CardTitle>
                        <Badge 
                          variant="outline" 
                          className={`mt-1 text-xs ${categoryColors[selectedSource.category]?.split(' ')[2] || ''}`}
                        >
                          {selectedSource.category}
                        </Badge>
                      </div>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="space-y-4">
                    <p className={`text-sm leading-relaxed ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                      {selectedSource.description}
                    </p>
                    
                    {/* URL */}
                    <a
                      href={selectedSource.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`flex items-center gap-2 text-sm font-medium transition-colors ${
                        darkMode ? 'text-cyan-400 hover:text-cyan-300' : 'text-cyan-600 hover:text-cyan-700'
                      }`}
                    >
                      <Icons.ExternalLink />
                      Visit Official Site
                    </a>
                    
                    <Separator />
                    
                    {/* Stats */}
                    <div className="grid grid-cols-2 gap-3">
                      <div className={`p-3 rounded-lg text-center ${darkMode ? 'bg-white/5' : 'bg-gray-50'}`}>
                        <p className="text-lg font-bold text-cyan-400">{selectedSource.recordCount}</p>
                        <p className={`text-[10px] uppercase ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>Records</p>
                      </div>
                      <div className={`p-3 rounded-lg text-center ${darkMode ? 'bg-white/5' : 'bg-gray-50'}`}>
                        <p className="text-lg font-bold text-violet-400">{selectedSource.updateFrequency}</p>
                        <p className={`text-[10px] uppercase ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>Update</p>
                      </div>
                    </div>
                    
                    {/* Data Types */}
                    <div>
                      <p className={`text-xs font-medium mb-2 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                        Data Formats:
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {selectedSource.dataTypes.map((type) => (
                          <span
                            key={type}
                            className={`text-[10px] px-2 py-0.5 rounded-full ${
                              darkMode ? 'bg-white/10 text-gray-300' : 'bg-gray-100 text-gray-700'
                            }`}
                          >
                            {type}
                          </span>
                        ))}
                      </div>
                    </div>
                    
                    {/* Features */}
                    <div>
                      <p className={`text-xs font-medium mb-2 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                        Key Features:
                      </p>
                      <ul className="space-y-1.5">
                        {selectedSource.features.map((feature, i) => (
                          <li key={i} className={`flex items-center gap-2 text-xs ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                            <Icons.CheckCircle />
                            <span>{feature}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                    
                    {/* Action Buttons */}
                    <div className="space-y-2 pt-2">
                      <Button className="w-full bg-gradient-to-r from-cyan-500 to-violet-500 hover:from-cyan-600 hover:to-violet-600 text-sm">
                        <Icons.Download /> Configure Connector
                      </Button>
                      <Button variant="outline" className={`w-full text-sm ${darkMode ? 'border-white/20 text-white hover:bg-white/10' : ''}`}>
                        <Icons.RefreshCw /> Sync Now
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </>
            ) : (
              /* Placeholder */
              <Card className={`${darkMode ? 'bg-black/30 backdrop-blur-xl border-white/10 border-dashed' : 'bg-white border-gray-200 border-dashed'}`}>
                <CardContent className="py-12 text-center">
                  <Icons.Database />
                  <p className={`mt-4 text-sm font-medium ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    Select a Data Source
                  </p>
                  <p className={`text-xs mt-1 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                    Click any source to view details
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Category Summary */}
            <Card className={`${darkMode ? 'bg-black/30 backdrop-blur-xl border-white/10' : 'bg-white border-gray-200'}`}>
              <CardHeader className="pb-3">
                <CardTitle className={`text-sm ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                  Categories Overview
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {categories.filter(c => c !== 'all').map(cat => {
                  const count = scientificDataSources.filter(s => s.category === cat).length
                  return (
                    <button
                      key={cat}
                      onClick={() => setSelectedCategory(cat)}
                      className={`w-full flex items-center justify-between p-2 rounded-lg text-left transition-colors ${
                        selectedCategory === cat
                          ? darkMode ? 'bg-cyan-500/10 text-cyan-400' : 'bg-cyan-50 text-cyan-700'
                          : darkMode ? 'hover:bg-white/5 text-gray-400' : 'hover:bg-gray-50 text-gray-600'
                      }`}
                    >
                      <span className="text-xs truncate pr-2">{cat}</span>
                      <Badge variant="outline" className="text-[10px] shrink-0">
                        {count}
                      </Badge>
                    </button>
                  )
                })}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* ===== SEARCH RESULTS SECTION ===== */}
        {activeTab === 'results' && queryResults.length > 0 && (
          <Card className={`${darkMode ? 'bg-black/30 backdrop-blur-xl border-white/10' : 'bg-white border-gray-200'}`}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className={`text-lg ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                    Search Results
                  </CardTitle>
                  <CardDescription>
                    Found {queryResults.length} results across scientific databases
                  </CardDescription>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setActiveTab('sources')}
                  className={darkMode ? 'border-white/20' : ''}
                >
                  Back to Sources
                </Button>
              </div>
            </CardHeader>
            
            <CardContent className="space-y-4">
              {queryResults.map((result) => (
                <div
                  key={result.id}
                  className={`p-4 rounded-xl border transition-all hover:shadow-lg cursor-pointer ${
                    darkMode ? 'bg-white/5 border-white/10 hover:border-cyan-500/30' : 'bg-gray-50 border-gray-200 hover:border-cyan-300'
                  }`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant="outline" className={`text-[10px] ${
                          result.type === 'paper' ? 'bg-red-500/10 text-red-400 border-red-500/20' :
                          result.type === 'dataset' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' :
                          result.type === 'code' ? 'bg-green-500/10 text-green-400 border-green-500/20' :
                          result.type === 'sequence' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                          result.type === 'structure' ? 'bg-purple-500/10 text-purple-400 border-purple-500/20' :
                          result.type === 'climate' ? 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20' :
                          'bg-orange-500/10 text-orange-400 border-orange-500/20'
                        }`}>
                          {result.type.charAt(0).toUpperCase() + result.type.slice(1)}
                        </Badge>
                        <Badge variant="outline" className="text-[10px] bg-violet-500/10 text-violet-400 border-violet-500/20">
                          {result.source}
                        </Badge>
                        <span className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                          {result.year}
                        </span>
                      </div>
                      
                      <h4 className={`font-semibold text-sm mb-1 ${darkMode ? 'text-white' : 'text-gray-900'} line-clamp-2`}>
                        {result.title}
                      </h4>
                      
                      <p className={`text-xs mb-2 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                        {result.authors}
                      </p>
                      
                      <p className={`text-xs line-clamp-2 leading-relaxed ${darkMode ? 'text-gray-500' : 'text-gray-500'}`}>
                        {result.abstract}
                      </p>
                      
                      {result.doi && (
                        <p className={`text-xs mt-2 font-mono ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                          DOI: {result.doi}
                        </p>
                      )}
                    </div>
                    
                    <div className="shrink-0 text-right hidden sm:block">
                      <div className={`flex items-center gap-1 text-xs mb-1 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                        <Icons.Download /> {result.metrics.downloads.toLocaleString()}
                      </div>
                      <div className={`flex items-center gap-1 text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                        <Icons.Star /> {result.metrics.citations.toLocaleString()}
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="mt-2 text-xs text-cyan-400 hover:text-cyan-300"
                        onClick={() => window.open(result.accessUrl, '_blank')}
                      >
                        <Icons.ExternalLink /> View
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        )}
      </div>
    </TooltipProvider>
  )
}
