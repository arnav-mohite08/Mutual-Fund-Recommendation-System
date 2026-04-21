import React, { useEffect, useState } from 'react'

const categoryConfig = {
  Equity: {
    color: '#10b981',
    bg: 'badge-equity',
    icon: '📈',
    gradient: 'from-emerald-500/10 to-transparent',
    border: 'hover:border-emerald-500/30',
    label: 'Equity Fund',
    tagline: 'Growth-oriented · Market-linked returns',
  },
  Debt: {
    color: '#3b82f6',
    bg: 'badge-debt',
    icon: '🛡️',
    gradient: 'from-blue-500/10 to-transparent',
    border: 'hover:border-blue-500/30',
    label: 'Debt Fund',
    tagline: 'Capital preservation · Stable income',
  },
  Hybrid: {
    color: '#e8b422',
    bg: 'badge-hybrid',
    icon: '⚖️',
    gradient: 'from-gold-500/10 to-transparent',
    border: 'hover:border-gold-500/30',
    label: 'Hybrid Fund',
    tagline: 'Balanced · Best of both worlds',
  },
}

function ScoreRing({ score, color }) {
  const [animated, setAnimated] = useState(false)
  useEffect(() => { setTimeout(() => setAnimated(true), 300) }, [])

  const max = 5
  const pct = Math.min(score / max, 1)
  const r = 22
  const circ = 2 * Math.PI * r
  const offset = circ - (animated ? pct * circ : circ)

  return (
    <div className="relative w-14 h-14">
      <svg viewBox="0 0 52 52" className="w-full h-full -rotate-90">
        <circle cx="26" cy="26" r={r} fill="none" stroke="#1c1f32" strokeWidth="4" />
        <circle
          cx="26" cy="26" r={r}
          fill="none" stroke={color} strokeWidth="4"
          strokeLinecap="round"
          strokeDasharray={circ}
          strokeDashoffset={offset}
          style={{ transition: 'stroke-dashoffset 1.2s cubic-bezier(0.4,0,0.2,1)', filter: `drop-shadow(0 0 4px ${color}80)` }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-xs font-bold font-mono" style={{ color }}>{score.toFixed(2)}</span>
      </div>
    </div>
  )
}

export default function FundCard({ category, fund, rank, monthlyInvestment }) {
  const cfg = categoryConfig[category] || categoryConfig.Hybrid
  const allocationAmt = fund.allocation || 0

  return (
    <div className={`fund-card border border-white/5 ${cfg.border} overflow-hidden fade-up`}
         style={{ animationDelay: `${rank * 150}ms` }}>

      {/* Top gradient strip */}
      <div className={`h-1 w-full`} style={{ background: `linear-gradient(90deg, ${cfg.color}, transparent)` }} />

      <div className="p-6">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 mb-5">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${cfg.bg}`}>
                <span>{cfg.icon}</span>
                {cfg.label}
              </span>
              <span className="text-xs font-mono text-gray-600">#{rank}</span>
            </div>
            <h3 className="text-base font-semibold text-white leading-snug font-body line-clamp-2">
              {fund.fund_name}
            </h3>
            <p className="text-xs text-gray-600 mt-1">{cfg.tagline}</p>
          </div>
          <ScoreRing score={fund.score} color={cfg.color} />
        </div>

        {/* Divider */}
        <div className="gold-divider mb-5" style={{ background: `linear-gradient(90deg, transparent, ${cfg.color}30, transparent)` }} />

        {/* Allocation */}
        <div className="glass-light rounded-xl p-4 text-center">
          <div className="label-text mb-1">Monthly Allocation</div>
          <div className="text-2xl font-display font-bold" style={{ color: cfg.color }}>
            ₹{allocationAmt.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
          </div>
          <div className="text-xs text-gray-600 mt-0.5">of ₹{monthlyInvestment?.toLocaleString('en-IN')} SIP</div>
        </div>

        {/* Score detail */}
        <div className="mt-4 flex items-center justify-between">
          <span className="text-xs text-gray-600 font-mono">AI Confidence Score</span>
          <div className="flex items-center gap-2">
            <div className="w-24 h-1 rounded-full bg-obsidian-700 overflow-hidden">
              <div
                className="h-full rounded-full"
                style={{
                  width: `${Math.min((fund.score / 5) * 100, 100)}%`,
                  backgroundColor: cfg.color,
                  boxShadow: `0 0 6px ${cfg.color}60`,
                  transition: 'width 1s ease 0.5s',
                }}
              />
            </div>
            <span className="text-xs font-mono" style={{ color: cfg.color }}>{fund.score.toFixed(3)}</span>
          </div>
        </div>
      </div>
    </div>
  )
}
