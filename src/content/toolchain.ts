import type { ToolUse } from './types'

/** Tools, each tied to the thing it actually produced. A proficiency bar would
 *  carry less information than one line of "here is what I shipped with it". */
export const toolchain: readonly ToolUse[] = [
  {
    tool: 'Power BI',
    artifact: 'Demand-vs-capacity and SIOP dashboards across 10+ product lines and 5 regions',
    activityId: 'vertiv',
  },
  {
    tool: 'Excel VBA',
    artifact: 'Monthly capacity allocation across 240+ products, 90% less planning time',
    activityId: 'vertiv',
  },
  {
    tool: 'DAX',
    artifact: 'The measure layer behind the Vertiv capacity dashboards',
    activityId: 'vertiv',
  },
  {
    tool: 'Process Query Language',
    artifact: 'Root-cause analysis on KPI gaps with Conformance Checker and Variant Explorer',
    activityId: 'celonis',
  },
  {
    tool: 'Celonis Studio',
    artifact: 'ETL over 10,000+ operational records across 10+ process variants',
    activityId: 'celonis',
  },
  {
    tool: 'Tableau',
    artifact: '5+ workflow bottlenecks surfaced to management as decisions, not charts',
    activityId: 'celonis',
  },
  {
    tool: 'SQL Server',
    artifact: 'Churn pipeline: 30+ attributes transformed, KPI views shared by model and report',
    activityId: 'churn',
  },
  {
    tool: 'Scikit-learn',
    artifact: 'Random Forest on 20+ features to 85% accuracy, validated past accuracy alone',
    activityId: 'churn',
  },
  {
    tool: 'OpenCV',
    artifact: 'Per-frame Eye Aspect Ratio detection inside a 40–60 ms budget',
    activityId: 'drowsiness',
  },
  {
    tool: 'Keras',
    artifact: 'InceptionV3 transfer learning on 80,000+ images to 93% accuracy',
    activityId: 'drowsiness',
  },
  {
    tool: 'BigQuery',
    artifact: 'Taught cloud SQL and Google Cloud environments to 50+ graduate students',
    activityId: 'iu-instructor',
  },
  {
    tool: 'Python',
    artifact: 'The connective tissue: preprocessing, modelling, and dashboard code throughout',
    activityId: 'iu-instructor',
  },
]

/** Named in the record but without a shipped artifact attached to them. Listed
 *  separately rather than padded out with a claim. */
export const alsoUsed: readonly string[] = [
  'PostgreSQL',
  'MySQL',
  'SQLite',
  'MongoDB',
  'Snowflake',
  'Alteryx',
  'Pandas',
  'NumPy',
  'Matplotlib',
  'Seaborn',
  'TensorFlow',
  'SharePoint',
]
