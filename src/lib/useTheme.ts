import { useCallback, useEffect, useState } from 'react'

export type Theme = 'light' | 'dark'
const KEY = 'vk-theme'

function chosen(): Theme {
  const stored = localStorage.getItem(KEY)
  if (stored === 'light' || stored === 'dark') return stored
  return matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

export function useTheme(): { theme: Theme; toggle: () => void } {
  /** Starts at the value the pages are prerendered with so hydration matches,
   *  then syncs on mount. The inline script in index.html has already applied
   *  the real theme to <html> before first paint, so nothing flashes. */
  const [theme, setTheme] = useState<Theme>('light')

  useEffect(() => {
    setTheme(chosen())
  }, [])

  /** Only an explicit toggle is stored: persisting the OS value on first visit
   *  would silently stop the site from following the OS afterwards. */
  const apply = useCallback((next: Theme, persist: boolean) => {
    document.documentElement.dataset['theme'] = next
    if (persist) localStorage.setItem(KEY, next)
    setTheme(next)
  }, [])

  useEffect(() => {
    const mq = matchMedia('(prefers-color-scheme: dark)')
    const onChange = () => {
      if (!localStorage.getItem(KEY)) apply(mq.matches ? 'dark' : 'light', false)
    }
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [apply])

  const toggle = useCallback(() => {
    // Read the live attribute rather than state: it is what the eye is seeing.
    apply(document.documentElement.dataset['theme'] === 'dark' ? 'light' : 'dark', true)
  }, [apply])

  return { theme, toggle }
}
