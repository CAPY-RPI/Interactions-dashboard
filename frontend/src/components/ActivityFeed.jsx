function StatusBadge({ status }) {
  if (!status) {
    return <span className="text-[#64748b] text-xs">—</span>
  }
  const styles = {
    success: 'bg-[#10b981]/15 text-[#10b981]',
    user_error: 'bg-[#f59e0b]/15 text-[#f59e0b]',
    internal_error: 'bg-[#ef4444]/15 text-[#ef4444]',
  }
  const label = {
    success: 'success',
    user_error: 'user error',
    internal_error: 'internal error',
  }
  return (
    <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${styles[status] || 'bg-[#2a3147] text-[#94a3b8]'}`}>
      {label[status] ?? status}
    </span>
  )
}

import { useState } from 'react'

const LIMIT_OPTIONS = [10, 25, 50]

function formatTimestamp(iso) {
  const d = new Date(iso)
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
}

function OptionsRow({ options, colSpan }) {
  return (
    <tr className="border-b border-[#2a3147]/50 bg-[#0f1117]/40">
      <td colSpan={colSpan} className="px-4 pb-2.5 pt-1">
        <div className="flex flex-wrap gap-2 pl-2 border-l-2 border-[#7c3aed]/40">
          {Object.entries(options).map(([key, value]) => (
            <span key={key} className="inline-flex items-center gap-1 bg-[#2a3147] rounded px-2 py-0.5 text-xs font-mono">
              <span className="text-[#7c3aed]">{key}</span>
              <span className="text-[#64748b]">:</span>
              <span className="text-[#f1f5f9]">{String(value)}</span>
            </span>
          ))}
        </div>
      </td>
    </tr>
  )
}

export default function ActivityFeed({ data }) {
  const [limit, setLimit] = useState(25)
  const [expanded, setExpanded] = useState(new Set())
  const visible = data.slice(0, limit)

  function toggleRow(i) {
    setExpanded(prev => {
      const next = new Set(prev)
      next.has(i) ? next.delete(i) : next.add(i)
      return next
    })
  }

  return (
    <div className="bg-[#161b27] rounded-xl border border-[#2a3147] p-5">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-[#f1f5f9] font-semibold text-sm uppercase tracking-wider">
          Recent Activity
        </h2>
        <div className="flex items-center gap-1">
          <span className="text-[#64748b] text-xs mr-1">Show</span>
          {LIMIT_OPTIONS.map((n) => (
            <button
              key={n}
              onClick={() => setLimit(n)}
              className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${
                limit === n
                  ? 'bg-[#7c3aed] text-white'
                  : 'text-[#64748b] hover:text-[#f1f5f9] hover:bg-[#2a3147]'
              }`}
            >
              {n}
            </button>
          ))}
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-[#64748b] text-xs uppercase tracking-wider border-b border-[#2a3147]">
              <th className="text-left pb-3 pr-4 font-medium">Time</th>
              <th className="text-left pb-3 pr-4 font-medium">User</th>
              <th className="text-left pb-3 pr-4 font-medium">Type</th>
              <th className="text-left pb-3 pr-4 font-medium">Command</th>
              <th className="text-left pb-3 pr-4 font-medium">Status</th>
              <th className="text-right pb-3 pr-4 font-medium">Latency</th>
              <th className="text-left pb-3 font-medium">Error</th>
            </tr>
          </thead>
          <tbody>
            {visible.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-8 text-center text-[#64748b] text-sm">
                  No recent activity
                </td>
              </tr>
            ) : (
              visible.map((row, i) => {
                const hasOptions = row.options && Object.keys(row.options).length > 0
                const isExpanded = expanded.has(i)
                return (
                  <>
                    <tr
                      key={i}
                      className="border-b border-[#2a3147]/50 hover:bg-[#1e2435]/50 transition-colors"
                    >
                      <td className="py-2.5 pr-4 text-[#94a3b8] font-mono text-xs whitespace-nowrap">
                        {formatTimestamp(row.timestamp)}
                      </td>
                      <td className="py-2.5 pr-4 text-[#94a3b8] font-mono text-xs">
                        {row.user_id}
                      </td>
                      <td className="py-2.5 pr-4 text-[#f1f5f9] capitalize text-xs">
                        {row.interaction_type.replace('_', ' ')}
                      </td>
                      <td className="py-2.5 pr-4 text-[#f1f5f9] font-mono text-xs">
                        <div className="flex items-center gap-1.5">
                          <span>{row.command_name ?? <span className="text-[#64748b]">—</span>}</span>
                          {hasOptions && (
                            <button
                              onClick={() => toggleRow(i)}
                              className="text-[#64748b] hover:text-[#7c3aed] transition-colors leading-none"
                              title={isExpanded ? 'Hide options' : 'Show options'}
                            >
                              <svg
                                className={`w-3 h-3 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                                strokeWidth={2.5}
                              >
                                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                              </svg>
                            </button>
                          )}
                        </div>
                      </td>
                      <td className="py-2.5 pr-4">
                        <StatusBadge status={row.status} />
                      </td>
                      <td className="py-2.5 pr-4 text-right font-mono text-xs text-[#94a3b8]">
                        {row.duration_ms != null ? `${Math.round(row.duration_ms)}ms` : <span className="text-[#64748b]">—</span>}
                      </td>
                      <td className="py-2.5 text-xs text-[#ef4444]">
                        {row.error_type ?? ''}
                      </td>
                    </tr>
                    {hasOptions && isExpanded && (
                      <OptionsRow key={`${i}-options`} options={row.options} colSpan={7} />
                    )}
                  </>
                )
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
