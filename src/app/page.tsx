'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'

// ============ REVOLUTIONARY ICON SYSTEM ============
const Icons = {
  // Core Science Icons
  QuantumField: () => (
    <svg viewBox="0 0 100 100" className="w-full h-full">
      <defs>
        <radialGradient id="quantumGlow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#00ffff" stopOpacity="0.8"/>
          <stop offset="50%" stopColor="#8b5cf6" stopOpacity="0.4"/>
          <stop offset="100%" stopColor="#ec4899" stopOpacity="0"/>
        </radialGradient>
        <filter id="quantumBlur">
          <feGaussianBlur stdDeviation="2"/>
        </filter>
      </defs>
      <circle cx="50" cy="50" r="40" fill="url(#quantumGlow)" filter="url(#quantumBlur)"/>
      <circle cx="35" cy="40" r="8" fill="#00ffff" opacity="0.9">
        <animate attributeName="r" values="6;10;6" dur="2s" repeatCount="indefinite"/>
      </circle>
      <circle cx="65" cy="45" r="6" fill="#a855f7" opacity="0.9">
        <animate attributeName="r" values="4;8;4" dur="1.5s" repeatCount="indefinite"/>
      </circle>
      <circle cx="50" cy="65" r="10" fill="#ec4899" opacity="0.7">
        <animate attributeName="r" values="8;12;8" dur="2.5s" repeatCount="indefinite"/>
      </circle>
      <path d="M35 40 Q50 30 65 45 Q70 55 50 65 Q30 60 35 40Z" fill="none" stroke="white" strokeWidth="0.5" opacity="0.3"/>
    </svg>
  ),
  
  DnaHelix: () => (
    <svg viewBox="0 0 100 100" className="w-full h-full">
      <defs>
        <linearGradient id="dnaGrad1" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#06b6d4"/>
          <stop offset="100%" stopColor="#8b5cf6"/>
        </linearGradient>
        <linearGradient id="dnaGrad2" x1="100%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#f43f5e"/>
          <stop offset="100%" stopColor="#f97316"/>
        </linearGradient>
      </defs>
      <path d="M25 10 Q50 25 75 10 Q50 25 25 40 Q50 55 75 40 Q50 55 25 70 Q50 85 75 70 Q50 85 25 95" 
            fill="none" stroke="url(#dnaGrad1)" strokeWidth="3" strokeLinecap="round">
        <animate attributeName="d" 
          values="M25 10 Q50 25 75 10 Q50 25 25 40 Q50 55 75 40 Q50 55 25 70 Q50 85 75 70 Q50 85 25 95;
                  M25 12 Q48 23 72 12 Q52 27 28 38 Q52 53 72 38 Q52 63 28 68 Q52 83 72 68 Q52 88 28 93;
                  M25 10 Q50 25 75 10 Q50 25 25 40 Q50 55 75 40 Q50 55 25 70 Q50 85 75 70 Q50 85 25 95"
          dur="3s" repeatCount="indefinite"/>
      </path>
      <path d="M75 10 Q50 25 25 10 Q50 25 75 40 Q50 55 25 40 Q50 55 75 70 Q50 85 25 70 Q50 85 75 95" 
            fill="none" stroke="url(#dnaGrad2)" strokeWidth="3" strokeLinecap="round">
        <animate attributeName="d" 
          values="M75 10 Q50 25 25 10 Q50 25 75 40 Q50 55 25 40 Q50 55 75 70 Q50 85 25 70 Q50 85 75 95;
                  M75 12 Q52 23 28 12 Q48 27 72 38 Q48 53 28 38 Q48 63 72 68 Q48 83 28 68 Q48 88 72 93;
                  M75 10 Q50 25 25 10 Q50 25 75 40 Q50 55 25 40 Q50 55 75 70 Q50 85 25 70 Q50 85 75 95"
          dur="3s" repeatCount="indefinite"/>
      </path>
      {/* Base pairs */}
      {[15, 32, 49, 66, 83].map((y, i) => (
        <g key={i}>
          <line x1={25 + (i % 2) * 10} y1={y} x2={75 - (i % 2) * 10} y2={y} 
                stroke="white" strokeWidth="2" opacity="0.4">
            <animate attributeName="opacity" values="0.2;0.6;0.2" dur={`${1 + i * 0.2}s`} repeatCount="indefinite"/>
          </line>
          <circle cx={25 + (i % 2) * 10} cy={y} r="3" fill="#06b6d4"/>
          <circle cx={75 - (i % 2) * 10} cy={y} r="3" fill="#f43f5e"/>
        </g>
      ))}
    </svg>),
  
  NeuralNetwork: () => (
    <svg viewBox="0 0 100 100" className="w-full h-full">
      <defs>
        <filter id="neuralGlow">
          <feGaussianBlur stdDeviation="1.5" result="blur"/>
          <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
      </defs>
      {/* Neural connections */}
      {[
        [20,20,35,40], [80,20,65,40], [20,20,50,50], [80,20,50,50],
        [35,40,50,50], [65,40,50,50], [35,40,35,70], [65,40,65,70],
        [50,50,35,70], [50,50,65,70], [35,70,50,90], [65,70,50,90]
      ].map(([x1,y1,x2,y2], i) => (
        <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} 
              stroke={`url(#neuralGrad${(i%3)+1})`} strokeWidth="1" opacity="0.4">
          <animate attributeName="opacity" values="0.2;0.7;0.2" dur={`${1.5 + i * 0.3}s`} repeatCount="indefinite"/>
          <animate attributeName="stroke-dasharray" values="0,100;100,0" dur="3s" repeatCount="indefinite"/>
        </line>
      ))}
      <defs>
        <linearGradient id="neuralGrad1"><stop stopColor="#06b6d4"/><stop offset="1" stopColor="#8b5cf6"/></linearGradient>
        <linearGradient id="neuralGrad2"><stop stopColor="#8b5cf6"/><stop offset="1" stopColor="#ec4899"/></linearGradient>
        <linearGradient id="neuralGrad3"><stop stopColor="#ec4899"/><stop offset="1" stopColor="#f97316"/></linearGradient>
      </defs>
      {/* Nodes */}
      {[[20,20],[80,20],[35,40],[65,40],[50,50],[35,70],[65,70],[50,90]].map(([cx,cy], i) => (
        <circle key={i} cx={cx} cy={cy} r="6" fill={`hsl(${180 + i * 25}, 80%, 60%)`} filter="url(#neuralGlow)">
          <animate attributeName="r" values="5;7;5" dur={`${2 + i * 0.2}s`} repeatCount="indefinite"/>
        </circle>
      ))}
    </svg>),

  AtomCore: () => (
    <svg viewBox="0 0 100 100" className="w-full h-full">
      <defs>
        <radialGradient id="atomCore" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="white"/>
          <stop offset="30%" stopColor="#06b6d4"/>
          <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0"/>
        </radialGradient>
      </defs>
      {/* Electron orbits */}
      {[[0,50,100,50,'rotate(0 50 50)'],[50,0,50,100,'rotate(60 50 50)'],[18,15,82,85,'rotate(-60 50 50)']].map(([x1,y1,x2,y2,transform], i) => (
        <ellipse key={i} cx="50" cy="50" rx="42" ry="15" fill="none" 
                 stroke={`hsl(${180 + i * 40}, 70%, 60%)`} strokeWidth="1.5" 
                 transform={transform} opacity="0.6">
          <animateTransform attributeName="transform" type="rotate" 
                           from={`0 50 50 ${i === 0 ? '' : (i === 1 ? '60' : '-60')}`} 
                           to={`360 50 50 ${i === 0 ? '' : (i === 1 ? '60' : '-60')}`} 
                           dur={`${8 + i * 2}s`} repeatCount="indefinite"/>
        </ellipse>
      ))}
      {/* Electrons */}
      {[
        [92,50,'#06b6d4'],[25,15,'#8b5cf6'],[75,85,'#ec4899']
      ].map(([cx,cy,color], i) => (
        <circle key={i} cx={cx} cy={cy} r="4" fill={color}>
          <animateMotion path={`M${i===0?'92,50':i===1?'25,15':'75,85'} A42,15 0 1,1 ${i===0?'8,50':i===1?'75,85':'25,15'} A42,15 0 1,1 ${i===0?'92,50':i===1?'25,15':'75,85'}`} 
                       dur={`${8 + i * 2}s`} repeatCount="indefinite" rotate="auto"/>
        </circle>
      ))}
      {/* Nucleus */}
      <circle cx="50" cy="50" r="10" fill="url(#atomCore)">
        <animate attributeName="r" values="9;11;9" dur="2s" repeatCount="indefinite"/>
      </circle>
    </svg>),

  MicroscopeLens: () => (
    <svg viewBox="0 0 100 100" className="w-full h-full">
      <defs>
        <linearGradient id="lensGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.8"/>
          <stop offset="50%" stopColor="#8b5cf6" stopOpacity="0.5"/>
          <stop offset="100%" stopColor="#ec4899" stopOpacity="0.8"/>
        </linearGradient>
        <clipPath id="lensClip"><circle cx="50" cy="50" r="40"/></clipPath>
      </defs>
      {/* Lens body */}
      <circle cx="50" cy="50" r="42" fill="none" stroke="url(#lensGrad)" strokeWidth="3"/>
      <circle cx="50" cy="50" r="38" fill="none" stroke="white" strokeWidth="0.5" opacity="0.3"/>
      {/* Internal cells/particles */}
      <g clipPath="url(#lensClip)">
        {[
          [30,35,8,'#06b6d4'],[65,40,6,'#8b5cf6'],[45,65,10,'#ec4899'],
          [55,30,5,'#f97316'],[25,60,7,'#22c55e']
        ].map(([cx,cy,r,color], i) => (
          <circle key={i} cx={cx} cy={cy} r={r} fill={color} opacity="0.6">
            <animate attributeName="opacity" values="0.4;0.8;0.4" dur={`${2+i*0.5}s`} repeatCount="indefinite"/>
            <animateTransform attributeName="transform" type="translate" 
                             values="0,0;2,-2;0,0" dur={`${3+i*0.7}s`} repeatCount="indefinite"/>
          </circle>
        ))}
        {/* Magnification lines */}
        <line x1="20" y1="50" x2="80" y2="50" stroke="white" strokeWidth="0.5" opacity="0.2"/>
        <line x1="50" y1="20" x2="50" y2="80" stroke="white" strokeWidth="0.5" opacity="0.2"/>
      </g>
      {/* Focus ring */}
      <circle cx="50" cy="50" r="25" fill="none" stroke="#06b6d4" strokeWidth="1" strokeDasharray="4 4" opacity="0.5">
        <animateTransform attributeName="transform" type="rotate" from="0 50 50" to="360 50 50" dur="20s" repeatCount="indefinite"/>
      </circle>
    </svg>),

  ParticleCollider: () => (
    <svg viewBox="0 0 100 100" className="w-full h-full">
      <defs>
        <radialGradient id="collisionGlow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="white" stopOpacity="1"/>
          <stop offset="30%" stopColor="#06b6d4" stopOpacity="0.8"/>
          <stop offset="70%" stopColor="#8b5cf6" stopOpacity="0.3"/>
          <stop offset="100%" stopColor="transparent"/>
        </radialGradient>
      </defs>
      {/* Ring accelerator */}
      <circle cx="50" cy="50" r="35" fill="none" stroke="#334155" strokeWidth="8"/>
      <circle cx="50" cy="50" r="35" fill="none" stroke="url(#collisionGlow)" strokeWidth="2" opacity="0.5"/>
      {/* Particles */}
      {[
        [50,15,'#06b6d4',0],[85,50,'#8b5cf6',90],[50,85,'#ec4899',180],[15,50,'#f97316',270]
      ].map(([cx,cy,color,angle], i) => (
        <g key={i}>
          <circle cx={cx} cy={cy} r="5" fill={color}>
            <animateMotion path="M50,15 A35,35 0 1,1 49.99,15" dur="2s" repeatCount="indefinite"
                         rotate="auto" begin={`${i*0.5}s`}/>
          </circle>
          {/* Trail */}
          <circle cx={cx} cy={cy} r="3" fill={color} opacity="0.3">
            <animateMotion path="M50,15 A35,35 0 1,1 49.99,15" dur="2s" repeatCount="indefinite"
                         rotate="auto" begin={`${i*0.5}s`}/>
          </circle>
        </g>
      ))}
      {/* Center collision point */}
      <circle cx="50" cy="50" r="8" fill="url(#collisionGlow)">
        <animate attributeName="r" values="5;12;5" dur="1s" repeatCount="indefinite"/>
      </circle>
      {/* Energy bursts */}
      {['#06b6d4','#8b5cf6','#ec4899','#f97316','#22c55e'].map((color,i) => (
        <line key={i} x1="50" y1="50" x2="50" y2="30" stroke={color} strokeWidth="2" opacity="0.6"
              transform={`rotate(${i*72} 50 50)`}>
          <animate attributeName="y2" values="30;15;30" dur="0.5s" repeatCount="indefinite" begin={`${i*0.1}s`}/>
          <animate attributeName="opacity" values="0.6;0;0.6" dur="0.5s" repeatCount="indefinite" begin={`${i*0.1}s`}/>
        </line>
      ))}
    </svg>),

  // Utility Icons
  Code: () => (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>),
  Server: () => (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="8" x="2" y="2" rx="2" ry="2"/><rect width="20" height="8" x="2" y="14" rx="2" ry="2"/><line x1="6" x2="6.01" y1="6" y2="6"/><line x1="6" x2="6.01" y1="18" y2="18"/></svg>),
  Users: () => (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>),
  Zap: () => (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>),
  Shield: () => (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>),
  Cloud: () => (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z"/></svg>),
  Database: () => (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M3 5V19A9 3 0 0 0 21 19V5"/><path d="M3 12A9 3 0 0 0 21 12"/></svg>),
  Layers: () => (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/></svg>),
  Rocket: () => (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z"/><path d="m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z"/><path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0"/><path d="M12 15v5s3-.55 4-2c1.08-1.62 0-5 0-5"/></svg>),
  Globe: () => (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="2" x2="22" y1="12" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>),
  Lock: () => (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>),
  CheckCircle: () => (<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>),
  Star: () => (<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>),
  ArrowRight: () => (<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>),
  Github: () => (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg>),
  Play: () => (<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="5 3 19 12 5 21 5 3"/></svg>),
  Eye: () => (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>),
}

// ============ QUANTUM FIELD BACKGROUND ============
function QuantumBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    
    let animationId: number
    let time = 0
    
    const particles: Array<{
      x: number; y: number; vx: number; vy: number;
      size: number; phase: number; frequency: number; amplitude: number;
      color: string; baseY: number;
    }> = []
    
    const colors = [
      'rgba(6, 182, 212,',   // cyan
      'rgba(139, 92, 246,',   // purple
      'rgba(236, 72, 153,',   // pink
      'rgba(249, 115, 22,',   // orange
      'rgba(34, 197, 94,',    // green
    ]
    
    const resize = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }
    
    const init = () => {
      resize()
      for (let i = 0; i < 120; i++) {
        particles.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          vx: (Math.random() - 0.5) * 0.3,
          vy: (Math.random() - 0.5) * 0.3,
          size: Math.random() * 3 + 0.5,
          phase: Math.random() * Math.PI * 2,
          frequency: 0.01 + Math.random() * 0.02,
          amplitude: 20 + Math.random() * 40,
          color: colors[Math.floor(Math.random() * colors.length)],
          baseY: Math.random() * canvas.height,
        })
      }
    }
    
    const drawQuantumField = () => {
      ctx.fillStyle = 'rgba(2, 6, 23, 0.1)'
      ctx.fillRect(0, 0, canvas.width, canvas.height)
      
      time += 0.016
      
      // Draw wave field
      ctx.strokeStyle = 'rgba(6, 182, 212, 0.05)'
      ctx.lineWidth = 1
      
      for (let wave = 0; wave < 5; wave++) {
        ctx.beginPath()
        for (let x = 0; x < canvas.width; x += 5) {
          const y = canvas.height / 2 + 
                    Math.sin(x * 0.005 + time + wave) * (50 + wave * 20) +
                    Math.sin(x * 0.01 + time * 1.5) * 30
          if (x === 0) ctx.moveTo(x, y)
          else ctx.lineTo(x, y)
        }
        ctx.stroke()
      }
      
      // Draw and update particles
      particles.forEach((p, i) => {
        // Quantum-like position uncertainty
        const quantumOffsetX = Math.sin(time * p.frequency * 60 + p.phase) * p.amplitude
        const quantumOffsetY = Math.cos(time * p.frequency * 60 + p.phase) * p.amplitude
        
        p.x += p.vx
        p.y += p.vy + Math.sin(time + p.phase) * 0.2
        
        if (p.x < 0) p.x = canvas.width
        if (p.x > canvas.width) p.x = 0
        if (p.y < 0) p.y = canvas.height
        if (p.y > canvas.height) p.y = 0
        
        // Draw particle with glow
        const gradient = ctx.createRadialGradient(
          p.x + quantumOffsetX * 0.1, p.y + quantumOffsetY * 0.1, 0,
          p.x + quantumOffsetX * 0.1, p.y + quantumOffsetY * 0.1, p.size * 4
        )
        gradient.addColorStop(0, `${p.color} 0.8)`)
        gradient.addColorStop(0.5, `${p.color} 0.2)`)
        gradient.addColorStop(1, `${p.color} 0)`)
        
        ctx.fillStyle = gradient
        ctx.beginPath()
        ctx.arc(p.x + quantumOffsetX * 0.1, p.y + quantumOffsetY * 0.1, p.size * 4, 0, Math.PI * 2)
        ctx.fill()
        
        // Connect nearby particles with neural-like connections
        particles.slice(i + 1).forEach(p2 => {
          const dx = p.x - p2.x
          const dy = p.y - p2.y
          const dist = Math.sqrt(dx * dx + dy * dy)
          
          if (dist < 120) {
            ctx.beginPath()
            ctx.moveTo(p.x, p.y)
            
            // Curved connection
            const midX = (p.x + p2.x) / 2 + Math.sin(time + i) * 20
            const midY = (p.y + p2.y) / 2 + Math.cos(time + i) * 20
            ctx.quadraticCurveTo(midX, midY, p2.x, p2.y)
            
            ctx.strokeStyle = `${p.color} ${(1 - dist / 120) * 0.15})`
            ctx.lineWidth = 0.5
            ctx.stroke()
          }
        })
      })
      
      // Central energy core
      const coreGradient = ctx.createRadialGradient(
        canvas.width / 2, canvas.height / 2, 0,
        canvas.width / 2, canvas.height / 2, 300
      )
      coreGradient.addColorStop(0, 'rgba(139, 92, 246, 0.08)')
      coreGradient.addColorStop(0.5, 'rgba(6, 182, 212, 0.04)')
      coreGradient.addColorStop(1, 'transparent')
      
      ctx.fillStyle = coreGradient
      ctx.fillRect(0, 0, canvas.width, canvas.height)
      
      animationId = requestAnimationFrame(drawQuantumField)
    }
    
    init()
    drawQuantumField()
    
    window.addEventListener('resize', resize)
    return () => {
      cancelAnimationFrame(animationId)
      window.removeEventListener('resize', resize)
    }
  }, [])
  
  return (
    <canvas 
      ref={canvasRef} 
      className="fixed inset-0 pointer-events-none z-0"
      style={{ background: 'linear-gradient(135deg, #020617 0%, #0f172a 30%, #1e1b4b 60%, #0c0a1e 100%)' }}
    />
  )
}

// ============ BIOLUMINESCENT FLOATING ELEMENTS ============
function BioluminescentElements() {
  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none z-10">
      {/* Organic blob shapes */}
      <div className="absolute top-[10%] left-[5%] w-64 h-64 animate-pulse" style={{ animationDuration: '8s' }}>
        <svg viewBox="0 0 200 200" className="w-full h-full opacity-20">
          <defs>
            <filter id="blob1">
              <feTurbulence type="fractalNoise" baseFrequency="0.02" numOctaves="3" result="noise"/>
              <feDisplacementMap in="SourceGraphic" in2="noise" scale="30"/>
              <feGaussianBlur stdDeviation="8"/>
            </filter>
            <radialGradient id="blobGrad1">
              <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.6"/>
              <stop offset="100%" stopColor="#06b6d4" stopOpacity="0"/>
            </radialGradient>
          </defs>
          <ellipse cx="100" cy="100" rx="80" ry="70" fill="url(#blobGrad1)" filter="url(#blob1)">
            <animate attributeName="rx" values="80;90;80" dur="7s" repeatCount="indefinite"/>
            <animate attributeName="ry" values="70;80;70" dur="5s" repeatCount="indefinite"/>
          </ellipse>
        </svg>
      </div>
      
      <div className="absolute top-[40%] right-[10%] w-96 h-96 animate-pulse" style={{ animationDuration: '10s' }}>
        <svg viewBox="0 0 200 200" className="w-full h-full opacity-15">
          <defs>
            <radialGradient id="blobGrad2">
              <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0.5"/>
              <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0"/>
            </radialGradient>
          </defs>
          <ellipse cx="100" cy="100" rx="90" ry="80" fill="url(#blobGrad2)" filter="url(#blob1)">
            <animate attributeName="rx" values="90;100;90" dur="9s" repeatCount="indefinite"/>
            <animate attributeName="ry" values="80;95;80" dur="6s" repeatCount="indefinite"/>
          </ellipse>
        </svg>
      </div>
      
      <div className="absolute bottom-[20%] left-[20%] w-72 h-72 animate-pulse" style={{ animationDuration: '12s' }}>
        <svg viewBox="0 0 200 200" className="w-full h-full opacity-12">
          <defs>
            <radialGradient id="blobGrad3">
              <stop offset="0%" stopColor="#ec4899" stopOpacity="0.4"/>
              <stop offset="100%" stopColor="#ec4899" stopOpacity="0"/>
            </radialGradient>
          </defs>
          <ellipse cx="100" cy="100" rx="75" ry="65" fill="url(#blobGrad3)" filter="url(#blob1)">
            <animate attributeName="rx" values="75;85;75" dur="8s" repeatCount="indefinite"/>
            <animate attributeName="ry" values="65;75;65" dur="7s" repeatCount="indefinite"/>
          </ellipse>
        </svg>
      </div>

      {/* Floating scientific icons */}
      <div className="absolute top-[25%] right-[25%] w-20 h-20 opacity-30 animate-bounce" style={{ animationDuration: '6s' }}>
        <Icons.QuantumField />
      </div>
      
      <div className="absolute bottom-[35%] left-[15%] w-16 h-16 opacity-25" style={{ animation: 'spin 15s linear infinite' }}>
        <Icons.AtomCore />
      </div>
      
      <div className="absolute top-[60%] right-[15%] w-14 h-14 opacity-20 animate-pulse" style={{ animationDuration: '4s' }}>
        <Icons.NeuralNetwork />
      </div>
      
      {/* Grid overlay */}
      <div className="absolute inset-0 opacity-[0.02]"
           style={{
             backgroundImage: `
               radial-gradient(circle at 1px 1px, white 1px, transparent 0)
             `,
             backgroundSize: '40px 40px'
           }}
      />
    </div>
  )
}

// ============ PREVIEW SWITCHER ============
function PreviewSwitcher({ currentPreview, onSwitch }: { currentPreview: number; onSwitch: (n: number) => void }) {
  return (
    <div className="fixed top-20 right-4 z-50 flex flex-col gap-2">
      <button
        onClick={() => onSwitch(1)}
        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 backdrop-blur-md ${
          currentPreview === 1 
            ? 'bg-gradient-to-r from-teal-500 to-cyan-500 text-white shadow-lg shadow-teal-500/30' 
            : 'bg-slate-800/80 text-slate-400 hover:bg-slate-700/80 border border-slate-700'
        }`}
      >
        Preview 1
      </button>
      <button
        onClick={() => onSwitch(2)}
        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 backdrop-blur-md ${
          currentPreview === 2 
            ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg shadow-purple-500/30' 
            : 'bg-slate-800/80 text-slate-400 hover:bg-slate-700/80 border border-slate-700'
        }`}
      >
        Preview 2 ✨
      </button>
    </div>
  )
}

// ============ HOLOGRAPHIC CARD COMPONENT ============
function HolographicCard({ children, className = '', icon, delay = 0 }: {
  children: React.ReactNode; className?: string; icon?: keyof typeof Icons; delay?: number
}) {
  const [rotation, setRotation] = useState({ x: 0, y: 0 })
  const cardRef = useRef<HTMLDivElement>(null)
  
  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!cardRef.current) return
    const rect = cardRef.current.getBoundingClientRect()
    const x = (e.clientX - rect.left) / rect.width - 0.5
    const y = (e.clientY - rect.top) / rect.height - 0.5
    setRotation({ x: y * 10, y: -x * 10 })
  }, [])
  
  const handleMouseLeave = () => setRotation({ x: 0, y: 0 })
  
  const IconComponent = icon ? Icons[icon] : null
  
  return (
    <div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className={`relative group perspective-1000 ${className}`}
      style={{ 
        transformStyle: 'preserve-3d',
        transition: 'transform 0.3s ease-out',
        transform: `rotateX(${rotation.x}deg) rotateY(${rotation.y}deg)`
      }}
    >
      {/* Holographic shimmer effect */}
      <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-cyan-500/10 via-transparent to-purple-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
           style={{ transform: 'translateZ(20px)' }}/>
      
      {/* Content */}
      <div className="relative bg-slate-900/60 backdrop-blur-xl border border-white/10 rounded-2xl p-6 hover:border-white/20 transition-all duration-300"
           style={{ transform: 'translateZ(10px)' }}>
        {IconComponent && (
          <div className="mb-4 transform group-hover:scale-110 transition-transform duration-300" style={{ transform: 'translateZ(20px)' }}>
            <div className="w-14 h-14 relative">
              <IconComponent />
            </div>
          </div>
        )}
        {children}
      </div>
      
      {/* Glow effect */}
      <div className="absolute -inset-px rounded-2xl bg-gradient-to-br from-cyan-500 via-purple-500 to-pink-500 opacity-0 group-hover:opacity-20 blur-xl transition-opacity duration-500 -z-10"/>
    </div>
  )
}

// ============ NAVIGATION WITH QUANTUM EFFECTS ============
function Navigation() {
  const [scrolled, setScrolled] = useState(false)
  
  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50)
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])
  
  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
      scrolled ? 'bg-slate-950/90 backdrop-blur-xl border-b border-white/5 shadow-2xl shadow-black/50' : 'bg-transparent'
    }`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Logo with quantum effect */}
          <div className="flex items-center gap-3 group cursor-pointer">
            <div className="relative w-12 h-12">
              <div className="absolute inset-0 bg-gradient-to-br from-cyan-400 via-purple-500 to-pink-500 rounded-xl blur-lg opacity-60 group-hover:opacity-100 transition-opacity duration-500"/>
              <div className="relative w-12 h-12 rounded-xl bg-slate-900 border border-white/20 flex items-center justify-center overflow-hidden">
                <Icons.QuantumField />
              </div>
            </div>
            <div className="hidden sm:block">
              <span className="text-white font-bold text-xl tracking-tight bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                SciHub Pro
              </span>
              <div className="text-xs text-slate-500 tracking-widest uppercase">Quantum Edition</div>
            </div>
          </div>
          
          {/* Desktop Nav with glow effects */}
          <div className="hidden md:flex items-center gap-1">
            {['Universe', 'Dimensions', 'Forces', 'Energy'].map((item, idx) => (
              <a key={item} href={`#${item.toLowerCase()}`} 
                 className="relative px-4 py-2 text-sm text-slate-400 hover:text-white transition-colors group/nav">
                <span className="relative z-10">{item}</span>
                <span className="absolute inset-0 rounded-lg bg-gradient-to-r from-cyan-500/0 via-purple-500/0 to-pink-500/0 group-hover/nav:from-cyan-500/10 group-hover/nav:via-purple-500/10 group-hover/nav:to-pink-500/10 transition-all duration-300"/>
                <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-0 h-0.5 bg-gradient-to-r from-cyan-400 to-purple-400 group-hover/nav:w-3/4 transition-all duration-300"/>
              </a>
            ))}
          </div>
          
          {/* CTA Buttons */}
          <div className="flex items-center gap-3">
            <Button variant="ghost" className="text-slate-400 hover:text-white hover:bg-white/5 hidden sm:flex gap-2">
              <Icons.Eye /> <span className="text-sm">Observe</span>
            </Button>
            <Button className="relative group/btn bg-gradient-to-r from-cyan-500 via-purple-500 to-pink-500 hover:from-cyan-400 hover:via-purple-400 hover:to-pink-400 text-white border-0 overflow-hidden">
              <span className="relative z-10 flex items-center gap-2">
                <Icons.Rocket /> <span>Enter Universe</span>
              </span>
              <div className="absolute inset-0 bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 opacity-0 group-hover/btn:opacity-100 transition-opacity duration-500"/>
              <div className="absolute -inset-1 bg-gradient-to-r from-cyan-500 via-purple-500 to-pink-500 blur-xl opacity-0 group-hover/btn:opacity-40 transition-opacity duration-500 -z-10"/>
            </Button>
          </div>
        </div>
      </div>
    </nav>
  )
}

// ============ HERO SECTION - THE PORTAL ============
function HeroSection() {
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 })
  
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePos({
        x: (e.clientX / window.innerWidth - 0.5) * 20,
        y: (e.clientY / window.innerHeight - 0.5) * 20
      })
    }
    window.addEventListener('mousemove', handleMouseMove)
    return () => window.removeEventListener('mousemove', handleMouseMove)
  }, [])
  
  return (
    <section id="universe" className="relative min-h-screen flex items-center justify-center overflow-hidden pt-20">
      <QuantumBackground />
      <BioluminescentElements />
      
      <div className="relative z-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center">
          {/* Quantum Badge */}
          <div className="inline-flex items-center gap-2 px-5 py-2.5 mb-8 rounded-full bg-white/5 border border-white/10 backdrop-blur-xl animate-pulse" style={{ animationDuration: '4s' }}>
            <div className="w-2 h-2 rounded-full bg-cyan-400 animate-ping"/>
            <span className="text-sm text-cyan-300 font-medium">Open Source • Quantum-Powered • Community-Driven</span>
            <div className="w-2 h-2 rounded-full bg-purple-400 animate-ping" style={{ animationDelay: '0.5s' }}/>
          </div>
          
          {/* Main Headline with parallax */}
          <div 
            className="relative"
            style={{ transform: `translate(${mousePos.x}px, ${mousePos.y}px)` }}
          >
            <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-bold text-white mb-6 leading-[0.9] tracking-tight">
              <span className="block bg-gradient-to-b from-white via-white to-slate-400 bg-clip-text text-transparent">
                The Scientific
              </span>
              <span className="block mt-2 relative">
                <span className="bg-gradient-to-r from-cyan-400 via-purple-500 to-pink-500 bg-clip-text text-transparent">
                  GitHub
                </span>
                <span className="text-white"> of</span>
              </span>
              <span className="block mt-2 bg-gradient-to-r from-pink-500 via-orange-400 to-yellow-400 bg-clip-text text-transparent">
                Tomorrow
              </span>
            </h1>
            
            {/* Decorative elements around headline */}
            <div className="absolute -left-20 top-0 w-40 h-40 opacity-20 hidden lg:block">
              <Icons.DnaHelix />
            </div>
            <div className="absolute -right-20 bottom-0 w-32 h-32 opacity-20 hidden lg:block">
              <Icons.ParticleCollider />
            </div>
          </div>
          
          {/* Subheadline */}
          <p className="text-lg sm:text-xl text-slate-400 max-w-3xl mx-auto mb-10 leading-relaxed mt-8">
            Where{' '}
            <span className="text-cyan-400 font-semibold relative group">
              Bioinformatics
              <span className="absolute bottom-0 left-0 w-full h-px bg-gradient-to-r from-cyan-400 to-transparent group-hover:w-0 transition-all duration-300"/>
            </span>,{' '}
            <span className="text-purple-400 font-semibold relative group">
              Cheminformatics
              <span className="absolute bottom-0 left-0 w-full h-px bg-gradient-to-r from-purple-400 to-transparent group-hover:w-0 transition-all duration-300"/>
            </span>, and{' '}
            <span className="text-pink-400 font-semibold relative group">
              Discovery
              <span className="absolute bottom-0 left-0 w-full h-px bg-gradient-to-r from-pink-400 to-transparent group-hover:w-0 transition-all duration-300"/>
            </span>{' '}
            converge into one unified dimension.
            <br className="hidden sm:block"/>
            <span className="text-slate-500 italic">No installation. No fragmentation. Just science.</span>
          </p>
          
          {/* CTA Buttons with holographic effect */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-5 mb-16">
            <Button size="lg" className="group relative px-10 py-7 text-lg bg-gradient-to-r from-cyan-500 via-blue-500 to-purple-500 hover:from-cyan-400 hover:via-blue-400 hover:to-purple-400 text-white shadow-2xl shadow-cyan-500/25 hover:shadow-cyan-500/40 transition-all duration-300 overflow-hidden">
              <span className="relative z-10 flex items-center gap-3">
                <Icons.Rocket /> 
                <span className="font-semibold">Enter the Laboratory</span>
              </span>
              <div className="absolute inset-0 bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400 opacity-0 group-hover:opacity-100 transition-opacity duration-500"/>
            </Button>
            
            <Button size="lg" variant="outline" className="group px-10 py-7 text-lg border-white/20 text-white hover:bg-white/5 hover:border-white/30 transition-all duration-300">
              <span className="flex items-center gap-3">
                <div className="relative w-8 h-8">
                  <Icons.Play />
                  <div className="absolute inset-0 rounded-full bg-white/20 animate-ping opacity-0 group-hover:opacity-100"/>
                </div>
                <span>Witness the Magic</span>
              </span>
            </Button>
          </div>
          
          {/* Stats Row with glass morphism */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto">
            {[
              { value: '∞', label: 'Possibilities', color: 'cyan', icon: '🧬' },
              { value: '10M+', label: 'Researchers', color: 'purple', icon: '👨‍🔬' },
              { value: '$50B', label: 'Market', color: 'pink', icon: '💫' },
              { value: '100%', label: 'Open Core', color: 'orange', icon: '⚛️' },
            ].map((stat) => (
              <HolographicCard key={stat.label} className="text-center">
                <div className="text-3xl mb-2">{stat.icon}</div>
                <div className={`text-3xl sm:text-4xl font-bold bg-gradient-to-r ${
                  stat.color === 'cyan' ? 'from-cyan-400 to-blue-400' :
                  stat.color === 'purple' ? 'from-purple-400 to-pink-400' :
                  stat.color === 'pink' ? 'from-pink-400 to-orange-400' :
                  'from-orange-400 to-yellow-400'
                } bg-clip-text text-transparent`}>
                  {stat.value}
                </div>
                <div className="text-sm text-slate-400 mt-1">{stat.label}</div>
              </HolographicCard>
            ))}
          </div>
        </div>
        
        {/* Scroll indicator with DNA animation */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2">
          <div className="w-8 h-12 rounded-full border-2 border-white/20 flex items-start justify-center p-1.5 overflow-hidden">
            <div className="w-1.5 h-3 bg-gradient-to-b from-cyan-400 to-purple-400 rounded-full animate-bounce"/>
          </div>
          <span className="text-xs text-slate-500 tracking-widest uppercase">Explore</span>
        </div>
      </div>
    </section>
  )
}

// ============ DIMENSIONS SECTION (Features) ============
const dimensions = [
  {
    icon: 'Code',
    title: 'Neural IDE Studio',
    description: 'AI-enhanced development environment that learns your workflow. Syntax prediction, intelligent autocomplete, and real-time collaboration across dimensions.',
    gradient: 'from-cyan-500 to-blue-600',
    tags: ['AI-Assisted', 'Multi-language', 'Real-time'],
    stats: { users: '50K+', rating: '4.9★' }
  },
  {
    icon: 'Server',
    title: 'Quantum Microservices',
    description: 'Each tool exists as an independent quantum state — superpositioned for maximum efficiency. Scale instantly, deploy globally.',
    gradient: 'from-purple-500 to-indigo-600',
    tags: ['Containerized', 'Auto-scale', 'Global CDN'],
    stats: { uptime: '99.99%', latency: '<50ms' }
  },
  {
    icon: 'Database',
    title: 'Unified Data Cosmos',
    description: 'All your research data unified in one searchable universe. From sequences to structures, molecules to materials — connected.',
    gradient: 'from-pink-500 to-rose-600',
    tags: ['Graph DB', 'Blob Storage', 'Search'],
    stats: { data: 'PB+', queries: '1M+/day' }
  },
  {
    icon: 'Layers',
    title: 'Reproducibility Engine',
    description: 'Every experiment is version-controlled, containerized, and citable. One-click reproduction of any published workflow.',
    gradient: 'from-orange-500 to-amber-600',
    tags: ['Git-Native', 'DOI Support', 'Audit Trail'],
    stats: { workflows: '100K+', citations: '10K+' }
  },
  {
    icon: 'Cpu',
    title: 'Compute Singularity',
    description: 'From laptop to exascale — seamless compute orchestration. GPU clusters, quantum simulators, distributed computing.',
    gradient: 'from-emerald-500 to-green-600',
    tags: ['GPU/HPC', 'Job Queue', 'Spot Instances'],
    stats: { cores: '100K+', jobs: '1M+/mo' }
  },
  {
    icon: 'Shield',
    title: 'Entropy Shield',
    description: 'Military-grade security with scientific compliance built-in. HIPAA, GDPR, SOC 2 ready. Zero-trust architecture.',
    gradient: 'from-red-500 to-rose-600',
    tags: ['SOC 2', 'HIPAA', 'Zero Trust'],
    stats: { breaches: '0', audits: '100%' }
  }
]

function DimensionsSection() {
  const IconComponent = ({ name }: { name: keyof typeof Icons }) => {
    const Icon = Icons[name]
    return <Icon />
  }
  
  return (
    <section id="dimensions" className="relative py-32 overflow-hidden">
      {/* Background accent */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-purple-950/20 to-transparent"/>
      
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-20">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-purple-500/10 border border-purple-500/20 mb-6">
            <Icons.NeuralNetwork />
            <span className="text-sm text-purple-300 font-medium">Platform Dimensions</span>
          </div>
          
          <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-6 leading-tight">
            Six Dimensions of
            <br/>
            <span className="bg-gradient-to-r from-cyan-400 via-purple-500 to-pink-500 bg-clip-text text-transparent">
              Scientific Power
            </span>
          </h2>
          
          <p className="text-slate-400 max-w-2xl mx-auto text-lg">
            Each dimension represents a fundamental pillar of modern computational research.
            Together, they form an unstoppable force for discovery.
          </p>
        </div>
        
        {/* Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {dimensions.map((dim, idx) => (
            <HolographicCard key={idx} icon={dim.icon as keyof typeof Icons} delay={idx * 100}>
              <h3 className="text-xl font-bold text-white mb-3 group-hover:text-cyan-400 transition-colors">
                {dim.title}
              </h3>
              <p className="text-slate-400 text-sm leading-relaxed mb-4">
                {dim.description}
              </p>
              
              {/* Tags */}
              <div className="flex flex-wrap gap-2 mb-4">
                {dim.tags.map((tag) => (
                  <Badge key={tag} variant="secondary" className="text-xs bg-slate-800/50 text-slate-300 border-slate-700/50">
                    {tag}
                  </Badge>
                ))}
              </div>
              
              {/* Stats */}
              <div className="flex items-center gap-4 pt-4 border-t border-slate-800">
                {Object.entries(dim.stats).map(([key, val]) => (
                  <div key={key} className="text-center">
                    <div className="text-sm font-bold text-white">{val}</div>
                    <div className="text-xs text-slate-500 capitalize">{key}</div>
                  </div>
                ))}
              </div>
            </HolographicCard>
          ))}
        </div>
      </div>
    </section>
  )
}

// ============ FORCES SECTION (Scientific Domains) ============
const forces = [
  {
    name: 'Bioinformatics',
    subtitle: 'The Code of Life',
    icon: 'MicroscopeLens',
    color: 'emerald',
    tools: ['BLAST', 'Clustal Omega', 'Bowtie2', 'SAMtools', 'GATK', 'DESeq2', 'CellRanger', 'Scanpy'],
    description: 'Decode genomes, analyze transcriptomes, discover variants. From single-cell to population genomics.',
    visual: '🧬'
  },
  {
    name: 'Cheminformatics',
    subtitle: 'Molecular Architecture',
    icon: 'AtomCore',
    color: 'amber',
    tools: ['RDKit', 'OpenBabel', 'AutoDock Vina', 'GROMACS', 'LAMMPS', 'NAMD', 'CP2K'],
    description: 'Design molecules, simulate dynamics, predict properties. Drug discovery accelerated 100x.',
    visual: '⚗️'
  },
  {
    name: 'Materials Science',
    subtitle: 'Atomic Engineering',
    icon: 'QuantumField',
    color: 'blue',
    tools: ['ASE', 'Quantum ESPRESSO', 'VASP', 'LAMMPS', 'MDAnalysis', 'OVITO', 'pymatgen'],
    description: 'Engineer materials atom by atom. DFT calculations, molecular dynamics, crystallography.',
    visual: '🔮'
  },
  {
    name: 'Physics & Astronomy',
    subtitle: 'Universal Laws',
    icon: 'ParticleCollider',
    color: 'purple',
    tools: ['NumPy/SciPy', 'Astropy', 'FEniCS', 'ROOT', 'HEPData', 'GWpy'],
    description: 'Simulate universes, analyze cosmic data, solve PDEs. From quantum to cosmological scales.',
    visual: '🌌'
  },
  {
    name: 'Machine Intelligence',
    subtitle: 'Neural Discovery',
    icon: 'NeuralNetwork',
    color: 'pink',
    tools: ['PyTorch', 'TensorFlow', 'scikit-learn', 'JAX', 'MLflow', 'Weights & Biases', 'Hugging Face'],
    description: 'Train models, discover patterns, accelerate research. AI becomes your co-scientist.',
    visual: '🧠'
  },
  {
    name: 'Statistics & Visualization',
    subtitle: 'Insight Generation',
    icon: 'DnaHelix',
    color: 'cyan',
    tools: ['R Environment', 'ggplot2', 'Plotly', 'Bokeh', 'Seaborn', 'Observable', 'Vega-Lite'],
    description: 'Extract meaning from data. Publication-quality figures, interactive dashboards, reproducible analysis.',
    visual: '📊'
  }
]

function ForcesSection() {
  const IconComponent = ({ name }: { name: keyof typeof Icons }) => {
    const Icon = Icons[name]
    return <Icon />
  }
  
  const colorMap: Record<string, { bg: string; border: string; text: string; glow: string }> = {
    emerald: { bg: 'from-emerald-500/10 to-emerald-600/5', border: 'border-emerald-500/30 hover:border-emerald-400/50', text: 'text-emerald-400', glow: 'shadow-emerald-500/20' },
    amber: { bg: 'from-amber-500/10 to-amber-600/5', border: 'border-amber-500/30 hover:border-amber-400/50', text: 'text-amber-400', glow: 'shadow-amber-500/20' },
    blue: { bg: 'from-blue-500/10 to-blue-600/5', border: 'border-blue-500/30 hover:border-blue-400/50', text: 'text-blue-400', glow: 'shadow-blue-500/20' },
    purple: { bg: 'from-purple-500/10 to-purple-600/5', border: 'border-purple-500/30 hover:border-purple-400/50', text: 'text-purple-400', glow: 'shadow-purple-500/20' },
    pink: { bg: 'from-pink-500/10 to-pink-600/5', border: 'border-pink-500/30 hover:border-pink-400/50', text: 'text-pink-400', glow: 'shadow-pink-500/20' },
    cyan: { bg: 'from-cyan-500/10 to-cyan-600/5', border: 'border-cyan-500/30 hover:border-cyan-400/50', text: 'text-cyan-400', glow: 'shadow-cyan-500/20' },
  }
  
  return (
    <section id="forces" className="relative py-32 overflow-hidden">
      {/* Constellation background pattern */}
      <div className="absolute inset-0">
        <div className="absolute top-1/4 left-1/4 w-2 h-2 rounded-full bg-cyan-400/30 blur-sm animate-pulse"/>
        <div className="absolute top-1/3 right-1/3 w-1.5 h-1.5 rounded-full bg-purple-400/30 blur-sm animate-pulse" style={{ animationDelay: '1s' }}/>
        <div className="absolute bottom-1/4 left-1/3 w-2 h-2 rounded-full bg-pink-400/30 blur-sm animate-pulse" style={{ animationDelay: '2s' }}/>
        <div className="absolute bottom-1/3 right-1/4 w-1.5 h-1.5 rounded-full bg-amber-400/30 blur-sm animate-pulse" style={{ animationDelay: '0.5s' }}/>
        
        {/* Connection lines */}
        <svg className="absolute inset-0 w-full h-full opacity-10">
          <line x1="25%" y1="25%" x2="33%" y2="33%" stroke="url(#lineGrad)" strokeWidth="0.5"/>
          <line x1="33%" y1="33%" x2="67%" y2="33%" stroke="url(#lineGrad)" strokeWidth="0.5"/>
          <line x1="67%" y1="33%" x2="75%" y2="25%" stroke="url(#lineGrad)" strokeWidth="0.5"/>
          <line x1="33%" y1="67%" x2="25%" y2="75%" stroke="url(#lineGrad)" strokeWidth="0.5"/>
          <line x1="67%" y1="67%" x2="75%" y2="75%" stroke="url(#lineGrad)" strokeWidth="0.5"/>
          <defs>
            <linearGradient id="lineGrad"><stop stopColor="#06b6d4"/><stop stopColor="#8b5cf6"/></linearGradient>
          </defs>
        </svg>
      </div>
      
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-20">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-cyan-500/10 border border-cyan-500/20 mb-6">
            <Icons.AtomCore />
            <span className="text-sm text-cyan-300 font-medium">Fundamental Forces</span>
          </div>
          
          <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-6 leading-tight">
            Master Every
            <br/>
            <span className="bg-gradient-to-r from-emerald-400 via-amber-400 via-purple-400 via-pink-400 to-cyan-400 bg-clip-text text-transparent">
              Scientific Force
            </span>
          </h2>
          
          <p className="text-slate-400 max-w-2xl mx-auto text-lg">
            Six domains of science, unified under one platform. Each force has its tools, its community, its discoveries.
          </p>
        </div>
        
        {/* Forces Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {forces.map((force, idx) => (
            <HolographicCard key={idx} icon={force.icon as keyof typeof Icons} delay={idx * 100}>
              {/* Header */}
              <div className="flex items-start gap-4 mb-4">
                <div className={`text-4xl`}>{force.visual}</div>
                <div className="flex-1">
                  <h3 className={`text-lg font-bold text-white group-hover:${colorMap[force.color].text} transition-colors`}>
                    {force.name}
                  </h3>
                  <p className={`text-sm ${colorMap[force.color].text} opacity-70`}>{force.subtitle}</p>
                </div>
              </div>
              
              <p className="text-slate-400 text-sm leading-relaxed mb-4">
                {force.description}
              </p>
              
              {/* Tools Grid */}
              <div className="grid grid-cols-2 gap-1.5">
                {force.tools.slice(0, 6).map((tool) => (
                  <Badge key={tool} variant="outline" className="text-xs border-slate-800 text-slate-400 hover:bg-slate-800/50 hover:text-white transition-all justify-center py-1">
                    {tool}
                  </Badge>
                ))}
                {force.tools.length > 6 && (
                  <Badge variant="outline" className="text-xs border-purple-500/30 text-purple-400 justify-center py-1">
                    +{force.tools.length - 6} more
                  </Badge>
                )}
              </div>
            </HolographicCard>
          ))}
        </div>
      </div>
    </section>
  )
}

// ============ ENERGY SECTION (Pricing) ============
const energyPlans = [
  {
    name: 'Community',
    subtitle: 'Free Forever',
    price: '$0',
    period: '',
    description: 'For explorers, students, and open-source pioneers.',
    icon: 'Users',
    gradient: 'from-slate-600 to-slate-700',
    cta: 'Start Exploring',
    popular: false,
    features: [
      { included: true, text: 'Full access to all 50+ tools' },
      { included: true, text: 'Web IDE with 10GB storage' },
      { included: true, text: 'Public workspaces & collaboration' },
      { included: true, text: 'Community package registry' },
      { included: true, text: 'Basic CPU compute' },
      { included: false, text: 'Private repositories' },
      { included: false, text: 'GPU acceleration' },
      { included: false, text: 'Priority support' },
    ]
  },
  {
    name: 'Professional',
    subtitle: 'For Teams',
    price: '$49',
    period: '/user/month',
    description: 'For labs and teams pushing boundaries.',
    icon: 'Zap',
    gradient: 'from-cyan-500 via-purple-500 to-pink-500',
    cta: 'Begin Journey',
    popular: true,
    features: [
      { included: true, text: 'Everything in Community' },
      { included: true, text: '100GB storage per user' },
      { included: true, text: 'Private workspaces & repos' },
      { included: true, text: 'GPU compute access' },
      { included: true, text: 'Team collaboration suite' },
      { included: true, text: 'Advanced analytics' },
      { included: false, text: 'SSO / Enterprise auth' },
      { included: false, text: 'Dedicated success manager' },
    ]
  },
  {
    name: 'Enterprise',
    subtitle: 'Institution Scale',
    price: 'Custom',
    period: '',
    description: 'For institutions shaping the future.',
    icon: 'Shield',
    gradient: 'from-amber-500 via-orange-500 to-red-500',
    cta: 'Contact Us',
    popular: false,
    features: [
      { included: true, text: 'Everything in Professional' },
      { included: true, text: 'Unlimited everything' },
      { included: true, text: 'On-premise deployment' },
      { included: true, text: 'SOC 2 / HIPAA / GDPR' },
      { included: true, text: 'SSO, LDAP, SCIM' },
      { included: true, text: 'Custom tool development' },
      { included: true, text: '99.99% SLA guarantee' },
      { included: true, text: 'Dedicated success team' },
    ]
  }
]

function EnergySection() {
  const IconComponent = ({ name }: { name: keyof typeof Icons }) => {
    const Icon = Icons[name]
    return <Icon />
  }
  
  return (
    <section id="energy" className="relative py-32 overflow-hidden">
      {/* Energy field background */}
      <div className="absolute inset-0">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full bg-gradient-to-r from-cyan-500/5 via-purple-500/5 to-pink-500/5 blur-3xl"/>
      </div>
      
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-20">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-amber-500/10 border border-amber-500/20 mb-6">
            <Icons.ParticleCollider />
            <span className="text-sm text-amber-300 font-medium">Energy Tiers</span>
          </div>
          
          <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-6 leading-tight">
            Choose Your
            <br/>
            <span className="bg-gradient-to-r from-cyan-400 via-purple-500 to-pink-500 bg-clip-text text-transparent">
              Energy Level
            </span>
          </h2>
          
          <p className="text-slate-400 max-w-2xl mx-auto text-lg">
            Start with infinite potential. Upgrade when you're ready to unlock new capabilities.
          </p>
        </div>
        
        {/* Pricing Cards */}
        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto items-stretch">
          {energyPlans.map((plan, idx) => (
            <div key={idx} className={`relative ${plan.popular ? 'md:-mt-4 md:mb-4' : ''}`}>
              {/* Popular badge */}
              {plan.popular && (
                <div className="absolute -top-5 left-1/2 -translate-x-1/2 z-10">
                  <Badge className="bg-gradient-to-r from-cyan-500 via-purple-500 to-pink-500 text-white border-0 px-4 py-1.5 text-sm shadow-lg">
                    ⭐ Most Popular
                  </Badge>
                </div>
              )}
              
              <HolographicCard className="h-full">
                {/* Plan Header */}
                <div className="flex items-center gap-3 mb-4">
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${plan.gradient} flex items-center justify-center text-white`}>
                    <IconComponent name={plan.icon as keyof typeof Icons} />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white">{plan.name}</h3>
                    <p className="text-xs text-slate-500">{plan.subtitle}</p>
                  </div>
                </div>
                
                {/* Price */}
                <div className="my-6">
                  <span className="text-5xl font-bold text-white">{plan.price}</span>
                  <span className="text-slate-400 ml-1">{plan.period}</span>
                </div>
                
                <p className="text-sm text-slate-400 mb-6">{plan.description}</p>
                
                {/* CTA */}
                <Button className={`w-full mb-6 ${
                  plan.popular 
                    ? 'bg-gradient-to-r from-cyan-500 via-purple-500 to-pink-500 hover:from-cyan-400 hover:via-purple-400 hover:to-pink-400 text-white shadow-lg' 
                    : 'bg-slate-800 hover:bg-slate-700 text-white'
                }`}>
                  {plan.cta}
                </Button>
                
                {/* Features */}
                <ul className="space-y-3">
                  {plan.features.map((feature, fIdx) => (
                    <li key={fIdx} className="flex items-start gap-2">
                      <span className={feature.included ? 'text-cyan-400 mt-0.5' : 'text-slate-700 mt-0.5'}>
                        <Icons.CheckCircle />
                      </span>
                      <span className={`text-sm ${feature.included ? 'text-slate-300' : 'text-slate-600'}`}>
                        {feature.text}
                      </span>
                    </li>
                  ))}
                </ul>
              </HolographicCard>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ============ CTA SECTION - THE PORTAL OPENS ============
function CTAPortalSection() {
  return (
    <section className="relative py-32 overflow-hidden">
      {/* Dramatic background */}
      <div className="absolute inset-0 bg-gradient-to-b from-slate-950 via-purple-950/30 to-slate-950"/>
      
      {/* Animated rings */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        {[...Array(5)].map((_, i) => (
          <div
            key={i}
            className="absolute rounded-full border border-white/5"
            style={{
              width: `${200 + i * 150}px`,
              height: `${200 + i * 150}px`,
              animation: `spin ${20 + i * 5}s linear infinite reverse`,
              opacity: 0.3 - i * 0.05
            }}
          >
            <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-cyan-400"/>
          </div>
        ))}
      </div>
      
      <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        {/* Open source badge */}
        <div className="inline-flex items-center gap-3 px-5 py-2.5 rounded-full bg-white/5 border border-white/10 mb-8 backdrop-blur-xl">
          <Icons.Github />
          <span className="text-sm text-slate-300">100% Open Source Core</span>
          <Separator orientation="vertical" className="h-4 bg-white/20"/>
          <span className="text-sm text-cyan-400">MIT License</span>
        </div>
        
        <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-6 leading-tight">
          Ready to Enter the
          <br/>
          <span className="bg-gradient-to-r from-cyan-400 via-purple-500 to-pink-500 bg-clip-text text-transparent">
            Next Dimension
          </span>
          <br/>
          <span className="text-white">of Discovery?</span>
        </h2>
        
        <p className="text-lg text-slate-400 mb-12 max-w-2xl mx-auto">
          Join the revolution. Scientists from MIT to CERN are already using SciHub Pro 
          to accelerate their breakthroughs. Your next discovery awaits.
        </p>
        
        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-5 mb-16">
          <Button size="lg" className="group relative px-12 py-8 text-xl bg-gradient-to-r from-cyan-500 via-purple-500 to-pink-500 hover:from-cyan-400 hover:via-purple-400 hover:to-pink-400 text-white shadow-2xl shadow-purple-500/30 overflow-hidden">
            <span className="relative z-10 flex items-center gap-3">
              <Icons.Rocket />
              <span className="font-bold">Begin Your Journey</span>
            </span>
            <div className="absolute inset-0 bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 opacity-0 group-hover:opacity-100 transition-opacity duration-500"/>
          </Button>
          
          <Button size="lg" variant="outline" className="px-12 py-8 text-xl border-white/20 text-white hover:bg-white/5 hover:border-white/30">
            <span className="flex items-center gap-3">
              <Icons.Globe />
              <span>Explore Docs</span>
            </span>
          </Button>
        </div>
        
        {/* Trust indicators */}
        <div className="pt-8 border-t border-white/10">
          <p className="text-sm text-slate-500 mb-6">Powering discoveries at</p>
          <div className="flex flex-wrap items-center justify-center gap-8 md:gap-12">
            {['MIT', 'Stanford', 'Harvard', 'Max Planck Institute', 'CERN', 'NIH', 'NASA JPL'].map((inst) => (
              <span key={inst} className="text-white/40 font-semibold text-lg hover:text-white/70 transition-colors cursor-default">
                {inst}
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

// ============ FOOTER ============
function Footer() {
  return (
    <footer className="bg-slate-950 border-t border-white/5 py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 md:grid-cols-6 gap-8 mb-12">
          {/* Brand */}
          <div className="col-span-2 md:col-span-2">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-400 to-purple-500 flex items-center justify-center text-white">
                <Icons.QuantumField />
              </div>
              <div>
                <span className="text-white font-bold text-lg">SciHub Pro</span>
                <div className="text-xs text-slate-500">Quantum Edition</div>
              </div>
            </div>
            <p className="text-sm text-slate-500 leading-relaxed mb-4">
              The Scientific GitHub of Tomorrow. Democratizing discovery through open-source innovation.
            </p>
            <div className="flex items-center gap-3">
              <a href="#" className="w-9 h-9 rounded-lg bg-slate-900 flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-800 transition-all">
                <Icons.Github />
              </a>
              <a href="#" className="w-9 h-9 rounded-lg bg-slate-900 flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-800 transition-all">
                <Icons.Globe />
              </a>
            </div>
          </div>
          
          {/* Link columns */}
          {[
            { title: 'Product', links: ['Features', 'Pricing', 'Enterprise', 'Changelog', 'Roadmap'] },
            { title: 'Resources', links: ['Documentation', 'API Reference', 'Tutorials', 'Blog', 'Community'] },
            { title: 'Company', links: ['About', 'Careers', 'Contact', 'Press', 'Partners'] },
            { title: 'Legal', links: ['Privacy', 'Terms', 'Security', 'Compliance', 'GDPR'] },
          ].map((col) => (
            <div key={col.title}>
              <h4 className="text-white font-semibold mb-4 text-sm">{col.title}</h4>
              <ul className="space-y-2.5">
                {col.links.map((link) => (
                  <li key={link}>
                    <a href="#" className="text-sm text-slate-500 hover:text-cyan-400 transition-colors">
                      {link}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        
        <Separator className="bg-slate-900 mb-8"/>
        
        {/* Bottom bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-slate-600">
          <p>© 2026 SciHub Pro. Built with ♥ for science.</p>
          <p>Made possible by open source.</p>
        </div>
      </div>
    </footer>
  )
}

// ============ MAIN PAGE COMPONENT ============
export default function HomePage() {
  const [currentPreview, setCurrentPreview] = useState(2)
  
  // Import preview 1 dynamically
  const [Preview1Component, setPreview1Component] = useState<React.ComponentType | null>(null)
  
  useEffect(() => {
    import('./preview1/page').then(mod => {
      setPreview1Component(() => mod.default)
    })
  }, [])
  
  return (
    <main className="min-h-screen bg-slate-950 text-white overflow-x-hidden">
      <style jsx global>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .perspective-1000 {
          perspective: 1000px;
        }
      `}</style>
      
      {/* Preview Switcher */}
      <PreviewSwitcher currentPreview={currentPreview} onSwitch={setCurrentPreview} />
      
      {/* Render based on selected preview */}
      {currentPreview === 2 ? (
        <>
          <Navigation />
          <HeroSection />
          <DimensionsSection />
          <ForcesSection />
          <EnergySection />
          <CTAPortalSection />
          <Footer />
        </>
      ) : (
        Preview1Component && <Preview1Component />
      )}
    </main>
  )
}
