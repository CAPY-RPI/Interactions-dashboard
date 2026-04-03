import { useState } from 'react'

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const HOURS = Array.from({ length: 24 }, (_, i) => i)

function formatHourLabel(h) {
  if (h === 0) return '12a'
  if (h === 12) return '12p'
  return h < 12 ? `${h}a` : `${h - 12}p`
}

export default function UsageHeatmap({ data }) {
  const [tooltip, setTooltip] = useState(null)

  // Build lookup: dow -> hour -> count
  const lookup = {}
  let maxCount = 1
  for (const { dow, hour, count } of data) {
    if (!lookup[dow]) lookup[dow] = {}
    lookup[dow][hour] = count
    if (count > maxCount) maxCount = count
  }

  function cellColor(dow, hour) {
    const count = lookup[dow]?.[hour] ?? 0
    if (count === 0) return 'rgba(42, 49, 71, 0.4)'
    const intensity = count / maxCount
    // Purple scale: low = faint purple, high = full #7c3aed
    const alpha = 0.15 + intensity * 0.85
    return `rgba(124, 58, 237, ${alpha.toFixed(2)})`
  }

  return (
    <div className="bg-[#161b27] rounded-xl border border-[#2a3147] p-5">
      <h2 className="text-[#f1f5f9] font-semibold text-sm uppercase tracking-wider mb-5">
        Peak Usage (UTC)
      </h2>

      <div className="overflow-x-auto">
        {/* Hour labels */}
        <div className="flex mb-1 ml-8">
          {HOURS.map((h) => (
            <div
              key={h}
              className="text-[#64748b] text-[10px] text-center flex-1 min-w-[20px]"
            >
              {h % 6 === 0 ? formatHourLabel(h) : ''}
            </div>
          ))}
        </div>

        {/* Grid rows */}
        {DAYS.map((day, dow) => (
          <div key={dow} className="flex items-center mb-1">
            <span className="text-[#64748b] text-[11px] w-8 flex-shrink-0">{day}</span>
            {HOURS.map((hour) => {
              const count = lookup[dow]?.[hour] ?? 0
              return (
                <div
                  key={hour}
                  className="flex-1 min-w-[20px] h-5 rounded-sm mx-px cursor-default transition-opacity hover:opacity-80"
                  style={{ backgroundColor: cellColor(dow, hour) }}
                  onMouseEnter={(e) =>
                    setTooltip({
                      x: e.clientX,
                      y: e.clientY,
                      day,
                      hour,
                      count,
                    })
                  }
                  onMouseLeave={() => setTooltip(null)}
                />
              )
            })}
          </div>
        ))}

        {/* Legend */}
        <div className="flex items-center gap-2 mt-3 justify-end">
          <span className="text-[#64748b] text-[10px]">Less</span>
          {[0.05, 0.3, 0.55, 0.8, 1.0].map((v) => (
            <div
              key={v}
              className="w-3 h-3 rounded-sm"
              style={{ backgroundColor: `rgba(124, 58, 237, ${0.15 + v * 0.85})` }}
            />
          ))}
          <span className="text-[#64748b] text-[10px]">More</span>
        </div>
      </div>

      {/* Tooltip — rendered in a fixed overlay */}
      {tooltip && (
        <div
          className="fixed z-50 pointer-events-none bg-[#1e2435] border border-[#2a3147] rounded-lg px-3 py-2 text-xs shadow-xl"
          style={{ left: tooltip.x + 12, top: tooltip.y - 40 }}
        >
          <p className="text-[#f1f5f9] font-medium">
            {tooltip.day} {formatHourLabel(tooltip.hour)}:00
          </p>
          <p className="text-[#94a3b8]">
            <span className="text-[#7c3aed] font-mono font-semibold">{tooltip.count}</span>
            {' '}interaction{tooltip.count !== 1 ? 's' : ''}
          </p>
        </div>
      )}
    </div>
  )
}
