import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Cell,
  ResponsiveContainer,
} from 'recharts'

const TYPE_COLORS = {
  slash_command: '#7c3aed',
  button: '#3b82f6',
  modal: '#14b8a6',
  dropdown: '#f59e0b',
}

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-[#1e2435] border border-[#2a3147] rounded-lg px-3 py-2 text-sm shadow-xl">
      <p className="text-[#f1f5f9] font-medium capitalize mb-1">{label?.replace('_', ' ')}</p>
      <p className="text-[#94a3b8]">
        <span className="text-[#f1f5f9] font-mono font-semibold">{payload[0].value.toLocaleString()}</span>
        {' '}interactions
      </p>
    </div>
  )
}

export default function InteractionTypeChart({ data }) {
  const chartData = (data || []).map((d) => ({
    ...d,
    label: d.interaction_type.replace('_', ' '),
  }))

  return (
    <div className="bg-[#161b27] rounded-xl border border-[#2a3147] p-5">
      <h2 className="text-[#f1f5f9] font-semibold text-sm uppercase tracking-wider mb-5">
        Interaction Types
      </h2>
      <ResponsiveContainer width="100%" height={200}>
        <BarChart
          data={chartData}
          layout="vertical"
          margin={{ top: 0, right: 16, left: 8, bottom: 0 }}
          barCategoryGap="30%"
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#2a3147" horizontal={false} />
          <XAxis
            type="number"
            tick={{ fill: '#94a3b8', fontSize: 11 }}
            tickLine={false}
            axisLine={{ stroke: '#2a3147' }}
          />
          <YAxis
            type="category"
            dataKey="label"
            tick={{ fill: '#94a3b8', fontSize: 12 }}
            tickLine={false}
            axisLine={false}
            width={90}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: '#2a3147', fillOpacity: 0.4 }} />
          <Bar dataKey="count" radius={[0, 4, 4, 0]}>
            {chartData.map((entry) => (
              <Cell
                key={entry.interaction_type}
                fill={TYPE_COLORS[entry.interaction_type] || '#7c3aed'}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
