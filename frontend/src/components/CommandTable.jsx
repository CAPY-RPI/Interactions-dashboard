function SuccessBar({ rate }) {
  if (rate === null || rate === undefined) {
    return <span className="text-[#94a3b8] text-xs">—</span>
  }
  const pct = (rate * 100).toFixed(1)
  const color = rate >= 0.95 ? '#10b981' : rate >= 0.8 ? '#f59e0b' : '#ef4444'
  return (
    <div className="flex items-center gap-2">
      <div className="relative w-20 h-1.5 bg-[#2a3147] rounded-full overflow-hidden flex-shrink-0">
        <div
          className="absolute inset-y-0 left-0 rounded-full"
          style={{ width: `${Math.min(rate * 100, 100)}%`, backgroundColor: color }}
        />
      </div>
      <span className="font-mono text-xs" style={{ color }}>
        {pct}%
      </span>
    </div>
  )
}

export default function CommandTable({ data }) {
  const sorted = [...(data || [])].sort((a, b) => b.invocations - a.invocations)

  return (
    <div className="bg-[#161b27] rounded-xl border border-[#2a3147] overflow-hidden">
      <div className="px-5 py-4 border-b border-[#2a3147]">
        <h2 className="text-[#f1f5f9] font-semibold text-sm uppercase tracking-wider">
          Commands
        </h2>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[#2a3147]">
              <th className="text-left px-5 py-3 text-[#94a3b8] text-xs font-medium uppercase tracking-wider">
                Command
              </th>
              <th className="text-right px-5 py-3 text-[#94a3b8] text-xs font-medium uppercase tracking-wider">
                Invocations
              </th>
              <th className="text-right px-5 py-3 text-[#94a3b8] text-xs font-medium uppercase tracking-wider">
                Avg Latency
              </th>
              <th className="text-left px-5 py-3 text-[#94a3b8] text-xs font-medium uppercase tracking-wider">
                Success Rate
              </th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((row, i) => (
              <tr
                key={row.command_name}
                className={[
                  'border-b border-[#2a3147] last:border-0 transition-colors hover:bg-[#1e2435]/60',
                  i % 2 === 1 ? 'bg-[#1e2435]/30' : '',
                ].join(' ')}
              >
                <td className="px-5 py-3.5">
                  <span className="font-mono text-[#7c3aed] text-sm">/{row.command_name}</span>
                </td>
                <td className="px-5 py-3.5 text-right font-mono text-[#f1f5f9]">
                  {row.invocations.toLocaleString()}
                </td>
                <td className="px-5 py-3.5 text-right font-mono text-[#94a3b8]">
                  {row.avg_latency_ms != null ? `${row.avg_latency_ms.toFixed(0)} ms` : '—'}
                </td>
                <td className="px-5 py-3.5">
                  <SuccessBar rate={row.success_rate} />
                </td>
              </tr>
            ))}
            {sorted.length === 0 && (
              <tr>
                <td colSpan={4} className="px-5 py-8 text-center text-[#94a3b8] text-sm">
                  No command data for this period.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
