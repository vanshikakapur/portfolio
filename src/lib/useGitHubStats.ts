import { useEffect, useState } from 'react'
import { variants } from '../content/variants'

export interface RepoStat {
  readonly stars: number
  readonly pushedAt: string
  readonly language: string | null
  /** True when this came from the fallback rather than the network. */
  readonly stale: boolean
}

/** Last verified against the public API on 2026-09-17. Rendered when the call
 *  fails, is rate-limited, or is blocked — the figure is never blank and never
 *  a spinner that stays forever. */
const FALLBACK: Record<string, Omit<RepoStat, 'stale'>> = {
  'Churn-Analysis-And-Prediction-Workflow': {
    stars: 0,
    pushedAt: '2026-02-09T22:49:12Z',
    language: 'Jupyter Notebook',
  },
  'Driver-s-drowsiness-detection-system': {
    stars: 1,
    pushedAt: '2025-04-11T02:32:49Z',
    language: 'Jupyter Notebook',
  },
}

function repoName(url: string): string {
  return url.split('/').pop() ?? ''
}

const withFallback = (): Record<string, RepoStat> =>
  Object.fromEntries(
    Object.entries(FALLBACK).map(([k, v]) => [k, { ...v, stale: true }]),
  )

/** Unauthenticated GitHub API, client-side. There is no server and no secret to
 *  hold one, which is the whole constraint of a Pages deploy. */
export function useGitHubStats(): Record<string, RepoStat> {
  const [stats, setStats] = useState<Record<string, RepoStat>>(withFallback)

  useEffect(() => {
    const controller = new AbortController()
    const names = variants
      .map((v) => v.repo)
      .filter((r): r is string => r !== null)
      .map(repoName)

    Promise.all(
      names.map(async (name) => {
        const res = await fetch(`https://api.github.com/repos/vanshikakapur/${name}`, {
          signal: controller.signal,
          headers: { Accept: 'application/vnd.github+json' },
        })
        if (!res.ok) throw new Error(`${name}: ${res.status}`)
        const json = (await res.json()) as {
          stargazers_count: number
          pushed_at: string
          language: string | null
        }
        return [
          name,
          {
            stars: json.stargazers_count,
            pushedAt: json.pushed_at,
            language: json.language,
            stale: false,
          },
        ] as const
      }),
    )
      .then((entries) => setStats(Object.fromEntries(entries)))
      .catch(() => {
        // Keep the committed fallback. Nothing to recover here, and an empty
        // state would be worse than a figure that is a few weeks old.
      })

    return () => controller.abort()
  }, [])

  return stats
}
