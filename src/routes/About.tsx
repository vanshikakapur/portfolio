import { profile } from '../content/profile'
import { activities } from '../content/log'
import { formatSpan } from '../lib/format'
import { Reveal } from '../components/Reveal'
import styles from './About.module.css'

const education = activities.filter((a) => a.kind === 'education')
const teaching = activities.filter((a) => a.kind === 'teaching')

export function About() {
  return (
    <div className={`page ${styles.wrap}`}>
      <header className={styles.head}>
        <p className="mono">Analyst</p>
        <h1 className={`display ${styles.title}`}>
          I went looking for the bottleneck and stayed for the dashboard.
        </h1>
      </header>

      <div className={styles.columns}>
        <section className={styles.prose} aria-labelledby="bio-title">
          <h2 className="srOnly" id="bio-title">
            Background
          </h2>
          <p>
            My first real analytics job was process mining at Celonis, which is
            an unusual place to start. You are not handed a question — you are
            handed an event log and asked to find out what the process actually
            does, as opposed to what the documentation claims it does. The gap
            between those two things is where all the interesting work lives.
          </p>
          <p>
            That framing followed me. At Vertiv I spent a summer inside
            supply-chain planning, and the useful contribution was not a clever
            model — it was noticing that a monthly allocation across 240+
            products was being assembled by hand, and that the manual step was
            both the slowest part of the cycle and the one most likely to be
            quietly wrong. Automating it cut planning time by 90%. The
            dashboards that came after only mattered because the underlying
            numbers had stopped drifting.
          </p>
          <p>
            Teaching changed how I work more than I expected. Explaining
            BigQuery and Google Cloud to 50+ graduate students, and marking
            100+ assignments, is a fast way to discover which parts of your own
            understanding are load-bearing and which are just familiar.
          </p>
          <p>
            I am finishing an M.S. in Data Science at Indiana University
            Bloomington in {profile.seeking.from}, and I am looking for a team
            where the analysis is expected to end in a decision rather than a
            deck.
          </p>
        </section>

        <aside className={styles.side}>
          <section aria-labelledby="edu-title">
            <h2 className={styles.h2} id="edu-title">
              Education
            </h2>
            <ul className={styles.list}>
              {education.map((e, i) => (
                <Reveal as="li" index={i} key={e.id}>
                  <div className={styles.item}>
                    <p className={styles.itemTitle}>{e.title}</p>
                    <p className={styles.itemOrg}>{e.org}</p>
                    <p className={`mono tnum ${styles.itemSpan}`}>
                      {formatSpan(e.start, e.end)}
                    </p>
                    {e.credential && (
                      <p className={`tnum ${styles.itemCred}`}>{e.credential}</p>
                    )}
                    <p className={styles.itemNote}>{e.detail[0]}</p>
                  </div>
                </Reveal>
              ))}
            </ul>
          </section>

          <section aria-labelledby="teach-title">
            <h2 className={styles.h2} id="teach-title">
              Teaching
            </h2>
            <ul className={styles.list}>
              {teaching.map((t, i) => (
                <Reveal as="li" index={i} key={t.id}>
                  <div className={styles.item}>
                    <p className={styles.itemTitle}>{t.title}</p>
                    <p className={styles.itemOrg}>{t.org}</p>
                    <p className={`mono tnum ${styles.itemSpan}`}>
                      {formatSpan(t.start, t.end)}
                    </p>
                    <p className={styles.itemNote}>{t.summary}</p>
                  </div>
                </Reveal>
              ))}
            </ul>
          </section>

          <section aria-labelledby="contact-title">
            <h2 className={styles.h2} id="contact-title">
              Contact
            </h2>
            <ul className={styles.contact}>
              <li>
                <a href={`mailto:${profile.email}`}>{profile.email}</a>
              </li>
              <li>
                <a href={profile.linkedin} rel="noreferrer noopener" target="_blank">
                  linkedin.com/in/vanshika-kapur
                </a>
              </li>
              <li>
                <a href={profile.github} rel="noreferrer noopener" target="_blank">
                  github.com/{profile.githubUser}
                </a>
              </li>
            </ul>
          </section>
        </aside>
      </div>
    </div>
  )
}
