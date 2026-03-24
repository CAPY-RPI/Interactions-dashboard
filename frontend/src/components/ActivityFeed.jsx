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

function formatTimestamp(iso) {
  const d = new Date(iso)
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
}

export default function ActivityFeed({ data }) {
  return (
    <div className="bg-[#161b27] rounded-xl border border-[#2a3147] p-5">
      <h2 className="text-[#f1f5f9] font-semibold text-sm uppercase tracking-wider mb-4">
        Recent Activity
      </h2>
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
            {data.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-8 text-center text-[#64748b] text-sm">
                  No recent activity
                </td>
              </tr>
            ) : (
              data.map((row, i) => (
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
                    {row.command_name ?? <span className="text-[#64748b]">—</span>}
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
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
