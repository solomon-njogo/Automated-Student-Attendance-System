import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { api } from '../api/client'
import type { DashboardOverview } from '../api/types'
import Card from '../components/Card'
import EmptyState from '../components/EmptyState'

const CHART = {
  present: 'var(--stamp-green)',
  absent: 'var(--stamp-red)',
  excused: 'var(--stamp-amber)',
  line: 'var(--stamp-blue)',
  tier: 'var(--stamp-blue)',
} as const

const TIER_ORDER = [
  'Excellent',
  'Satisfactory',
  'Low / At Risk',
  'Critical',
  'Fail / Barred',
] as const

function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false)
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    setReduced(mq.matches)
    const onChange = () => setReduced(mq.matches)
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [])
  return reduced
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardOverview | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const reducedMotion = usePrefersReducedMotion()

  useEffect(() => {
    let cancelled = false
    async function run() {
      setLoading(true)
      setError(null)
      try {
        const json = await api.dashboardOverview()
        if (!cancelled) setData(json)
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : 'Failed to load')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    void run()
    return () => {
      cancelled = true
    }
  }, [])

  const statusPieData = useMemo(() => {
    if (!data) return []
    const { present, absent, excused } = data.cohort
    return [
      { name: 'Present', value: present, fill: CHART.present },
      { name: 'Absent', value: absent, fill: CHART.absent },
      { name: 'Excused', value: excused, fill: CHART.excused },
    ].filter((d) => d.value > 0)
  }, [data])

  const tierBarData = useMemo(() => {
    if (!data) return []
    return TIER_ORDER.filter((t) => (data.tier_counts[t] ?? 0) > 0).map((t) => ({
      tier: t,
      count: data.tier_counts[t] ?? 0,
    }))
  }, [data])

  const sessionLineData = useMemo(() => {
    if (!data) return []
    return data.by_session.map((s) => ({
      date: s.session_date,
      pct: s.adjusted_pct,
    }))
  }, [data])

  const hasSlots = data ? data.cohort.total_slots > 0 : false
  const meanLabel =
    data?.mean_student_adjusted_pct != null ? `${data.mean_student_adjusted_pct}%` : '—'

  return (
    <>
      <div className="topbar">
        <div className="pageTitle">
          <h1>Dashboard</h1>
        </div>
        <div className="row">
          <Link className="btn btnPrimary" to="/attendance">
            Take attendance
          </Link>
          <Link className="btn" to="/students">
            View students
          </Link>
          <Link className="btn" to="/sessions">
            View sessions
          </Link>
        </div>
      </div>

      <div className="grid">
        <Card
          title="Attendance overview"
          subtitle="Adjusted % excludes excused sessions from the denominator (same policy as student profiles)."
        >
          {loading ? (
            <div className="help">Loading…</div>
          ) : error ? (
            <EmptyState
              title="Couldn’t load dashboard"
              body={error}
              hint="Check the API is running and the DB is initialized."
            />
          ) : !data ? (
            <EmptyState title="No dashboard data" hint="The endpoint returned an empty response." />
          ) : (
            <>
              <div className="dashboardHero">
                <div className="dashboardHeroMain">
                  <div className="metricKicker">Average student attendance (adjusted)</div>
                  <div className="dashboardHeroValue">{meanLabel}</div>
                  <p className="dashboardHeroSub">
                    Cohort rate (all slots):{' '}
                    <strong>{hasSlots ? `${data.cohort.adjusted_pct}%` : '—'}</strong>
                    {hasSlots ? (
                      <>
                        {' '}
                        <span className="dashboardHeroMuted">
                          · raw {data.cohort.raw_pct}% · {data.cohort.total_slots} student-session
                          slots
                        </span>
                      </>
                    ) : null}
                  </p>
                </div>
                <div className="metricRow dashboardHeroMetrics">
                  <div className="metric">
                    <div className="metricKicker">Students</div>
                    <div className="metricValue">{data.counts?.students ?? 0}</div>
                  </div>
                  <div className="metric">
                    <div className="metricKicker">Sessions</div>
                    <div className="metricValue">{data.counts?.sessions ?? 0}</div>
                  </div>
                  <div className="metric">
                    <div className="metricKicker">Attendance rows</div>
                    <div className="metricValue">{data.counts?.attendance_records ?? 0}</div>
                  </div>
                </div>
              </div>
            </>
          )}
        </Card>

        {!loading && !error && data && (
          <div className="grid grid2 dashboardChartGrid">
            <Card title="Status mix" subtitle="All student × session slots">
              {hasSlots && statusPieData.length > 0 ? (
                <div className="dashboardChart" role="img" aria-label="Donut chart of attendance status counts">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={statusPieData}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        innerRadius={52}
                        outerRadius={80}
                        paddingAngle={2}
                        isAnimationActive={!reducedMotion}
                      >
                        {statusPieData.map((entry, i) => (
                          <Cell key={i} fill={entry.fill} stroke="rgba(23, 19, 12, 0.08)" />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(value: number, name: string) => [`${value}`, name]}
                        contentStyle={{
                          borderRadius: 12,
                          border: '1px solid var(--line)',
                          fontFamily: 'var(--sans)',
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <EmptyState
                  title="No slots yet"
                  body="Add students and sessions, then take attendance to see the mix."
                />
              )}
            </Card>

            <Card title="Students by performance tier" subtitle="Based on each student’s adjusted %">
              {tierBarData.length > 0 ? (
                <div
                  className="dashboardChart"
                  role="img"
                  aria-label="Bar chart of student counts by tier"
                >
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={tierBarData} margin={{ top: 8, right: 8, left: 0, bottom: 64 }}>
                      <CartesianGrid stroke="var(--line-2)" vertical={false} />
                      <XAxis
                        dataKey="tier"
                        tick={{ fill: 'var(--ink-2)', fontSize: 11 }}
                        interval={0}
                        angle={-28}
                        textAnchor="end"
                        height={72}
                      />
                      <YAxis
                        allowDecimals={false}
                        tick={{ fill: 'var(--ink-2)', fontSize: 11 }}
                        width={36}
                      />
                      <Tooltip
                        formatter={(value: number) => [`${value} students`, 'Count']}
                        contentStyle={{
                          borderRadius: 12,
                          border: '1px solid var(--line)',
                          fontFamily: 'var(--sans)',
                        }}
                      />
                      <Bar
                        dataKey="count"
                        fill={CHART.tier}
                        radius={[8, 8, 0, 0]}
                        isAnimationActive={!reducedMotion}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <EmptyState
                  title="No tier data"
                  body="Tiers appear once there is at least one session and enrolled students."
                />
              )}
            </Card>
          </div>
        )}

        {!loading && !error && data && (
          <Card title="Attendance by session" subtitle="Session-level adjusted % (excused excluded)">
            {sessionLineData.length > 0 ? (
              <div
                className="dashboardChart dashboardChartWide"
                role="img"
                aria-label="Line chart of attendance rate by session date"
              >
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={sessionLineData} margin={{ top: 8, right: 12, left: 0, bottom: 8 }}>
                    <CartesianGrid stroke="var(--line-2)" />
                    <XAxis
                      dataKey="date"
                      tick={{ fill: 'var(--ink-2)', fontSize: 11 }}
                      tickMargin={8}
                    />
                    <YAxis
                      domain={[0, 100]}
                      tick={{ fill: 'var(--ink-2)', fontSize: 11 }}
                      width={36}
                      tickFormatter={(v) => `${v}%`}
                    />
                    <Tooltip
                      formatter={(value: number) => [`${value}%`, 'Adjusted']}
                      labelFormatter={(label) => `Session ${label}`}
                      contentStyle={{
                        borderRadius: 12,
                        border: '1px solid var(--line)',
                        fontFamily: 'var(--sans)',
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="pct"
                      name="Adjusted %"
                      stroke={CHART.line}
                      strokeWidth={2}
                      dot={{ r: 3, strokeWidth: 0, fill: CHART.line }}
                      activeDot={{ r: 5 }}
                      isAnimationActive={!reducedMotion}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <EmptyState title="No sessions yet" body="Create a session to see trends over time." />
            )}
          </Card>
        )}
      </div>
    </>
  )
}
