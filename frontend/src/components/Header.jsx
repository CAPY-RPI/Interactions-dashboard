import { useState, useEffect } from 'react'

const RANGES = ['24h', '7d', '30d']

function LiveIndicator({ lastUpdated, fetchError }) {
  const [secondsAgo, setSecondsAgo] = useState(null)

  useEffect(() => {
    if (!lastUpdated) return
    const id = setInterval(() => {
      setSecondsAgo(Math.floor((Date.now() - lastUpdated.getTime()) / 1000))
    }, 1000)
    return () => clearInterval(id)
  }, [lastUpdated])

  const dotColor = fetchError
    ? 'bg-[#f59e0b]'
    : lastUpdated
    ? 'bg-[#10b981]'
    : 'bg-[#64748b]'

  const label = fetchError
    ? 'refresh failed'
    : lastUpdated
    ? `updated ${secondsAgo ?? 0}s ago`
    : 'connecting...'

  return (
    <div className="flex items-center gap-2">
      <div className={`w-2 h-2 rounded-full ${dotColor} ${!fetchError && lastUpdated ? 'animate-pulse' : ''}`} />
      <span className="text-[#64748b] text-xs font-mono">{label}</span>
    </div>
  )
}

export default function Header({ range, onRangeChange, lastUpdated, fetchError }) {
  return (
    <header className="flex items-center justify-between px-6 py-4 border-b border-[#2a3147] bg-[#161b27]">
      <div className="flex items-center gap-3">
        <div className="w-2.5 h-2.5 rounded-full bg-[#7c3aed] shadow-[0_0_8px_#7c3aed]" />
        <span className="text-[#f1f5f9] font-semibold text-lg tracking-tight">
          CAPY Dashboard
        </span>
        <span className="text-[#94a3b8] text-xs font-mono ml-1">/ telemetry</span>
      </div>
      <div className="flex items-center gap-4">
        <LiveIndicator lastUpdated={lastUpdated} fetchError={fetchError} />
        <div className="flex items-center gap-1 bg-[#0f1117] rounded-lg p-1 border border-[#2a3147]">
          {RANGES.map((r) => (
            <button
              key={r}
              onClick={() => onRangeChange(r)}
              className={[
                'px-4 py-1.5 rounded-md text-sm font-medium transition-all duration-150',
                range === r
                  ? 'bg-[#7c3aed] text-white shadow-sm'
                  : 'text-[#94a3b8] hover:text-[#f1f5f9] hover:bg-[#1e2435]',
              ].join(' ')}
            >
              {r}
            </button>
          ))}
        </div>
      </div>
    </header>
  )
}
