import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { api } from '../api/client'
import Card from '../components/Card'
import EmptyState from '../components/EmptyState'
import { Field } from '../components/Field'

function todayIsoDate() {
  const d = new Date()
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export default function CreateSessionPage() {
  const nav = useNavigate()
  const [sessionDate, setSessionDate] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [ok, setOk] = useState<string | null>(null)

  useEffect(() => {
    setSessionDate(todayIsoDate())
  }, [])

  const canSave = useMemo(() => {
    return sessionDate.trim().length > 0 && !saving
  }, [saving, sessionDate])

  async function onCreate() {
    const date = sessionDate.trim()
    if (!date) {
      setError("'session_date' is required (YYYY-MM-DD).")
      return
    }
    setSaving(true)
    setError(null)
    setOk(null)
    try {
      await api.createSession({ session_date: date })
      setOk('Session created.')
      window.setTimeout(() => nav(`/attendance?session_date=${encodeURIComponent(date)}`), 650)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to save')
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      <div className="topbar">
        <div className="pageTitle">
          <h1>Create session</h1>
          <p>Add a class date, then take attendance.</p>
        </div>
        <div className="row">
          <Link className="btn" to="/sessions">
            Back to sessions
          </Link>
        </div>
      </div>

      <div className="grid">
        <Card title="Session date" subtitle="POST /sessions">
          <div className="grid" style={{ gap: 10 }}>
            <div className="row">
              <Field label="Date" hint="Defaults to today">
                <input
                  className="control"
                  type="date"
                  value={sessionDate}
                  onChange={(e) => setSessionDate(e.target.value)}
                />
              </Field>
            </div>

            {error ? (
              <EmptyState title="Couldn’t create session" body={error} />
            ) : ok ? (
              <div className="notice noticeOk" role="status" aria-live="polite">
                {ok} Opening attendance…
              </div>
            ) : (
              <div className="help"> </div>
            )}

            <div className="row">
              <button className="btn btnPrimary" onClick={onCreate} disabled={!canSave}>
                {saving ? 'Creating…' : 'Create session'}
              </button>
              <div className="help">Tip: you can create future dates too.</div>
            </div>
          </div>
        </Card>
      </div>
    </>
  )
}

