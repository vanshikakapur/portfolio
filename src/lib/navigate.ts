import { useCallback } from 'react'
import { useNavigate, type To } from 'react-router-dom'
import { useReducedMotion } from './useReducedMotion'

interface StartViewTransition {
  startViewTransition?: (cb: () => void) => { finished: Promise<void> }
}

/** Navigation that carries a shared element across the route change. The
 *  project's path-graph is tagged with the same view-transition-name on both
 *  the index and the detail view, so the browser tweens it rather than
 *  crossfading the page. Falls back to a plain navigate where the API is
 *  missing (Safari < 18, Firefox) — no shim, just no transition. */
export function useTravel(): (to: To) => void {
  const navigate = useNavigate()
  const reduced = useReducedMotion()

  return useCallback(
    (to: To) => {
      const doc = document as Document & StartViewTransition
      if (reduced || typeof doc.startViewTransition !== 'function') {
        navigate(to)
        return
      }
      doc.startViewTransition(() => {
        navigate(to)
      })
    },
    [navigate, reduced],
  )
}

/** Applied to the element that should travel. Both routes must agree on the
 *  name, which is why it is derived from the slug rather than written twice. */
export function travelName(slug: string): { viewTransitionName: string } {
  return { viewTransitionName: `variant-${slug.replace(/[^a-z0-9]/gi, '-')}` }
}
