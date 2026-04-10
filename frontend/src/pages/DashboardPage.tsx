import { useEffect, useState } from 'react'
import { api } from '../api/client'
import type { DbHealth } from '../api/types'
import Card from '../components/Card'
import EmptyState from '../components/EmptyState'
import Stamp from '../components/Stamp'

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
          <p>System pulse, database readiness, and demo-friendly shortcuts.</p>
        </div>
        <div className="row">
          <a className="btn btnPrimary" href="/students">
            Go to students
          </a>
          <a className="btn" href="/sessions">
            Go to sessions
          </a>
        </div>
      </div>

      <div className="grid grid2">
        <Card
          title="Database health"
          subtitle="GET /db/health"
          aside={
            loading ? (
              <Stamp label="Status" value="Checking…" tone="info" />
            ) : error ? (
              <Stamp label="Status" value="Error" tone="danger" />
            ) : data?.ok ? (
              <Stamp label="Status" value="Ready" tone="ok" />
            ) : (
              <Stamp label="Status" value="Needs_setup" tone="warn" />
            )
          }
        >
          {loading ? (
            <div className="help">Pulling latest status…</div>
          ) : error ? (
            <EmptyState title="Couldn’t load database health" body={error} hint="Check the API is running and the DB is initialized." />
          ) : !data ? (
            <EmptyState title="No health data" hint="The endpoint returned an empty response." />
          ) : (
            <div className="grid" style={{ gap: 10 }}>
              <div className="row">
                <span className="badge">
                  DB path <span style={{ marginLeft: 8, color: 'var(--ink-3)' }}>{data.db_path}</span>
                </span>
              </div>
              {!data.ok && data.missing_tables?.length ? (
                <EmptyState
                  title="Setup checklist"
                  body={`Missing tables: ${data.missing_tables.join(', ')}`}
                  hint="Run: py db\\init_db.py (then refresh)"
                />
              ) : (
                <div className="help">Schema looks good. You’re ready to create students and sessions.</div>
              )}
            </div>
          )}
        </Card>

        <Card title="Counts" subtitle="Core tables">
          {loading ? (
            <div className="help">Loading…</div>
          ) : error ? (
            <EmptyState title="Couldn’t load counts" body={error} />
          ) : !data ? (
            <EmptyState title="No counts yet" />
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
                Demo flow: create 1–2 students → create a few sessions → mark attendance by date → open a student
                summary.
              </div>
            </div>
          )}
        </Card>
      </div>
    </>
  )
}

