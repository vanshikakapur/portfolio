import { Link, useParams } from 'react-router-dom'
import { variantBySlug, weightLabel } from '../content/variants'
import { metricFigure, formatRelative } from '../lib/format'
import { useGitHubStats } from '../lib/useGitHubStats'
import { PathGraph } from '../components/PathGraph'
import { NotFound } from './NotFound'
import styles from './VariantDetail.module.css'

export function VariantDetail() {
  const { slug } = useParams<'slug'>()
  const variant = slug ? variantBySlug.get(slug) : undefined
  const stats = useGitHubStats()

  if (!variant) return <NotFound />

  const repoName = variant.repo?.split('/').pop()
  const stat = repoName ? stats[repoName] : undefined

  return (
    <article className={`page ${styles.wrap}`}>
      <nav aria-label="Breadcrumb" className={styles.crumb}>
        <Link to="/#variants">Variants</Link>
        <span aria-hidden="true">/</span>
        <span aria-current="page">{variant.title}</span>
      </nav>

      <header className={styles.head}>
        <p className="mono">{weightLabel[variant.weight]}</p>
        <h1 className={`display ${styles.title}`}>{variant.title}</h1>
        <p className={styles.blurb}>{variant.blurb}</p>

        <dl className={styles.meta}>
          <div>
            <dt className="mono">Role</dt>
            <dd>{variant.role}</dd>
          </div>
          <div>
            <dt className="mono">Stack</dt>
            <dd>{variant.stack.join(' · ')}</dd>
          </div>
          <div>
            <dt className="mono">Source</dt>
            <dd>
              {variant.repo ? (
                <a href={variant.repo} rel="noreferrer noopener" target="_blank">
                  {repoName}
                  {/* suppressHydrationWarning: the figure is relative to now, so
                      build time and view time differ by design. */}
                  {stat && (
                    <span className={`tnum ${styles.repoStat}`} suppressHydrationWarning>
                      {' '}
                      · {stat.stars} ★ · pushed {formatRelative(stat.pushedAt)}
                      {stat.stale ? ' (cached)' : ''}
                    </span>
                  )}
                </a>
              ) : (
                <span className={styles.noRepo}>Not published publicly</span>
              )}
            </dd>
          </div>
        </dl>
      </header>

      <div className={styles.body}>
        <section className={styles.pipeline} aria-labelledby="pipeline-title">
          <h2 id="pipeline-title" className={styles.h2}>
            Path
          </h2>
          <PathGraph slug={variant.slug} pipeline={variant.pipeline} verbose />
        </section>

        <section className={styles.detail} aria-labelledby="detail-title">
          <h2 id="detail-title" className={styles.h2}>
            How it was built
          </h2>
          <ul className={styles.detailList}>
            {variant.detail.map((d) => (
              <li key={d}>{d}</li>
            ))}
          </ul>

          {variant.openQuestion && (
            <aside className={styles.open}>
              <p className="mono">Open question</p>
              <p className={styles.openBody}>{variant.openQuestion}</p>
            </aside>
          )}
        </section>

        <section className={styles.metrics} aria-labelledby="metrics-title">
          <h2 id="metrics-title" className={styles.h2}>
            Measured
          </h2>
          <dl className={styles.metricList}>
            {variant.metrics.map((m) => (
              <div key={m.note}>
                <dt className={`tnum ${styles.metricValue}`}>
                  {metricFigure(m)}
                  <span className={styles.metricUnit}>{m.unit}</span>
                </dt>
                <dd className={styles.metricNote}>{m.note}</dd>
              </div>
            ))}
          </dl>
        </section>
      </div>

      <footer className={styles.foot}>
        <Link to="/#variants" className={styles.back}>
          ← Back to the variants
        </Link>
      </footer>
    </article>
  )
}
