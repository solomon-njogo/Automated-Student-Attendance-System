import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { api } from '../api/client'
import type { SessionAttendanceResponse, SessionAttendanceStudent } from '../api/types'
import Card from '../components/Card'
import EmptyState from '../components/EmptyState'
import Stamp from '../components/Stamp'

function toneForStatus(status: SessionAttendanceStudent['status']) {
  if (status === 'PRESENT') return 'ok' as const
  if (status === 'EXCUSED') return 'warn' as const
  return 'danger' as const
}

export default function SessionDetailPage() {
  const params = useParams()
  const sessionIdRaw = params.sessionId ?? ''
  const sessionId = Number(sessionIdRaw)
  const sessionIdOk = Number.isFinite(sessionId) && sessionId > 0

  const [data, setData] = useState<SessionAttendanceResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  async function load() {
    if (!Number.isFinite(sessionId) || sessionId <= 0) {
      setData(null)
      setError('Invalid session id.')
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)
    try {
      const json = await api.sessionAttendance(sessionId)
      setData(json)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionIdRaw])

  const counts = useMemo(() => {
    const c = { PRESENT: 0, ABSENT: 0, EXCUSED: 0 }
    for (const s of data?.students ?? []) c[s.status]++
    return c
  }, [data])

  return (
    <>
      <div className="topbar">
        <div className="pageTitle">
          <h1>Session details</h1>
          <p>
            {data ? (
              <>
                Session <strong>{data.session.session_date}</strong> (ID {data.session.id})
              </>
            ) : (
              <>View the attendance status for each student.</>
            )}
          </p>
        </div>
        <div className="row" style={{ flexWrap: 'wrap' }}>
          {sessionIdOk ? (
            <Link className="btn btnPrimary" to={`/attendance?session_id=${sessionId}`}>
              Take attendance
            </Link>
          ) : null}
          <Link className="btn" to="/sessions">
            Back to sessions
          </Link>
          <button className="btn" onClick={load} disabled={loading}>
            Refresh
          </button>
        </div>
      </div>

      {loading ? (
        <div className="help">Loading…</div>
      ) : error ? (
        <EmptyState title="Couldn’t load session attendance" body={error} />
      ) : !data ? (
        <EmptyState title="Session not found" hint="Return to Sessions and pick a session." />
      ) : (
        <div className="grid">
          <Card title="Summary">
            <div className="row" style={{ flexWrap: 'wrap' }}>
              <Stamp label="Present" value={String(counts.PRESENT)} tone="ok" />
              <Stamp label="Excused" value={String(counts.EXCUSED)} tone="warn" />
              <Stamp label="Absent" value={String(counts.ABSENT)} tone="danger" />
              <Stamp label="Total" value={String(data.students.length)} tone="ink" />
            </div>
          </Card>

          <Card title="Students" subtitle="Status for this session">
            {data.students.length === 0 ? (
              <EmptyState title="No students yet" body="Add students before taking attendance." hint="Go to Students → Add student." />
            ) : (
              <>
                <div className="tableWrap rosterTable">
                  <table>
                    <thead>
                      <tr>
                        <th style={{ width: 70 }}>ID</th>
                        <th>Student</th>
                        <th style={{ width: 200 }}>Reg</th>
                        <th style={{ width: 180 }}>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.students.map((s) => (
                        <tr key={s.student_id}>
                          <td>{s.student_id}</td>
                          <td>{s.full_name}</td>
                          <td style={{ color: 'var(--ink-3)' }}>{s.reg_number}</td>
                          <td>
                            <Stamp label="Status" value={s.status} tone={toneForStatus(s.status)} />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="rosterList">
                  {data.students.map((s) => (
                    <div key={s.student_id} className="rosterCard">
                      <div className="rosterMeta">
                        <div className="rosterName">{s.full_name}</div>
                        <div className="rosterSub">
                          <span className="badge">
                            ID <strong style={{ marginLeft: 6 }}>{s.student_id}</strong>
                          </span>
                          <span className="badge">
                            Reg <span style={{ marginLeft: 8, color: 'var(--ink-3)' }}>{s.reg_number}</span>
                          </span>
                        </div>
                      </div>
                      <Stamp label="Status" value={s.status} tone={toneForStatus(s.status)} />
                    </div>
                  ))}
                </div>
              </>
            )}
          </Card>
        </div>
      )}
    </>
  )
}

