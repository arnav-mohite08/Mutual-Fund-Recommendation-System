import React, { useState, useEffect, useRef, useCallback } from 'react'

const ZONES = [
  { min: 0,    max: 0.35, label: 'Conservative', color: '#3b82f6', emoji: '🛡️',
    desc: 'Capital safety first — mostly debt & stable instruments.' },
  { min: 0.35, max: 0.65, label: 'Moderate',     color: '#e8b422', emoji: '⚖️',
    desc: 'Balanced growth with managed downside protection.' },
  { min: 0.65, max: 1.0,  label: 'Aggressive',   color: '#ef4444', emoji: '🚀',
    desc: 'Maximum growth potential — comfortable with volatility.' },
]

function getZone(v) {
  return ZONES.find(z => v >= z.min && v < z.max) || ZONES[ZONES.length - 1]
}

export default function RiskSlider({ value, modelValue, onChange, loading }) {
  const [dragging, setDragging] = useState(false)
  const trackRef = useRef()

  const zone = getZone(value)
  const pct = value * 100

  const posFromEvent = useCallback((e) => {
    const rect = trackRef.current?.getBoundingClientRect()
    if (!rect) return null
    const clientX = e.touches ? e.touches[0].clientX : e.clientX
    return Math.max(0, Math.min(1, (clientX - rect.left) / rect.width))
  }, [])

  const handleStart = (e) => {
    e.preventDefault()
    setDragging(true)
    const v = posFromEvent(e)
    if (v !== null) onChange(parseFloat(v.toFixed(3)))
  }

  useEffect(() => {
    if (!dragging) return
    const move = (e) => {
      const v = posFromEvent(e)
      if (v !== null) onChange(parseFloat(v.toFixed(3)))
    }
    const up = () => setDragging(false)
    window.addEventListener('mousemove', move)
    window.addEventListener('mouseup', up)
    window.addEventListener('touchmove', move, { passive: false })
    window.addEventListener('touchend', up)
    return () => {
      window.removeEventListener('mousemove', move)
      window.removeEventListener('mouseup', up)
      window.removeEventListener('touchmove', move)
      window.removeEventListener('touchend', up)
    }
  }, [dragging, posFromEvent, onChange])

  const isOverridden = Math.abs(value - modelValue) > 0.01

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="label-text mb-0.5">Adjust Risk Appetite</div>
          <p className="text-xs text-gray-600">Drag to override — funds update live</p>
        </div>
        <div className="flex items-center gap-2">
          {isOverridden && (
            <button
              onClick={() => onChange(modelValue)}
              className="text-xs px-2.5 py-1 rounded-lg glass-light border border-white/10 text-gray-400 hover:text-gold-400 hover:border-gold-500/30 transition-all"
            >
              ↺ Reset to ML
            </button>
          )}
          {loading && (
            <div className="w-4 h-4 border-2 border-t-gold-400 border-obsidian-700 rounded-full animate-spin" />
          )}
        </div>
      </div>

      {/* Zone indicators */}
      <div className="grid grid-cols-3 gap-2">
        {ZONES.map(z => {
          const active = zone.label === z.label
          return (
            <button
              key={z.label}
              onClick={() => onChange((z.min + z.max) / 2)}
              className={`text-center px-2 py-2 rounded-xl border text-xs transition-all duration-300 ${
                active
                  ? 'border-white/20 text-white'
                  : 'border-white/5 text-gray-600 hover:border-white/10 hover:text-gray-400'
              }`}
              style={active ? {
                background: `${z.color}18`,
                borderColor: `${z.color}40`,
                boxShadow: `0 0 12px ${z.color}20`,
              } : {}}
            >
              <div className="text-base mb-0.5">{z.emoji}</div>
              <div className="font-semibold" style={active ? { color: z.color } : {}}>{z.label}</div>
            </button>
          )
        })}
      </div>

      {/* Slider track */}
      <div className="relative py-3">
        {/* Gradient track */}
        <div
          ref={trackRef}
          className="relative h-3 rounded-full cursor-pointer select-none"
          style={{
            background: 'linear-gradient(90deg, #3b82f6 0%, #e8b422 40%, #f97316 70%, #ef4444 100%)',
            boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.4)',
          }}
          onMouseDown={handleStart}
          onTouchStart={handleStart}
        >
          {/* Model value marker */}
          {isOverridden && (
            <div
              className="absolute top-1/2 -translate-y-1/2 flex flex-col items-center"
              style={{ left: `${modelValue * 100}%`, transform: 'translateX(-50%) translateY(-50%)' }}
            >
              <div
                className="w-1 h-5 rounded-full opacity-50"
                style={{ background: 'white' }}
                title="ML model score"
              />
            </div>
          )}

          {/* Thumb */}
          <div
            className="absolute top-1/2 -translate-y-1/2 transition-transform"
            style={{
              left: `${pct}%`,
              transform: `translateX(-50%) translateY(-50%) scale(${dragging ? 1.2 : 1})`,
              transition: dragging ? 'transform 0.1s' : 'left 0.15s ease, transform 0.1s',
            }}
          >
            <div
              className="w-6 h-6 rounded-full border-2 border-obsidian-950 shadow-lg flex items-center justify-center"
              style={{
                background: zone.color,
                boxShadow: `0 0 0 3px ${zone.color}30, 0 4px 12px rgba(0,0,0,0.5)`,
              }}
            >
              <div className="w-2 h-2 rounded-full bg-white opacity-60" />
            </div>
          </div>
        </div>

        {/* Tick labels */}
        <div className="flex justify-between mt-2 px-1">
          {[0, 25, 50, 75, 100].map(v => (
            <span key={v} className="text-xs font-mono text-gray-700">{v}</span>
          ))}
        </div>
      </div>

      {/* Active zone info */}
      <div
        className="flex items-start gap-3 p-3 rounded-xl border transition-all duration-300"
        style={{
          background: `${zone.color}10`,
          borderColor: `${zone.color}25`,
        }}
      >
        <span className="text-xl">{zone.emoji}</span>
        <div>
          <div className="text-sm font-semibold" style={{ color: zone.color }}>{zone.label}</div>
          <div className="text-xs text-gray-500 mt-0.5">{zone.desc}</div>
        </div>
        <div className="ml-auto text-right shrink-0">
          <div className="text-lg font-mono font-bold" style={{ color: zone.color }}>
            {Math.round(pct)}
          </div>
          <div className="text-xs text-gray-600">/ 100</div>
        </div>
      </div>

      {isOverridden && (
        <div className="flex items-center gap-2 text-xs text-amber-400/70 font-mono">
          <span>⚡</span>
          <span>Risk overridden · ML predicted {Math.round(modelValue * 100)}</span>
        </div>
      )}
    </div>
  )
}
