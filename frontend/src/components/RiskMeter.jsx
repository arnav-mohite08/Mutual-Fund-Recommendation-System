import React, { useEffect, useRef, useState } from 'react'

export default function RiskMeter({ score, label, color }) {
  const [animated, setAnimated] = useState(false)
  const ref = useRef()

  useEffect(() => {
    const timer = setTimeout(() => setAnimated(true), 100)
    return () => clearTimeout(timer)
  }, [score])

  const pct = Math.round(score * 100)
  const circumference = 2 * Math.PI * 52
  const dashOffset = circumference - (animated ? (pct / 100) * circumference : circumference)

  const colorMap = {
    blue: { stroke: '#60a5fa', glow: 'rgba(96, 165, 250, 0.4)', text: 'text-sapphire-400', badge: 'bg-sapphire-400/10 text-sapphire-400 border-sapphire-400/30' },
    amber: { stroke: '#e8b422', glow: 'rgba(232, 180, 34, 0.4)', text: 'text-gold-400', badge: 'bg-gold-400/10 text-gold-400 border-gold-400/30' },
    red: { stroke: '#ef4444', glow: 'rgba(239, 68, 68, 0.4)', text: 'text-red-400', badge: 'bg-red-400/10 text-red-400 border-red-400/30' },
  }
  const c = colorMap[color] || colorMap.amber

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="relative w-36 h-36">
        <svg viewBox="0 0 120 120" className="w-full h-full -rotate-90">
          {/* Track */}
          <circle cx="60" cy="60" r="52" fill="none" stroke="#1c1f32" strokeWidth="8" />
          {/* Progress */}
          <circle
            cx="60" cy="60" r="52"
            fill="none"
            stroke={c.stroke}
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={dashOffset}
            style={{
              transition: 'stroke-dashoffset 1.4s cubic-bezier(0.4,0,0.2,1)',
              filter: `drop-shadow(0 0 6px ${c.glow})`
            }}
          />
          {/* Dot markers */}
          {[0, 25, 50, 75, 100].map(v => {
            const angle = (v / 100) * 360 - 90
            const rad = angle * Math.PI / 180
            const x = 60 + 52 * Math.cos(rad)
            const y = 60 + 52 * Math.sin(rad)
            return <circle key={v} cx={x} cy={y} r="2" fill="#252840" />
          })}
        </svg>
        {/* Center text */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className={`text-3xl font-display font-bold ${c.text}`}>{pct}</span>
          <span className="text-xs text-gray-600 font-mono mt-0.5">/ 100</span>
        </div>
      </div>

      <div>
        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${c.badge}`}>
          <span className={`w-1.5 h-1.5 rounded-full`} style={{ background: c.stroke }}></span>
          {label} Risk Profile
        </span>
      </div>

      <div className="text-center">
        <p className="text-xs text-gray-500 font-body max-w-[180px] leading-relaxed">
          {label === 'Conservative' && 'Prioritising capital protection with steady, low-volatility returns.'}
          {label === 'Moderate' && 'Balanced approach — growth with managed downside risk.'}
          {label === 'Aggressive' && 'Maximising long-term growth, comfortable with short-term swings.'}
        </p>
      </div>
    </div>
  )
}
