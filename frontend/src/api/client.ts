import type {
  ApiError,
  AttendanceRecord,
  AttendanceStatus,
  AttendanceUpsertResponse,
  DbHealth,
  Session,
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
    return requestJson<DbHealth>('/db/health')
  },

  listStudents(): Promise<Student[]> {
    return requestJson<Student[]>('/students')
  },

  createStudent(input: { reg_number: string; full_name: string }): Promise<Student> {
    return requestJson<Student>('/students', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    })
  },

  listSessions(): Promise<Session[]> {
    return requestJson<Session[]>('/sessions')
  },

  createSession(input: { session_date: string }): Promise<Session> {
    return requestJson<Session>('/sessions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    })
  },

  upsertAttendance(input: { student_id: number; session_date: string; status: AttendanceStatus }): Promise<AttendanceUpsertResponse> {
    return requestJson<AttendanceUpsertResponse>('/attendance', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    })
  },

  studentAttendanceRecords(studentId: number): Promise<AttendanceRecord[]> {
    return requestJson<AttendanceRecord[]>(`/students/${studentId}/attendance-records`)
  },

  studentAttendanceSummary(studentId: number): Promise<StudentSummaryResponse> {
    return requestJson<StudentSummaryResponse>(`/students/${studentId}/attendance-summary`)
  },
}

