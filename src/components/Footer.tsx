import { profile } from '../content/profile'
import styles from './Footer.module.css'

export function Footer() {
  return (
    <footer className={styles.foot}>
      <div className={`page ${styles.inner}`}>
        <div className={styles.pitch}>
          <p className="mono">Open to work</p>
          <p className={styles.pitchBody}>
            {profile.seeking.roles.join(', ')} — from {profile.seeking.from}.
            If the role involves finding out what a process really does, I want
            to hear about it.
          </p>
        </div>

        <ul className={styles.links}>
          <li>
            <a href={`mailto:${profile.email}`}>{profile.email}</a>
          </li>
          <li>
            <a href={profile.linkedin} rel="noreferrer noopener" target="_blank">
              LinkedIn
            </a>
          </li>
          <li>
            <a href={profile.github} rel="noreferrer noopener" target="_blank">
              GitHub
            </a>
          </li>
        </ul>

        <p className={styles.colophon}>
          Set in Instrument Serif and IBM Plex. Built with Vite and React;
          the process model is 2D canvas. Press{' '}
          <kbd className={styles.kbd}>?</kbd> for shortcuts.
        </p>
      </div>
    </footer>
  )
}
