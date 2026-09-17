import type { Activity } from './types'

/** The event log, in observation order. Everything here comes from the source
 *  record; nothing is inferred. */
export const activities: readonly Activity[] = [
  {
    id: 'medicaps',
    kind: 'education',
    title: 'B.Tech, Computer Science',
    org: 'Medi-Caps University',
    place: 'Indore, India',
    start: '2020-08',
    end: '2024-03',
    summary:
      'Four years of the fundamentals the analytics work later leaned on: data structures, operating systems, and object-oriented Python.',
    detail: [
      'Coursework in Python, object-oriented programming, operating systems, and data structures and algorithms.',
    ],
    metrics: [{ value: 8.8, unit: '/ 10 GPA', note: 'Final cumulative' }],
    tools: ['Python', 'OOP', 'Data Structures'],
    credential: 'GPA 8.8 / 10',
  },
  {
    id: 'celonis',
    kind: 'role',
    title: 'Data Analyst Intern',
    org: 'Celonis',
    place: 'Indore, India',
    start: '2023-06',
    end: '2023-08',
    caseVolume: { count: 10000, unit: 'operational records' },
    summary:
      'Process mining on live operational data — the summer that set the pattern for everything after it.',
    detail: [
      'Designed and optimised ETL pipelines in Celonis Studio and SQL to extract, cleanse, and transform 10,000+ operational records across 10+ process variants.',
      'Ran root-cause analysis on KPI gaps using Process Query Language with the Conformance Checker and Variant Explorer, isolating where the real process diverged from the modelled one.',
      'Built Tableau dashboards that surfaced the bottlenecks to management as something they could act on, not just read.',
    ],
    metrics: [
      { value: 75, unit: '%', note: 'Improvement in pipeline processing efficiency' },
      { value: 20, unit: '%', note: 'Measured productivity improvement from the KPI work' },
      { value: 5, unit: 'bottlenecks', note: 'Workflow bottlenecks surfaced across systems' },
      { value: 10, unit: 'variants', note: 'Distinct process variants handled' },
    ],
    tools: ['Celonis Studio', 'PQL', 'SQL', 'Tableau', 'ETL'],
  },
  {
    id: 'iu-ms',
    kind: 'education',
    title: 'M.S., Data Science',
    org: 'Indiana University Bloomington',
    place: 'Bloomington, Indiana',
    start: '2024-08',
    end: '2026-05',
    summary:
      'The formal grounding: statistics and applied machine learning alongside the database and visualisation work.',
    detail: [
      'Coursework in data visualisation, advanced database concepts, statistics, applied machine learning, and management access using big data.',
    ],
    metrics: [{ value: 3.9, unit: '/ 4.0 GPA', note: 'Current cumulative' }],
    tools: ['Statistics', 'Applied ML', 'Databases', 'Data Visualization'],
    credential: 'GPA 3.9 / 4.0',
  },
  {
    id: 'vertiv',
    kind: 'role',
    title: 'Data Analyst Intern',
    org: 'Vertiv',
    place: 'Chesterfield, Missouri',
    start: '2025-05',
    end: '2025-08',
    caseVolume: { count: 240, unit: 'products' },
    summary:
      'Supply-chain planning at manufacturing scale, where a spreadsheet that quietly drifts costs real money.',
    detail: [
      'Automated monthly capacity allocation across 240+ products with Excel VBA, removing 5+ hours of manual work every cycle.',
      'Built Power BI dashboards tracking demand against capacity and SIOP trends across 10+ product lines and 5 regions.',
      'Analysed the 2024–2027 manufacturing footprint across 31 factories and 5 regions, surfacing space-growth and spend trends that led to a capacity expansion decision approved by leadership.',
    ],
    metrics: [
      { value: 90, unit: '%', note: 'Reduction in planning time per cycle' },
      {
        value: 560_000_000,
        unit: 'production volume',
        display: '$560M',
        note: 'Production volume the dashboards informed',
      },
      { value: 31, unit: 'factories', note: 'Across 5 regions in the footprint analysis' },
      { value: 5, unit: 'hours / cycle', note: 'Manual effort eliminated by the automation' },
    ],
    tools: ['Power BI', 'DAX', 'Excel VBA', 'SIOP', 'Capacity Planning'],
  },
  {
    id: 'iu-instructor',
    kind: 'teaching',
    title: 'Graduate Associate Instructor',
    org: 'Indiana University Bloomington',
    place: 'Bloomington, Indiana',
    start: '2025-08',
    end: '2025-12',
    caseVolume: { count: 50, unit: 'students' },
    summary:
      'Teaching the cloud data stack to graduate students — the fastest way to find out how well you actually know it.',
    detail: [
      'Delivered hands-on instruction to 50+ students on Python dashboards, SQL in BigQuery, and Google Cloud environments.',
      'Assessed 100+ assignments, working towards genuine proficiency in large-scale data analysis rather than completion.',
    ],
    metrics: [
      { value: 50, unit: 'students', note: 'Taught across the semester' },
      { value: 100, unit: 'assignments', note: 'Assessed and returned with feedback' },
    ],
    tools: ['Python', 'BigQuery', 'Google Cloud', 'SQL'],
  },
]

export const activityById = new Map(activities.map((a) => [a.id, a]))
