import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'

const COLORS = {
  slash_command: '#7c3aed',
  button: '#3b82f6',
  modal: '#14b8a6',
}

function formatDate(dateStr, range) {
  // hourly: "2026-03-20T14:00" — already has time component
  // daily:  "2026-03-20"       — needs time appended for UTC parse
  const iso = dateStr.includes('T') ? dateStr + ':00Z' : dateStr + 'T00:00:00Z'
  const d = new Date(iso)
  if (range === '24h') {
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }
  return d.toLocaleDateString([], { month: 'short', day: 'numeric' })
}

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-[#1e2435] border border-[#2a3147] rounded-lg p-3 shadow-xl text-sm">
      <p className="text-[#94a3b8] mb-2 text-xs">{label}</p>
      {payload.map((entry) => (
        <div key={entry.dataKey} className="flex items-center gap-2 mb-1">
          <span
            className="w-2 h-2 rounded-full flex-shrink-0"
            style={{ backgroundColor: entry.color }}
          />
          <span className="text-[#94a3b8] capitalize">{entry.dataKey.replace('_', ' ')}:</span>
          <span className="text-[#f1f5f9] font-mono ml-auto pl-4">{entry.value}</span>
        </div>
      ))}
    </div>
  )
}

export default function TimeSeriesChart({ data, range }) {
  const formatted = data.map((d) => ({
    ...d,
    label: formatDate(d.timestamp, range),
  }))

  return (
    <div className="bg-[#161b27] rounded-xl border border-[#2a3147] p-5">
      <h2 className="text-[#f1f5f9] font-semibold text-sm uppercase tracking-wider mb-5">
        Interactions Over Time
      </h2>
      <ResponsiveContainer width="100%" height={260}>
        <AreaChart data={formatted} margin={{ top: 4, right: 8, left: -8, bottom: 0 }}>
          <defs>
            {Object.entries(COLORS).map(([key, color]) => (
              <linearGradient key={key} id={`grad-${key}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={color} stopOpacity={0.25} />
                <stop offset="95%" stopColor={color} stopOpacity={0} />
              </linearGradient>
            ))}
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#2a3147" vertical={false} />
          <XAxis
            dataKey="label"
            tick={{ fill: '#94a3b8', fontSize: 11 }}
            tickLine={false}
            axisLine={{ stroke: '#2a3147' }}
            interval="preserveStartEnd"
          />
          <YAxis
            tick={{ fill: '#94a3b8', fontSize: 11 }}
            tickLine={false}
            axisLine={false}
            width={36}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#2a3147', strokeWidth: 1 }} />
          <Legend
            formatter={(value) => (
              <span className="text-[#94a3b8] text-xs capitalize">
                {value.replace('_', ' ')}
              </span>
            )}
          />
          {Object.entries(COLORS).map(([key, color]) => (
            <Area
              key={key}
              type="monotone"
              dataKey={key}
              stroke={color}
              strokeWidth={2}
              fill={`url(#grad-${key})`}
              dot={false}
              activeDot={{ r: 4, fill: color, stroke: '#161b27', strokeWidth: 2 }}
            />
          ))}
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}
