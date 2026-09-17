import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { variants } from '../content/variants'
import styles from './NotFound.module.css'

/** Written in the site's own vocabulary: a path that isn't in the discovered
 *  model. It also does the one useful thing a 404 can do — offer the real
 *  nodes rather than a shrug. */
export function NotFound() {
  /** One prerendered 404 document stands in for every unmatched URL, so the
   *  attempted path can only be read in the browser. The row holds its height
   *  while empty, so filling it in shifts nothing. */
  const [attempted, setAttempted] = useState('')
  useEffect(() => setAttempted(window.location.pathname), [])

  return (
    <div className={`page ${styles.wrap}`}>
      <p className="mono">Conformance error</p>
      <h1 className={`display ${styles.title}`}>
        That path isn&rsquo;t in the model.
      </h1>
      <p className={styles.attempted}>
        <code className={styles.path}>{attempted}</code>
      </p>
      <p className={styles.body}>
        Every route on this site comes from the event log, so there is nothing
        here to recover — but these exist:
      </p>

      <ul className={styles.links}>
        <li>
          <Link to="/">Discover — the process model</Link>
        </li>
        <li>
          <Link to="/#log">Event log — five activities</Link>
        </li>
        {variants.map((v) => (
          <li key={v.slug}>
            <Link to={`/variants/${v.slug}`}>{v.title}</Link>
          </li>
        ))}
        <li>
          <Link to="/about">Analyst</Link>
        </li>
      </ul>
    </div>
  )
}
