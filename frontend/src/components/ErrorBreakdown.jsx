import { PieChart, Pie, Cell, Legend, Tooltip, ResponsiveContainer } from 'recharts'

const ERROR_COLORS = ['#ef4444', '#f59e0b', '#fb923c', '#f87171']

function CustomTooltip({ active, payload }) {
  if (!active || !payload?.length) return null
  const { name, value } = payload[0]
  return (
    <div className="bg-[#1e2435] border border-[#2a3147] rounded-lg px-3 py-2 text-sm shadow-xl">
      <p className="text-[#f1f5f9] font-mono">{name}</p>
      <p className="text-[#94a3b8]">
        <span className="text-[#f1f5f9] font-semibold">{value}</span> occurrences
      </p>
    </div>
  )
}

function CustomLegend({ payload }) {
  return (
    <ul className="flex flex-col gap-1.5 mt-3">
      {payload.map((entry) => (
        <li key={entry.value} className="flex items-center gap-2 text-xs">
          <span
            className="w-2.5 h-2.5 rounded-sm flex-shrink-0"
            style={{ backgroundColor: entry.color }}
          />
          <span className="text-[#94a3b8]">{entry.value}</span>
          <span className="text-[#f1f5f9] font-mono ml-auto">{entry.payload.value}</span>
        </li>
      ))}
    </ul>
  )
}

export default function ErrorBreakdown({ data }) {
  const hasData = data && data.length > 0

  return (
    <div className="bg-[#161b27] rounded-xl border border-[#2a3147] p-5 flex flex-col">
      <h2 className="text-[#f1f5f9] font-semibold text-sm uppercase tracking-wider mb-4">
        Error Breakdown
      </h2>
      {!hasData ? (
        <div className="flex-1 flex flex-col items-center justify-center gap-2 py-8">
          <div className="w-10 h-10 rounded-full bg-[#10b981]/10 flex items-center justify-center">
            <svg className="w-5 h-5 text-[#10b981]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <span className="text-[#94a3b8] text-sm">No errors in this period</span>
        </div>
      ) : (
        <div className="flex-1 flex flex-col">
          <ResponsiveContainer width="100%" height={180}>
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={52}
                outerRadius={80}
                paddingAngle={3}
                dataKey="count"
                nameKey="error_type"
              >
                {data.map((entry, i) => (
                  <Cell
                    key={entry.error_type}
                    fill={ERROR_COLORS[i % ERROR_COLORS.length]}
                    stroke="transparent"
                  />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
          <CustomLegend
            payload={data.map((d, i) => ({
              value: d.error_type,
              color: ERROR_COLORS[i % ERROR_COLORS.length],
              payload: d,
            }))}
          />
        </div>
      )}
    </div>
  )
}
