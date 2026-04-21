import React, { useState, useEffect, useRef, useCallback } from 'react'
import axios from 'axios'
import RiskMeter from './RiskMeter'
import AllocationChart from './AllocationChart'
import FundCard from './FundCard'
import FutureValueChart from './FutureValueChart'
import RiskSlider from './RiskSlider'

function useDebounce(value, delay) {
  const [debounced, setDebounced] = useState(value)
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay)
    return () => clearTimeout(t)
  }, [value, delay])
  return debounced
}

export default function Results({ initialData, inputs, onReset }) {
  const [data, setData]               = useState(initialData)
  const [riskScore, setRiskScore]     = useState(initialData.risk_score)
  const [modelRisk]                   = useState(initialData.model_risk_score ?? initialData.risk_score)
  const [rebalancing, setRebalancing] = useState(false)
  const [activeTab, setActiveTab]     = useState('funds')   // 'funds' | 'projection'

  const debouncedRisk = useDebounce(riskScore, 420)

  // Fire rebalance whenever debounced risk changes (skip on first mount)
  const mounted = useRef(false)
  useEffect(() => {
    if (!mounted.current) { mounted.current = true; return }
    if (Math.abs(debouncedRisk - data.risk_score) < 0.001) return

    setRebalancing(true)
    axios.post('/api/rebalance', {
      age:              parseFloat(inputs.age),
      salary:           parseFloat(inputs.salary),
      horizon:          parseFloat(inputs.horizon),
      monthly_investment: parseFloat(inputs.monthly_investment),
      risk_score:       debouncedRisk,
    }).then(res => {
      if (res.data.success) setData(res.data)
    }).catch(console.error)
     .finally(() => setRebalancing(false))
  }, [debouncedRisk])

  const totalMonthly = parseFloat(inputs.monthly_investment)

  const tabs = [
    { id: 'funds',      label: 'Recommended Funds', icon: '◈' },
    { id: 'projection', label: 'Future Value',       icon: '📈' },
  ]

  return (
    <div className="space-y-8 fade-up">

      {/* Page header */}
      <div className="text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full glass-light border border-emerald-500/20 text-emerald-400 text-xs font-semibold mb-4">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          Analysis Complete
        </div>
        <h2 className="text-2xl font-display font-bold text-white">
          Your Personalised <span className="gold-text">Fund Portfolio</span>
        </h2>
        <p className="text-sm text-gray-500 mt-2">
          Age {inputs.age} · ₹{parseFloat(inputs.salary)} LPA · {inputs.horizon}yr horizon
        </p>
      </div>

      {/* ── Top row: Risk Meter + Allocation + Risk Slider ── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">

        {/* Risk Meter */}
        <div className="stat-card flex flex-col items-center py-8 relative overflow-hidden">
          {rebalancing && (
            <div className="absolute inset-0 bg-obsidian-900/60 flex items-center justify-center z-10 rounded-2xl">
              <div className="w-6 h-6 border-2 border-t-gold-400 border-obsidian-700 rounded-full animate-spin" />
            </div>
          )}
          <div className="label-text mb-6">Risk Profile</div>
          <RiskMeter score={data.risk_score} label={data.risk_label} color={data.risk_color} />
        </div>

        {/* Allocation */}
        <div className="stat-card relative overflow-hidden">
          {rebalancing && (
            <div className="absolute inset-0 bg-obsidian-900/60 flex items-center justify-center z-10 rounded-2xl">
              <div className="w-6 h-6 border-2 border-t-gold-400 border-obsidian-700 rounded-full animate-spin" />
            </div>
          )}
          <div className="label-text mb-5">Portfolio Allocation</div>
          <AllocationChart allocation={data.allocation} />
          <div className="gold-divider mt-5 mb-4" />
          <div className="flex justify-between text-xs text-gray-600">
            <span>Monthly SIP</span>
            <span className="font-mono text-gold-400 font-semibold">₹{totalMonthly.toLocaleString('en-IN')}/mo</span>
          </div>
        </div>

        {/* Risk Slider */}
        <div className="stat-card">
          <RiskSlider
            value={riskScore}
            modelValue={modelRisk}
            onChange={setRiskScore}
            loading={rebalancing}
          />
        </div>
      </div>

      {/* ── Tab bar ── */}
      <div className="flex gap-1 p-1 glass rounded-xl w-fit">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-5 py-2.5 rounded-lg text-sm font-semibold transition-all duration-300 flex items-center gap-2 ${
              activeTab === tab.id
                ? 'bg-gold-500 text-obsidian-950'
                : 'text-gray-500 hover:text-gray-300'
            }`}
          >
            <span>{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── Fund Cards tab ── */}
      {activeTab === 'funds' && (
        <div className="fade-up">
          <div className="label-text mb-5">ML-Ranked Recommendations</div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 relative">
            {rebalancing && (
              <div className="absolute inset-0 bg-obsidian-950/50 rounded-2xl flex items-center justify-center z-10 backdrop-blur-sm">
                <div className="glass border border-gold-500/20 rounded-xl px-5 py-3 flex items-center gap-3">
                  <div className="w-5 h-5 border-2 border-t-gold-400 border-obsidian-700 rounded-full animate-spin" />
                  <span className="text-sm text-gold-400 font-mono">Reranking funds…</span>
                </div>
              </div>
            )}
            {Object.entries(data.funds).map(([category, fund], idx) => (
              <FundCard
                key={`${category}-${fund.fund_name}`}
                category={category}
                fund={fund}
                rank={idx + 1}
                monthlyInvestment={totalMonthly}
              />
            ))}
          </div>
        </div>
      )}

      {/* ── Future Value tab ── */}
      {activeTab === 'projection' && (
        <div className="fade-up relative">
          <div className="label-text mb-5">SIP Growth Projection</div>
          {rebalancing && (
            <div className="absolute inset-0 bg-obsidian-950/50 rounded-2xl flex items-center justify-center z-10 backdrop-blur-sm">
              <div className="glass border border-gold-500/20 rounded-xl px-5 py-3 flex items-center gap-3">
                <div className="w-5 h-5 border-2 border-t-gold-400 border-obsidian-700 rounded-full animate-spin" />
                <span className="text-sm text-gold-400 font-mono">Recalculating projection…</span>
              </div>
            </div>
          )}
          <FutureValueChart
            data={data.future_value}
            fundRates={data.fund_rates}
            horizon={parseFloat(inputs.horizon)}
          />
        </div>
      )}

      {/* ── Summary strip ── */}
      <div className="glass rounded-2xl p-5">
        <div className="grid grid-cols-3 divide-x divide-white/5 text-center">
          <div className="px-4">
            <div className="label-text mb-1">Funds Selected</div>
            <div className="text-2xl font-display font-bold gold-text">{Object.keys(data.funds).length}</div>
          </div>
          <div className="px-4">
            <div className="label-text mb-1">Monthly SIP</div>
            <div className="text-2xl font-display font-bold text-white">₹{totalMonthly.toLocaleString('en-IN')}</div>
          </div>
          <div className="px-4">
            <div className="label-text mb-1">Risk Score</div>
            <div className="text-2xl font-display font-bold" style={{
              color: data.risk_color === 'blue' ? '#60a5fa' : data.risk_color === 'red' ? '#ef4444' : '#e8b422'
            }}>
              {(data.risk_score * 100).toFixed(0)}
            </div>
          </div>
        </div>
      </div>

      <p className="text-center text-xs text-gray-700 leading-relaxed max-w-xl mx-auto">
        Recommendations generated by ML models. Past performance does not guarantee future results. 
        Consult a SEBI-registered advisor before investing.
      </p>

      <div className="text-center">
        <button
          onClick={onReset}
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl glass-light border border-white/10 text-gray-400 hover:text-white hover:border-gold-500/30 transition-all duration-300 text-sm font-body"
        >
          ← Recalculate with new inputs
        </button>
      </div>
    </div>
  )
}
