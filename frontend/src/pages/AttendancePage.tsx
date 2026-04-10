import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { api } from '../api/client'
import type { AttendanceStatus, Session, Student } from '../api/types'
import Card from '../components/Card'
import EmptyState from '../components/EmptyState'
import { Field } from '../components/Field'

type StatusByStudent = Record<number, AttendanceStatus>

function isTypingTarget(el: EventTarget | null) {
  if (!(el instanceof HTMLElement)) return false
  const tag = el.tagName.toLowerCase()
  return tag === 'input' || tag === 'textarea' || tag === 'select' || el.isContentEditable
}

export default function AttendancePage() {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const preselectDate = params.get('session_date') ?? ''
  const preselectSessionIdRaw = params.get('session_id') ?? ''

  const [sessions, setSessions] = useState<Session[]>([])
  const [students, setStudents] = useState<Student[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [sessionId, setSessionId] = useState<number | null>(null)
  const [selectedStudentId, setSelectedStudentId] = useState<number | null>(null)
  const [statuses, setStatuses] = useState<StatusByStudent>({})

  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [rosterError, setRosterError] = useState<string | null>(null)

  const sessionById = useMemo(() => {
    const map = new Map<number, Session>()
    for (const s of sessions) map.set(s.id, s)
    return map
  }, [sessions])

  const orderedStudents = useMemo(() => {
    return [...students].sort((a, b) => {
      const an = a.full_name?.toLowerCase?.() ?? ''
      const bn = b.full_name?.toLowerCase?.() ?? ''
      if (an && bn && an !== bn) return an.localeCompare(bn)
      return a.id - b.id
    })
  }, [students])

  useEffect(() => {
    let cancelled = false
    async function load() {
      setLoading(true)
      setError(null)
      try {
        const [ses, stu] = await Promise.all([api.listSessions(), api.listStudents()])
        if (cancelled) return
        setSessions(ses)
        setStudents(stu)

        const urlSid = Number(preselectSessionIdRaw)
        if (Number.isFinite(urlSid) && urlSid > 0 && ses.some((s) => s.id === urlSid)) {
          setSessionId(urlSid)
        } else if (preselectDate) {
          const match = ses.find((s) => s.session_date === preselectDate)
          if (match) setSessionId(match.id)
        }
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : 'Failed to load')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    void load()
    return () => {
      cancelled = true
    }
  }, [preselectDate, preselectSessionIdRaw])

  useEffect(() => {
    if (!sessionId) {
      setStatuses({})
      setRosterError(null)
      return
    }
    let cancelled = false
    setRosterError(null)
    ;(async () => {
      try {
        const data = await api.sessionAttendance(sessionId)
        if (cancelled) return
        const next: StatusByStudent = {}
        for (const s of data.students) next[s.student_id] = s.status
        setStatuses(next)
        setSaveError(null)
      } catch (e) {
        if (!cancelled) {
          setRosterError(e instanceof Error ? e.message : 'Failed to load roster')
          setStatuses({})
        }
      }
    })()
    return () => {
      cancelled = true
    }
  }, [sessionId])

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (isTypingTarget(e.target)) return
      if (!sessionId) return
      if (saving) return

      const key = e.key.toLowerCase()
      const allPresent = key === 'p' && e.shiftKey
      const allAbsent = key === 'a' && e.shiftKey
      const singlePresent = key === 'p' && !e.shiftKey
      const singleAbsent = key === 'a' && !e.shiftKey
      const singleExcused = key === 'e' && !e.shiftKey

      if (allPresent) {
        e.preventDefault()
        markAll('PRESENT')
        return
      }
      if (allAbsent) {
        e.preventDefault()
        markAll('ABSENT')
        return
      }
      if (!selectedStudentId) return

      if (singlePresent) {
        e.preventDefault()
        setStatus(selectedStudentId, 'PRESENT')
      } else if (singleAbsent) {
        e.preventDefault()
        setStatus(selectedStudentId, 'ABSENT')
      } else if (singleExcused) {
        e.preventDefault()
        setStatus(selectedStudentId, 'EXCUSED')
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [saving, selectedStudentId, sessionId])

  function setStatus(studentId: number, status: AttendanceStatus) {
    setStatuses((prev) => ({ ...prev, [studentId]: status }))
  }

  function markAll(status: AttendanceStatus) {
    const next: StatusByStudent = {}
    for (const s of students) next[s.id] = status
    setStatuses(next)
    setSaveError(null)
  }

  const selectedSession = sessionId ? sessionById.get(sessionId) ?? null : null

  const canSave = useMemo(() => {
    if (!sessionId) return false
    if (saving) return false
    return students.length > 0 && Object.keys(statuses).length === students.length
  }, [saving, sessionId, statuses, students.length])

  async function onSave() {
    if (!sessionId) return
    setSaving(true)
    setSaveError(null)
    try {
      const records = orderedStudents.map((s) => ({ student_id: s.id, status: statuses[s.id] }))
      await api.bulkUpsertAttendance({ session_id: sessionId, records })
      navigate(`/sessions/${sessionId}`, { replace: true })
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
          <h1>Attendance</h1>
          <p>
            Choose the session for this class, mark each student, then save. You’ll return to that session’s
            detail page with the updated roster. Hotkeys: Shift+P all present, Shift+A all absent.
          </p>
        </div>
        <div className="row">
          <Link className="btn" to="/sessions/new">
            Create session
          </Link>
        </div>
      </div>

      {loading ? (
        <div className="help">Loading…</div>
      ) : error ? (
        <EmptyState title="Couldn’t load attendance screen" body={error} />
      ) : (
        <div className="grid">
          <Card title="Session" subtitle="Choose a class date">
            <div className="grid" style={{ gap: 10 }}>
              <div className="row">
                <Field label="Session">
                  <select
                    className="control"
                    value={sessionId ?? ''}
                    onChange={(e) => {
                      const next = Number(e.target.value)
                      setSessionId(Number.isFinite(next) && next > 0 ? next : null)
                      setSaveError(null)
                      setRosterError(null)
                      setSelectedStudentId(null)
                    }}
                  >
                    <option value="">Select a session…</option>
                    {sessions.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.session_date} (#{s.id})
                      </option>
                    ))}
                  </select>
                </Field>
              </div>
              {selectedSession ? (
                <div className="help">
                  Session: <strong>{selectedSession.session_date}</strong> (ID {selectedSession.id})
                </div>
              ) : (
                <div className="help">Pick a session to start marking attendance.</div>
              )}
            </div>
          </Card>

          <Card title="Mark attendance" subtitle="P/A/E for selected row">
            {!sessionId ? (
              <EmptyState title="Select a session first" hint="You can create a new session if you don’t see today." />
            ) : rosterError ? (
              <EmptyState title="Couldn’t load this session" body={rosterError} />
            ) : students.length === 0 ? (
              <EmptyState title="No students yet" body="Add students before taking attendance." hint="Go to Students → Add student." />
            ) : (
              <div className="grid" style={{ gap: 10 }}>
                <div className="row">
                  <button className="btn" type="button" onClick={() => markAll('PRESENT')}>
                    Mark all present
                  </button>
                  <button className="btn" type="button" onClick={() => markAll('ABSENT')}>
                    Mark all absent
                  </button>
                  <div className="help">Tip: click a student row, then press P / A / E.</div>
                </div>

                <div className="tableWrap">
                  <table style={{ minWidth: 820 }}>
                    <thead>
                      <tr>
                        <th style={{ width: 70 }}>ID</th>
                        <th>Student</th>
                        <th style={{ width: 180 }}>Reg</th>
                        <th style={{ width: 280 }}>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {orderedStudents.map((s) => {
                        const active = selectedStudentId === s.id
                        const st = statuses[s.id]
                        return (
                          <tr
                            key={s.id}
                            className={active ? 'rowActive' : undefined}
                            onClick={() => setSelectedStudentId(s.id)}
                            style={{ cursor: 'pointer' }}
                          >
                            <td>{s.id}</td>
                            <td>{s.full_name}</td>
                            <td style={{ color: 'var(--ink-3)' }}>{s.reg_number}</td>
                            <td>
                              <div className="row">
                                <button
                                  className={`btn btnSmall ${st === 'PRESENT' ? 'btnPrimary' : ''}`.trim()}
                                  type="button"
                                  onClick={(e) => {
                                    e.preventDefault()
                                    e.stopPropagation()
                                    setStatus(s.id, 'PRESENT')
                                  }}
                                >
                                  Present
                                </button>
                                <button
                                  className={`btn btnSmall ${st === 'ABSENT' ? 'btnDanger' : ''}`.trim()}
                                  type="button"
                                  onClick={(e) => {
                                    e.preventDefault()
                                    e.stopPropagation()
                                    setStatus(s.id, 'ABSENT')
                                  }}
                                >
                                  Absent
                                </button>
                                <button
                                  className={`btn btnSmall ${st === 'EXCUSED' ? 'btnInfo' : ''}`.trim()}
                                  type="button"
                                  onClick={(e) => {
                                    e.preventDefault()
                                    e.stopPropagation()
                                    setStatus(s.id, 'EXCUSED')
                                  }}
                                >
                                  Excused
                                </button>
                              </div>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>

                {saveError ? (
                  <EmptyState title="Couldn’t save attendance" body={saveError} />
                ) : Object.keys(statuses).length !== students.length ? (
                  <div className="help">
                    Mark all students to enable save ({Object.keys(statuses).length}/{students.length}).
                  </div>
                ) : (
                  <div className="help">Ready to save.</div>
                )}

                <div className="row">
                  <button className="btn btnPrimary" onClick={onSave} disabled={!canSave}>
                    {saving ? 'Saving…' : 'Save attendance'}
                  </button>
                  <div className="help">Saves one record per student for this session.</div>
                </div>
              </div>
            )}
          </Card>
        </div>
      )}
    </>
  )
}

