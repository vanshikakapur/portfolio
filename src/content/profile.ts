export const profile = {
  name: 'Vanshika Kapur',
  /** Used in <title> and the hero standfirst. Describes the through-line of the
   *  record rather than a job title she has not held. */
  discipline: 'Data analyst · process mining · business intelligence',
  standfirst:
    'I mine event logs for the step that is quietly costing the most, then build the dashboard that makes the fix obvious.',
  /** Search-result copy for the home page. index.html carries a static copy for
   *  crawlers; the build fails if the two drift. */
  metaDescription:
    'Vanshika Kapur mines event logs for the step that is quietly costing the most, then builds the dashboard that makes the fix obvious. MS Data Science, Indiana University. Previously Vertiv and Celonis.',
  location: 'Bloomington, Indiana',
  seeking: {
    open: true,
    roles: ['Data Analyst', 'Data Scientist', 'BI Engineer'],
    from: 'May 2026',
  },
  email: 'Vanshikakapur2002@gmail.com',
  linkedin: 'https://linkedin.com/in/vanshika-kapur',
  github: 'https://github.com/vanshikakapur',
  githubUser: 'vanshikakapur',
} as const

/** Bounds of the observed record. The graph's time cursor is scaled to these,
 *  so extending the log automatically extends the axis. */
export const observationWindow = {
  from: '2020-08',
  to: '2026-05',
} as const
