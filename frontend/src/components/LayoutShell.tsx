import { useEffect, useId, useMemo, useState } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { api } from '../api/client'
import type { DbHealth } from '../api/types'
import Stamp from './Stamp'

type NavItem = { to: string; label: string; end?: boolean }

export default function LayoutShell({
  children,
  title = 'Attendance Demo',
  subtitle = 'Admin / Lecturer UI',
}: {
  children: React.ReactNode
  title?: string
  subtitle?: string
}) {
  const location = useLocation()
  const navId = useId()
  const [open, setOpen] = useState(false)
  const [db, setDb] = useState<DbHealth | null>(null)
  const [dbError, setDbError] = useState<string | null>(null)

  const items = useMemo<NavItem[]>(
    () => [
      { to: '/', label: 'Dashboard', end: true },
      { to: '/students', label: 'Students' },
      { to: '/sessions', label: 'Sessions' },
      { to: '/attendance', label: 'Attendance' },
    ],
    [],
  )

  useEffect(() => {
    setOpen(false)
  }, [location.pathname])

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false)
    }
    if (open) window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [open])

  useEffect(() => {
    let cancelled = false
    async function run() {
      setDbError(null)
      try {
        const json = await api.dbHealth()
        if (!cancelled) setDb(json)
      } catch (e) {
        if (!cancelled) setDbError(e instanceof Error ? e.message : 'Failed to load')
      }
    }
    void run()
    const id = window.setInterval(run, 30_000)
    return () => {
      cancelled = true
      window.clearInterval(id)
    }
  }, [])

  return (
    <div className={`appShell ${open ? 'appShellNavOpen' : ''}`}>
      <header className="shellTopbar">
        <button
          className="iconBtn"
          type="button"
          aria-controls={navId}
          aria-expanded={open}
          aria-label={open ? 'Close navigation' : 'Open navigation'}
          onClick={() => setOpen((v) => !v)}
        >
          <span className="iconBtnBars" aria-hidden="true" />
        </button>
        <div className="shellTopbarBrand">
          <div className="brandTitle">
            <strong>{title}</strong>
            <span>{subtitle}</span>
          </div>
        </div>
      </header>

      <div className="shellBackdrop" role="presentation" onClick={() => setOpen(false)} />

      <aside className="sidebar shellNav" id={navId} aria-label="Primary">
        <div className="brand shellBrand">
          <div className="brandTitle">
            <strong>{title}</strong>
            <span>{subtitle}</span>
          </div>
        </div>

        <nav className="nav" aria-label="Primary navigation">
          {items.map((it) => (
            <NavLink
              key={it.to}
              to={it.to}
              end={it.end}
              aria-label={it.label}
              className={({ isActive }) => (isActive ? 'active' : undefined)}
            >
              {it.label}
            </NavLink>
          ))}
        </nav>

        <div className="shellFootnote">
          <div className="shellFootnoteRow">
            <div className="help">API served from the same service.</div>
            {dbError ? (
              <Stamp label="DB" value="Error" tone="danger" />
            ) : !db ? (
              <Stamp label="DB" value="…" tone="info" />
            ) : db.ok ? (
              <Stamp label="DB" value="Ready" tone="ok" />
            ) : (
              <Stamp label="DB" value="Setup" tone="warn" />
            )}
          </div>
        </div>
      </aside>

      <main className="content shellContent">
        <div className="container">{children}</div>
      </main>
    </div>
  )
}

