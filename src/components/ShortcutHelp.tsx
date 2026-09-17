import { useEffect, useRef } from 'react'
import styles from './ShortcutHelp.module.css'

const SHORTCUTS = [
  { keys: ['⌘', 'K'], does: 'Query the record' },
  { keys: ['/'], does: 'Query the record' },
  { keys: ['G', 'D'], does: 'Go to Discover' },
  { keys: ['G', 'L'], does: 'Go to the event log' },
  { keys: ['G', 'V'], does: 'Go to the variants' },
  { keys: ['G', 'A'], does: 'Go to Analyst' },
  { keys: ['T'], does: 'Toggle colour mode' },
  { keys: ['?'], does: 'This panel' },
  { keys: ['Esc'], does: 'Close' },
] as const

export function ShortcutHelp({ open, onClose }: { open: boolean; onClose: () => void }) {
  const closeRef = useRef<HTMLButtonElement | null>(null)

  useEffect(() => {
    if (open) closeRef.current?.focus()
  }, [open])

  if (!open) return null

  return (
    <div
      className={styles.scrim}
      onPointerDown={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div className={styles.panel} role="dialog" aria-modal="true" aria-labelledby="sc-title">
        <div className={styles.head}>
          <h2 id="sc-title" className={styles.title}>
            Keyboard
          </h2>
          <button ref={closeRef} type="button" className={styles.close} onClick={onClose}>
            close
          </button>
        </div>
        <dl className={styles.list}>
          {SHORTCUTS.map((s) => (
            <div className={styles.row} key={s.does + s.keys.join()}>
              <dt className={styles.keys}>
                {s.keys.map((k) => (
                  <kbd className={styles.key} key={k}>
                    {k}
                  </kbd>
                ))}
              </dt>
              <dd className={styles.does}>{s.does}</dd>
            </div>
          ))}
        </dl>
      </div>
    </div>
  )
}
