import { useEffect, useId, useMemo, useState } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { api } from '../api/client'
import type { DbHealth } from '../api/types'
import Stamp from './Stamp'

type NavItem = { to: string; label: string; end?: boolean }

const GROUP_MEMBERS = ['Solomon Njogo', 'Ted Mbatia', 'Shawn Njoroge'] as const

export default function LayoutShell({
  children,
  title = 'Automated Student Attendance System',
  subtitle = '',
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
            <div className="help">API and Database Health Status.</div>
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
        <div className="shellContentGrow">
          <div className="container">{children}</div>
        </div>
        <footer className="shellPageFooter" aria-label="Course group members">
          <div className="shellPageFooterInner">
            <span className="shellPageFooterLabel">APT3020 — Group members</span>
            <ul className="shellPageFooterList">
              {GROUP_MEMBERS.map((name) => (
                <li key={name}>{name}</li>
              ))}
            </ul>
          </div>
        </footer>
      </main>
    </div>
  )
}

