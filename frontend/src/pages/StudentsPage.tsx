import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../api/client'
import type { Student } from '../api/types'
import Card from '../components/Card'
import EmptyState from '../components/EmptyState'
import { Field } from '../components/Field'

export default function StudentsPage() {
  const [students, setStudents] = useState<Student[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [q, setQ] = useState('')
  const [regNumber, setRegNumber] = useState('')
  const [fullName, setFullName] = useState('')
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)

  async function load() {
    setLoading(true)
    setError(null)
    try {
      const json = await api.listStudents()
      setStudents(json)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void load()
  }, [])

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase()
    if (!query) return students
    return students.filter((s) => {
      return (
        s.full_name.toLowerCase().includes(query) ||
        s.reg_number.toLowerCase().includes(query) ||
        String(s.id).includes(query)
      )
    })
  }, [q, students])

  async function createStudent() {
    const rn = regNumber.trim()
    const fn = fullName.trim()
    if (!rn || !fn) {
      setSaveError("Both 'reg_number' and 'full_name' are required.")
      return
    }
    setSaving(true)
    setSaveError(null)
    try {
      await api.createStudent({ reg_number: rn, full_name: fn })
      setRegNumber('')
      setFullName('')
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
          <h1>Students</h1>
          <p>Create a roster, open a profile, then stamp attendance by date.</p>
        </div>
        <div className="row">
          <button className="btn" onClick={load} disabled={loading}>
            Refresh
          </button>
        </div>
      </div>

      <div className="grid grid2">
        <Card title="Create student" subtitle="POST /students">
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

            {saveError ? <div className="help">Error: {saveError}</div> : <div className="help"> </div>}

            <div className="row">
              <button className="btn btnPrimary" onClick={createStudent} disabled={saving}>
                {saving ? 'Creating…' : 'Create student'}
              </button>
              <div className="help">Tip: realistic reg numbers look better in demos.</div>
            </div>
          </div>
        </Card>

        <Card title="Student roster" subtitle="GET /students">
          <div className="grid" style={{ gap: 10 }}>
            <Field label="Search" hint={`${filtered.length}/${students.length}`}>
              <input
                className="control"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search by name, reg number, or id…"
              />
            </Field>

            {loading ? (
              <div className="help">Loading…</div>
            ) : error ? (
              <EmptyState title="Couldn’t load students" body={error} />
            ) : filtered.length === 0 ? (
              <EmptyState title="No students yet" body="Create one on the left to begin." />
            ) : (
              <>
                <div className="tableWrap rosterTable">
                  <table>
                    <thead>
                      <tr>
                        <th style={{ width: 70 }}>ID</th>
                        <th>Reg number</th>
                        <th>Full name</th>
                        <th style={{ width: 120 }}>Open</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filtered.map((s) => (
                        <tr key={s.id}>
                          <td>{s.id}</td>
                          <td style={{ color: 'var(--ink-3)' }}>{s.reg_number}</td>
                          <td>{s.full_name}</td>
                          <td>
                            <Link className="btn" to={`/students/${s.id}`}>
                              View
                            </Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="rosterList">
                  {filtered.map((s) => (
                    <div key={s.id} className="rosterCard">
                      <div className="rosterMeta">
                        <div className="rosterName">{s.full_name}</div>
                        <div className="rosterSub">
                          <span className="badge">
                            ID <strong style={{ marginLeft: 6 }}>{s.id}</strong>
                          </span>
                          <span className="badge">
                            Reg <span style={{ marginLeft: 8, color: 'var(--ink-3)' }}>{s.reg_number}</span>
                          </span>
                        </div>
                      </div>
                      <Link className="btn" to={`/students/${s.id}`}>
                        Open
                      </Link>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </Card>
      </div>
    </>
  )
}

