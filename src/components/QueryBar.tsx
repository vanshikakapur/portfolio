import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { queryHints, runQuery } from '../lib/query'
import styles from './QueryBar.module.css'

interface Props {
  open: boolean
  onClose: () => void
}

/** Filters the same typed content layer the page renders, so a result can
 *  never disagree with the page. Query text lives in the URL as ?q= while the
 *  bar is open, which makes a search shareable. */
export function QueryBar({ open, onClose }: Props) {
  const [raw, setRaw] = useState('')
  const [active, setActive] = useState(0)
  const inputRef = useRef<HTMLInputElement | null>(null)
  const navigate = useNavigate()
  const results = useMemo(() => runQuery(raw), [raw])

  useEffect(() => {
    if (!open) return
    const params = new URLSearchParams(location.search)
    setRaw(params.get('q') ?? '')
    inputRef.current?.focus()
  }, [open])

  useEffect(() => {
    if (!open) return
    const url = new URL(location.href)
    if (raw) url.searchParams.set('q', raw)
    else url.searchParams.delete('q')
    history.replaceState(null, '', url)
  }, [raw, open])

  useEffect(() => setActive(0), [raw])

  if (!open) return null

  const go = (to: string) => {
    onClose()
    const url = new URL(location.href)
    url.searchParams.delete('q')
    history.replaceState(null, '', url)
    if (to.startsWith('/#')) {
      navigate('/')
      // Wait for the route to commit before hunting for the anchor.
      requestAnimationFrame(() => {
        document.querySelector(to.slice(1))?.scrollIntoView({ block: 'start' })
      })
    } else {
      navigate(to)
    }
  }

  return (
    <div
      className={styles.scrim}
      onPointerDown={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div
        className={styles.panel}
        role="dialog"
        aria-modal="true"
        aria-label="Query the record"
      >
        <div className={styles.inputRow}>
          <span className={styles.prompt} aria-hidden="true">
            ›
          </span>
          <input
            ref={inputRef}
            className={styles.input}
            value={raw}
            spellCheck={false}
            autoComplete="off"
            placeholder="Query the record — tool:python, org:celonis, year:2023"
            aria-label="Query the record"
            aria-describedby="query-hints"
            onChange={(e) => setRaw(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'ArrowDown') {
                e.preventDefault()
                setActive((i) => Math.min(results.length - 1, i + 1))
              } else if (e.key === 'ArrowUp') {
                e.preventDefault()
                setActive((i) => Math.max(0, i - 1))
              } else if (e.key === 'Enter') {
                const hit = results[active]
                if (hit) go(hit.to)
              } else if (e.key === 'Escape') {
                onClose()
              }
            }}
          />
          <kbd className={styles.esc}>esc</kbd>
        </div>

        <ul className={styles.results}>
          {results.map((r, i) => (
            <li key={`${r.kind}-${r.id}`}>
              <button
                type="button"
                className={i === active ? styles.hitActive : styles.hit}
                onMouseEnter={() => setActive(i)}
                onClick={() => go(r.to)}
              >
                <span className={styles.hitKind}>{r.kind}</span>
                <span className={styles.hitTitle}>{r.title}</span>
                <span className={styles.hitContext}>{r.context}</span>
              </button>
            </li>
          ))}
          {results.length === 0 && (
            <li className={styles.empty}>
              No match in the record for <strong>{raw}</strong>. Nothing here is
              invented, so an empty result means it genuinely isn&rsquo;t there.
            </li>
          )}
        </ul>

        <p className={styles.hints} id="query-hints">
          {queryHints.map((h) => (
            <button
              key={h.token}
              type="button"
              className={styles.hintChip}
              onClick={() => {
                setRaw((prev) => `${prev.trim()} ${h.example}`.trim())
                inputRef.current?.focus()
              }}
            >
              {h.example}
            </button>
          ))}
        </p>
      </div>
    </div>
  )
}
