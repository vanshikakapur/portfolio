import { activities } from '../content/log'
import { variants } from '../content/variants'
import { toolchain } from '../content/toolchain'

export type ResultKind = 'activity' | 'variant' | 'tool'

export interface Result {
  readonly kind: ResultKind
  readonly id: string
  readonly title: string
  readonly context: string
  readonly to: string
  readonly haystack: string
  readonly tools: readonly string[]
  readonly org: string
  readonly years: readonly number[]
}

function yearsBetween(start: string, end: string): number[] {
  const a = Number(start.slice(0, 4))
  const b = Number(end.slice(0, 4))
  return Array.from({ length: b - a + 1 }, (_, i) => a + i)
}

/** One flat index over everything, built once at module load. */
const index: readonly Result[] = [
  ...activities.map((a) => ({
    kind: 'activity' as const,
    id: a.id,
    title: `${a.title} — ${a.org}`,
    context: `${a.place} · ${a.start.slice(0, 4)}`,
    to: `/#log-${a.id}`,
    haystack: [a.title, a.org, a.place, a.summary, ...a.detail, ...a.tools]
      .join(' ')
      .toLowerCase(),
    tools: a.tools.map((t) => t.toLowerCase()),
    org: a.org.toLowerCase(),
    years: yearsBetween(a.start, a.end),
  })),
  ...variants.map((v) => ({
    kind: 'variant' as const,
    id: v.id,
    title: v.title,
    context: v.stack.join(' · '),
    to: `/variants/${v.slug}`,
    haystack: [v.title, v.blurb, v.role, ...v.detail, ...v.stack].join(' ').toLowerCase(),
    tools: v.stack.map((t) => t.toLowerCase()),
    org: '',
    years: [],
  })),
  ...toolchain.map((t) => ({
    kind: 'tool' as const,
    id: t.tool,
    title: t.tool,
    context: t.artifact,
    to: `/#toolchain`,
    haystack: `${t.tool} ${t.artifact}`.toLowerCase(),
    tools: [t.tool.toLowerCase()],
    org: '',
    years: [],
  })),
]

interface Parsed {
  readonly text: string
  readonly tool: string | null
  readonly org: string | null
  readonly year: number | null
  readonly type: ResultKind | null
}

const TYPES: readonly ResultKind[] = ['activity', 'variant', 'tool']

/** Supports `tool:python org:celonis year:2023 type:variant` plus free text.
 *  Unknown keys fall through to free text rather than silently matching
 *  nothing — a query that looks like it worked but didn't is worse than one
 *  that obviously didn't. */
export function parseQuery(raw: string): Parsed {
  let tool: string | null = null
  let org: string | null = null
  let year: number | null = null
  let type: ResultKind | null = null
  const free: string[] = []

  for (const part of raw.trim().split(/\s+/)) {
    if (!part) continue
    const m = /^(tool|org|year|type):(.*)$/i.exec(part)
    if (!m) {
      free.push(part)
      continue
    }
    const key = m[1]!.toLowerCase()
    const value = (m[2] ?? '').toLowerCase()
    if (!value) continue
    if (key === 'tool') tool = value
    else if (key === 'org') org = value
    else if (key === 'year') year = Number.isNaN(Number(value)) ? null : Number(value)
    else if (key === 'type') {
      type = TYPES.find((t) => t.startsWith(value)) ?? null
    }
  }

  return { text: free.join(' ').toLowerCase(), tool, org, year, type }
}

export function runQuery(raw: string): readonly Result[] {
  const q = parseQuery(raw)
  if (!raw.trim()) return index.slice(0, 8)

  return index
    .filter((r) => {
      if (q.type && r.kind !== q.type) return false
      if (q.tool && !r.tools.some((t) => t.includes(q.tool!))) return false
      if (q.org && !r.org.includes(q.org)) return false
      if (q.year !== null && !r.years.includes(q.year)) return false
      if (q.text && !r.haystack.includes(q.text)) return false
      return true
    })
    .slice(0, 12)
}

export const queryHints = [
  { token: 'tool:', example: 'tool:python' },
  { token: 'org:', example: 'org:celonis' },
  { token: 'year:', example: 'year:2023' },
  { token: 'type:', example: 'type:variant' },
] as const
