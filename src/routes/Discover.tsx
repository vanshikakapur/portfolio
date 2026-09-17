import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { profile, observationWindow } from '../content/profile'
import { activities } from '../content/log'
import { variants, weightLabel } from '../content/variants'
import { toolchain, alsoUsed } from '../content/toolchain'
import { graphLegend, monthIndex } from '../content/graph'
import { formatSpan, formatYearMonth, formatRelative } from '../lib/format'
import { useScrollProgress } from '../lib/useScrollProgress'
import { useReducedMotion } from '../lib/useReducedMotion'
import { useGitHubStats } from '../lib/useGitHubStats'
import { useTravel } from '../lib/navigate'
import { ProcessGraph } from '../components/ProcessGraph'
import { PathGraph } from '../components/PathGraph'
import { Reveal } from '../components/Reveal'
import { Pressable } from '../components/Pressable'
import { CountUp } from '../components/CountUp'
import styles from './Discover.module.css'

/** The four figures that carry the most weight in the record. Referenced by
 *  activity id so the numbers stay owned by the content layer. */
const HEADLINE = [
  { activityId: 'vertiv', metricIndex: 1 },
  { activityId: 'vertiv', metricIndex: 0 },
  { activityId: 'celonis', metricIndex: 0 },
  { activityId: 'iu-instructor', metricIndex: 0 },
] as const

/** Grid span and card treatment are two halves of one decision — how much room
 *  a project has earned — so they are chosen together rather than in two maps. */
const LAYOUT = {
  primary: { span: styles.spanHalf, card: styles.variantPrimary },
  secondary: { span: styles.spanFull, card: styles.variantSecondary },
  supporting: { span: styles.spanThird, card: styles.variantSupporting },
} as const

/** One pass of the replay. Long enough to read the five activities arriving,
 *  short enough that nobody waits for it to end. */
const REPLAY_MS = 9000

const T0 = monthIndex(observationWindow.from)
const T1 = monthIndex(observationWindow.to)

function cursorToYearMonth(c: number): string {
  const m = Math.round(T0 + c * (T1 - T0))
  const year = Math.floor(m / 12)
  const month = (m % 12) + 1
  return `${year}-${String(month).padStart(2, '0')}`
}

export function Discover() {
  const { ref: heroRef, progress } = useScrollProgress<HTMLElement>()
  const [params, setParams] = useSearchParams()
  const travel = useTravel()
  const stats = useGitHubStats()

  /** The graph cursor is deep-linkable as ?t=0.42, so a specific moment in the
   *  discovery can be shared. Applied on mount rather than in the initial state
   *  because the page is prerendered without a query string. */
  const deepLinked = params.get('t')
  const [cursor, setCursor] = useState(0)
  const [replaying, setReplaying] = useState(false)
  const reduced = useReducedMotion()

  useEffect(() => {
    const parsed = Number(deepLinked)
    if (deepLinked !== null && parsed >= 0 && parsed <= 1) setCursor(parsed)
  }, [deepLinked])

  // Scroll takes over once the visitor scrolls; the deep link only seeds it.
  // Suspended during a replay so the two never fight over the same cursor.
  useEffect(() => {
    if (!replaying && progress > 0.001) setCursor(Math.min(1, progress * 1.7))
  }, [progress, replaying])

  /** Replays the observation window through the model, which is the one thing a
   *  static picture of a process cannot show. */
  useEffect(() => {
    if (!replaying) return
    let frame = 0
    let startedAt = 0
    const step = (now: number) => {
      if (startedAt === 0) startedAt = now
      const p = Math.min(1, (now - startedAt) / REPLAY_MS)
      setCursor(p)
      if (p < 1) frame = requestAnimationFrame(step)
      else setReplaying(false)
    }
    frame = requestAnimationFrame(step)
    return () => cancelAnimationFrame(frame)
  }, [replaying])

  const toggleReplay = () => {
    if (replaying) {
      setReplaying(false)
      return
    }
    // With motion reduced, the replay still has a destination — it just arrives.
    if (reduced) {
      setCursor(1)
      return
    }
    setCursor(0)
    setReplaying(true)
  }

  const commitCursor = () => {
    const next = new URLSearchParams(params)
    next.set('t', cursor.toFixed(2))
    setParams(next, { replace: true })
  }

  return (
    <>
      <section className={styles.hero} ref={heroRef} aria-labelledby="hero-title">
        <div className={`page ${styles.heroInner}`}>
          <div className={styles.heroText}>
            <p className="mono">{profile.discipline}</p>
            <h1 id="hero-title" className={`display ${styles.title}`}>
              {profile.name}
            </h1>
            <p className={styles.standfirst}>{profile.standfirst}</p>

            <dl className={styles.status}>
              <div>
                <dt className="mono">Available</dt>
                <dd className="tnum">{profile.seeking.from}</dd>
              </div>
              <div>
                <dt className="mono">Seeking</dt>
                <dd>{profile.seeking.roles.join(' · ')}</dd>
              </div>
              <div>
                <dt className="mono">Based</dt>
                <dd>{profile.location}</dd>
              </div>
            </dl>
          </div>

          <figure className={styles.graphFigure}>
            <ProcessGraph
              cursor={cursor}
              replaying={replaying}
              onPick={(node) => {
                if (!node.href) return
                if (node.href.startsWith('#')) {
                  document.querySelector(node.href)?.scrollIntoView({ block: 'start' })
                } else {
                  travel(`/${node.href}`)
                }
              }}
            />
            <figcaption className={styles.caption}>
              <div className={styles.captionHead}>
                <span className="mono">Discovered process model</span>
                <div className={styles.captionActions}>
                  <Pressable
                    className={styles.replayButton}
                    onPress={toggleReplay}
                    pressed={replaying}
                    label={replaying ? 'Pause the replay' : 'Replay the process'}
                  >
                    <span aria-hidden="true" className={styles.replayGlyph} />
                    {/* Fixed-width label: the text swaps, the row must not move. */}
                    <span className={styles.replayLabel}>
                      {replaying ? 'Pause' : 'Replay'}
                    </span>
                  </Pressable>
                  <Pressable
                    className={styles.cursorButton}
                    onPress={commitCursor}
                    // Nothing to copy once the URL already holds this moment.
                    disabled={params.get('t') === cursor.toFixed(2)}
                  >
                    {/* No aria-label: the accessible name has to contain the
                        visible text, and the visible text already says it. */}
                    <span className="tnum">{formatYearMonth(cursorToYearMonth(cursor))}</span>
                    <span className={styles.cursorHint}>link this moment</span>
                  </Pressable>
                </div>
              </div>
              <dl className={styles.legend}>
                {graphLegend.map((l) => (
                  <div key={l.mark}>
                    <dt>{l.mark}</dt>
                    <dd>{l.means}</dd>
                  </div>
                ))}
              </dl>
            </figcaption>
          </figure>
        </div>
      </section>

      <hr className="rule" />

      <section className={`page ${styles.section}`} aria-labelledby="throughput-title">
        <Reveal>
          <h2 id="throughput-title" className={`display ${styles.sectionTitle}`}>
            Throughput
          </h2>
          <p className={styles.sectionLead}>
            Every figure below came out of work that shipped, and each one is
            attached to the activity that produced it.
          </p>
        </Reveal>

        <ul className={styles.figures}>
          {HEADLINE.map((h, i) => {
            const activity = activities.find((a) => a.id === h.activityId)
            const metric = activity?.metrics[h.metricIndex]
            if (!activity || !metric) return null
            return (
              <Reveal as="li" index={i} key={`${h.activityId}-${h.metricIndex}`}>
                <div className={styles.figure}>
                  <CountUp metric={metric} className={`tnum ${styles.figureValue}`} />
                  <span className={styles.figureUnit}>{metric.unit}</span>
                  <span className={styles.figureNote}>{metric.note}</span>
                  <span className={styles.figureOrg}>{activity.org}</span>
                </div>
              </Reveal>
            )
          })}
        </ul>
      </section>

      <hr className="rule" />

      <section className={`page ${styles.section}`} id="log" aria-labelledby="log-title">
        <Reveal>
          <h2 id="log-title" className={`display ${styles.sectionTitle}`}>
            Event log
          </h2>
          <p className={styles.sectionLead}>
            Five activities, {formatSpan(observationWindow.from, observationWindow.to)}. The
            overlaps are real — two of the roles ran concurrently with a degree.
          </p>
        </Reveal>

        <ol className={styles.log}>
          {activities.map((a, i) => (
            <Reveal as="li" index={i} key={a.id}>
              <article className={styles.entry} id={`log-${a.id}`}>
                <header className={styles.entryHead}>
                  <p className={`mono tnum ${styles.entrySpan}`}>{formatSpan(a.start, a.end)}</p>
                  <h3 className={styles.entryTitle}>
                    {a.title}
                    <span className={styles.entryOrg}>{a.org}</span>
                  </h3>
                  <p className={styles.entryMeta}>
                    {a.place}
                    {a.credential ? ` · ${a.credential}` : ''}
                  </p>
                </header>

                <div className={styles.entryBody}>
                  <p className={styles.entrySummary}>{a.summary}</p>
                  <ul className={styles.entryDetail}>
                    {a.detail.map((d) => (
                      <li key={d}>{d}</li>
                    ))}
                  </ul>
                  <ul className={styles.entryTools}>
                    {a.tools.map((t) => (
                      <li key={t}>{t}</li>
                    ))}
                  </ul>
                </div>

                <dl className={styles.entryMetrics}>
                  {a.metrics.map((m) => (
                    <div key={m.note}>
                      <dt className={`tnum ${styles.metricValue}`}>
                        <CountUp metric={m} />
                        <span className={styles.metricUnit}>{m.unit}</span>
                      </dt>
                      <dd className={styles.metricNote}>{m.note}</dd>
                    </div>
                  ))}
                </dl>
              </article>
            </Reveal>
          ))}
        </ol>
      </section>

      <hr className="rule" />

      <section className={`page ${styles.section}`} id="variants" aria-labelledby="variants-title">
        <Reveal>
          <h2 id="variants-title" className={`display ${styles.sectionTitle}`}>
            Variants
          </h2>
          <p className={styles.sectionLead}>
            {variants.length} paths through the same set of tools. They are not
            the same size, and the layout does not pretend they are.
          </p>
        </Reveal>

        <ul className={styles.variants}>
          {variants.map((v, i) => {
            const repoName = v.repo?.split('/').pop()
            const stat = repoName ? stats[repoName] : undefined
            const layout = LAYOUT[v.weight]
            return (
              <Reveal as="li" index={i} key={v.id} className={layout.span}>
                <article className={layout.card}>
                  <p className="mono">{weightLabel[v.weight]}</p>
                  <h3 className={`display ${styles.variantTitle}`}>
                    {/* The link covers the card via ::after rather than the card
                        being a button: a whole-card <button> cannot legally hold
                        this markup, and a real link still opens in a new tab. */}
                    <Link
                      to={`/variants/${v.slug}`}
                      className={styles.variantLink}
                      onClick={(e) => {
                        if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return
                        e.preventDefault()
                        travel(`/variants/${v.slug}`)
                      }}
                    >
                      {v.title}
                    </Link>
                  </h3>
                  <p className={styles.variantBlurb}>{v.blurb}</p>
                  <div className={styles.variantPath}>
                    <PathGraph slug={v.slug} pipeline={v.pipeline} />
                  </div>
                  <footer className={styles.variantFoot}>
                    <span className={styles.variantRole}>{v.role}</span>
                    {/* suppressHydrationWarning: "3 weeks ago" is relative to
                        now, so build time and view time differ by design. */}
                    {stat ? (
                      <span className={`tnum ${styles.variantStat}`} suppressHydrationWarning>
                        {stat.stars} ★ · pushed {formatRelative(stat.pushedAt)}
                        {stat.stale ? ' (cached)' : ''}
                      </span>
                    ) : (
                      <span className={styles.variantStat}>no public repo</span>
                    )}
                  </footer>
                </article>
              </Reveal>
            )
          })}
        </ul>
      </section>

      <hr className="rule" />

      <section className={`page ${styles.section}`} id="toolchain" aria-labelledby="tool-title">
        <Reveal>
          <h2 id="tool-title" className={`display ${styles.sectionTitle}`}>
            Toolchain
          </h2>
          <p className={styles.sectionLead}>
            What each tool actually produced. A percentage next to a tool name
            measures nothing, so there aren&rsquo;t any.
          </p>
        </Reveal>

        <dl className={styles.tools}>
          {toolchain.map((t, i) => (
            <Reveal index={i} key={t.tool} className={styles.toolRow}>
              <dt className={styles.toolName}>{t.tool}</dt>
              <dd className={styles.toolArtifact}>{t.artifact}</dd>
            </Reveal>
          ))}
        </dl>

        <Reveal>
          <p className={styles.alsoUsed}>
            <span className="mono">Also in the record, without a shipped artifact attached</span>
            <span className={styles.alsoList}>{alsoUsed.join(' · ')}</span>
          </p>
        </Reveal>
      </section>
    </>
  )
}
