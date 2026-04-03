import { useState, Fragment } from 'react'

function StatusBadge({ status }) {
  if (!status) return <span className="text-[#64748b] text-xs">—</span>
  const styles = {
    success: 'bg-[#10b981]/15 text-[#10b981]',
    user_error: 'bg-[#f59e0b]/15 text-[#f59e0b]',
    internal_error: 'bg-[#ef4444]/15 text-[#ef4444]',
  }
  const label = { success: 'success', user_error: 'user error', internal_error: 'internal error' }
  return (
    <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${styles[status] || 'bg-[#2a3147] text-[#94a3b8]'}`}>
      {label[status] ?? status}
    </span>
  )
}

function Chevron({ open }) {
  return (
    <svg
      className="w-3 h-3 text-[#64748b] flex-shrink-0 transition-transform duration-150"
      style={{ transform: open ? 'rotate(90deg)' : 'rotate(0deg)' }}
      fill="none" viewBox="0 0 24 24" stroke="currentColor"
    >
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
    </svg>
  )
}

const LIMIT_OPTIONS = [10, 25, 50]

function formatTimestamp(iso) {
  return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
}

/**
 * Groups a flat newest-first event list so that button/modal events with a
 * command_name are nested under the most recent slash_command with that name.
 * Events with no matching parent slash command remain top-level.
 */
/**
 * Groups a flat newest-first event list by time proximity.
 * Button/modal events that occur within WINDOW_MS after a slash command
 * are nested under that slash command. The bot sends command_name: null
 * on button/modal events, so time-based matching is the only option.
 */
const WINDOW_MS = 10 * 60 * 1000 // 10 minutes

function groupEvents(flat) {
  // Build a grouped entry for every slash command
  const slashByTs = {}
  for (const event of flat) {
    if (event.interaction_type === 'slash_command') {
      slashByTs[event.timestamp] = { ...event, subs: [] }
    }
  }
  const slashEntries = Object.values(slashByTs)

  // For each button/modal, find the most recent slash command that
  // occurred before it within the time window
  const consumedTs = new Set()
  for (const event of flat) {
    if (event.interaction_type === 'slash_command') continue
    const eventTime = new Date(event.timestamp).getTime()

    let bestParent = null
    let bestDiff = Infinity
    for (const slash of slashEntries) {
      const diff = eventTime - new Date(slash.timestamp).getTime()
      if (diff >= 0 && diff <= WINDOW_MS && diff < bestDiff) {
        bestDiff = diff
        bestParent = slash
      }
    }

    if (bestParent) {
      bestParent.subs.push(event)
      consumedTs.add(event.timestamp)
    }
  }

  // Rebuild the list in original order, skipping consumed sub-events
  const result = []
  for (const event of flat) {
    if (event.interaction_type === 'slash_command') {
      result.push(slashByTs[event.timestamp])
    } else if (!consumedTs.has(event.timestamp)) {
      result.push({ ...event, subs: [] })
    }
  }

  return result
}

export default function ActivityFeed({ data }) {
  const [limit, setLimit] = useState(25)
  const [expanded, setExpanded] = useState(new Set())

  const grouped = groupEvents(data)
  const visible = grouped.slice(0, limit)

  function toggle(key) {
    setExpanded(prev => {
      const next = new Set(prev)
      next.has(key) ? next.delete(key) : next.add(key)
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
          {LIMIT_OPTIONS.map(n => (
            <button
              key={n}
              onClick={() => setLimit(n)}
              className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${
                limit === n ? 'bg-[#7c3aed] text-white' : 'text-[#64748b] hover:text-[#f1f5f9] hover:bg-[#2a3147]'
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
            ) : visible.map(row => {
              const hasSubs = row.subs.length > 0
              const isOpen = expanded.has(row.timestamp)
              return (
                <Fragment key={row.timestamp}>
                  {/* Primary row */}
                  <tr
                    onClick={() => hasSubs && toggle(row.timestamp)}
                    className={`border-b border-[#2a3147]/50 transition-colors hover:bg-[#1e2435]/50 ${hasSubs ? 'cursor-pointer' : ''}`}
                  >
                    <td className="py-2.5 pr-4 font-mono text-xs text-[#94a3b8] whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        {hasSubs ? <Chevron open={isOpen} /> : <span className="w-3 inline-block" />}
                        {formatTimestamp(row.timestamp)}
                      </div>
                    </td>
                    <td className="py-2.5 pr-4 font-mono text-xs text-[#94a3b8]">{row.user_id}</td>
                    <td className="py-2.5 pr-4 text-xs text-[#f1f5f9] capitalize">{row.interaction_type.replace('_', ' ')}</td>
                    <td className="py-2.5 pr-4 font-mono text-xs text-[#f1f5f9]">
                      {row.command_name ?? <span className="text-[#64748b]">—</span>}
                    </td>
                    <td className="py-2.5 pr-4"><StatusBadge status={row.status} /></td>
                    <td className="py-2.5 pr-4 text-right font-mono text-xs text-[#94a3b8]">
                      {row.duration_ms != null ? `${Math.round(row.duration_ms)}ms` : <span className="text-[#64748b]">—</span>}
                    </td>
                    <td className="py-2.5 text-xs text-[#ef4444]">{row.error_type ?? ''}</td>
                  </tr>

                  {/* Sub-interaction rows — only rendered when expanded */}
                  {hasSubs && isOpen && row.subs.map(sub => (
                    <tr key={sub.timestamp} className="border-b border-[#2a3147]/30 bg-[#0f1117]/50">
                      <td className="py-2 pr-4 font-mono text-xs text-[#64748b] whitespace-nowrap pl-6">
                        └ {formatTimestamp(sub.timestamp)}
                      </td>
                      <td className="py-2 pr-4 font-mono text-xs text-[#64748b]">{sub.user_id}</td>
                      <td className="py-2 pr-4 text-xs text-[#64748b] capitalize">{sub.interaction_type.replace('_', ' ')}</td>
                      <td className="py-2 pr-4 font-mono text-xs text-[#64748b]">
                        {sub.command_name ?? <span className="text-[#475569]">—</span>}
                      </td>
                      <td className="py-2 pr-4"><StatusBadge status={sub.status} /></td>
                      <td className="py-2 pr-4 text-right font-mono text-xs text-[#64748b]">
                        {sub.duration_ms != null ? `${Math.round(sub.duration_ms)}ms` : <span className="text-[#475569]">—</span>}
                      </td>
                      <td className="py-2 text-xs text-[#ef4444]">{sub.error_type ?? ''}</td>
                    </tr>
                  ))}
                </Fragment>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
