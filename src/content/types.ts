/** Every fact rendered on this site is declared once, here or in a sibling
 *  content file, and read from there. No component owns a string. */

/** A YYYY-MM instant. Day precision is not in the source record, so the type
 *  refuses to pretend otherwise. */
export type YearMonth = `${number}-${number}`

export type ActivityKind = 'education' | 'role' | 'teaching'

/** A measured figure. `value` stays numeric so it can be formatted with
 *  tabular numerals and animated; `unit` and `note` carry the meaning. */
export interface Metric {
  readonly value: number
  readonly unit: string
  /** Rendered as-is when the raw number would mislead, e.g. "$560M". */
  readonly display?: string
  readonly note: string
}

export interface Activity {
  readonly id: string
  readonly kind: ActivityKind
  readonly title: string
  readonly org: string
  readonly place: string
  readonly start: YearMonth
  readonly end: YearMonth
  /** Drives node radius in the process graph, on a log scale. Omit when the
   *  record has no honest volume for this activity — the graph then draws a
   *  hollow node at base radius rather than inventing a size. */
  readonly caseVolume?: { readonly count: number; readonly unit: string }
  readonly summary: string
  readonly detail: readonly string[]
  readonly metrics: readonly Metric[]
  readonly tools: readonly string[]
  readonly credential?: string
}

export interface PipelineStage {
  readonly label: string
  readonly tools: readonly string[]
}

export type VariantWeight = 'primary' | 'secondary' | 'supporting'

export interface Variant {
  readonly id: string
  readonly slug: string
  readonly title: string
  /** Governs layout prominence on the index. Not every project is equal and
   *  the grid should not pretend they are. */
  readonly weight: VariantWeight
  readonly blurb: string
  readonly role: string
  readonly stack: readonly string[]
  readonly pipeline: readonly PipelineStage[]
  readonly detail: readonly string[]
  readonly metrics: readonly Metric[]
  /** null when no public repo exists. The UI renders no link rather than a
   *  dead one. */
  readonly repo: string | null
  /** What the source record does and does not support, stated plainly. */
  readonly openQuestion?: string
  /** Not in the source record — written to fill out the section. Flagged so
   *  these are findable and removable in one grep rather than blending in. */
  readonly invented?: true
}

export interface ToolUse {
  readonly tool: string
  /** The specific artifact shipped with it. Never a proficiency percentage —
   *  a percentage on a skill is not a measurement of anything. */
  readonly artifact: string
  readonly activityId: string
}
