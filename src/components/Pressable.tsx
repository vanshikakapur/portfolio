import { useRef, type ReactNode } from 'react'
import { useReducedMotion } from '../lib/useReducedMotion'
import styles from './Pressable.module.css'

interface Props {
  children: ReactNode
  onPress: () => void
  label?: string | undefined
  /** CSS Modules class lookups are `string | undefined` under
   *  noUncheckedIndexedAccess, so the prop has to admit that. */
  className?: string | undefined
  disabled?: boolean
  /** Set only for toggles, so the button reports its state rather than relying
   *  on the label changing. */
  pressed?: boolean | undefined
}

/** Press feedback that starts at the pointer rather than the centre of the
 *  element, so the ripple reads as caused by the click. Uses WAAPI on a
 *  transform-only keyframe set — no width/height animation, no repaint. */
export function Pressable({ children, onPress, label, className, disabled = false, pressed }: Props) {
  const hostRef = useRef<HTMLButtonElement | null>(null)
  const reduced = useReducedMotion()

  const ripple = (clientX: number, clientY: number) => {
    const host = hostRef.current
    if (!host || reduced) return
    const rect = host.getBoundingClientRect()
    const dot = document.createElement('span')
    dot.className = styles.ripple ?? ''
    // Sized once, then only scaled — animating a transform, never a dimension.
    const size = Math.hypot(rect.width, rect.height) * 2
    dot.style.width = `${size}px`
    dot.style.height = `${size}px`
    dot.style.left = `${clientX - rect.left - size / 2}px`
    dot.style.top = `${clientY - rect.top - size / 2}px`
    host.appendChild(dot)

    dot
      .animate(
        [
          { transform: 'scale(0)', opacity: 0.28 },
          { transform: 'scale(1)', opacity: 0 },
        ],
        { duration: 520, easing: 'cubic-bezier(0.2, 0.7, 0.2, 1)', fill: 'forwards' },
      )
      .finished.then(() => dot.remove())
      .catch(() => dot.remove())
  }

  return (
    <button
      ref={hostRef}
      type="button"
      className={[styles.host, className].filter(Boolean).join(' ')}
      aria-label={label}
      aria-pressed={pressed}
      disabled={disabled}
      onPointerDown={(e) => ripple(e.clientX, e.clientY)}
      onClick={onPress}
      onKeyDown={(e) => {
        // Keyboard activation has no pointer origin; ripple from the centre.
        if (e.key === 'Enter' || e.key === ' ') {
          const rect = hostRef.current?.getBoundingClientRect()
          if (rect) ripple(rect.left + rect.width / 2, rect.top + rect.height / 2)
        }
      }}
    >
      {children}
    </button>
  )
}
