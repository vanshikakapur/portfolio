import { useEffect, useRef, useState } from 'react'

/** How far an element has travelled through the viewport, 0..1. Exported so a
 *  caller can ask the same question once, outside the rAF loop, without a
 *  second copy of the geometry. */
export function scrollProgressOf(el: Element): number {
  const rect = el.getBoundingClientRect()
  const span = rect.height + innerHeight
  return Math.min(1, Math.max(0, (innerHeight - rect.top) / span))
}

/** Scroll-driven, not scroll-triggered: returns a continuous 0..1 for how far
 *  the element has travelled through the viewport, so scrubbing back reverses
 *  whatever reads it. IntersectionObserver only gates the rAF loop — the value
 *  itself comes from geometry, never from a one-shot "has entered" flag. */
export function useScrollProgress<T extends HTMLElement>(): {
  ref: React.RefObject<T | null>
  progress: number
} {
  const ref = useRef<T | null>(null)
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    let frame = 0
    let active = false
    let last = -1

    const measure = () => {
      const next = scrollProgressOf(el)
      // Skip the state write when the change is below display resolution.
      if (Math.abs(next - last) > 0.0005) {
        last = next
        setProgress(next)
      }
      if (active) frame = requestAnimationFrame(measure)
    }

    const io = new IntersectionObserver(
      ([entry]) => {
        if (!entry) return
        if (entry.isIntersecting && !active) {
          active = true
          frame = requestAnimationFrame(measure)
        } else if (!entry.isIntersecting && active) {
          active = false
          cancelAnimationFrame(frame)
          measure() // settle at the boundary value
        }
      },
      { threshold: 0 },
    )

    io.observe(el)
    measure()

    return () => {
      io.disconnect()
      active = false
      cancelAnimationFrame(frame)
    }
  }, [])

  return { ref, progress }
}
