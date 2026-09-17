import { useEffect, useRef, type ReactNode } from 'react'
import styles from './Reveal.module.css'

interface Props {
  children: ReactNode
  /** Index within a group, for staggering. */
  index?: number
  as?: 'div' | 'li' | 'section'
  /** Merged onto the reveal element so a <dl> row does not need an inner
   *  wrapper — a dl may hold only one level of div. */
  className?: string | undefined
}

/** Scroll-driven reveal: the element's own progress through the viewport
 *  writes a custom property, so scrubbing upward genuinely puts it back. This
 *  is not a one-shot "has entered" class.
 *
 *  Applied sparingly — section leads and list groups only. Everything fading up
 *  is the same as nothing fading up. */
export function Reveal({ children, index = 0, as = 'div', className }: Props) {
  const ref = useRef<HTMLElement | null>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    let frame = 0
    let running = false

    const tick = () => {
      const rect = el.getBoundingClientRect()
      // 0 at one viewport-eighth below the fold, 1 once comfortably inside.
      const raw = (innerHeight * 0.92 - rect.top) / (innerHeight * 0.3)
      el.style.setProperty('--p', String(Math.min(1, Math.max(0, raw))))
      if (running) frame = requestAnimationFrame(tick)
    }

    const io = new IntersectionObserver(
      ([entry]) => {
        if (!entry) return
        if (entry.isIntersecting) {
          running = true
          frame = requestAnimationFrame(tick)
        } else {
          running = false
          cancelAnimationFrame(frame)
          tick()
        }
      },
      { rootMargin: '20% 0px 20% 0px' },
    )

    io.observe(el)
    tick()

    return () => {
      io.disconnect()
      running = false
      cancelAnimationFrame(frame)
    }
  }, [])

  const Tag = as
  return (
    <Tag
      // 45ms rhythm, capped so a long list never stalls at the end.
      style={{ transitionDelay: `${Math.min(index, 6) * 45}ms` }}
      className={[styles.reveal, className].filter(Boolean).join(' ')}
      ref={ref as React.Ref<never>}
    >
      {children}
    </Tag>
  )
}
