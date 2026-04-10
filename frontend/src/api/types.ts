export type ApiError = { error: string }

export type DbHealth = {
  db_path: string
  ok: boolean
  required_tables: string[]
  missing_tables: string[]
  counts: Record<string, number>
}

export type DashboardCohort = {
  present: number
  absent: number
  excused: number
  total_slots: number
  raw_pct: number
  adjusted_pct: number
}

export type DashboardSessionPoint = {
  session_id: number
  session_date: string
  present: number
  absent: number
  excused: number
  adjusted_pct: number
}

export type DashboardOverview = {
  counts: Record<string, number>
  mean_student_adjusted_pct: number | null
  cohort: DashboardCohort
  by_session: DashboardSessionPoint[]
  tier_counts: Record<string, number>
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

export type SessionAttendanceStudent = {
  student_id: number
  reg_number: string
  full_name: string
  status: AttendanceStatus
}

export type SessionAttendanceResponse = {
  session: { id: number; session_date: string }
  students: SessionAttendanceStudent[]
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

