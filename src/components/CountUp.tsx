import { useEffect, useState } from 'react'
import type { Metric } from '../content/types'
import { metricFigure, metricFigureAt } from '../lib/format'
import { useReducedMotion } from '../lib/useReducedMotion'
import { scrollProgressOf, useScrollProgress } from '../lib/useScrollProgress'

interface Props {
  metric: Metric
  className?: string | undefined
}

/** The window within the element's viewport travel over which the figure counts.
 *  Measured at 375px and 768px: a figure has to be settled by the time it is
 *  roughly three quarters down the screen, or a stack of them sits still on a
 *  short viewport reading zero, which looks like a claim of zero. */
const FROM = 0.05
const TO = 0.28

/** Scroll-driven, so scrubbing back counts the figure down again rather than
 *  latching at the total. Rendered with tabular numerals by the caller, which
 *  is what stops the digits changing width as they climb. */
export function CountUp({ metric, className }: Props) {
  const { ref, progress } = useScrollProgress<HTMLSpanElement>()
  const reduced = useReducedMotion()

  /** Off until the element is known to still be approaching. The prerendered
   *  HTML therefore carries the real figure, and a figure already on screen at
   *  load never snaps back to zero to climb again. */
  const [counting, setCounting] = useState(false)
  useEffect(() => {
    const el = ref.current
    if (el) setCounting(scrollProgressOf(el) < FROM)
  }, [ref])

  const p = Math.min(1, Math.max(0, (progress - FROM) / (TO - FROM)))

  return (
    <span className={className} ref={ref}>
      {counting && !reduced ? metricFigureAt(metric, p) : metricFigure(metric)}
    </span>
  )
}
