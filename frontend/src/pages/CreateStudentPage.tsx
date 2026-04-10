import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { api } from '../api/client'
import Card from '../components/Card'
import EmptyState from '../components/EmptyState'
import { Field } from '../components/Field'

export default function CreateStudentPage() {
  const nav = useNavigate()
  const [regNumber, setRegNumber] = useState('')
  const [fullName, setFullName] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [ok, setOk] = useState<string | null>(null)

  const canSave = useMemo(() => {
    return regNumber.trim().length > 0 && fullName.trim().length > 0 && !saving
  }, [fullName, regNumber, saving])

  async function onCreate() {
    const rn = regNumber.trim()
    const fn = fullName.trim()
    if (!rn || !fn) {
      setError("Both 'reg_number' and 'full_name' are required.")
      return
    }

    setSaving(true)
    setError(null)
    setOk(null)
    try {
      await api.createStudent({ reg_number: rn, full_name: fn })
      setOk('Student created.')
      window.setTimeout(() => nav('/students'), 650)
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
          <h1>Add student</h1>
          <p>Create a single student record, then return to the roster.</p>
        </div>
        <div className="row">
          <Link className="btn" to="/students">
            Back to roster
          </Link>
        </div>
      </div>

      <div className="grid">
        <Card title="Student details" subtitle="POST /students">
          <div className="grid" style={{ gap: 10 }}>
            <div className="row">
              <Field label="Registration number" hint="Must be unique">
                <input
                  className="control"
                  value={regNumber}
                  onChange={(e) => setRegNumber(e.target.value)}
                  placeholder="ICT/123/2026"
                  autoComplete="off"
                />
              </Field>
              <Field label="Full name">
                <input
                  className="control"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Jane Doe"
                  autoComplete="off"
                />
              </Field>
            </div>

            {error ? (
              <EmptyState title="Couldn’t create student" body={error} />
            ) : ok ? (
              <div className="notice noticeOk" role="status" aria-live="polite">
                {ok} Returning to roster…
              </div>
            ) : (
              <div className="help"> </div>
            )}

            <div className="row">
              <button className="btn btnPrimary" onClick={onCreate} disabled={!canSave}>
                {saving ? 'Creating…' : 'Create student'}
              </button>
              <div className="help">Tip: realistic reg numbers look better in demos.</div>
            </div>
          </div>
        </Card>
      </div>
    </>
  )
}

