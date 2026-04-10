export type ApiError = { error: string }

export type DbHealth = {
  db_path: string
  ok: boolean
  required_tables: string[]
  missing_tables: string[]
  counts: Record<string, number>
}

export type Student = {
  id: number
  reg_number: string
  full_name: string
  created_at?: string
}

export type Session = {
  id: number
  session_date: string
  created_at?: string
}

export type AttendanceStatus = 'PRESENT' | 'ABSENT' | 'EXCUSED'

export type AttendanceUpsertResponse = {
  student_id: number
  session_id: number
  status: AttendanceStatus
}

export type AttendanceBulkUpsertResponse = {
  session_id: number
  saved: number
}

export type AttendanceRecord = {
  session_id: number
  session_date: string
  status: AttendanceStatus
}

export type AttendanceSummary = {
  total_sessions: number
  present: number
  absent: number
  excused: number
  raw_pct: number
  adjusted_pct: number
  tier: string
  validity: string
  escalation: string | null
}

export type StudentSummaryResponse = {
  student: { id: number; reg_number: string; full_name: string }
  summary: AttendanceSummary
  sessions_counted: number
}

