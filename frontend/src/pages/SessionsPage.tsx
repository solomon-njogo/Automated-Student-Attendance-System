import { useEffect, useState } from 'react'
import { api } from '../api/client'
import type { Session } from '../api/types'
import Card from '../components/Card'
import EmptyState from '../components/EmptyState'
import { Field } from '../components/Field'

export default function SessionsPage() {
  const [sessions, setSessions] = useState<Session[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [sessionDate, setSessionDate] = useState('')
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)

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

  async function createSession() {
    const date = sessionDate.trim()
    if (!date) {
      setSaveError("'session_date' is required (YYYY-MM-DD).")
      return
    }
    setSaving(true)
    setSaveError(null)
    try {
      await api.createSession({ session_date: date })
      setSessionDate('')
      await load()
    } catch (e) {
      setSaveError(e instanceof Error ? e.message : 'Failed to save')
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      <div className="topbar">
        <div className="pageTitle">
          <h1>Sessions</h1>
          <p>Create class dates. Attendance stamping by date can auto-create sessions too.</p>
        </div>
        <div className="row">
          <button className="btn" onClick={load} disabled={loading}>
            Refresh
          </button>
        </div>
      </div>

      <div className="grid grid2">
        <Card title="Create session" subtitle="POST /sessions">
          <div className="grid" style={{ gap: 10 }}>
            <div className="row">
              <Field label="Session date" hint="YYYY-MM-DD">
                <input
                  className="control"
                  value={sessionDate}
                  onChange={(e) => setSessionDate(e.target.value)}
                  placeholder="2026-03-18"
                  inputMode="numeric"
                  autoComplete="off"
                />
              </Field>
            </div>

            {saveError ? <div className="help">Error: {saveError}</div> : <div className="help"> </div>}

            <div className="row">
              <button className="btn btnPrimary" onClick={createSession} disabled={saving}>
                {saving ? 'Creating…' : 'Create session'}
              </button>
              <div className="help">Tip: ISO format keeps sorting predictable.</div>
            </div>
          </div>
        </Card>

        <Card title="Session list" subtitle="GET /sessions">
          {loading ? (
            <div className="help">Loading…</div>
          ) : error ? (
            <EmptyState title="Couldn’t load sessions" body={error} />
          ) : sessions.length === 0 ? (
            <EmptyState title="No sessions yet" body="Create one on the left to begin." />
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

