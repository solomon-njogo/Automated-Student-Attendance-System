import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { api } from '../api/client'
import type { AttendanceRecord, AttendanceStatus, StudentSummaryResponse } from '../api/types'
import Card from '../components/Card'
import EmptyState from '../components/EmptyState'
import { Field } from '../components/Field'
import Stamp from '../components/Stamp'

export default function StudentDetailPage() {
  const params = useParams()
  const studentId = Number(params.studentId)

  const [records, setRecords] = useState<AttendanceRecord[]>([])
  const [summary, setSummary] = useState<StudentSummaryResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [markDate, setMarkDate] = useState('')
  const [markStatus, setMarkStatus] = useState<AttendanceStatus>('PRESENT')
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [saveOk, setSaveOk] = useState<string | null>(null)

  const title = useMemo(() => {
    if (!summary) return 'Student'
    return `${summary.student.full_name} (${summary.student.reg_number})`
  }, [summary])

  async function load() {
    if (!Number.isFinite(studentId) || studentId <= 0) {
      setError('Invalid student id.')
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)
    try {
      const [recordsJson, summaryJson] = await Promise.all([
        api.studentAttendanceRecords(studentId),
        api.studentAttendanceSummary(studentId),
      ])

      setRecords(recordsJson)
      setSummary(summaryJson)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [studentId])

  async function markAttendance() {
    const date = markDate.trim()
    if (!date) {
      setSaveError("'session_date' is required (YYYY-MM-DD).")
      return
    }
    setSaving(true)
    setSaveError(null)
    setSaveOk(null)
    try {
      await api.upsertAttendance({ student_id: studentId, session_date: date, status: markStatus })
      setSaveOk('Attendance saved.')
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
          <h1>{title}</h1>
          <p>Stamp attendance and review computed summary (tier, validity, escalation).</p>
        </div>
        <div className="row">
          <Link className="btn" to="/students">
            Back to students
          </Link>
          <button className="btn" onClick={load} disabled={loading}>
            Refresh
          </button>
        </div>
      </div>

      {loading ? (
        <div className="help">Loading…</div>
      ) : error ? (
        <EmptyState title="Couldn’t load student data" body={error} />
      ) : (
        <div className="grid grid2">
          <Card
            title="Summary"
            subtitle="GET /students/:id/attendance-summary"
            aside={
              summary ? (
                <Stamp
                  label="Adjusted"
                  value={`${summary.summary.adjusted_pct}%`}
                  tone={summary.summary.adjusted_pct >= 75 ? 'ok' : summary.summary.adjusted_pct >= 60 ? 'warn' : 'danger'}
                />
              ) : null
            }
          >
            {!summary ? (
              <EmptyState title="No summary yet" hint="Create sessions and stamp attendance to generate a summary." />
            ) : (
              <div className="grid" style={{ gap: 12 }}>
                <div className="row">
                  <Stamp label="Tier" value={summary.summary.tier.replaceAll(' ', '_')} tone={toneForTier(summary.summary.tier)} />
                  <Stamp
                    label="Validity"
                    value={summary.summary.validity.replaceAll(' ', '_')}
                    tone={toneForValidity(summary.summary.validity)}
                  />
                  <Stamp
                    label="Escalation"
                    value={(summary.summary.escalation ?? 'None').replaceAll(' ', '_')}
                    tone={toneForEscalation(summary.summary.escalation)}
                  />
                </div>
                <div className="metricRow" style={{ gridTemplateColumns: 'repeat(3, minmax(0, 1fr))' }}>
                  <div className="metric">
                    <div className="metricKicker">Raw %</div>
                    <div className="metricValue">{summary.summary.raw_pct}%</div>
                  </div>
                  <div className="metric">
                    <div className="metricKicker">Adjusted %</div>
                    <div className="metricValue">{summary.summary.adjusted_pct}%</div>
                  </div>
                  <div className="metric">
                    <div className="metricKicker">Sessions counted</div>
                    <div className="metricValue">{summary.sessions_counted}</div>
                  </div>
                </div>
                <div className="help">
                  Adjusted % excludes excused sessions from the denominator (per your policy rules).
                </div>
              </div>
            )}
          </Card>

          <Card title="Stamp attendance" subtitle="POST /attendance" className="stickyCol">
            <div className="grid" style={{ gap: 10 }}>
              <div className="row">
                <Field label="Session date" hint="YYYY-MM-DD">
                  <input
                    className="control"
                    value={markDate}
                    onChange={(e) => setMarkDate(e.target.value)}
                    placeholder="2026-03-18"
                    autoComplete="off"
                  />
                </Field>
                <Field label="Status">
                  <select
                    className="control"
                    value={markStatus}
                    onChange={(e) => setMarkStatus(e.target.value as AttendanceStatus)}
                  >
                    <option value="PRESENT">PRESENT</option>
                    <option value="ABSENT">ABSENT</option>
                    <option value="EXCUSED">EXCUSED</option>
                  </select>
                </Field>
              </div>

              {saveError ? (
                <EmptyState title="Couldn’t save" body={saveError} />
              ) : saveOk ? (
                <div className="help">{saveOk}</div>
              ) : (
                <div className="help"> </div>
              )}

              <div className="row">
                <button className="btn btnPrimary" onClick={markAttendance} disabled={saving}>
                  {saving ? 'Saving…' : 'Save attendance'}
                </button>
                <div className="help">
                  Using <code>session_date</code> will auto-create the session if missing.
                </div>
              </div>
            </div>
          </Card>

          <Card
            title="Attendance timeline"
            subtitle="GET /students/:id/attendance-records"
            className="spanAll"
          >
            {records.length === 0 ? (
              <EmptyState
                title="No sessions to show"
                body="Create sessions (or stamp attendance by date) to populate the timeline."
              />
            ) : (
              <div className="timeline">
                {records.map((r) => (
                  <div key={r.session_id} className="timelineRow">
                    <div className="timelineDot" aria-hidden="true" />
                    <div className="timelineMain">
                      <div className="timelineDate">{r.session_date}</div>
                      <div className="timelineMeta">
                        <span className="badge">
                          Session <strong style={{ marginLeft: 6 }}>{r.session_id}</strong>
                        </span>
                        <Stamp label="Status" value={r.status} tone={toneForStatus(r.status)} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      )}
    </>
  )
}

function toneForStatus(status: AttendanceStatus) {
  if (status === 'PRESENT') return 'ok'
  if (status === 'EXCUSED') return 'info'
  return 'danger'
}

function toneForTier(tier: string) {
  const t = tier.toLowerCase()
  if (t.includes('excellent') || t.includes('satisfactory')) return 'ok'
  if (t.includes('at risk') || t.includes('low')) return 'warn'
  if (t.includes('critical') || t.includes('barred') || t.includes('fail')) return 'danger'
  return 'info'
}

function toneForValidity(validity: string) {
  const v = validity.toLowerCase()
  if (v.includes('valid')) return 'ok'
  if (v.includes('risk')) return 'warn'
  return 'danger'
}

function toneForEscalation(escalation: string | null) {
  if (!escalation) return 'info'
  const e = escalation.toLowerCase()
  if (e.includes('early warning')) return 'warn'
  if (e.includes('academic alert')) return 'warn'
  if (e.includes('formal intervention')) return 'danger'
  if (e.includes('barred') || e.includes('critical')) return 'danger'
  return 'info'
}

