import type { PipelineStage } from '../content/types'
import { travelName } from '../lib/navigate'
import styles from './PathGraph.module.css'

interface Props {
  slug: string
  pipeline: readonly PipelineStage[]
  /** Detail view gets the stage tools spelled out; the index does not. */
  verbose?: boolean
}

/** A project's own directly-follows path. This is the shared element that
 *  travels from the variants index into the detail route — the view-transition
 *  name is derived from the slug in one place so both routes must agree. */
export function PathGraph({ slug, pipeline, verbose = false }: Props) {
  return (
    <ol className={verbose ? styles.pathVerbose : styles.path} style={travelName(slug)}>
      {pipeline.map((stage, i) => (
        <li
          className={styles.stage}
          key={stage.label}
          // Stage position drives the stagger; the timing itself is in CSS.
          style={{ '--i': i } as React.CSSProperties}
        >
          <span className={styles.marker} aria-hidden="true">
            <span className={styles.dot} />
            {i < pipeline.length - 1 && <span className={styles.link} />}
          </span>
          <span className={styles.body}>
            <span className={styles.label}>{stage.label}</span>
            {verbose && <span className={styles.tools}>{stage.tools.join(' · ')}</span>}
          </span>
        </li>
      ))}
    </ol>
  )
}
