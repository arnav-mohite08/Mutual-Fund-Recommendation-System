import React, { useRef, useState, useEffect, useCallback } from 'react'

const COLORS = {
  Total:    { stroke: '#e8b422', fill: 'rgba(232,180,34,0.12)',  label: 'Total Portfolio' },
  Equity:   { stroke: '#10b981', fill: 'rgba(16,185,129,0.08)',  label: 'Equity' },
  Debt:     { stroke: '#3b82f6', fill: 'rgba(59,130,246,0.08)',  label: 'Debt' },
  Hybrid:   { stroke: '#a78bfa', fill: 'rgba(167,139,250,0.08)', label: 'Hybrid' },
  Invested: { stroke: '#475569', fill: 'rgba(71,85,105,0.06)',   label: 'Amount Invested', dashed: true },
}

const VISIBLE_DEFAULT = { Total: true, Equity: true, Debt: true, Hybrid: true, Invested: true }

function fmt(n) {
  if (n >= 1e7) return `₹${(n/1e7).toFixed(2)}Cr`
  if (n >= 1e5) return `₹${(n/1e5).toFixed(2)}L`
  return `₹${n.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`
}

function fmtShort(n) {
  if (n >= 1e7) return `${(n/1e7).toFixed(1)}Cr`
  if (n >= 1e5) return `${(n/1e5).toFixed(1)}L`
  if (n >= 1e3) return `${(n/1e3).toFixed(0)}K`
  return `${n.toFixed(0)}`
}

export default function FutureValueChart({ data, fundRates, horizon }) {
  const svgRef = useRef()
  const [tooltip, setTooltip] = useState(null)
  const [visible, setVisible] = useState(VISIBLE_DEFAULT)
  const [animated, setAnimated] = useState(false)
  const [hoverX, setHoverX] = useState(null)

  useEffect(() => {
    setAnimated(false)
    const t = setTimeout(() => setAnimated(true), 100)
    return () => clearTimeout(t)
  }, [data])

  if (!data || data.length < 2) return null

  // Chart dimensions
  const W = 800, H = 340
  const PAD = { top: 28, right: 28, bottom: 48, left: 68 }
  const chartW = W - PAD.left - PAD.right
  const chartH = H - PAD.top - PAD.bottom

  const keys = ['Total', 'Equity', 'Debt', 'Hybrid', 'Invested']

  // Scales
  const maxY = Math.max(...data.map(d => d.Total)) * 1.08
  const minY = 0
  const maxX = data[data.length - 1].year

  const xScale = x => PAD.left + (x / maxX) * chartW
  const yScale = y => PAD.top + chartH - ((y - minY) / (maxY - minY)) * chartH

  // Build SVG path
  const linePath = (key) =>
    data.map((d, i) =>
      `${i === 0 ? 'M' : 'L'}${xScale(d.year).toFixed(1)},${yScale(d[key]).toFixed(1)}`
    ).join(' ')

  const areaPath = (key) => {
    const pts = data.map(d => `${xScale(d.year).toFixed(1)},${yScale(d[key]).toFixed(1)}`).join(' L')
    const base = yScale(0).toFixed(1)
    return `M${xScale(0)},${base} L${pts} L${xScale(maxX)},${base} Z`
  }

  // Y-axis ticks
  const yTicks = 5
  const yTickVals = Array.from({ length: yTicks + 1 }, (_, i) => (maxY * i) / yTicks)

  // X-axis ticks (every 2 or 5 years)
  const xStep = maxX <= 10 ? 1 : maxX <= 20 ? 2 : 5
  const xTicks = []
  for (let y = 0; y <= maxX; y += xStep) xTicks.push(y)

  // Hover interaction
  const handleMouseMove = useCallback((e) => {
    const rect = svgRef.current?.getBoundingClientRect()
    if (!rect) return
    const svgX = (e.clientX - rect.left) * (W / rect.width)
    const dataX = ((svgX - PAD.left) / chartW) * maxX
    const clamped = Math.max(0, Math.min(maxX, dataX))
    const nearest = data.reduce((best, d) =>
      Math.abs(d.year - clamped) < Math.abs(best.year - clamped) ? d : best
    )
    setHoverX(xScale(nearest.year))
    setTooltip({ ...nearest, svgX: xScale(nearest.year), svgY: yScale(nearest.Total) })
  }, [data, maxX])

  const handleMouseLeave = () => { setTooltip(null); setHoverX(null) }

  const toggleLine = (key) => setVisible(v => ({ ...v, [key]: !v[key] }))

  // Total gain
  const finalTotal = data[data.length - 1]?.Total || 0
  const finalInvested = data[data.length - 1]?.Invested || 0
  const gain = finalTotal - finalInvested
  const gainPct = finalInvested > 0 ? ((gain / finalInvested) * 100).toFixed(1) : 0

  return (
    <div className="space-y-5">
      {/* Summary KPIs */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Projected Value', val: fmt(finalTotal), color: '#e8b422', sub: `in ${horizon} years` },
          { label: 'Total Invested',  val: fmt(finalInvested), color: '#94a3b8', sub: `SIP × ${horizon * 12} months` },
          { label: 'Estimated Gains', val: fmt(gain), color: gain >= 0 ? '#10b981' : '#ef4444', sub: `${gainPct}% total return` },
        ].map(k => (
          <div key={k.label} className="glass-light rounded-xl p-4 text-center">
            <div className="label-text mb-1">{k.label}</div>
            <div className="text-xl font-display font-bold" style={{ color: k.color }}>{k.val}</div>
            <div className="text-xs text-gray-600 mt-0.5">{k.sub}</div>
          </div>
        ))}
      </div>

      {/* Legend / toggles */}
      <div className="flex flex-wrap gap-3 items-center">
        {keys.map(key => {
          const cfg = COLORS[key]
          const on = visible[key]
          return (
            <button
              key={key}
              onClick={() => toggleLine(key)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all duration-200 ${
                on ? 'border-white/10 text-gray-300' : 'border-white/5 text-gray-600 opacity-40'
              }`}
              style={{ background: on ? `${cfg.fill}` : 'transparent' }}
            >
              <span className="inline-block w-4 h-0.5 rounded-full" style={{
                background: cfg.stroke,
                borderTop: cfg.dashed ? `2px dashed ${cfg.stroke}` : 'none',
                height: cfg.dashed ? 0 : '2px',
              }} />
              {cfg.label}
              {fundRates?.[key] && (
                <span className="opacity-60 font-mono">{fundRates[key]}%</span>
              )}
            </button>
          )
        })}
        <span className="ml-auto text-xs text-gray-700 font-mono">Click to toggle</span>
      </div>

      {/* SVG Chart */}
      <div className="relative rounded-2xl overflow-hidden glass border border-white/5">
        <svg
          ref={svgRef}
          viewBox={`0 0 ${W} ${H}`}
          className="w-full"
          style={{ cursor: 'crosshair' }}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
        >
          <defs>
            {keys.map(key => (
              <linearGradient key={key} id={`grad-${key}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={COLORS[key].stroke} stopOpacity="0.25" />
                <stop offset="100%" stopColor={COLORS[key].stroke} stopOpacity="0.01" />
              </linearGradient>
            ))}
            <clipPath id="chart-clip">
              <rect x={PAD.left} y={PAD.top} width={chartW} height={chartH} />
            </clipPath>
          </defs>

          {/* Grid lines */}
          {yTickVals.map((v, i) => (
            <line key={i}
              x1={PAD.left} y1={yScale(v)} x2={PAD.left + chartW} y2={yScale(v)}
              stroke="rgba(255,255,255,0.04)" strokeWidth="1"
            />
          ))}
          {xTicks.map(yr => (
            <line key={yr}
              x1={xScale(yr)} y1={PAD.top} x2={xScale(yr)} y2={PAD.top + chartH}
              stroke="rgba(255,255,255,0.04)" strokeWidth="1"
            />
          ))}

          {/* Area fills */}
          <g clipPath="url(#chart-clip)">
            {['Invested', 'Hybrid', 'Debt', 'Equity', 'Total'].map(key => (
              visible[key] && (
                <path
                  key={`area-${key}`}
                  d={areaPath(key)}
                  fill={`url(#grad-${key})`}
                  style={{ transition: 'opacity 0.4s' }}
                />
              )
            ))}

            {/* Lines */}
            {keys.map(key => {
              if (!visible[key]) return null
              const cfg = COLORS[key]
              const path = linePath(key)
              const length = 9999  // large number for dasharray animation
              return (
                <path
                  key={`line-${key}`}
                  d={path}
                  fill="none"
                  stroke={cfg.stroke}
                  strokeWidth={key === 'Total' ? 2.5 : 1.5}
                  strokeDasharray={cfg.dashed ? '6,4' : undefined}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  style={{
                    filter: key === 'Total' ? `drop-shadow(0 0 4px ${cfg.stroke}60)` : 'none',
                    strokeDashoffset: animated ? 0 : length,
                    transition: `stroke-dashoffset 1.6s cubic-bezier(0.4,0,0.2,1)`,
                  }}
                />
              )
            })}

            {/* Hover vertical line */}
            {hoverX !== null && (
              <line
                x1={hoverX} y1={PAD.top} x2={hoverX} y2={PAD.top + chartH}
                stroke="rgba(232,180,34,0.3)" strokeWidth="1" strokeDasharray="4,3"
              />
            )}

            {/* Hover dots */}
            {tooltip && keys.filter(k => visible[k]).map(key => (
              <circle
                key={`dot-${key}`}
                cx={xScale(tooltip.year)}
                cy={yScale(tooltip[key])}
                r={key === 'Total' ? 5 : 3.5}
                fill={COLORS[key].stroke}
                stroke="#0d0f1a"
                strokeWidth="2"
                style={{ filter: `drop-shadow(0 0 4px ${COLORS[key].stroke})` }}
              />
            ))}
          </g>

          {/* Y-axis labels */}
          {yTickVals.map((v, i) => (
            <text key={i} x={PAD.left - 8} y={yScale(v) + 4}
              textAnchor="end" fill="rgba(148,163,184,0.7)"
              fontSize="10" fontFamily="JetBrains Mono, monospace">
              {fmtShort(v)}
            </text>
          ))}

          {/* X-axis labels */}
          {xTicks.map(yr => (
            <text key={yr} x={xScale(yr)} y={PAD.top + chartH + 18}
              textAnchor="middle" fill="rgba(148,163,184,0.7)"
              fontSize="10" fontFamily="JetBrains Mono, monospace">
              Yr {yr}
            </text>
          ))}

          {/* Axis lines */}
          <line x1={PAD.left} y1={PAD.top} x2={PAD.left} y2={PAD.top + chartH}
            stroke="rgba(255,255,255,0.08)" strokeWidth="1" />
          <line x1={PAD.left} y1={PAD.top + chartH} x2={PAD.left + chartW} y2={PAD.top + chartH}
            stroke="rgba(255,255,255,0.08)" strokeWidth="1" />
        </svg>

        {/* Floating Tooltip */}
        {tooltip && (
          <div
            className="absolute pointer-events-none z-20"
            style={{
              left: Math.min(tooltip.svgX / W * 100, 72) + '%',
              top: '12px',
              transform: tooltip.svgX / W > 0.6 ? 'translateX(-100%)' : 'translateX(8px)',
            }}
          >
            <div className="glass border border-gold-500/20 rounded-xl p-3 min-w-[180px] shadow-2xl">
              <div className="label-text mb-2">Year {tooltip.year}</div>
              {keys.filter(k => visible[k]).map(key => (
                <div key={key} className="flex items-center justify-between gap-4 py-0.5">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full" style={{ background: COLORS[key].stroke }} />
                    <span className="text-xs text-gray-400">{COLORS[key].label}</span>
                  </div>
                  <span className="text-xs font-mono font-semibold" style={{ color: COLORS[key].stroke }}>
                    {fmt(tooltip[key])}
                  </span>
                </div>
              ))}
              <div className="border-t border-white/5 mt-2 pt-2 flex justify-between">
                <span className="text-xs text-gray-600">Gain</span>
                <span className="text-xs font-mono text-emerald-400 font-semibold">
                  +{fmt(Math.max(0, tooltip.Total - tooltip.Invested))}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      <p className="text-xs text-gray-700 text-center">
        Projections use interpolated historical return rates per fund · Assumes monthly SIP compounding · 
        Not a guarantee of future performance
      </p>
    </div>
  )
}
