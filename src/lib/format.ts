import type { Metric } from '../content/types'

/** Metric.display wins when the raw number would mislead (560000000 → $560M). */
export function metricFigure(m: Metric): string {
  return m.display ?? m.value.toLocaleString('en-US')
}

/** The same figure part-way through a count-up, 0..1. Returns metricFigure
 *  exactly at p = 1, so the counting value and the resting value can never
 *  disagree. Decimal places are taken from the figure itself, which keeps the
 *  string width steady under tabular numerals. */
export function metricFigureAt(m: Metric, p: number): string {
  if (p >= 1) return metricFigure(m)
  const scale = (text: string): string => {
    const decimals = text.split('.')[1]?.length ?? 0
    return (Number(text.replace(/,/g, '')) * p).toLocaleString('en-US', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    })
  }
  // Only the numeric run is scaled, so "$560M" keeps its prefix and suffix.
  return m.display ? m.display.replace(/[\d.,]+/, scale) : scale(String(m.value))
}

const MONTHS = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
] as const

/** YYYY-MM → "Aug 2024". Parsed by hand because new Date('2024-08') is UTC and
 *  drifts a month backwards for anyone west of Greenwich. */
export function formatYearMonth(ym: string): string {
  const [y, m] = ym.split('-')
  return `${MONTHS[Number(m) - 1] ?? '?'} ${y}`
}

export function formatSpan(start: string, end: string): string {
  return `${formatYearMonth(start)} – ${formatYearMonth(end)}`
}

export function formatRelative(iso: string): string {
  const days = Math.round((Date.now() - Date.parse(iso)) / 86_400_000)
  if (days < 1) return 'today'
  if (days < 30) return `${days}d ago`
  const months = Math.round(days / 30)
  if (months < 18) return `${months}mo ago`
  return `${Math.round(months / 12)}y ago`
}
