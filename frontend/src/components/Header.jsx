const RANGES = ['24h', '7d', '30d']

export default function Header({ range, onRangeChange }) {
  return (
    <header className="flex items-center justify-between px-6 py-4 border-b border-[#2a3147] bg-[#161b27]">
      <div className="flex items-center gap-3">
        <div className="w-2.5 h-2.5 rounded-full bg-[#7c3aed] shadow-[0_0_8px_#7c3aed]" />
        <span className="text-[#f1f5f9] font-semibold text-lg tracking-tight">
          CAPY Dashboard
        </span>
        <span className="text-[#94a3b8] text-xs font-mono ml-1">/ telemetry</span>
      </div>
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
    </header>
  )
}
