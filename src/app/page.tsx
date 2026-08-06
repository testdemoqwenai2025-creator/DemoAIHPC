'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'

// ============ COMPREHENSIVE ICON SYSTEM ============
const Icons = {
  // Core Infrastructure Icons
  QuantumCore: () => (
    <svg viewBox="0 0 100 100" className="w-full h-full">
      <defs>
        <radialGradient id="qCore" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#00ffff" stopOpacity="1"/>
          <stop offset="40%" stopColor="#8b5cf6" stopOpacity="0.8"/>
          <stop offset="100%" stopColor="#ec4899" stopOpacity="0"/>
        </radialGradient>
        <filter id="qGlow"><feGaussianBlur stdDeviation="3"/></filter>
      </defs>
      <circle cx="50" cy="50" r="45" fill="url(#qCore)" filter="url(#qGlow)"/>
      {[...Array(8)].map((_, i) => {
        const angle = (i * 45) * Math.PI / 180
        const x = 50 + Math.cos(angle) * 30
        const y = 50 + Math.sin(angle) * 30
        return <circle key={i} cx={x} cy={y} r={5+i%2*2} fill={`hsl(${180+i*20},80%,60%)`}>
          <animate attributeName="r" values={`${4+i%2};${6+i%2};${4+i%2}`} dur={`${2+i*0.3}s`} repeatCount="indefinite"/>
        </circle>
      })}
      <circle cx="50" cy="50" r="12" fill="white" opacity="0.9">
        <animate attributeName="r" values="10;14;10" dur="2s" repeatCount="indefinite"/>
      </circle>
    </svg>),

  DatabaseCluster: () => (
    <svg viewBox="0 0 100 100" className="w-full h-full">
      <defs>
        <linearGradient id="dbGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#06b6d4"/><stop offset="100%" stopColor="#3b82f6"/>
        </linearGradient>
      </defs>
      {[-15, 0, 15].map((offset, i) => (
        <g key={i}>
          <ellipse cx="50" cy={35+offset} rx="35" ry="12" fill="none" stroke="url(#dbGrad)" strokeWidth="2.5" opacity={0.6+i*0.15}/>
          <path d={`M15 ${35+offset} L15 ${55+offset} A35 12 0 0 0 85 ${55+offset}`} fill="none" stroke="url(#dbGrad)" strokeWidth="2.5" opacity={0.6+i*0.15}/>
          <ellipse cx="50" cy={55+offset} rx="35" ry="12" fill={`rgba(6,182,212,${0.05+i*0.05})`} stroke="url(#dbGrad)" strokeWidth="2.5" opacity={0.6+i*0.15}/>
        </g>
      ))}
    </svg>),

  DataLake: () => (
    <svg viewBox="0 0 100 100" className="w-full h-full">
      <defs>
        <linearGradient id="lakeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#0891b2"/><stop offset="100%" stopColor="#1e40af"/>
        </linearGradient>
        <pattern id="waves" patternUnits="userSpaceOnUse" width="10" height="10">
          <path d="M0 5 Q2.5 2 5 5 T10 5" fill="none" stroke="white" strokeWidth="0.5" opacity="0.3"/>
        </pattern>
      </defs>
      <ellipse cx="50" cy="55" rx="45" ry="25" fill="url(#lakeGrad)"/>
      <ellipse cx="50" cy="55" rx="45" ry="25" fill="url(#waves)">
        <animateTransform attributeName="transform" type="translate" values="0,0;5,0;0,0" dur="3s" repeatCount="indefinite"/>
      </ellipse>
      {/* Data waves */}
      {[...Array(5)].map((_, i) => (
        <path key={i} d={`M${10+i*15} ${45-i*3} Q${17+i*15} ${40-i*3} ${25+i*15} ${45-i*3}`} 
              fill="none" stroke="white" strokeWidth="1" opacity="0.4">
          <animate attributeName="d" 
            values={`M${10+i*15} ${45-i*3} Q${17+i*15} ${40-i*3} ${25+i*15} ${45-i*3};
                    M${10+i*15} ${42-i*3} Q${17+i*15} ${37-i*3} ${25+i*15} ${42-i*3};
                    M${10+i*15} ${45-i*3} Q${17+i*15} ${40-i*3} ${25+i*15} ${45-i*3}`}
            dur="2s" repeatCount="indefinite"/>
        </path>
      ))}
    </svg>),

  StreamingPipe: () => (
    <svg viewBox="0 0 100 100" className="w-full h-full">
      <defs>
        <linearGradient id="streamGrad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#22c55e"/><stop offset="50%" stopColor="#eab308"/><stop offset="100%" stopColor="#ef4444"/>
        </linearGradient>
      </defs>
      {/* Pipe */}
      <rect x="10" y="42" width="80" height="16" rx="8" fill="none" stroke="url(#streamGrad)" strokeWidth="3"/>
      {/* Flowing particles */}
      {[...Array(6)].map((_, i) => (
        <circle key={i} cy="50" r="4" fill={`hsl(${120-i*20},70%,50%)`}>
          <animateMotion path="M15,50 L85,50" dur={`${1+i*0.3}s`} repeatCount="indefinite" begin={`${i*0.2}s`}/>
        </circle>
      ))}
      {/* Input/Output */}
      <circle cx="10" cy="50" r="8" fill="#22c55e" opacity="0.3"/>
      <circle cx="90" cy="50" r="8" fill="#ef4444" opacity="0.3"/>
    </svg>),

  ConnectorHub: () => (
    <svg viewBox="0 0 100 100" className="w-full h-full">
      <defs>
        <radialGradient id="hubGlow"><stop offset="0%" stopColor="#a855f7" stopOpacity="0.5"/><stop offset="100%" stopColor="transparent"/></radialGradient>
      </defs>
      {/* Center hub */}
      <circle cx="50" cy="50" r="18" fill="#1e1b4b" stroke="#a855f7" strokeWidth="2"/>
      <circle cx="50" cy="50" r="8" fill="#a855f7">
        <animate attributeName="r" values="6;10;6" dur="2s" repeatCount="indefinite"/>
      </circle>
      {/* Spokes */}
      {[...Array(8)].map((_, i) => {
        const angle = (i * 45) * Math.PI / 180
        const x = 50 + Math.cos(angle) * 38
        const y = 50 + Math.sin(angle) * 38
        return (
          <g key={i}>
            <line x1="50" y1="50" x2={x} y2={y} stroke="#a855f7" strokeWidth="1.5" opacity="0.5">
              <animate attributeName="opacity" values="0.3;0.7;0.3" dur={`${1.5+i*0.2}s`} repeatCount="indefinite"/>
            </line>
            <circle cx={x} cy={y} r="6" fill="#1e1b4b" stroke={`hsl(${270+i*15},70%,60%)`} strokeWidth="1.5"/>
          </g>
        )
      })}
      <circle cx="50" cy="50" r="45" fill="url(#hubGlow)"/>
    </svg>),

  IDECode: () => (
    <svg viewBox="0 0 100 100" className="w-full h-full">
      <defs>
        <linearGradient id="ideGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#1e293b"/><stop offset="100%" stopColor="#0f172a"/>
        </linearGradient>
      </defs>
      <rect x="10" y="15" width="80" height="70" rx="8" fill="url(#ideGrad)" stroke="#334155" strokeWidth="2"/>
      {/* Title bar */}
      <rect x="10" y="15" width="80" height="16" rx="8" fill="#1e293b"/>
      <circle cx="22" cy="23" r="3" fill="#ef4444"/>
      <circle cx="32" cy="23" r="3" fill="#eab308"/>
      <circle cx="42" cy="23" r="3" fill="#22c55e"/>
      {/* Code lines */}
      {['const', 'data', '=','await', 'fetch()'].map((text, i) => (
        <text key={i} x="18" y={42+i*12} fill={['#c084fc','#67e8f9','#f472b6','#fbbf24','#34d399'][i]} 
              fontSize="8" fontFamily="monospace">{text}</text>
      ))}
      {/* Cursor blink */}
      <rect x="52" y="84" width="2" height="10" fill="#22d3ee">
        <animate attributeName="opacity" values="1;0;1" dur="1s" repeatCount="indefinite"/>
      </rect>
    </svg>),

  BlogPublish: () => (
    <svg viewBox="0 0 100 100" className="w-full h-full">
      <defs>
        <linearGradient id="blogGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#f43f5e"/><stop offset="100%" stopColor="#ec4899"/>
        </linearGradient>
      </defs>
      <rect x="15" y="10" width="70" height="80" rx="6" fill="#fff" stroke="url(#blogGrad)" strokeWidth="2"/>
      {/* Header */}
      <rect x="15" y="10" width="70" height="20" rx="6" fill="url(#blogGrad)"/>
      <text x="50" y="24" textAnchor="middle" fill="white" fontSize="8" fontWeight="bold">PAPER</text>
      {/* Content lines */}
      {[28,38,48,56].map((y, i) => (
        <line key={i} x1="22" y1={y} x2={78-i*8} y2={y} stroke="#e2e8f0" strokeWidth="2" strokeLinecap="round"/>
      ))}
      {/* Image placeholder */}
      <rect x="22" y="64" width="30" height="18" rx="2" fill="#f1f5f9" stroke="#cbd5e1" strokeWidth="1"/>
      {/* Publish badge */}
      <circle cx="72" cy="78" r="10" fill="#22c55e"/>
      <text x="72" y="81" textAnchor="middle" fill="white" fontSize="8" fontWeight="bold">✓</text>
    </svg>),

  APILayer: () => (
    <svg viewBox="0 0 100 100" className="w-full h-full">
      <defs>
        <linearGradient id="apiGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#3b82f6"/><stop offset="100%" stopColor="#8b5cf6"/>
        </linearGradient>
      </defs>
      {/* REST box */}
      <rect x="10" y="30" width="35" height="40" rx="4" fill="none" stroke="#3b82f6" strokeWidth="2"/>
      <text x="27" y="50" textAnchor="middle" fill="#3b82f6" fontSize="9" fontWeight="bold">REST</text>
      {/* GraphQL box */}
      <rect x="55" y="30" width="35" height="40" rx="4" fill="none" stroke="#8b5cf6" strokeWidth="2"/>
      <text x="72" y="46" textAnchor="middle" fill="#8b5cf6" fontSize="7" fontWeight="bold">GraphQL</text>
      <text x="72" y="58" textAnchor="middle" fill="#8b5cf6" fontSize="7" fontWeight="bold">WS</text>
      {/* Arrows */}
      <path d="M45 45 L55 45" stroke="url(#apiGrad)" strokeWidth="2" markerEnd="url(#arrow)"/>
      <path d="M27 75 L27 85 L50 85 L50 95 M72 75 L72 85 L50 85" stroke="#94a3b8" strokeWidth="1.5" fill="none"/>
      <defs><marker id="arrow" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto"><path d="M0,0 L6,3 L0,6Z" fill="url(#apiGrad)"/></marker></defs>
    </svg>),

  Middleware: () => (
    <svg viewBox="0 0 100 100" className="w-full h-full">
      <defs>
        <linearGradient id="mwGrad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#f97316"/><stop offset="50%" stopColor="#eab308"/><stop offset="100%" stopColor="#84cc16"/>
        </linearGradient>
      </defs>
      {/* Layers */}
      {[
        { y: 15, label: 'Auth', color: '#f97316' },
        { y: 32, label: 'Rate', color: '#eab308' },
        { y: 49, label: 'Cache', color: '#84cc16' },
        { y: 66, label: 'Log', color: '#22c55e' }
      ].map((layer, i) => (
        <g key={i}>
          <rect x="15" y={layer.y} width="70" height="14" rx="3" fill={`${layer.color}20`} stroke={layer.color} strokeWidth="1.5"/>
          <text x="50" y={layer.y+10} textAnchor="middle" fill={layer.color} fontSize="8" fontWeight="bold">{layer.label}</text>
        </g>
      ))}
      {/* Vertical flow arrow */}
      <line x1="90" y1="22" x2="90" y2="73" stroke="url(#mwGrad)" strokeWidth="2" markerEnd="url(#mwArrow)"/>
      <defs><marker id="mwArrow" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto"><path d="M0,0 L6,3 L0,6Z" fill="#84cc16"/></marker></defs>
    </svg>),

  FileFormat: () => (
    <svg viewBox="0 0 100 100" className="w-full h-full">
      <defs>
        <linearGradient id="fileGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#06b6d4"/><stop offset="100%" stopColor="#0ea5e9"/>
        </linearGradient>
      </defs>
      {/* Folder */}
      <path d="M15 30 L15 80 Q15 85 20 85 L80 85 Q85 85 85 80 L85 35 Q85 30 80 30 L45 30 L40 25 L20 25 Q15 25 15 30Z" 
            fill="url(#fileGrad)" opacity="0.2" stroke="url(#fileGrad)" strokeWidth="2"/>
      {/* Files inside */}
      {[
        { x: 28, y: 45, ext: '.pq', color: '#22c55e' },
        { x: 45, y: 50, ext: '.av', color: '#3b82f6' },
        { x: 62, y: 45, ext: '.orc', color: '#f97316' }
      ].map((file, i) => (
        <g key={i}>
          <rect x={file.x} y={file.y} width="16" height="20" rx="2" fill="white" stroke={file.color} strokeWidth="1.5"/>
          <text x={file.x+8} y={file.y+14} textAnchor="middle" fill={file.color} fontSize="6" fontWeight="bold">{file.ext}</text>
        </g>
      ))}
    </svg>),

  Satellite: () => (
    <svg viewBox="0 0 100 100" className="w-full h-full">
      <defs>
        <linearGradient id="satGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#6366f1"/><stop offset="100%" stopColor="#8b5cf6"/>
        </linearGradient>
      </defs>
      {/* Body */}
      <rect x="35" y="42" width="30" height="18" rx="3" fill="url(#satGrad)"/>
      {/* Solar panels */}
      <rect x="10" y="45" width="22" height="12" rx="1" fill="#1e40af" stroke="#3b82f6" strokeWidth="1"/>
      <rect x="68" y="45" width="22" height="12" rx="1" fill="#1e40af" stroke="#3b82f6" strokeWidth="1"/>
      {/* Panel lines */}
      {[13,18,23,71,76,81].map((x, i) => (
        <line key={i} x1={x} y1="46" x2={x} y2="56" stroke="#60a5fa" strokeWidth="0.5"/>
      ))}
      {/* Antenna */}
      <line x1="50" y1="42" x2="50" y2="32" stroke="#a1a1aa" strokeWidth="2"/>
      <circle cx="50" cy="30" r="3" fill="#ef4444">
        <animate attributeName="opacity" values="1;0.3;1" dur="1s" repeatCount="indefinite"/>
      </circle>
      {/* Orbit ring */}
      <ellipse cx="50" cy="51" rx="45" ry="12" fill="none" stroke="#6366f1" strokeWidth="0.5" strokeDasharray="4 4" opacity="0.5">
        <animateTransform attributeName="transform" type="rotate" from="0 50 51" to="360 50 51" dur="20s" repeatCount="indefinite"/>
      </ellipse>
    </svg>),

  LHCRing: () => (
    <svg viewBox="0 0 100 100" className="w-full h-full">
      <defs>
        <linearGradient id="lhcGrad"><stop offset="0%" stopColor="#ef4444"/><stop offset="50%" stopColor="#eab308"/><stop offset="100%" stopColor="#22c55e"/></linearGradient>
      </defs>
      {/* Ring segments */}
      {[-60,-30,0,30,60].map((angle, i) => (
        <g key={i} transform={`rotate(${angle} 50 50)`}>
          <path d="M50 15 A35 35 0 0 1 85 50" fill="none" stroke={`hsl(${120-i*24},70%,50%)`} strokeWidth="8" strokeLinecap="round" opacity="0.7"/>
        </g>
      ))}
      {/* Center detector */}
      <circle cx="50" cy="50" r="12" fill="#1f2937" stroke="url(#lhcGrad)" strokeWidth="2"/>
      <circle cx="50" cy="50" r="6" fill="#ef4444">
        <animate attributeName="r" values="4;8;4" dur="0.5s" repeatCount="indefinite"/>
      </circle>
      {/* Particles */}
      {[[50,18,'#ef4444'],[82,50,'#eab308'],[50,82,'#22c55e'],[18,50,'#3b82f6']].map(([cx,cy,color], i) => (
        <circle key={i} cx={cx} cy={cy} r="4" fill={color}>
          <animateMotion path="M50,50 A35,35 0 0 1 85,50 A35,35 0 0 1 50,85 A35,35 0 0 1 15,50 A35,35 0 0 1 50,15" 
                       dur="2s" repeatCount="indefinite" begin={`${i*0.5}s`}/>
        </circle>
      ))}
    </svg>),

  GovInstitute: () => (
    <svg viewBox="0 0 100 100" className="w-full h-full">
      <defs>
        <linearGradient id="govGrad" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#1e40af"/><stop offset="100%" stopColor="#1e3a8a"/>
        </linearGradient>
      </defs>
      {/* Building */}
      <rect x="25" y="30" width="50" height="50" fill="url(#govGrad)"/>
      {/* Columns */}
      {[32,42,52,62,72].map((x, i) => (
        <rect key={i} x={x} y="38" width="5" height="37" fill="#dbeafe" opacity="0.8"/>
      ))}
      {/* Roof */}
      <polygon points="50,15 15,35 85,35" fill="#1e3a8a"/>
      {/* Flag */}
      <line x1="50" y1="15" x2="50" y2="5" stroke="#64748b" strokeWidth="1.5"/>
      <rect x="51" y="5" width="12" height="8" fill="#3b82f6"/>
      {/* Steps */}
      <rect x="20" y="80" width="60" height="4" fill="#94a3b8"/>
      <rect x="15" y="86" width="70" height="4" fill="#94a3b8"/>
    </svg>),

  QueryEngine: () => (
    <svg viewBox="0 0 100 100" className="w-full h-full">
      <defs>
        <linearGradient id="qeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#0ea5e9"/><stop offset="100%" stopColor="#06b6d4"/>
        </linearGradient>
      </defs>
      {/* Magnifying glass over data */}
      <circle cx="42" cy="45" r="25" fill="none" stroke="url(#qeGrad)" strokeWidth="4"/>
      <line x1="60" y1="63" x2="80" y2="83" stroke="url(#qeGrad)" strokeWidth="6" strokeLinecap="round"/>
      {/* Data rows inside */}
      {['|','|','|'].map((char, i) => (
        <text key={i} x="28" y={40+i*10} fill="#06b6d4" fontSize="8" fontFamily="monospace" opacity="0.6">{char}████</text>
      ))}
      {/* Search sparkles */}
      {[[65,30],[30,70]].map(([cx,cy], i) => (
        <g key={i}>
          <line x1={cx-5} y1={cy} x2={cx+5} y2={cy} stroke="#eab308" strokeWidth="1.5"/>
          <line x1={cx} y1={cy-5} x2={cx} y2={cy+5} stroke="#eab308" strokeWidth="1.5"/>
          <animateTransform attributeName="transform" type="rotate" from="0 65 30" to="360 65 30" dur="3s" repeatCount="indefinite"/>
        </g>
      ))}
    </svg>),

  NoSQLDB: () => (
    <svg viewBox="0 0 100 100" className="w-full h-full">
      <defs>
        <linearGradient id="nosqlGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#10b981"/><stop offset="100%" stopColor="#059669"/>
        </linearGradient>
      </defs>
      {/* Document shape */}
      <rect x="25" y="15" width="50" height="70" rx="5" fill="white" stroke="url(#nosqlGrad)" strokeWidth="2"/>
      {/* JSON-like content */}
      <text x="33" y="32" fill="#10b981" fontSize="7" fontFamily="monospace">{"{"}</text>
      <text x="38" y="44" fill="#3b82f6" fontSize="6" fontFamily="monospace">"_id":</text>
      <text x="58" y="44" fill="#eab308" fontSize="6" fontFamily="monospace">"..."</text>
      <text x="38" y="54" fill="#3b82f6" fontSize="6" fontFamily="monospace">"data":</text>
      <text x="33" y="66" fill="#10b981" fontSize="7" fontFamily="monospace">{"}"}</text>
      {/* Curly brace decoration */}
      <path d="M68 30 Q75 35 68 50 Q75 65 68 70" fill="none" stroke="#10b981" strokeWidth="1.5" opacity="0.5"/>
    </svg>),

  SparkEngine: () => (
    <svg viewBox="0 0 100 100" className="w-full h-full">
      <defs>
        <linearGradient id="sparkGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#ff6b35"/><stop offset="50%" stopColor="#f7931e"/><stop offset="100%" stopColor="#ffcc02"/>
        </linearGradient>
      </defs>
      {/* Spark logo hexagon-ish */}
      <polygon points="50,15 80,32 80,68 50,85 20,68 20,32" fill="url(#sparkGrad)"/>
      {/* Inner star */}
      <polygon points="50,30 57,45 73,45 60,55 65,70 50,60 35,70 40,55 27,45 43,45" fill="white" opacity="0.9">
        <animateTransform attributeName="transform" type="scale" values="1;1.1;1" dur="2s" repeatCount="indefinite"/>
      </polygon>
    </svg>),

  KafkaIcon: () => (
    <svg viewBox="0 0 100 100" className="w-full h-full">
      <defs>
        <linearGradient id="kafkaGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#231f20"/><stop offset="100%" stopColor="#000000"/>
        </linearGradient>
      </defs>
      <circle cx="50" cy="50" r="40" fill="url(#kafkaGrad)"/>
      {/* Kafka lines */}
      {[...Array(6)].map((_, i) => (
        <g key={i} transform={`rotate(${i*60} 50 50)`}>
          <line x1="50" y1="20" x2="50" y2="45" stroke="white" strokeWidth="2.5" strokeLinecap="round"/>
          <circle cx="50" cy="18" r="4" fill="white"/>
        </g>
      ))}
      <circle cx="50" cy="50" r="8" fill="white"/>
    </svg>),

  FlinkStream: () => (
    <svg viewBox="0 0 100 100" className="w-full h-full">
      <defs>
        <linearGradient id="flinkGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#e91e63"/><stop offset="50%" stopColor="#9c27b0"/><stop offset="100%" stopColor="#673ab7"/>
        </linearGradient>
      </defs>
      {/* Flink triangle-ish with stream */}
      <polygon points="50,15 85,80 15,80" fill="url(#flinkGrad)"/>
      {/* Stream lines */}
      <path d="M30 65 Q40 55 50 60 T70 55" fill="none" stroke="white" strokeWidth="2" opacity="0.6">
        <animate attributeName="d" values="M30 65 Q40 55 50 60 T70 55;M30 60 Q40 65 50 55 T70 60;M30 65 Q40 55 50 60 T70 55" dur="2s" repeatCount="indefinite"/>
      </path>
      {/* Triangle cutout */}
      <polygon points="50,35 65,60 35,60" fill="white" opacity="0.2"/>
    </svg>),

  // Utility icons
  Server: () => (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="8" x="2" y="2" rx="2" ry="2"/><rect width="20" height="8" x="2" y="14" rx="2" ry="2"/><line x1="6" x2="6.01" y1="6" y2="6"/><line x1="6" x2="6.01" y1="18" y2="18"/></svg>),
  Users: () => (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>),
  Zap: () => (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>),
  Shield: () => (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>),
  Cloud: () => (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z"/></svg>),
  Globe: () => (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="2" x2="22" y1="12" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>),
  Lock: () => (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>),
  CheckCircle: () => (<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>),
  ArrowRight: () => (<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>),
  Github: () => (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg>),
  Rocket: () => (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z"/><path d="m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z"/><path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0"/><path d="M12 15v5s3-.55 4-2c1.08-1.62 0-5 0-5"/></svg>),
  Play: () => (<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="5 3 19 12 5 21 5 3"/></svg>),
  Eye: () => (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>),
  Settings: () => (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/></svg>),
  Layers: () => (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/></svg>),
  Folder: () => (<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 20h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.93a2 2 0 0 1-1.66-.9l-.82-1.2A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2z"/></svg>),
}

// ============ ANIMATED BACKGROUND ============
function ArchitectureBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    
    let animationId: number
    let time = 0
    
    const nodes: Array<{x: number; y: number; vx: number; vy: number; size: number; connections: number}> = []
    
    const resize = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }
    
    const init = () => {
      resize()
      for (let i = 0; i < 60; i++) {
        nodes.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          vx: (Math.random() - 0.5) * 0.3,
          vy: (Math.random() - 0.5) * 0.3,
          size: Math.random() * 2 + 1,
          connections: 0
        })
      }
    }
    
    const animate = () => {
      ctx.fillStyle = 'rgba(2, 6, 23, 0.15)'
      ctx.fillRect(0, 0, canvas.width, canvas.height)
      
      time += 0.01
      
      // Draw grid
      ctx.strokeStyle = 'rgba(139, 92, 246, 0.03)'
      ctx.lineWidth = 1
      const gridSize = 50
      for (let x = 0; x < canvas.width; x += gridSize) {
        for (let y = 0; y < canvas.height; y += gridSize) {
          ctx.strokeRect(x, y, gridSize, gridSize)
        }
      }
      
      // Update and draw nodes
      nodes.forEach((node, i) => {
        node.x += node.vx
        node.y += node.vy
        
        if (node.x < 0 || node.x > canvas.width) node.vx *= -1
        if (node.y < 0 || node.y > canvas.height) node.vy *= -1
        
        // Node glow
        const gradient = ctx.createRadialGradient(node.x, node.y, 0, node.x, node.y, node.size * 8)
        gradient.addColorStop(0, `rgba(6, 182, 212, 0.3)`)
        gradient.addColorStop(1, 'transparent')
        ctx.fillStyle = gradient
        ctx.beginPath()
        ctx.arc(node.x, node.y, node.size * 8, 0, Math.PI * 2)
        ctx.fill()
        
        // Node core
        ctx.fillStyle = `hsl(${180 + i * 3}, 70%, 60%)`
        ctx.beginPath()
        ctx.arc(node.x, node.y, node.size, 0, Math.PI * 2)
        ctx.fill()
        
        // Connections
        nodes.slice(i + 1).forEach((other) => {
          const dx = node.x - other.x
          const dy = node.y - other.y
          const dist = Math.sqrt(dx * dx + dy * dy)
          
          if (dist < 150) {
            ctx.beginPath()
            ctx.moveTo(node.x, node.y)
            
            // Curved connection
            const midX = (node.x + other.x) / 2 + Math.sin(time + i) * 20
            const midY = (node.y + other.y) / 2 + Math.cos(time + i) * 20
            ctx.quadraticCurveTo(midX, midY, other.x, other.y)
            
            ctx.strokeStyle = `rgba(139, 92, 246, ${(1 - dist / 150) * 0.2})`
            ctx.lineWidth = 0.5
            ctx.stroke()
          }
        })
      })
      
      animationId = requestAnimationFrame(animate)
    }
    
    init()
    animate()
    
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

// ============ MICROSERVICE CARD COMPONENT ============
function MicroserviceCard({ 
  icon, title, subtitle, description, status, metrics, tags, color, delay = 0 
}: {
  icon: keyof typeof Icons; title: string; subtitle?: string; description: string;
  status: 'active' | 'scaling' | 'idle'; metrics?: { label: string; value: string }[];
  tags?: string[]; color: string; delay?: number
}) {
  const [hovered, setHovered] = useState(false)
  const IconComponent = Icons[icon]
  
  const statusColors = {
    active: 'bg-emerald-500',
    scaling: 'bg-amber-500',
    idle: 'bg-slate-500'
  }
  
  const borderColors = {
    emerald: 'border-emerald-500/30 hover:border-emerald-400/50 hover:shadow-emerald-500/20',
    cyan: 'border-cyan-500/30 hover:border-cyan-400/50 hover:shadow-cyan-500/20',
    purple: 'border-purple-500/30 hover:border-purple-400/50 hover:shadow-purple-500/20',
    pink: 'border-pink-500/30 hover:border-pink-400/50 hover:shadow-pink-500/20',
    orange: 'border-orange-500/30 hover:border-orange-400/50 hover:shadow-orange-500/20',
    blue: 'border-blue-500/30 hover:border-blue-400/50 hover:shadow-blue-500/20',
    green: 'border-green-500/30 hover:border-green-400/50 hover:shadow-green-500/20',
  }
  
  return (
    <Card 
      className={`group relative bg-slate-900/60 backdrop-blur-xl border ${borderColors[color] || borderColors.purple} transition-all duration-500 overflow-hidden`}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{ 
        transform: hovered ? 'translateY(-4px) scale(1.02)' : 'translateY(0) scale(1)',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
      }}
    >
      {/* Glow effect */}
      <div className={`absolute inset-0 bg-gradient-to-br ${
        color === 'emerald' ? 'from-emerald-500/5 to-transparent' :
        color === 'cyan' ? 'from-cyan-500/5 to-transparent' :
        color === 'purple' ? 'from-purple-500/5 to-transparent' :
        color === 'pink' ? 'from-pink-500/5 to-transparent' :
        color === 'orange' ? 'from-orange-500/5 to-transparent' :
        'from-blue-500/5 to-transparent'
      } opacity-0 group-hover:opacity-100 transition-opacity duration-500`}/>
      
      <CardContent className="p-5 relative">
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className={`w-12 h-12 rounded-xl bg-slate-800 flex items-center justify-center text-white group-hover:scale-110 transition-transform duration-300`}>
              <IconComponent />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-white text-sm">{title}</h3>
                <span className={`w-2 h-2 rounded-full ${statusColors[status]} animate-pulse`}/>
              </div>
              {subtitle && <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>}
            </div>
          </div>
          
          {/* Status indicator */}
          <Badge variant="outline" className={`text-xs capitalize ${
            status === 'active' ? 'border-emerald-500/50 text-emerald-400' :
            status === 'scaling' ? 'border-amber-500/50 text-amber-400' :
            'border-slate-500/50 text-slate-400'
          }`}>
            {status}
          </Badge>
        </div>
        
        {/* Description */}
        <p className="text-xs text-slate-400 leading-relaxed mb-3 line-clamp-2">
          {description}
        </p>
        
        {/* Tags */}
        {tags && (
          <div className="flex flex-wrap gap-1 mb-3">
            {tags.slice(0, 3).map(tag => (
              <Badge key={tag} variant="secondary" className="text-[10px] px-1.5 py-0 bg-slate-800/50 text-slate-400">
                {tag}
              </Badge>
            ))}
            {tags.length > 3 && (
              <Badge variant="secondary" className="text-[10px] px-1.5 py-0 bg-slate-800/50 text-slate-500">
                +{tags.length - 3}
              </Badge>
            )}
          </div>
        )}
        
        {/* Metrics */}
        {metrics && (
          <div className="grid grid-cols-2 gap-2 pt-3 border-t border-slate-800">
            {metrics.map(({ label, value }) => (
              <div key={label} className="text-center">
                <div className="text-sm font-bold text-white">{value}</div>
                <div className="text-[10px] text-slate-500">{label}</div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// ============ CONNECTOR CARD ============
function ConnectorCard({ name, category, status, dataSources }: {
  name: string; category: string; status: 'connected' | 'available' | 'configuring'; dataSources: string[]
}) {
  const categoryIcons: Record<string, string> = {
    'Genomics': '🧬',
    'Chemistry': '⚗️',
    'Physics': '🌌',
    'Public Data': '🌐',
    'Satellite': '🛰️',
    'Research': '📚',
    'Government': '🏛️',
    'Health': '🏥',
  }
  
  return (
    <Card className="group bg-slate-900/40 backdrop-blur-sm border border-slate-800/50 hover:border-purple-500/30 transition-all duration-300 hover:-translate-y-1">
      <CardContent className="p-4">
        <div className="flex items-center gap-3 mb-2">
          <span className="text-2xl">{categoryIcons[category] || '🔗'}</span>
          <div className="flex-1 min-w-0">
            <h4 className="font-medium text-white text-sm truncate">{name}</h4>
            <p className="text-[10px] text-slate-500">{category}</p>
          </div>
          <span className={`w-2 h-2 rounded-full ${
            status === 'connected' ? 'bg-emerald-500' :
            status === 'available' ? 'bg-amber-500' : 'bg-blue-500 animate-pulse'
          }`}/>
        </div>
        
        <div className="flex flex-wrap gap-1">
          {dataSources.slice(0, 2).map(ds => (
            <Badge key={ds} variant="outline" className="text-[9px] px-1 py-0 border-slate-700 text-slate-400">
              {ds}
            </Badge>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

// ============ ARCHITECTURE FLOW DIAGRAM ============
function ArchitectureFlow() {
  const layers = [
    { name: 'Client Layer', components: ['Web IDE', 'Notebook', 'CLI', 'Mobile API'], color: 'cyan' },
    { name: 'API Gateway', components: ['REST', 'GraphQL', 'WebSocket', 'gRPC'], color: 'purple' },
    { name: 'Middleware', components: ['Auth', 'Rate Limit', 'Cache', 'Logger'], color: 'amber' },
    { name: 'Microservices', components: ['BioInfo', 'Chemo', 'Physics', 'DataSci', 'Compute'], color: 'pink' },
    { name: 'Data Layer', components: ['BigQuery Engine', 'PostgreSQL', 'MongoDB', 'Redis', 'Data Lake'], color: 'emerald' },
    { name: 'Streaming', components: ['Kafka', 'Flink', 'Spark Streaming', 'Connectors'], color: 'blue' },
    { name: 'Infrastructure', components: ['Kubernetes', 'Docker', 'GPU Cluster', 'Object Storage', 'CDN'], color: 'slate' },
  ]
  
  const colorMap: Record<string, string> = {
    cyan: 'border-cyan-500/30 bg-cyan-500/5',
    purple: 'border-purple-500/30 bg-purple-500/5',
    amber: 'border-amber-500/30 bg-amber-500/5',
    pink: 'border-pink-500/30 bg-pink-500/5',
    emerald: 'border-emerald-500/30 bg-emerald-500/5',
    blue: 'border-blue-500/30 bg-blue-500/5',
    slate: 'border-slate-500/30 bg-slate-500/5',
  }
  
  return (
    <div className="space-y-3 max-w-4xl mx-auto">
      {layers.map((layer, idx) => (
        <div key={idx} className={`rounded-xl border ${colorMap[layer.color]} p-4 transition-all hover:scale-[1.01]`}>
          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            <div className="sm:w-36 flex-shrink-0">
              <div className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full ${
                  layer.color === 'cyan' ? 'bg-cyan-400' :
                  layer.color === 'purple' ? 'bg-purple-400' :
                  layer.color === 'amber' ? 'bg-amber-400' :
                  layer.color === 'pink' ? 'bg-pink-400' :
                  layer.color === 'emerald' ? 'bg-emerald-400' :
                  layer.color === 'blue' ? 'bg-blue-400' : 'bg-slate-400'
                }`}/>
                <h4 className="font-semibold text-white text-sm">{layer.name}</h4>
              </div>
            </div>
            <div className="flex-1 flex flex-wrap gap-2">
              {layer.components.map(comp => (
                <Badge key={comp} variant="outline" className="text-xs border-current text-slate-300 hover:bg-white/5 transition-colors"
                  style={{ borderColor: `${layer.color === 'cyan' ? '#06b6d4' : layer.color === 'purple' ? '#a855f7' : layer.color === 'amber' ? '#f59e0b' : layer.color === 'pink' ? '#ec4899' : layer.color === 'emerald' ? '#10b981' : layer.color === 'blue' ? '#3b82f6' : '#64748b'}40` }}>
                  {comp}
                </Badge>
              ))}
            </div>
          </div>
          {/* Connection to next layer */}
          {idx < layers.length - 1 && (
            <div className="flex justify-center mt-2">
              <div className="w-0.5 h-3 bg-gradient-to-b from-current to-transparent opacity-30"/>
            </div>
          )}
        </div>
      ))}
    </div>
  )
}

// ============ MAIN DASHBOARD COMPONENT ============
export default function MicroservicesDashboard() {
  const [activeTab, setActiveTab] = useState<'overview' | 'services' | 'data' | 'streaming' | 'ide' | 'publish'>('overview')
  const [selectedService, setSelectedService] = useState<string | null>(null)
  
  const tabs = [
    { id: 'overview', label: 'Overview', icon: 'Layers' },
    { id: 'services', label: 'Services', icon: 'Server' },
    { id: 'data', label: 'Data Layer', icon: 'DatabaseCluster' },
    { id: 'streaming', label: 'Streaming', icon: 'StreamingPipe' },
    { id: 'ide', label: 'IDE Studio', icon: 'IDECode' },
    { id: 'publish', label: 'Publish', icon: 'BlogPublish' },
  ] as const
  
  // Microservices definitions
  const microservices = [
    // Scientific Tools
    { icon: 'QueryEngine', title: 'BigQuery Engine', subtitle: 'Distributed SQL Analytics', description: 'Petabyte-scale query engine with columnar storage, automatic partitioning, and ML-powered query optimization. Similar to Google BigQuery but open-source.', status: 'active', color: 'cyan', tags: ['SQL', 'Columnar', 'ML Optimized', 'PB Scale'], metrics: [{ label: 'Queries/sec', value: '50K+' }, { label: 'Latency', value: '<100ms' }] },
    { icon: 'NoSQLDB', title: 'Document Store', subtitle: 'Flexible Schema Storage', description: 'MongoDB-compatible document database optimized for semi-structured research data, nested experiments, and evolving schemas.', status: 'active', color: 'green', tags: ['MongoDB', 'JSON', 'Flexible Schema', 'Sharding'], metrics: [{ label: 'Documents', value: '10B+' }, { label: 'Ops/sec', value: '100K' }] },
    { icon: 'DataLake', title: 'Data Lake', subtitle: 'Unified Binary Storage', description: 'S3-compatible object storage for binary data from satellites, LHC, sequencing machines, microscopes, and government datasets. Supports all file formats.', status: 'active', color: 'blue', tags: ['S3', 'Parquet', 'AVRO', 'ORC', 'Binary'], metrics: [{ label: 'Storage', value: '50 PB' }, { label: 'Files', value: '1B+' }] },
    { icon: 'FileFormat', title: 'Format Converter', subtitle: 'Universal Parser', description: 'Automatic detection and conversion between Parquet, AVRO, ORC, FASTQ, BAM, CIF, PDB, XYZ, and 50+ scientific formats with metadata preservation.', status: 'active', color: 'orange', tags: ['Parquet', 'AVRO', 'ORC', 'FASTQ', 'BAM', 'PDB'], metrics: [{ label: 'Formats', value: '50+' }, { label: 'Throughput', value: '1 GB/s' }] },
    
    // Connectors
    { icon: 'ConnectorHub', title: 'Connector Hub', subtitle: 'External Platform Integration', description: 'Universal connector system for 100+ free platforms: NCBI, EBI, PDB, NASA, ESA, CERN Open Data, World Bank, NOAA, USGS, and more.', status: 'active', color: 'purple', tags: ['NCBI', 'EBI', 'PDB', 'NASA', 'ESA', 'CERN'], metrics: [{ label: 'Connectors', value: '100+' }, { label: 'Sync Rate', value: 'Real-time' }] },
    { icon: 'Satellite', title: 'Satellite Ingest', subtitle: 'Earth Observation Pipeline', description: 'Direct ingestion from Landsat, Sentinel, MODIS, and commercial satellites. Automatic geospatial indexing and analysis pipelines.', status: 'scaling', color: 'blue', tags: ['Landsat', 'Sentinel', 'MODIS', 'Copernicus', 'EOSDIS'], metrics: [{ label: 'Images/day', value: '100K+' }, { label: 'Storage', value: '5 PB' }] },
    { icon: 'LHCRing', title: 'HEP Data Pipeline', subtitle: 'High Energy Physics Ingest', description: 'Real-time ingestion from CERN, Fermilab, DESY. ROOT format support, event reconstruction, and particle physics analysis tools.', status: 'active', color: 'pink', tags: ['CERN', 'ROOT', 'HEPData', 'Fermilab', 'DESY'], metrics: [{ label: 'Events/day', value: '1B+' }, { label: 'Raw Data', value: '2 EB' }] },
    { icon: 'GovInstitute', title: 'Gov Data Gateway', subtitle: 'Government Research Portal', description: 'Aggregated access to NIH, NSF, DOE, EU Horizon, JST, CNRS, and 50+ government-funded research repositories worldwide.', status: 'active', color: 'emerald', tags: ['NIH', 'NSF', 'DOE', 'EU Horizon', 'JST', 'CNRS'], metrics: [{ label: 'Datasets', value: '10M+' }, { label: 'Countries', value: '80+' }] },
    
    // Streaming & Processing
    { icon: 'StreamingPipe', title: 'Stream Processor', subtitle: 'Real-time Event Pipeline', description: 'Apache Kafka + Flink + Spark Streaming unified interface. Process streaming data from IoT sensors, lab equipment, and real-time feeds.', status: 'active', color: 'green', tags: ['Kafka', 'Flink', 'Spark', 'CEP', 'Windowing'], metrics: [{ label: 'Events/sec', value: '1M+' }, { label: 'Latency', value: '<10ms' }] },
    { icon: 'SparkEngine', title: 'Batch Processor', subtitle: 'Large-scale Analytics', description: 'Apache Spark cluster for batch ML training, ETL jobs, graph processing, and large-scale statistical computations.', status: 'scaling', color: 'orange', tags: ['Spark', 'MLlib', 'GraphX', 'PySpark'], metrics: [{ label: 'Nodes', value: '1000+' }, { label: 'Memory', value: '50 TB' }] },
    { icon: 'KafkaIcon', title: 'Event Bus', subtitle: 'Message Queue System', description: 'Distributed event streaming platform with exactly-once semantics, schema registry, and 99.999% availability SLA.', status: 'active', color: 'slate', tags: ['Kafka', 'Schema Registry', 'ksqlDB'], metrics: [{ label: 'Topics', value: '10K+' }, { label: 'Msg/sec', value: '5M' }] },
    { icon: 'FlinkStream', title: 'Stream Analytics', subtitle: 'Complex Event Processing', description: 'Apache Flink for stateful stream processing, time-window analytics, and real-time anomaly detection in research data.', status: 'active', color: 'pink', tags: ['Flink', 'CEP', 'Stateful', 'Exactly-Once'], metrics: [{ label: 'Throughput', value: '2M/s' }, { label: 'State', value: '10 TB' }] },
    
    // IDE & Publishing
    { icon: 'IDECode', title: 'IDE Studio', subtitle: 'AI-Powered Development Environment', description: 'Google AI Studio-inspired IDE with auto-file parsing, inline visualizations, collaborative editing, and integrated publishing workflow.', status: 'active', color: 'cyan', tags: ['Monaco', 'Jupyter', 'AI Assist', 'Collab'], metrics: [{ label: 'Users', value: '50K+' }, { label: 'Sessions', value: '100K/d' }] },
    { icon: 'BlogPublish', title: 'Publish Hub', subtitle: 'Blogs & White Papers', description: 'Full publishing pipeline for blog posts, preprints, white papers, and datasets. DOI assignment, version control, and citation tracking.', status: 'active', color: 'pink', tags: ['DOI', 'Preprint', 'White Paper', 'Blog'], metrics: [{ label: 'Published', value: '100K+' }, { label: 'Citations', value: '1M+'}] },
    
    // API & Middleware
    { icon: 'APILayer', title: 'API Gateway', subtitle: 'Unified Interface Layer', description: 'REST, GraphQL, WebSocket, and gRPC endpoints with rate limiting, caching, authentication, and request transformation.', status: 'active', color: 'purple', tags: ['REST', 'GraphQL', 'WebSocket', 'gRPC'], metrics: [{ label: 'RPS', value: '500K+' }, { label: 'Uptime', value: '99.99%' }] },
    { icon: 'Middleware', title: 'Middleware Suite', subtitle: 'Cross-cutting Services', description: 'Authentication (OAuth2/SAML), rate limiting, request logging, caching layer, CORS handling, and API versioning.', status: 'active', color: 'amber', tags: ['Auth', 'Rate Limit', 'Cache', 'Log', 'CORS'], metrics: [{ label: 'Latency', value: '<5ms' }, { label: 'Cache Hit', value: '95%' }] },
    { icon: 'Shield', title: 'Security Layer', subtitle: 'Compliance & Encryption', description: 'SOC 2 Type II, HIPAA, GDPR compliant. End-to-end encryption, audit logging, vulnerability scanning, and penetration testing.', status: 'active', color: 'emerald', tags: ['SOC2', 'HIPAA', 'GDPR', 'Encryption'], metrics: [{ label: 'Encrypted', value: '100%' }, { label: 'Audits', value: '0 issues' }] },
  ]
  
  // External connectors
  const externalConnectors = [
    { name: 'NCBI GenBank', category: 'Genomics', status: 'connected' as const, dataSources: ['Genome', 'SRA', 'GEO', 'PubChem'] },
    { name: 'European Bioinformatics', category: 'Genomics', status: 'connected' as const, dataSources: ['Ensembl', 'UniProt', 'ArrayExpress', 'BioSamples'] },
    { name: 'Protein Data Bank', category: 'Chemistry', status: 'connected' as const, dataSources: ['PDB', 'EMDB', 'BMRB'] },
    { name: 'NASA EOSDIS', category: 'Satellite', status: 'connected' as const, dataSources: ['MODIS', 'ASTER', 'VIIRS', 'GRACE'] },
    { name: 'ESA Copernicus', category: 'Satellite', status: 'connected' as const, dataSources: ['Sentinel-1/2/3/5P', 'CMEMS'] },
    { name: 'CERN Open Data', category: 'Physics', status: 'connected' as const, dataSources: ['CMS', 'ATLAS', 'ALICE', 'LHCb'] },
    { name: 'World Bank Data', category: 'Public Data', status: 'available' as const, dataSources: ['Economics', 'Health', 'Climate'] },
    { name: 'NIH RePORTER', category: 'Research', status: 'connected' as const, dataSources: ['Grants', 'Publications', 'Patents'] },
    { name: 'NSF Awards', category: 'Government', status: 'connected' as const, dataSources: ['Awards', 'Citations', 'Outcomes'] },
    { name: 'DOE OSTI', category: 'Government', status: 'available' as const, dataSources: ['SciTech Connect', 'Data Explorer'] },
    { name: 'EU Open Data Portal', category: 'Government', status: 'connected' as const, dataSources: ['Research', 'Environment', 'Digital'] },
    { name: 'NOAA NCEI', category: 'Satellite', status: 'connected' as const, dataSources: ['Climate', 'Ocean', 'Coastal'] },
    { name: 'USGS EarthExplorer', category: 'Satellite', status: 'available' as const, dataSources: ['Landsat', 'MODIS', 'Radar'] },
    { name: 'Figshare', category: 'Research', status: 'connected' as const, dataSources: ['Datasets', 'Figures', 'Media'] },
    { name: 'Zenodo', category: 'Research', status: 'connected' as const, dataSources: ['Software', 'Data', 'Papers'] },
    { name: 'ClinicalTrials.gov', category: 'Health', status: 'connected' as const, dataSources: ['Trials', 'Results', 'Adverse Events'] },
  ]
  
  return (
    <main className="min-h-screen bg-slate-950 text-white overflow-x-hidden">
      <ArchitectureBackground />
      
      {/* Header */}
      <header className="relative z-10 border-b border-white/5 bg-slate-950/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-cyan-500 flex items-center justify-center">
                <Icons.QuantumCore />
              </div>
              <div>
                <h1 className="text-lg font-bold text-white">SciHub Pro</h1>
                <p className="text-[10px] text-slate-500 tracking-wider uppercase">Microservices Architecture Dashboard</p>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <Badge variant="outline" className="border-emerald-500/50 text-emerald-400 gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"/>
                All Systems Operational
              </Badge>
              <Button variant="ghost" size="sm" className="text-slate-400 hover:text-white">
                <Icons.Settings />
              </Button>
            </div>
          </div>
        </div>
      </header>
      
      {/* Navigation Tabs */}
      <nav className="relative z-10 border-b border-white/5 bg-slate-950/50 backdrop-blur-sm sticky top-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex gap-1 overflow-x-auto py-3 scrollbar-hide">
            {tabs.map(tab => {
              const TabIcon = Icons[tab.icon]
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${
                    activeTab === tab.id
                      ? 'bg-gradient-to-r from-purple-500/20 to-cyan-500/20 text-white border border-purple-500/30'
                      : 'text-slate-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <TabIcon />
                  {tab.label}
                </button>
              )
            })}
          </div>
        </div>
      </nav>
      
      {/* Main Content */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* OVERVIEW TAB */}
        {activeTab === 'overview' && (
          <div className="space-y-8">
            {/* Stats Row */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: 'Total Services', value: '18', icon: 'Server', color: 'text-cyan-400' },
                { label: 'Active Connections', value: '100+', icon: 'Globe', color: 'text-purple-400' },
                { label: 'Data Processed/Day', value: '5 PB', icon: 'DatabaseCluster', color: 'text-emerald-400' },
                { label: 'Uptime SLA', value: '99.99%', icon: 'Shield', color: 'text-pink-400' },
              ].map(stat => {
                const StatIcon = Icons[stat.icon as keyof typeof Icons]
                return (
                  <Card key={stat.label} className="bg-slate-900/60 backdrop-blur-sm border border-slate-800/50">
                    <CardContent className="p-4 flex items-center gap-3">
                      <StatIcon />
                      <div>
                        <div className={`text-2xl font-bold ${stat.color}`}>{stat.value}</div>
                        <div className="text-xs text-slate-500">{stat.label}</div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
            
            {/* Architecture Diagram */}
            <section>
              <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                <Icons.Layers /> System Architecture
              </h2>
              <ArchitectureFlow />
            </section>
            
            {/* Quick Service Status */}
            <section>
              <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                <Icons.Zap /> Service Health
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {microservices.slice(0, 8).map(service => (
                  <MicroserviceCard key={service.title} {...service} />
                ))}
              </div>
            </section>
          </div>
        )}
        
        {/* SERVICES TAB */}
        {activeTab === 'services' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-white">All Microservices</h2>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" className="border-slate-700 text-slate-300">Filter</Button>
                <Button size="sm" className="bg-gradient-to-r from-purple-500 to-cyan-500">Add Service</Button>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {microservices.map(service => (
                <MicroserviceCard key={service.title} {...service} />
              ))}
            </div>
          </div>
        )}
        
        {/* DATA LAYER TAB */}
        {activeTab === 'data' && (
          <div className="space-y-8">
            {/* Data Architecture Overview */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="bg-gradient-to-br from-cyan-500/10 to-transparent border-cyan-500/30">
                <CardContent className="p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 rounded-xl bg-cyan-500/20 flex items-center justify-center">
                      <Icons.QueryEngine />
                    </div>
                    <div>
                      <h3 className="font-bold text-white">BigQuery Engine</h3>
                      <p className="text-xs text-slate-400">Distributed SQL Analytics</p>
                    </div>
                  </div>
                  <ul className="space-y-2 text-sm text-slate-300">
                    <li className="flex items-center gap-2"><Icons.CheckCircle className="text-cyan-400"/> Columnar storage optimization</li>
                    <li className="flex items-center gap-2"><Icons.CheckCircle className="text-cyan-400"/> Auto-partitioning & clustering</li>
                    <li className="flex items-center gap-2"><Icons.CheckCircle className="text-cyan-400"/> ML-powered query planning</li>
                    <li className="flex items-center gap-2"><Icons.CheckCircle className="text-cyan-400"/> Petabyte-scale analytics</li>
                  </ul>
                </CardContent>
              </Card>
              
              <Card className="bg-gradient-to-br from-green-500/10 to-transparent border-green-500/30">
                <CardContent className="p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 rounded-xl bg-green-500/20 flex items-center justify-center">
                      <Icons.NoSQLDB />
                    </div>
                    <div>
                      <h3 className="font-bold text-white">Document Store</h3>
                      <p className="text-xs text-slate-400">Flexible Schema Database</p>
                    </div>
                  </div>
                  <ul className="space-y-2 text-sm text-slate-300">
                    <li className="flex items-center gap-2"><Icons.CheckCircle className="text-green-400"/> MongoDB-compatible API</li>
                    <li className="flex items-center gap-2"><Icons.CheckCircle className="text-green-400"/> Nested experiment schemas</li>
                    <li className="flex items-center gap-2"><Icons.CheckCircle className="text-green-400"/> Horizontal sharding</li>
                    <li className="flex items-center gap-2"><Icons.CheckCircle className="text-green-400"/> Real-time replication</li>
                  </ul>
                </CardContent>
              </Card>
              
              <Card className="bg-gradient-to-br from-blue-500/10 to-transparent border-blue-500/30">
                <CardContent className="p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 rounded-xl bg-blue-500/20 flex items-center justify-center">
                      <Icons.DataLake />
                    </div>
                    <div>
                      <h3 className="font-bold text-white">Data Lake</h3>
                      <p className="text-xs text-slate-400">Unified Binary Storage</p>
                    </div>
                  </div>
                  <ul className="space-y-2 text-sm text-slate-300">
                    <li className="flex items-center gap-2"><Icons.CheckCircle className="text-blue-400"/> S3-compatible object storage</li>
                    <li className="flex items-center gap-2"><Icons.CheckCircle className="text-blue-400"/> Satellite imagery ingest</li>
                    <li className="flex items-center gap-2"><Icons.CheckCircle className="text-blue-400"/> LHC raw event data</li>
                    <li className="flex items-center gap-2"><Icons.CheckCircle className="text-blue-400"/> Multi-format support</li>
                  </ul>
                </CardContent>
              </Card>
              
              <Card className="bg-gradient-to-br from-orange-500/10 to-transparent border-orange-500/30">
                <CardContent className="p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 rounded-xl bg-orange-500/20 flex items-center justify-center">
                      <Icons.FileFormat />
                    </div>
                    <div>
                      <h3 className="font-bold text-white">Format Converter</h3>
                      <p className="text-xs text-slate-400">Universal Parser Engine</p>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2 mt-4">
                    {['Parquet', 'AVRO', 'ORC', 'FASTQ', 'BAM', 'CRAM', 'VCF', 'PDB', 'CIF', 'XYZ', 'MOL2', 'SDF', 'HDF5', 'NetCDF'].map(fmt => (
                      <Badge key={fmt} variant="outline" className="text-xs border-orange-500/30 text-orange-300">{fmt}</Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
            
            {/* External Connectors */}
            <section>
              <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                <Icons.ConnectorHub /> External Platform Connectors
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {externalConnectors.map(connector => (
                  <ConnectorCard key={connector.name} {...connector} />
                ))}
              </div>
            </section>
          </div>
        )}
        
        {/* STREAMING TAB */}
        {activeTab === 'streaming' && (
          <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="bg-gradient-to-br from-amber-500/10 to-transparent border-amber-500/30">
                <CardContent className="p-6 text-center">
                  <div className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-amber-500/20 flex items-center justify-center">
                    <Icons.KafkaIcon />
                  </div>
                  <h3 className="font-bold text-lg text-white mb-2">Apache Kafka</h3>
                  <p className="text-sm text-slate-400 mb-4">Distributed event streaming platform</p>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="bg-slate-800/50 rounded p-2"><div className="font-bold text-amber-400">10K+</div><div className="text-xs text-slate-500">Topics</div></div>
                    <div className="bg-slate-800/50 rounded p-2"><div className="font-bold text-amber-400">5M</div><div className="text-xs text-slate-500">Msg/sec</div></div>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="bg-gradient-to-br from-pink-500/10 to-transparent border-pink-500/30">
                <CardContent className="p-6 text-center">
                  <div className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-pink-500/20 flex items-center justify-center">
                    <Icons.FlinkStream />
                  </div>
                  <h3 className="font-bold text-lg text-white mb-2">Apache Flink</h3>
                  <p className="text-sm text-slate-400 mb-4">Stateful stream processing engine</p>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="bg-slate-800/50 rounded p-2"><div className="font-bold text-pink-400">2M/s</div><div className="text-xs text-slate-500">Throughput</div></div>
                    <div className="bg-slate-800/50 rounded p-2"><div className="font-bold text-pink-400">&lt;10ms</div><div className="text-xs text-slate-500">Latency</div></div>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="bg-gradient-to-br from-orange-500/10 to-transparent border-orange-500/30">
                <CardContent className="p-6 text-center">
                  <div className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-orange-500/20 flex items-center justify-center">
                    <Icons.SparkEngine />
                  </div>
                  <h3 className="font-bold text-lg text-white mb-2">Apache Spark</h3>
                  <p className="text-sm text-slate-400 mb-4">Unified analytics engine</p>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="bg-slate-800/50 rounded p-2"><div className="font-bold text-orange-400">1000+</div><div className="text-xs text-slate-500">Nodes</div></div>
                    <div className="bg-slate-800/50 rounded p-2"><div className="font-bold text-orange-400">50TB</div><div className="text-xs text-slate-500">Memory</div></div>
                  </div>
                </CardContent>
              </Card>
            </div>
            
            {/* Streaming Architecture Diagram */}
            <Card className="bg-slate-900/60 border border-slate-800/50">
              <CardContent className="p-6">
                <h3 className="font-bold text-white mb-6">Streaming Data Pipeline</h3>
                <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                  {[
                    { label: 'Sources', items: ['IoT Sensors', 'Lab Equipment', 'Satellites', 'User Events'], color: 'emerald' },
                    { label: 'Ingestion', items: ['Kafka Topics', 'Schema Registry', 'Partitioning'], color: 'amber' },
                    { label: 'Processing', items: ['Flink Jobs', 'Spark Streaming', 'CEP Rules'], color: 'pink' },
                    { label: 'Output', items: ['Data Lake', 'Analytics DB', 'Dashboards', 'Alerts'], color: 'cyan' },
                  ].map((stage, idx) => (
                    <div key={stage.label} className="flex-1 w-full">
                      <div className={`p-4 rounded-xl bg-${stage.color}-500/10 border border-${stage.color}-500/30`}>
                        <h4 className={`font-medium text-${stage.color}-400 mb-2`}>{stage.label}</h4>
                        <ul className="space-y-1">
                          {stage.items.map(item => (
                            <li key={item} className="text-xs text-slate-400 flex items-center gap-1">
                              <span className={`w-1.5 h-1.5 rounded-full bg-${stage.color}-400`}/>{item}
                            </li>
                          ))}
                        </ul>
                      </div>
                      {idx < 3 && (
                        <div className="hidden md:block text-center text-slate-600 my-2">→</div>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}
        
        {/* IDE STUDIO TAB */}
        {activeTab === 'ide' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* IDE Preview */}
              <Card className="lg:col-span-2 bg-slate-900/80 border border-slate-800/50 overflow-hidden">
                <CardContent className="p-0">
                  {/* IDE Header */}
                  <div className="flex items-center justify-between px-4 py-2 bg-slate-800 border-b border-slate-700">
                    <div className="flex items-center gap-2">
                      <div className="flex gap-1.5">
                        <div className="w-3 h-3 rounded-full bg-red-500"/>
                        <div className="w-3 h-3 rounded-full bg-yellow-500"/>
                        <div className="w-3 h-3 rounded-full bg-green-500"/>
                      </div>
                      <span className="text-xs text-slate-400 ml-2">analysis_pipeline.ipynb</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs border-cyan-500/50 text-cyan-400">Python 3.11</Badge>
                      <Badge variant="outline" className="text-xs border-purple-500/50 text-purple-400">GPU Enabled</Badge>
                    </div>
                  </div>
                  
                  {/* IDE Body */}
                  <div className="flex">
                    {/* Sidebar */}
                    <div className="w-48 border-r border-slate-700 p-3 space-y-2 hidden md:block">
                      <div className="text-xs text-slate-500 uppercase tracking-wider mb-2">Files</div>
                      {['data/', 'raw/', 'processed/', 'models/', 'notebooks/'].map(item => (
                        <div key={item} className="flex items-center gap-2 text-xs text-slate-400 hover:text-white cursor-pointer py-1">
                          <Icons.Folder />{item}
                        </div>
                      ))}
                      <Separator className="my-2 bg-slate-700"/>
                      {['analysis.ipynb', 'viz.py', 'model.pt', 'results.csv'].map(file => (
                        <div key={file} className="flex items-center gap-2 text-xs text-slate-300 hover:text-cyan-400 cursor-pointer py-1 pl-2">
                          {file.endsWith('.ipynb') ? '📓' : file.endsWith('.py') ? '🐍' : file.endsWith('.pt') ? '🤖' : '📊'}{file}
                        </div>
                      ))}
                    </div>
                    
                    {/* Editor Area */}
                    <div className="flex-1 p-4 font-mono text-sm">
                      <div className="text-slate-500"># Auto-parsed from satellite imagery dataset</div>
                      <div><span className="text-purple-400">import</span> <span className="text-cyan-400">scihub</span> <span className="text-purple-400">as</span> <span className="text-yellow-400">sh</span></div>
                      <div className="mt-2"><span className="text-cyan-400">dataset</span> = <span className="text-yellow-400">sh</span>.<span className="text-blue-400">load</span>(<span className="text-emerald-400">'sentinel2_landsat8'</span>)</div>
                      <div className="mt-2"><span className="text-cyan-400">images</span>, <span className="text-cyan-400">metadata</span> = <span className="text-cyan-400">dataset</span>.<span className="text-blue-400">parse</span>()</div>
                      <div className="mt-2"><span className="text-slate-500"># Images automatically extracted with thumbnails</span></div>
                      <div><span className="text-cyan-400">sh</span>.<span className="text-blue-400">display</span>(<span className="text-cyan-400">images</span>[<span className="text-amber-400">0</span>])</div>
                      
                      {/* Inline image preview */}
                      <div className="mt-4 p-3 bg-slate-800/50 rounded-lg border border-slate-700">
                        <div className="flex items-center gap-2 mb-2">
                          <Icons.Eye />
                          <span className="text-xs text-slate-400">Inline Preview • sentinel2_2024_001.tif</span>
                        </div>
                        <div className="aspect-video bg-gradient-to-br from-emerald-900/30 to-cyan-900/30 rounded flex items-center justify-center border border-dashed border-slate-600">
                          <div className="text-center">
                            <div className="text-3xl mb-2">🛰️</div>
                            <div className="text-xs text-slate-500">Satellite Imagery<br/>1024×1024 • 4 bands</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              {/* IDE Features */}
              <div className="space-y-4">
                <Card className="bg-gradient-to-br from-cyan-500/10 to-transparent border-cyan-500/30">
                  <CardContent className="p-4">
                    <h4 className="font-semibold text-white mb-3 flex items-center gap-2">
                      <Icons.Zap /> AI Assistant
                    </h4>
                    <p className="text-xs text-slate-400 mb-3">Context-aware code completion and explanation</p>
                    <div className="space-y-2">
                      {['Auto-complete queries', 'Explain code blocks', 'Generate visualizations', 'Debug suggestions'].map(feature => (
                        <div key={feature} className="flex items-center gap-2 text-xs text-slate-300">
                          <Icons.CheckCircle className="text-cyan-400"/>{feature}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
                
                <Card className="bg-gradient-to-br from-purple-500/10 to-transparent border-purple-500/30">
                  <CardContent className="p-4">
                    <h4 className="font-semibold text-white mb-3 flex items-center gap-2">
                      <Icons.Users /> Collaboration
                    </h4>
                    <p className="text-xs text-slate-400 mb-3">Real-time multi-user editing</p>
                    <div className="space-y-2">
                      {['Cursor presence', 'Comments & threads', 'Version history', 'Share links'].map(feature => (
                        <div key={feature} className="flex items-center gap-2 text-xs text-slate-300">
                          <Icons.CheckCircle className="text-purple-400"/>{feature}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
                
                <Card className="bg-gradient-to-br from-pink-500/10 to-transparent border-pink-500/30">
                  <CardContent className="p-4">
                    <h4 className="font-semibold text-white mb-3 flex items-center gap-2">
                      <Icons.Cloud /> Compute
                    </h4>
                    <p className="text-xs text-slate-400 mb-3">Integrated compute resources</p>
                    <div className="space-y-2">
                      {['GPU instances', 'Distributed runs', 'Job scheduling', 'Result caching'].map(feature => (
                        <div key={feature} className="flex items-center gap-2 text-xs text-slate-300">
                          <Icons.CheckCircle className="text-pink-400"/>{feature}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        )}
        
        {/* PUBLISH TAB */}
        {activeTab === 'publish' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Blog Post Editor Preview */}
              <Card className="bg-slate-900/80 border border-slate-800/50 overflow-hidden">
                <CardContent className="p-0">
                  <div className="flex items-center justify-between px-4 py-3 bg-slate-800 border-b border-slate-700">
                    <span className="text-sm font-medium text-white">New Blog Post</span>
                    <div className="flex gap-2">
                      <Button size="sm" variant="ghost" className="text-xs text-slate-400">Save Draft</Button>
                      <Button size="sm" className="text-xs bg-gradient-to-r from-pink-500 to-purple-500">Publish</Button>
                    </div>
                  </div>
                  
                  <div className="p-4 space-y-4">
                    <input 
                      type="text" 
                      placeholder="Enter your title..."
                      className="w-full bg-transparent text-xl font-bold text-white placeholder:text-slate-600 outline-none border-b border-slate-700 pb-2"
                      defaultValue="Breakthrough: Novel Protein Structure Prediction Method"
                    />
                    
                    <div className="flex gap-2">
                      <Badge variant="outline" className="text-xs border-pink-500/30 text-pink-400">Bioinformatics</Badge>
                      <Badge variant="outline" className="text-xs border-purple-500/30 text-purple-400">Machine Learning</Badge>
                      <Badge variant="outline" className="text-xs border-cyan-500/30 text-cyan-400">Research</Badge>
                    </div>
                    
                    <div className="prose prose-invert prose-sm max-w-none">
                      <p className="text-slate-300 text-sm leading-relaxed">
                        We present a novel approach to protein structure prediction that achieves state-of-the-art accuracy on CASP15 benchmarks...
                      </p>
                    </div>
                    
                    {/* Embedded content areas */}
                    <div className="space-y-3">
                      <div className="p-3 bg-slate-800/50 rounded-lg border border-dashed border-slate-600">
                        <div className="flex items-center gap-2 text-xs text-slate-500 mb-2">
                          📊 Embed Chart / Visualization
                        </div>
                        <div className="h-24 bg-gradient-to-r from-pink-500/10 to-purple-500/10 rounded flex items-center justify-center">
                          <span className="text-xs text-slate-500">Click to add chart</span>
                        </div>
                      </div>
                      
                      <div className="p-3 bg-slate-800/50 rounded-lg border border-dashed border-slate-600">
                        <div className="flex items-center gap-2 text-xs text-slate-500 mb-2">
                          🖼️ Upload Image / Figure
                        </div>
                        <div className="h-24 bg-slate-700/30 rounded flex items-center justify-center">
                          <span className="text-xs text-slate-500">Drop image or click to upload</span>
                        </div>
                      </div>
                      
                      <div className="p-3 bg-slate-800/50 rounded-lg border border-dashed border-slate-600">
                        <div className="flex items-center gap-2 text-xs text-slate-500 mb-2">
                          📎 Link Dataset / Code
                        </div>
                        <div className="h-16 bg-slate-700/30 rounded flex items-center justify-center">
                          <span className="text-xs text-slate-500">Attach reproducible artifacts</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              {/* Publishing Options */}
              <div className="space-y-4">
                <Card className="bg-gradient-to-br from-pink-500/10 to-transparent border-pink-500/30">
                  <CardContent className="p-5">
                    <h3 className="font-bold text-white mb-4 flex items-center gap-2">
                      <Icons.BlogPublish /> Publishing Options
                    </h3>
                    
                    <div className="space-y-4">
                      {[
                        { type: 'Blog Post', desc: 'Share insights with the community', audience: 'Public', icon: '📝' },
                        { type: 'Preprint', desc: 'Early dissemination before peer review', audience: 'Public', icon: '📄' },
                        { type: 'White Paper', desc: 'Comprehensive technical deep-dive', audience: 'Enterprise', icon: '📋' },
                        { type: 'Dataset', desc: 'Publish data with DOI citation', audience: 'Public', icon: '💾' },
                      ].map(option => (
                        <div key={option.type} className="p-3 rounded-lg bg-slate-800/50 border border-slate-700 hover:border-pink-500/30 transition-colors cursor-pointer">
                          <div className="flex items-center gap-3">
                            <span className="text-2xl">{option.icon}</span>
                            <div className="flex-1">
                              <div className="font-medium text-white text-sm">{option.type}</div>
                              <div className="text-xs text-slate-400">{option.desc}</div>
                            </div>
                            <Badge variant="outline" className="text-xs">{option.audience}</Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
                
                <Card className="bg-gradient-to-br from-emerald-500/10 to-transparent border-emerald-500/30">
                  <CardContent className="p-5">
                    <h3 className="font-bold text-white mb-4">Citation & Impact</h3>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-slate-400">DOI Assignment</span>
                        <Badge className="bg-emerald-500/20 text-emerald-400 border-0">Auto-generated</Badge>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-slate-400">Citation Tracking</span>
                        <Badge className="bg-emerald-500/20 text-emerald-400 border-0">CrossRef</Badge>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-slate-400">Altmetric Score</span>
                        <Badge className="bg-emerald-500/20 text-emerald-400 border-0">Tracked</Badge>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-slate-400">Version Control</span>
                        <Badge className="bg-emerald-500/20 text-emerald-400 border-0">Git-native</Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        )}
        
      </div>
      
      {/* Footer */}
      <footer className="relative z-10 border-t border-white/5 mt-12 py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-slate-500">
            <span>© 2026 SciHub Pro — Microservices Architecture Dashboard</span>
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"/>
                All services operational
              </span>
              <span>v2.0.0-quantum</span>
            </div>
          </div>
        </div>
      </footer>
    </main>
  )
}
