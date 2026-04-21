import React, { useEffect, useState } from 'react'

const categories = [
  { key: 'Equity', color: '#10b981', bg: 'bg-emerald-500', label: 'Equity', desc: 'High growth potential' },
  { key: 'Debt', color: '#3b82f6', bg: 'bg-sapphire-500', label: 'Debt', desc: 'Stable fixed returns' },
  { key: 'Hybrid', color: '#e8b422', bg: 'bg-gold-500', label: 'Hybrid', desc: 'Balanced blend' },
]

export default function AllocationChart({ allocation }) {
  const [widths, setWidths] = useState({ Equity: 0, Debt: 0, Hybrid: 0 })

  useEffect(() => {
    const t = setTimeout(() => setWidths(allocation), 200)
    return () => clearTimeout(t)
  }, [allocation])

  return (
    <div className="space-y-4">
      {/* Stacked bar */}
      <div className="flex rounded-xl overflow-hidden h-3 gap-0.5">
        {categories.map(cat => (
          <div
            key={cat.key}
            style={{
              width: `${widths[cat.key] || 0}%`,
              backgroundColor: cat.color,
              transition: 'width 1.2s cubic-bezier(0.4,0,0.2,1)',
              boxShadow: `0 0 8px ${cat.color}60`,
            }}
          />
        ))}
      </div>

      {/* Individual bars */}
      <div className="space-y-3 pt-1">
        {categories.map((cat, i) => (
          <div key={cat.key} className="fade-up" style={{ animationDelay: `${i * 150}ms` }}>
            <div className="flex items-center justify-between mb-1.5">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: cat.color, boxShadow: `0 0 6px ${cat.color}` }} />
                <span className="text-sm font-medium text-gray-300 font-body">{cat.label}</span>
                <span className="text-xs text-gray-600">{cat.desc}</span>
              </div>
              <span className="font-mono text-sm font-semibold" style={{ color: cat.color }}>
                {allocation[cat.key]?.toFixed(1)}%
              </span>
            </div>
            <div className="h-1.5 rounded-full bg-obsidian-700 overflow-hidden">
              <div
                style={{
                  width: `${widths[cat.key] || 0}%`,
                  backgroundColor: cat.color,
                  height: '100%',
                  borderRadius: '4px',
                  transition: `width 1.2s cubic-bezier(0.4,0,0.2,1) ${i * 0.1}s`,
                  boxShadow: `0 0 8px ${cat.color}40`,
                }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
