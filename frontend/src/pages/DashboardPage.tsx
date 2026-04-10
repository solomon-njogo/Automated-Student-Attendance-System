import { useEffect, useState } from 'react'
import { api } from '../api/client'
import type { DbHealth } from '../api/types'
import Card from '../components/Card'
import EmptyState from '../components/EmptyState'

export default function DashboardPage() {
  const [data, setData] = useState<DbHealth | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    async function run() {
      setLoading(true)
      setError(null)
      try {
        const json = await api.dbHealth()
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

  return (
    <>
      <div className="topbar">
        <div className="pageTitle">
          <h1>Dashboard</h1>
          <p>Quick overview and the fastest paths to your core tasks.</p>
        </div>
        <div className="row">
          <a className="btn btnPrimary" href="/attendance">
            Take attendance
          </a>
          <a className="btn" href="/students">
            View students
          </a>
          <a className="btn" href="/sessions">
            View sessions
          </a>
        </div>
      </div>

      <div className="grid">
        <Card title="Overview" subtitle="Counts (from /db/health)">
          {loading ? (
            <div className="help">Loading…</div>
          ) : error ? (
            <EmptyState title="Couldn’t load overview" body={error} hint="Check the API is running and the DB is initialized." />
          ) : !data ? (
            <EmptyState title="No overview data" hint="The endpoint returned an empty response." />
          ) : (
            <div className="metricRow">
              <div className="metric">
                <div className="metricKicker">Students</div>
                <div className="metricValue">{data.counts?.students ?? 0}</div>
              </div>
              <div className="metric">
                <div className="metricKicker">Sessions</div>
                <div className="metricValue">{data.counts?.sessions ?? 0}</div>
              </div>
              <div className="metric">
                <div className="metricKicker">Attendance</div>
                <div className="metricValue">{data.counts?.attendance_records ?? 0}</div>
              </div>
              <div className="help" style={{ marginTop: 6 }}>
                Suggested flow: add students → create a session → take attendance → review a student summary.
              </div>
            </div>
          )}
        </Card>
      </div>
    </>
  )
}

