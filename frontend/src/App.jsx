import React, { useState } from 'react'
import axios from 'axios'
import InputForm from './components/InputForm'
import Results from './components/Results'

function Logo() {
  return (
    <div className="flex items-center gap-3">
      <div className="relative w-9 h-9">
        <svg viewBox="0 0 36 36" fill="none" className="w-full h-full">
          <circle cx="18" cy="18" r="17" stroke="#e8b422" strokeWidth="1.5" strokeOpacity="0.4" />
          <path d="M9 24 L14 14 L18 20 L22 12 L27 24" stroke="#e8b422" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
          <circle cx="18" cy="10" r="2.5" fill="#e8b422" opacity="0.8" />
        </svg>
      </div>
      <div>
        <div className="text-lg font-display font-bold gold-text leading-none">FundWise</div>
        <div className="text-xs text-gray-600 font-mono tracking-widest leading-none mt-0.5">AI ADVISOR</div>
      </div>
    </div>
  )
}

function LoadingScreen() {
  return (
    <div className="flex flex-col items-center justify-center py-20 gap-6">
      <div className="relative">
        <div className="w-16 h-16 rounded-full border-2 border-obsidian-700" />
        <div className="absolute inset-0 w-16 h-16 rounded-full border-2 border-t-gold-400 border-r-gold-400 border-b-transparent border-l-transparent animate-spin" />
        <div className="absolute inset-2 w-12 h-12 rounded-full border border-t-emerald-400 border-b-transparent border-l-transparent border-r-transparent animate-spin" style={{ animationDuration: '1.5s', animationDirection: 'reverse' }} />
      </div>
      <div className="text-center space-y-2">
        <p className="text-white font-body font-medium">Analysing Your Financial Profile</p>
        <div className="flex items-center gap-3 text-xs text-gray-600 font-mono">
          <span className="animate-pulse">Scoring risk</span>
          <span className="text-gold-500">·</span>
          <span className="animate-pulse" style={{ animationDelay: '0.3s' }}>Mapping allocation</span>
          <span className="text-gold-500">·</span>
          <span className="animate-pulse" style={{ animationDelay: '0.6s' }}>Ranking funds</span>
        </div>
      </div>
    </div>
  )
}

export default function App() {
  const [state, setState] = useState('form') // 'form' | 'loading' | 'results' | 'error'
  const [results, setResults] = useState(null)
  const [inputs, setInputs] = useState(null)
  const [error, setError] = useState(null)

  const handleSubmit = async (values) => {
    setInputs(values)
    setState('loading')
    setError(null)

    try {
      const res = await axios.post('/api/recommend', {
        age: parseFloat(values.age),
        salary: parseFloat(values.salary),
        expenses: parseFloat(values.expenses),
        horizon: parseFloat(values.horizon),
        monthly_investment: parseFloat(values.monthly_investment),
      })

      if (res.data.success) {
        setResults(res.data)
        setState('results')
      } else {
        setError(res.data.error || 'Something went wrong.')
        setState('error')
      }
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Server error. Is Flask running?')
      setState('error')
    }
  }

  return (
    <div className="min-h-screen relative z-10">
      {/* Background orbs */}
      <div className="orb orb-1" />
      <div className="orb orb-2" />
      <div className="orb orb-3" />

      {/* Nav */}
      <nav className="relative z-20 flex items-center justify-between px-6 py-4 border-b border-white/5 glass">
        <Logo />
        <div className="hidden sm:flex items-center gap-6 text-xs font-mono text-gray-600">
          <span>ML-Powered</span>
          <span className="text-gold-500">·</span>
          <span>Risk-Profiled</span>
          <span className="text-gold-500">·</span>
          <span>3-Fund Strategy</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-xs text-emerald-400 font-mono">Live</span>
        </div>
      </nav>

      {/* Main */}
      <main className="relative z-10 max-w-5xl mx-auto px-4 py-12">

        {/* Hero text — shown only on form */}
        {state === 'form' && (
          <div className="text-center mb-12 fade-up">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full glass-light border border-gold-500/20 text-gold-400 text-xs font-mono mb-6">
              ✦ Intelligent Mutual Fund Recommendations
            </div>
            <h1 className="text-4xl sm:text-5xl font-display font-bold text-white leading-tight mb-4">
              Invest with{' '}
              <span className="gold-text">Precision</span>
              <br />
              <span className="italic font-normal text-gray-400">not guesswork</span>
            </h1>
            <p className="text-gray-500 max-w-lg mx-auto leading-relaxed font-body">
              Our ML models analyse your risk profile, income, and goals to recommend the perfect 
              3-fund portfolio — Equity, Debt, and Hybrid — tailored to you.
            </p>

            {/* Feature pills */}
            <div className="flex flex-wrap justify-center gap-3 mt-8">
              {['Risk Scoring', 'Smart Allocation', 'XGBoost Ranking', 'SIP Optimised'].map(f => (
                <span key={f} className="px-3 py-1.5 rounded-full glass-light border border-white/8 text-xs text-gray-500 font-body">
                  {f}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Card */}
        <div className={`glass rounded-3xl border border-white/6 overflow-hidden shadow-2xl ${state === 'results' ? 'p-6 sm:p-10' : 'max-w-2xl mx-auto p-6 sm:p-10'}`}>

          {state === 'form' && (
            <>
              <div className="mb-8">
                <h2 className="text-xl font-display font-semibold text-white mb-1">Your Financial Profile</h2>
                <p className="text-sm text-gray-600">Fill in your details to get personalised fund recommendations</p>
              </div>
              <InputForm onSubmit={handleSubmit} loading={false} />
            </>
          )}

          {state === 'loading' && <LoadingScreen />}

          {state === 'results' && results && (
            <Results initialData={results} inputs={inputs} onReset={() => setState('form')} />
          )}

          {state === 'error' && (
            <div className="text-center py-16 fade-up">
              <div className="text-5xl mb-4">⚠</div>
              <h3 className="text-lg font-display font-semibold text-white mb-2">Something went wrong</h3>
              <p className="text-sm text-gray-500 mb-6 font-mono">{error}</p>
              <button
                onClick={() => setState('form')}
                className="btn-primary px-6 py-3 text-sm"
              >
                Try Again
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-gray-700 font-mono mt-10">
          FundWise · Powered by Linear Regression & XGBoost · Not SEBI registered
        </p>
      </main>
    </div>
  )
}
