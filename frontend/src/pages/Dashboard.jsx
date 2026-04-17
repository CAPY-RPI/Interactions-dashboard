import { useState, useEffect, useCallback } from 'react'
import Header from '../components/Header.jsx'
import MetricCard from '../components/MetricCard.jsx'
import TimeSeriesChart from '../components/TimeSeriesChart.jsx'
import CommandTable from '../components/CommandTable.jsx'
import ErrorBreakdown from '../components/ErrorBreakdown.jsx'
import InteractionTypeChart from '../components/InteractionTypeChart.jsx'
import ActivityFeed from '../components/ActivityFeed.jsx'
import UsageHeatmap from '../components/UsageHeatmap.jsx'
import {
  fetchMetrics,
  fetchCommands,
  fetchTimeseries,
  fetchErrors,
  fetchInteractionTypes,
  fetchRecent,
  fetchHeatmap,
} from '../api/telemetry.js'

function SkeletonCard() {
  return (
    <div className="bg-[#161b27] rounded-xl border border-[#2a3147] p-5 animate-pulse">
      <div className="h-3 w-28 bg-[#2a3147] rounded mb-4" />
      <div className="h-8 w-20 bg-[#2a3147] rounded mb-3" />
      <div className="h-2 w-16 bg-[#2a3147] rounded" />
    </div>
  )
}

function SkeletonBlock({ height = 'h-64' }) {
  return (
    <div className={`bg-[#161b27] rounded-xl border border-[#2a3147] ${height} animate-pulse`}>
      <div className="p-5">
        <div className="h-3 w-36 bg-[#2a3147] rounded" />
      </div>
    </div>
  )
}

function ErrorBanner({ message }) {
  return (
    <div className="mx-6 mt-4 flex items-center gap-3 bg-[#ef4444]/10 border border-[#ef4444]/30 rounded-lg px-4 py-3 text-sm text-[#ef4444]">
      <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"
        />
      </svg>
      <span>{message}</span>
    </div>
  )
}

const METRIC_CONFIG = [
  {
    key: 'total_interactions',
    title: 'Total Interactions',
    changeKey: 'total_interactions_change',
    color: '#7c3aed',
    format: (v) => v.toLocaleString(),
  },
  {
    key: 'unique_users',
    title: 'Unique Users',
    changeKey: 'unique_users_change',
    color: '#3b82f6',
    format: (v) => v.toLocaleString(),
  },
  {
    key: 'success_rate',
    title: 'Success Rate',
    changeKey: 'success_rate_change',
    color: '#10b981',
    format: (v) => `${(v * 100).toFixed(1)}%`,
  },
  {
    key: 'avg_latency_ms',
    title: 'Avg Latency',
    changeKey: 'avg_latency_change',
    color: '#f59e0b',
    unit: 'ms',
    format: (v) => v.toFixed(0),
  },
]

export default function Dashboard() {
  const [range, setRange] = useState('7d')
  const [metrics, setMetrics] = useState(null)
  const [commands, setCommands] = useState(null)
  const [timeseries, setTimeseries] = useState(null)
  const [errors, setErrors] = useState(null)
  const [interactionTypes, setInteractionTypes] = useState(null)
  const [heatmap, setHeatmap] = useState(null)
  const [recent, setRecent] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [lastUpdated, setLastUpdated] = useState(null)
  const [fetchError, setFetchError] = useState(false)

  const loadAll = useCallback(async (r) => {
    setLoading(true)
    setError(null)
    try {
      const [m, c, ts, e, it, hm, rec] = await Promise.all([
        fetchMetrics(r),
        fetchCommands(r),
        fetchTimeseries(r),
        fetchErrors(r),
        fetchInteractionTypes(r),
        fetchHeatmap(r),
        fetchRecent(),
      ])
      setMetrics(m)
      setCommands(c)
      setTimeseries(ts)
      setErrors(e)
      setInteractionTypes(it)
      setHeatmap(hm)
      setRecent(rec)
    } catch (err) {
      setError(
        err.response?.data?.detail ||
          err.message ||
          'Failed to load dashboard data. Is the backend running?'
      )
    } finally {
      setLoading(false)
    }
  }, [])

  const refreshAll = useCallback(async (r) => {
    // Silent refresh — no loading skeletons, errors don't overwrite existing data
    try {
      const [m, c, ts, e, it, hm, rec] = await Promise.all([
        fetchMetrics(r),
        fetchCommands(r),
        fetchTimeseries(r),
        fetchErrors(r),
        fetchInteractionTypes(r),
        fetchHeatmap(r),
        fetchRecent(),
      ])
      setMetrics(m)
      setCommands(c)
      setTimeseries(ts)
      setErrors(e)
      setInteractionTypes(it)
      setHeatmap(hm)
      setRecent(rec)
      setLastUpdated(new Date())
      setFetchError(false)
    } catch {
      // Silently ignore — stale data is better than an error banner on auto-refresh
      setFetchError(true)
    }
  }, [])

  useEffect(() => {
    loadAll(range)
  }, [range, loadAll])

  // Auto-refresh all data every 0.001s
  useEffect(() => {
    const id = setInterval(() => refreshAll(range), 2_000)
    return () => clearInterval(id)
  }, [range, refreshAll])

  return (
    <div className="min-h-screen bg-[#0f1117] text-[#f1f5f9]">
      <Header range={range} onRangeChange={setRange} />

      {error && <ErrorBanner message={error} />}

      <main className="px-6 py-6 flex flex-col gap-6 max-w-[1600px] mx-auto">

        {/* Row 1: Metric cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {loading
            ? Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)
            : METRIC_CONFIG.map((cfg) => (
                <MetricCard
                  key={cfg.key}
                  title={cfg.title}
                  value={metrics ? cfg.format(metrics[cfg.key]) : '—'}
                  unit={cfg.unit}
                  change={metrics ? metrics[cfg.changeKey] : 0}
                  color={cfg.color}
                />
              ))}
        </div>

        {/* Row 2: Time series chart */}
        {loading ? (
          <SkeletonBlock height="h-80" />
        ) : (
          timeseries && <TimeSeriesChart data={timeseries} range={range} />
        )}

        {/* Row 3: Command table + Error breakdown */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
          <div className="lg:col-span-3 h-full">
            {loading ? (
              <SkeletonBlock height="h-72" />
            ) : (
              commands && <CommandTable data={commands} />
            )}
          </div>
          <div className="lg:col-span-2 h-full">
            {loading ? (
              <SkeletonBlock height="h-72" />
            ) : (
              <ErrorBreakdown data={errors || []} />
            )}
          </div>
        </div>

        {/* Row 4: Interaction type chart + Peak usage heatmap */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div>
            {loading ? (
              <SkeletonBlock height="h-64" />
            ) : (
              interactionTypes && <InteractionTypeChart data={interactionTypes} />
            )}
          </div>
          <div>
            {loading ? (
              <SkeletonBlock height="h-64" />
            ) : (
              heatmap && <UsageHeatmap data={heatmap} />
            )}
          </div>
        </div>

        {/* Row 5: Activity feed — full width */}
        <div>
          {loading ? <SkeletonBlock height="h-96" /> : <ActivityFeed data={recent || []} />}
        </div>
      </main>
    </div>
  )
}
