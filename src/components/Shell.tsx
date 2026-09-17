import { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { profile } from '../content/profile'
import { useTheme } from '../lib/useTheme'
import { QueryBar } from './QueryBar'
import { ShortcutHelp } from './ShortcutHelp'
import styles from './Shell.module.css'

const NAV = [
  { to: '/', label: 'Discover' },
  { to: '/about', label: 'Analyst' },
] as const

function isTypingTarget(el: EventTarget | null): boolean {
  return el instanceof HTMLElement && (el.isContentEditable || /^(input|textarea)$/i.test(el.tagName))
}

export function Shell({ children }: { children: React.ReactNode }) {
  const { theme, toggle } = useTheme()
  const [queryOpen, setQueryOpen] = useState(false)
  const [helpOpen, setHelpOpen] = useState(false)
  const location = useLocation()
  const navigate = useNavigate()

  /** Real shortcuts, not decoration. `g` then a letter is a two-key chord, so
   *  the pending `g` has to be tracked and expired. */
  useEffect(() => {
    let pendingG = false
    let timer = 0

    const onKey = (e: KeyboardEvent) => {
      if (isTypingTarget(e.target)) {
        if (e.key === 'Escape') (e.target as HTMLElement).blur()
        return
      }

      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        setQueryOpen(true)
        return
      }
      if (e.metaKey || e.ctrlKey || e.altKey) return

      if (e.key === 'Escape') {
        setQueryOpen(false)
        setHelpOpen(false)
        return
      }
      if (e.key === '?') {
        e.preventDefault()
        setHelpOpen((v) => !v)
        return
      }
      if (e.key === '/') {
        e.preventDefault()
        setQueryOpen(true)
        return
      }
      if (e.key.toLowerCase() === 't') {
        toggle()
        return
      }

      if (pendingG) {
        pendingG = false
        clearTimeout(timer)
        const map: Record<string, string> = {
          d: '/',
          a: '/about',
          l: '/#log',
          v: '/#variants',
        }
        const to = map[e.key.toLowerCase()]
        if (!to) return
        e.preventDefault()
        if (to.startsWith('/#')) {
          if (location.pathname !== '/') navigate('/')
          requestAnimationFrame(() => {
            document.querySelector(to.slice(1))?.scrollIntoView({ block: 'start' })
          })
        } else {
          navigate(to)
        }
        return
      }

      if (e.key.toLowerCase() === 'g') {
        pendingG = true
        timer = window.setTimeout(() => {
          pendingG = false
        }, 1200)
      }
    }

    addEventListener('keydown', onKey)
    return () => {
      removeEventListener('keydown', onKey)
      clearTimeout(timer)
    }
  }, [toggle, navigate, location.pathname])

  // Scroll to top on route change, but never fight an in-page anchor.
  useEffect(() => {
    if (!location.hash) window.scrollTo({ top: 0, behavior: 'instant' })
  }, [location.pathname, location.hash])

  return (
    <>
      <a className="skipLink" href="#main">
        Skip to content
      </a>

      <header className={styles.bar}>
        <div className={styles.barInner}>
          <Link to="/" className={styles.wordmark}>
            <span className={styles.wordmarkName}>{profile.name}</span>
            <span className={styles.wordmarkRole}>Data analyst</span>
          </Link>

          <nav aria-label="Sections" className={styles.nav}>
            {NAV.map((n) => (
              <Link
                key={n.to}
                to={n.to}
                className={location.pathname === n.to ? styles.navLinkOn : styles.navLink}
                aria-current={location.pathname === n.to ? 'page' : undefined}
              >
                {n.label}
              </Link>
            ))}
          </nav>

          <div className={styles.tools}>
            <button
              type="button"
              className={styles.toolButton}
              onClick={() => setQueryOpen(true)}
            >
              Query
              <kbd className={styles.kbd}>⌘K</kbd>
            </button>
            <button
              type="button"
              className={styles.toolButton}
              onClick={toggle}
              aria-pressed={theme === 'dark'}
              title="Toggle colour mode (T)"
            >
              <span className={styles.srOnly}>
                Colour mode: {theme}. Activate to switch.
              </span>
              <span aria-hidden="true" className={styles.themeGlyph}>
                {theme === 'dark' ? 'dark' : 'light'}
              </span>
            </button>
          </div>
        </div>
      </header>

      <main id="main">{children}</main>

      <QueryBar open={queryOpen} onClose={() => setQueryOpen(false)} />
      <ShortcutHelp open={helpOpen} onClose={() => setHelpOpen(false)} />
    </>
  )
}
