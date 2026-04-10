import { useEffect, useState } from 'react'
import { api } from '../api/client'
import type { Session } from '../api/types'
import Card from '../components/Card'
import EmptyState from '../components/EmptyState'
import { Link } from 'react-router-dom'

export default function SessionsPage() {
  const [sessions, setSessions] = useState<Session[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  async function load() {
    setLoading(true)
    setError(null)
    try {
      const json = await api.listSessions()
      setSessions(json)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void load()
  }, [])

  return (
    <>
      <div className="topbar">
        <div className="pageTitle">
          <h1>Sessions</h1>
          <p>View existing class dates (sessions).</p>
        </div>
        <div className="row">
          <Link className="btn btnPrimary" to="/sessions/new">
            Create session
          </Link>
          <button className="btn" onClick={load} disabled={loading}>
            Refresh
          </button>
        </div>
      </div>

      <div className="grid">
        <Card title="Session list" subtitle="GET /sessions">
          {loading ? (
            <div className="help">Loading…</div>
          ) : error ? (
            <EmptyState title="Couldn’t load sessions" body={error} />
          ) : sessions.length === 0 ? (
            <EmptyState title="No sessions yet" body="Create a session to begin." hint="Use the “Create session” button above." />
          ) : (
            <>
              <div className="tableWrap rosterTable">
                <table>
                  <thead>
                    <tr>
                      <th style={{ width: 70 }}>ID</th>
                      <th style={{ width: 160 }}>Date</th>
                      <th>Created</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sessions.map((s) => (
                      <tr key={s.id}>
                        <td>{s.id}</td>
                        <td>{s.session_date}</td>
                        <td style={{ color: 'var(--ink-3)' }}>{s.created_at ?? '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="rosterList">
                {sessions.map((s) => (
                  <div key={s.id} className="rosterCard">
                    <div className="rosterMeta">
                      <div className="rosterName">{s.session_date}</div>
                      <div className="rosterSub">
                        <span className="badge">
                          ID <strong style={{ marginLeft: 6 }}>{s.id}</strong>
                        </span>
                        <span className="badge">
                          Created <span style={{ marginLeft: 8, color: 'var(--ink-3)' }}>{s.created_at ?? '—'}</span>
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </Card>
      </div>
    </>
  )
}

