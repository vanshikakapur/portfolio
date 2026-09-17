import { activities } from './log'
import { variants } from './variants'
import { observationWindow } from './profile'
import type { Activity, Variant } from './types'

/** Months since epoch, for laying activities out on a real time axis. */
export function monthIndex(ym: string): number {
  const [y, m] = ym.split('-')
  return Number(y) * 12 + (Number(m) - 1)
}

const T0 = monthIndex(observationWindow.from)
const T1 = monthIndex(observationWindow.to)

/** 0..1 position of a YYYY-MM inside the observation window. */
export function timeFraction(ym: string): number {
  return (monthIndex(ym) - T0) / (T1 - T0)
}

export function durationMonths(a: Activity): number {
  return monthIndex(a.end) - monthIndex(a.start)
}

export type NodeKind = 'activity' | 'variant' | 'hub'

export interface GraphNode {
  readonly id: string
  readonly label: string
  readonly sublabel: string
  readonly kind: NodeKind
  /** 0..1 in layout space; y is hand-authored per lane. A force simulation
   *  would jitter and would encode nothing real. */
  readonly x: number
  readonly y: number
  /** Log-scaled radius weight, 0..1. null = no honest volume in the record, so
   *  the node draws hollow at base radius. */
  readonly volume: number | null
  readonly volumeLabel: string | null
  /** null for variants: the record does not date them. */
  readonly startsAt: number | null
  readonly href: string | null
}

export interface GraphEdge {
  readonly from: string
  readonly to: string
  /** 0..1 thickness weight from real duration; undated edges get `dashed`. */
  readonly weight: number
  readonly dashed: boolean
  readonly label: string
}

const VOLUME_FLOOR = 10
const VOLUME_CEIL = 100_000

/** log10 so 50 students and 80,000 images can share one axis legibly. */
function volumeWeight(count: number): number {
  const lo = Math.log10(VOLUME_FLOOR)
  const hi = Math.log10(VOLUME_CEIL)
  return Math.min(1, Math.max(0, (Math.log10(count) - lo) / (hi - lo)))
}

/** Lanes. Education runs along the spine; concurrent roles branch above and
 *  teaching below, which is what the overlapping dates actually describe. */
const LANE: Record<string, number> = {
  medicaps: 0.5,
  celonis: 0.16,
  'iu-ms': 0.5,
  vertiv: 0.16,
  'iu-instructor': 0.85,
}

const LONGEST = Math.max(...activities.map(durationMonths))

function activityNode(a: Activity): GraphNode {
  return {
    id: a.id,
    label: a.org,
    sublabel: a.title,
    kind: 'activity',
    x: timeFraction(a.start) * 0.62 + 0.06,
    y: LANE[a.id] ?? 0.5,
    volume: a.caseVolume ? volumeWeight(a.caseVolume.count) : null,
    volumeLabel: a.caseVolume
      ? `${a.caseVolume.count.toLocaleString('en-US')} ${a.caseVolume.unit}`
      : null,
    startsAt: timeFraction(a.start),
    href: `#log-${a.id}`,
  }
}

const VARIANT_LANE = [0.14, 0.5, 0.86]

function variantNode(v: Variant, i: number): GraphNode {
  const biggest = v.metrics.reduce((m, x) => (x.value > m.value ? x : m), v.metrics[0]!)
  return {
    id: `v-${v.id}`,
    label: v.title,
    sublabel: v.role,
    kind: 'variant',
    x: 0.9,
    y: VARIANT_LANE[i] ?? 0.5,
    volume: volumeWeight(Math.max(VOLUME_FLOOR, biggest.value)),
    volumeLabel: `${biggest.display ?? biggest.value.toLocaleString('en-US')} ${biggest.unit}`,
    startsAt: null,
    href: `variants/${v.slug}`,
  }
}

export const graphNodes: readonly GraphNode[] = [
  ...activities.map(activityNode),
  {
    id: 'hub',
    label: 'Projects',
    sublabel: 'undated in the log',
    kind: 'hub',
    x: 0.76,
    y: 0.5,
    volume: null,
    volumeLabel: null,
    startsAt: null,
    href: '#variants',
  },
  ...variants.map(variantNode),
]

/** Directly-follows relations. Solid edges are dated successions from the log;
 *  dashed edges attach the undated project branch. */
export const graphEdges: readonly GraphEdge[] = [
  { from: 'medicaps', to: 'celonis', weight: 0.4, dashed: false, label: 'internship during degree' },
  { from: 'celonis', to: 'iu-ms', weight: 0.5, dashed: false, label: '' },
  {
    from: 'medicaps',
    to: 'iu-ms',
    weight: durationMonths(activities[0]!) / LONGEST,
    dashed: false,
    label: '',
  },
  { from: 'iu-ms', to: 'vertiv', weight: 0.4, dashed: false, label: 'internship during degree' },
  { from: 'iu-ms', to: 'iu-instructor', weight: 0.45, dashed: false, label: '' },
  { from: 'vertiv', to: 'hub', weight: 0.35, dashed: false, label: '' },
  { from: 'iu-instructor', to: 'hub', weight: 0.35, dashed: false, label: '' },
  ...variants.map((v) => ({
    from: 'hub',
    to: `v-${v.id}`,
    weight: 0.3,
    dashed: true,
    label: 'undated',
  })),
]

export const nodeById = new Map(graphNodes.map((n) => [n.id, n]))

/** Legend copy lives with the encoding it explains, so the two cannot drift. */
export const graphLegend = [
  { mark: 'radius', means: 'case volume on a log scale — hover a node for the raw figure' },
  { mark: 'hollow', means: 'no case volume in the source record; drawn at base radius' },
  { mark: 'thickness', means: 'duration in months' },
  { mark: 'dashed', means: 'relation the record does not date' },
] as const
