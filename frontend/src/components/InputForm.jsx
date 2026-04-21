import React, { useState } from 'react'

const fields = [
  {
    id: 'age',
    label: 'Age',
    placeholder: '28',
    unit: 'years',
    icon: '◈',
    hint: '18 – 70',
    type: 'number',
  },
  {
    id: 'salary',
    label: 'Annual Income',
    placeholder: '12.5',
    unit: 'LPA',
    icon: '◈',
    hint: 'Gross income per year',
    type: 'number',
    step: '0.1',
  },
  {
    id: 'expenses',
    label: 'Annual Expenses',
    placeholder: '4.0',
    unit: 'LPA',
    icon: '◈',
    hint: 'Total yearly spending',
    type: 'number',
    step: '0.1',
  },
  {
    id: 'horizon',
    label: 'Investment Horizon',
    placeholder: '10',
    unit: 'years',
    icon: '◈',
    hint: 'How long you plan to invest',
    type: 'number',
  },
  {
    id: 'monthly_investment',
    label: 'Monthly SIP',
    placeholder: '20000',
    unit: '₹',
    unitPosition: 'left',
    icon: '◈',
    hint: 'Monthly SIP amount',
    type: 'number',
  },
]

export default function InputForm({ onSubmit, loading }) {
  const [values, setValues] = useState({
    age: '', salary: '', expenses: '', horizon: '', monthly_investment: ''
  })
  const [errors, setErrors] = useState({})
  const [focused, setFocused] = useState(null)

  const validate = () => {
    const e = {}
    if (!values.age || values.age < 18 || values.age > 70) e.age = 'Enter age between 18–70'
    if (!values.salary || values.salary <= 0) e.salary = 'Enter a valid income'
    if (!values.expenses || values.expenses < 0) e.expenses = 'Enter valid expenses'
    if (parseFloat(values.expenses) >= parseFloat(values.salary)) e.expenses = 'Expenses must be less than income'
    if (!values.horizon || values.horizon < 1 || values.horizon > 40) e.horizon = 'Enter 1–40 years'
    if (!values.monthly_investment || values.monthly_investment < 500) e.monthly_investment = 'Minimum ₹500'
    return e
  }

  const handleChange = (id, val) => {
    setValues(v => ({ ...v, [id]: val }))
    if (errors[id]) setErrors(e => ({ ...e, [id]: null }))
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length) { setErrors(errs); return }
    onSubmit(values)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        {fields.map((field, idx) => (
          <div
            key={field.id}
            className={`fade-up animate-delay-${(idx + 1) * 100} ${field.id === 'monthly_investment' ? 'sm:col-span-2' : ''}`}
          >
            <label className="block mb-2">
              <span className="label-text">{field.label}</span>
              {field.hint && (
                <span className="ml-2 text-xs text-gray-600 font-body normal-case tracking-normal">{field.hint}</span>
              )}
            </label>
            <div className={`relative group flex items-center`}>
              {field.unitPosition === 'left' && (
                <span className="absolute left-4 text-gray-500 font-mono text-sm pointer-events-none z-10">
                  {field.unit}
                </span>
              )}
              <input
                type={field.type}
                step={field.step || '1'}
                min="0"
                value={values[field.id]}
                onChange={e => handleChange(field.id, e.target.value)}
                onFocus={() => setFocused(field.id)}
                onBlur={() => setFocused(null)}
                placeholder={field.placeholder}
                className={`input-field ${field.unitPosition === 'left' ? 'pl-8' : ''} ${errors[field.id] ? 'border-red-500/50 focus:border-red-400' : ''}`}
              />
              {field.unit && field.unitPosition !== 'left' && (
                <span className="absolute right-4 text-xs font-mono text-gray-500 pointer-events-none">
                  {field.unit}
                </span>
              )}
            </div>
            {errors[field.id] && (
              <p className="mt-1.5 text-xs text-red-400 font-body fade-up">
                ⚠ {errors[field.id]}
              </p>
            )}
          </div>
        ))}
      </div>

      <div className="pt-2 fade-up animate-delay-500">
        <button
          type="submit"
          disabled={loading}
          className="btn-primary w-full flex items-center justify-center gap-3 disabled:opacity-60 disabled:cursor-not-allowed disabled:transform-none"
        >
          {loading ? (
            <>
              <span className="inline-block w-4 h-4 border-2 border-obsidian-900 border-t-transparent rounded-full animate-spin" />
              <span>Analysing Your Profile…</span>
            </>
          ) : (
            <>
              <span>Generate My Fund Plan</span>
              <span className="text-obsidian-900 opacity-60">→</span>
            </>
          )}
        </button>
      </div>
    </form>
  )
}
