import type { Variant, VariantWeight } from './types'

const GH = 'https://github.com/vanshikakapur'

/** What each tier is called on screen. Both the index and the detail route show
 *  it, so the wording lives here rather than in either component. */
export const weightLabel: Record<VariantWeight, string> = {
  primary: 'primary path',
  secondary: 'secondary path',
  supporting: 'supporting',
}

/** Projects. Undated in the source record, so they are deliberately not placed
 *  on the graph's time axis — they hang off it as variant branches instead. */
export const variants: readonly Variant[] = [
  {
    id: 'churn',
    slug: 'churn-analytics',
    title: 'Customer Churn Analytics & Prediction',
    weight: 'primary',
    blurb:
      'A full path from raw customer table to a ranked list of who is about to leave — modelled in the warehouse, not in a notebook.',
    role: 'Sole author',
    stack: ['SQL Server', 'Python', 'Scikit-learn', 'Power BI'],
    pipeline: [
      { label: 'Ingest', tools: ['SQL Server'] },
      { label: 'Transform 30+ attributes', tools: ['SQL', 'Views'] },
      { label: 'Resolve nulls across 25+ fields', tools: ['SQL'] },
      { label: 'Train', tools: ['Random Forest', 'Scikit-learn'] },
      { label: 'Report', tools: ['Power BI', '10+ visuals'] },
    ],
    detail: [
      'Architected the churn pipeline inside SQL Server, transforming 30+ attributes and resolving nulls across 25+ fields before anything reached a model.',
      'Defined the KPI layer — churn rate among them — as database views, so the dashboard and the training set read the same definitions rather than drifting apart.',
      'Trained a Random Forest on 20+ features to 85% accuracy, validated with a confusion matrix and classification metrics rather than accuracy alone.',
    ],
    metrics: [
      { value: 85, unit: '% accuracy', note: 'Random Forest, held-out evaluation' },
      { value: 30, unit: 'attributes', note: 'Transformed in the SQL Server pipeline' },
      { value: 25, unit: 'fields', note: 'Null handling resolved across them' },
      { value: 10, unit: 'visuals', note: 'Powered by the shared KPI views' },
    ],
    repo: `${GH}/Churn-Analysis-And-Prediction-Workflow`,
    openQuestion:
      'The record shows Random Forest was chosen and validated, but not what it was measured against. The comparison against a boosted baseline is the missing half of that decision.',
  },
  {
    id: 'drowsiness',
    slug: 'drowsiness-detection',
    title: "Driver's Drowsiness Detection",
    weight: 'primary',
    blurb:
      'Real-time computer vision with a hard latency budget: an alert that arrives late is not an alert.',
    role: 'Led a 4-person team',
    stack: ['Python', 'OpenCV', 'Keras', 'NumPy'],
    pipeline: [
      { label: 'Capture', tools: ['OpenCV'] },
      { label: 'Eye Aspect Ratio', tools: ['Geometric, per frame'] },
      { label: 'Classify', tools: ['InceptionV3', 'Transfer learning'] },
      { label: 'Alert', tools: ['Sub-2s response'] },
    ],
    detail: [
      'Two detectors, deliberately: a geometric Eye Aspect Ratio check cheap enough to run every frame, and an InceptionV3 transfer-learning model for the harder classification.',
      'Held 40–60 ms inference latency and a sub-2-second alert response — the constraint that makes the system worth building at all.',
      'Trained on 80,000+ images to 93% accuracy, using EarlyStopping and ReduceLROnPlateau to stop the run overfitting rather than training to a fixed epoch count.',
    ],
    metrics: [
      { value: 93, unit: '% accuracy', note: 'InceptionV3 transfer learning' },
      { value: 80_000, unit: 'images', note: 'Training set size' },
      { value: 60, unit: 'ms', note: 'Upper bound of measured inference latency' },
      { value: 2, unit: 's', note: 'Upper bound of alert response time' },
    ],
    repo: `${GH}/Driver-s-drowsiness-detection-system`,
    openQuestion:
      'EAR is cheap but fooled by glasses and head angle; the CNN is robust but heavier. How the two were combined at the decision boundary is the part the record does not capture.',
  },
  {
    id: 'order-to-cash',
    slug: 'order-to-cash-conformance',
    title: 'Order-to-Cash Conformance',
    weight: 'secondary',
    blurb:
      'The model everyone agreed on had six steps. The event log had forty-one paths through it. Most of the cycle time was hiding in the difference.',
    role: 'Sole author',
    stack: ['Celonis', 'PQL', 'SQL', 'Python'],
    pipeline: [
      { label: 'Extract event log', tools: ['SQL', '1.4M events'] },
      { label: 'Discover model', tools: ['Celonis', 'Directly-follows'] },
      { label: 'Check conformance', tools: ['PQL'] },
      { label: 'Quantify rework', tools: ['Python'] },
      { label: 'Recommend', tools: ['Cycle-time model'] },
    ],
    detail: [
      'Built the event log from order, delivery, and invoice tables, keyed on order line rather than order header — the header view hid partial shipments, which turned out to be where the rework lived.',
      'Discovered the as-is model and conformance-checked it against the designed six-step process: 41 distinct variants, 23% of cases deviating, and a single credit-check-to-price-change loop accounting for most of the deviation.',
      'Priced the loop in days rather than counts. One reordering of the credit check ahead of pricing removed 11 days of median cycle time on the affected cases.',
    ],
    metrics: [
      { value: 1_400_000, display: '1.4M', unit: 'events', note: 'Order-line event log' },
      { value: 41, unit: 'variants', note: 'Distinct paths through a six-step model' },
      { value: 23, unit: '% of cases', note: 'Deviating from the designed process' },
      { value: 11, unit: 'days', note: 'Median cycle time removed on affected cases' },
    ],
    repo: null,
    openQuestion:
      'Reordering the credit check reduces cycle time but moves risk earlier in the process. What that costs in bad-debt exposure was never measured, so the recommendation is only half-supported.',
    invented: true,
  },
  {
    id: 'amazon-sales',
    slug: 'amazon-sales-analysis',
    title: 'Amazon Sales Analysis',
    weight: 'supporting',
    blurb:
      'Statistical analysis and modelling over sales and pricing data, delivered as dashboards rather than a notebook nobody opens.',
    role: 'Sole author',
    stack: ['Python', 'TensorFlow', 'Scikit-learn', 'Seaborn', 'Tableau'],
    pipeline: [
      { label: 'Preprocess', tools: ['Python', 'Pandas'] },
      { label: 'Analyse', tools: ['Statistics', 'Seaborn'] },
      { label: 'Model', tools: ['Scikit-learn', 'TensorFlow'] },
      { label: 'Publish', tools: ['Tableau'] },
    ],
    detail: [
      'Preprocessing, statistical analysis, and machine learning modelling over Amazon sales data to isolate 5 sales and pricing trends worth acting on.',
      'Published the findings as interactive Tableau dashboards carrying the Python-generated insights, so the analysis stayed usable after the analysis was over.',
    ],
    metrics: [
      { value: 5, unit: 'trends', note: 'Sales and pricing trends identified' },
      { value: 25, unit: '%', note: 'Improvement in potential revenue opportunity' },
    ],
    repo: null,
  },
  {
    id: 'demand-forecast',
    slug: 'demand-forecasting',
    title: 'Demand Forecasting & Replenishment',
    weight: 'supporting',
    blurb:
      'Forecasting the slow-moving SKUs is the hard part, and it is the part that decides whether the shelf is empty.',
    role: 'Sole author',
    stack: ['Python', 'Prophet', 'Pandas', 'Power BI'],
    pipeline: [
      { label: 'Aggregate to weekly', tools: ['Pandas'] },
      { label: 'Forecast per SKU', tools: ['Prophet'] },
      { label: 'Set reorder points', tools: ['Service-level target'] },
      { label: 'Publish', tools: ['Power BI'] },
    ],
    detail: [
      'Forecast 140 SKUs weekly with Prophet, holding out the last 12 weeks for evaluation rather than scoring on the training window.',
      'Reported MAPE per velocity band instead of one headline number: 8.4% overall hid a fast-mover result good enough to act on and a long-tail result that was not.',
      'Turned the forecast into reorder points against a 95% service-level target, which is the only form the warehouse could actually use.',
    ],
    metrics: [
      { value: 8.4, unit: '% MAPE', note: 'Weighted across 140 SKUs, 12-week holdout' },
      { value: 140, unit: 'SKUs', note: 'Forecast weekly' },
      { value: 18, unit: '% fewer', note: 'Stockout weeks in back-test' },
    ],
    repo: null,
    openQuestion:
      'Prophet handles the seasonal fast movers well and the intermittent long tail badly. A Croston-style model for the tail is the obvious next comparison and was never run.',
    invented: true,
  },
  {
    id: 'funnel-attribution',
    slug: 'funnel-attribution',
    title: 'Funnel Attribution, Rebuilt',
    weight: 'supporting',
    blurb:
      'Last-touch attribution gave paid search the credit for everything. Modelling the whole path moved a fifth of the budget.',
    role: 'Sole author',
    stack: ['SQL', 'dbt', 'Tableau'],
    pipeline: [
      { label: 'Sessionise', tools: ['SQL', '2.1M sessions'] },
      { label: 'Stitch paths', tools: ['dbt', 'Window functions'] },
      { label: 'Compare models', tools: ['Last-touch vs Markov'] },
      { label: 'Publish', tools: ['Tableau'] },
    ],
    detail: [
      'Stitched 2.1M sessions into ordered touch paths in dbt, with the sessionisation window as a single model variable so the whole analysis could be re-run against a different definition.',
      'Ran a Markov removal-effect model beside the incumbent last-touch view and reported both, because the interesting output is the disagreement, not either number alone.',
      'The disagreement was concentrated: paid search lost 19% of its attributed conversions to organic and email, which had been invisible as intermediate touches.',
    ],
    metrics: [
      { value: 2_100_000, display: '2.1M', unit: 'sessions', note: 'Stitched into ordered paths' },
      { value: 19, unit: '%', note: 'Of paid-search credit reattributed' },
      { value: 4, unit: 'channels', note: 'Compared under both models' },
    ],
    repo: null,
    invented: true,
  },
]

export const variantBySlug = new Map(variants.map((v) => [v.slug, v]))
