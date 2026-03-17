function ArrowUp() {
  return (
    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
    </svg>
  )
}

function ArrowDown() {
  return (
    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
    </svg>
  )
}

export default function MetricCard({ title, value, unit, change, color = '#7c3aed' }) {
  const isPositive = change >= 0
  const changeAbs = Math.abs(change).toFixed(1)
  // For latency, lower is better (positive change = bad)
  const isGood = title.toLowerCase().includes('latency') ? !isPositive : isPositive
  const changeColor = change === 0 ? '#94a3b8' : isGood ? '#10b981' : '#ef4444'

  return (
    <div
      className="bg-[#161b27] rounded-xl border border-[#2a3147] p-5 flex flex-col gap-3"
      style={{ borderTop: `3px solid ${color}` }}
    >
      <div className="flex items-center justify-between">
        <span className="text-[#94a3b8] text-xs font-medium uppercase tracking-wider">
          {title}
        </span>
        <div
          className="flex items-center gap-1 text-xs font-medium"
          style={{ color: changeColor }}
        >
          {change !== 0 && (isPositive ? <ArrowUp /> : <ArrowDown />)}
          <span>
            {change === 0 ? '—' : `${isPositive ? '+' : '-'}${changeAbs}%`}
          </span>
        </div>
      </div>
      <div className="flex items-end gap-1.5">
        <span className="text-[#f1f5f9] text-3xl font-bold font-mono leading-none">
          {typeof value === 'number' && value % 1 !== 0
            ? value.toFixed(1)
            : value}
        </span>
        {unit && (
          <span className="text-[#94a3b8] text-sm mb-0.5">{unit}</span>
        )}
      </div>
      <div className="text-[#94a3b8] text-xs">
        vs prior period
      </div>
    </div>
  )
}
