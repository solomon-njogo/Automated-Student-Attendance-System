import type {
  ApiError,
  AttendanceRecord,
  AttendanceStatus,
  AttendanceBulkUpsertResponse,
  AttendanceUpsertResponse,
  DashboardOverview,
  DbHealth,
  Session,
  SessionAttendanceResponse,
  Student,
  StudentSummaryResponse,
} from './types'

async function requestJson<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(path, init)
  const text = await res.text()
  const json = text ? (JSON.parse(text) as unknown) : null

  if (!res.ok) {
    const msg =
      json && typeof json === 'object' && json !== null && 'error' in json
        ? String((json as ApiError).error)
        : `HTTP ${res.status}`
    throw new Error(msg)
  }

  return json as T
}

export const api = {
  dbHealth(): Promise<DbHealth> {
    return requestJson<DbHealth>('/api/db/health')
  },

  dashboardOverview(): Promise<DashboardOverview> {
    return requestJson<DashboardOverview>('/api/dashboard/overview')
  },

  listStudents(): Promise<Student[]> {
    return requestJson<Student[]>('/api/students')
  },

  createStudent(input: { reg_number: string; full_name: string }): Promise<Student> {
    return requestJson<Student>('/api/students', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    })
  },

  listSessions(): Promise<Session[]> {
    return requestJson<Session[]>('/api/sessions')
  },

  sessionAttendance(sessionId: number): Promise<SessionAttendanceResponse> {
    return requestJson<SessionAttendanceResponse>(`/api/sessions/${sessionId}/attendance`)
  },

  createSession(input: { session_date: string }): Promise<Session> {
    return requestJson<Session>('/api/sessions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    })
  },

  upsertAttendance(input: { student_id: number; session_date: string; status: AttendanceStatus }): Promise<AttendanceUpsertResponse> {
    return requestJson<AttendanceUpsertResponse>('/api/attendance', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    })
  },

  bulkUpsertAttendance(input: {
    session_id?: number
    session_date?: string
    records: { student_id: number; status: AttendanceStatus }[]
  }): Promise<AttendanceBulkUpsertResponse> {
    return requestJson<AttendanceBulkUpsertResponse>('/api/attendance/bulk', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    })
  },

  studentAttendanceRecords(studentId: number): Promise<AttendanceRecord[]> {
    return requestJson<AttendanceRecord[]>(`/api/students/${studentId}/attendance-records`)
  },

  studentAttendanceSummary(studentId: number): Promise<StudentSummaryResponse> {
    return requestJson<StudentSummaryResponse>(`/api/students/${studentId}/attendance-summary`)
  },
}

