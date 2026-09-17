# vanshika-portfolio

Personal site for Vanshika Kapur — data analyst, process mining, business
intelligence. Vite + React + TypeScript, prerendered to static HTML, served by
GitHub Pages.

## Visual concept: the site is a process model

Vanshika's work is process mining — you take an event log out of a system, use it
to discover what the process *actually* does, and compare that against the model
everyone believed. So the site is built as one of those models rather than
decorated with a metaphor picked for looking technical:

| Site | Process mining |
| --- | --- |
| Home (`/`) | **Discover** — the discovered model |
| Hero graph | The directly-follows graph, nodes sized by case volume |
| Career history | The **event log**: activities with a start, an end, and metrics |
| Projects | **Variants** — distinct paths through the same set of tools |
| About | **Analyst** — the person reading the log |
| 404 | **Conformance error** — "that path isn't in the model" |

This is why the projects section does not use identical cards. Real variants have
different case frequencies, so the layout gives each project the room its weight
earned: two `primary` paths at half width, one `secondary` at full width laid out
across rather than down, three `supporting` at a third. Add a project with a
different weight and the grid re-tiers itself.

The hero graph is the signature piece. A time cursor sweeps the observation
window; activities that have not started yet are drawn dashed and dimmed, and
resolve as the cursor reaches them. It reads pointer position and scroll
position every frame, every node is a real focusable button, and the moment is
deep-linkable as `?t=0.42`.

## Type and colour

**Type.** Instrument Serif for display, IBM Plex Sans for text, IBM Plex Mono for
labels and figures. The serif is there because the site is mostly prose and
numbers making an argument, not a product page; Plex Mono is the working typeface
of the tools she actually uses (SQL, PQL, notebooks), so mono labels read as
field annotations rather than as decoration. Every figure carries
`font-variant-numeric: tabular-nums lining-nums`, which is what stops digits
jittering as they count up.

**Colour.** Two neutrals and one accent, declared once in `src/styles/tokens.css`
and referenced everywhere else:

- `--bone-*` — the light ground (an analysis report you could print)
- `--graphite-*` — text and rules on light, the ground on dark
- one amber accent, with a **different value per mode**: `#8f3d0e` on light
  (6.6:1 on bone-100), `#e8843c` on dark (7.1:1 on graphite-900). A single accent
  value cannot clear 4.5:1 in both directions, so there are two.

Components never name a palette value; they read the semantic layer
(`--ink`, `--ink-muted`, `--ink-faint`, `--surface`, `--surface-raised`,
`--rule`, `--accent`), which is what each mode remaps.

Dark and light are both authored, not one inverted: the dark mode adds a glow
pass to the graph tokens (`--glow: 1`) that the light mode does not have, because
a bright dot on a dark ground needs bloom to read and a dark dot on paper does
not.

## Animation

Four named easing curves in `tokens.css`, each with a job, reused rather than
respecified:

| Curve | Used for |
| --- | --- |
| `--ease-token` | tokens settling into a node |
| `--ease-trace` | symmetric — anything that scrubs and must reverse cleanly |
| `--ease-snap` | press release, slight overshoot |
| `--ease-drain` | exits and decay |

**Scroll-driven, not scroll-triggered.** `useScrollProgress` returns a continuous
0..1 for how far an element has travelled through the viewport, from geometry —
never a one-shot "has entered" flag. Scrub back up and everything reading it
reverses. `Reveal` publishes its progress as a CSS custom property `--p`;
descendants derive their own `--draw` from it with a per-index lag:

```css
--draw: clamp(0, (var(--p, 1) - var(--i, 0) * 0.08) / 0.25, 1);
```

That is the whole stagger mechanism — about 50ms between siblings at an ordinary
scroll speed, with no JS per child and no timers to get out of sync.

**Page transitions carry a shared element.** A project's path graph has a
`view-transition-name` derived from its slug, so clicking a card makes that path
travel from the index into the detail route instead of the two pages
cross-fading.

**Press feedback starts where you pressed.** `Pressable` spawns a ripple at the
pointer coordinates and animates transform + opacity only via WAAPI, releasing on
`--ease-snap`. Keyboard activation ripples from the centre, since there is no
pointer to originate from.

**Reduced motion.** `prefers-reduced-motion: reduce` gives a complete still
version, not a disabled one. The graph keeps drawing and still responds to hover,
focus and the time cursor — it just redraws on change instead of running an
animation loop. Paths arrive already drawn. Figures show their real value rather
than counting. `Replay` still has a destination, it just arrives there.

## Adding a project

One file: `src/content/variants.ts`. Append an entry typed as `Variant`
(`src/content/types.ts`):

```ts
{
  id: 'my-project',
  slug: 'my-project',            // the URL: /variants/my-project
  title: 'My Project',
  weight: 'supporting',          // 'primary' | 'secondary' | 'supporting'
  blurb: '...',                  // one or two sentences, the trade-off not the summary
  role: 'Sole author',
  stack: ['Python', 'SQL'],
  repo: 'https://github.com/user/repo',   // or null for no public repo
  pipeline: [{ label: 'Ingest', tools: ['SQL'] }, ...],
  detail: ['What you built and the decision behind it.', ...],
  metrics: [{ value: 41, unit: 'variants', note: '...' }],
  openQuestion: '...',           // optional: what the work does not settle
}
```

Then rebuild. The grid tier, the detail route, the prerendered
`variants/<slug>/index.html`, the `⌘K` palette entry (via `src/lib/query.ts`)
and the tier label all come off that one entry — there is nothing to register in a second place. `repo`
set to a public GitHub URL is fetched client-side for stars and last-pushed date,
with a hardcoded fallback so it never renders empty; `repo: null` renders "no
public repo".

**`invented: true`** flags an entry as not from the source record. Three of the
six carry it. `grep -rn "invented" src/content/variants.ts` finds every one.

## Deploying

Push to `main`. `.github/workflows/deploy.yml` runs `npm ci && npm run build` and
publishes `dist` via `actions/deploy-pages`. `npm run build` starts with `tsc -b`,
so a type error fails the deploy rather than shipping.

**The one setting to flip:** repo **Settings → Pages → Source → GitHub Actions**
(not "Deploy from a branch"). Without it the workflow succeeds and nothing
appears.

`base` in `vite.config.ts` is `'/portfolio/'` and is the single source of truth
for the subpath — the router, the postbuild absolute-URL assertion and the OG
tags all read it. **If the repo is not named `portfolio`, change that one value.**

`scripts/postbuild.mjs` inlines the CSS, preloads the two hashed fonts,
prerenders every route to a real `dir/index.html` (so deep links are 200s, not
fallbacks), writes a `404.html` marked `noindex` with no canonical, and asserts
every absolute URL agrees with `base`.

To check a build the way Pages will actually serve it:

```sh
npm run build && npm run serve:pages   # → http://localhost:4173/portfolio/
```

That server reproduces Pages' two behaviours that matter: `dir/index.html` for
extensionless paths, and gzip on text responses. Without the gzip a local
Lighthouse run reports roughly three times the real transfer size.

`npm run og` regenerates `public/og.png` from the graph data and needs a local
Chrome. The output is committed, so the deploy does not depend on it.

## Measured

Lighthouse CLI, mobile defaults (4× CPU throttle, slow 4G), against
`serve:pages`:

| Route | Perf | A11y | Best practices | SEO |
| --- | --- | --- | --- | --- |
| `/portfolio/` | 99 | 100 | 100 | 100 |
| `/portfolio/about` | 99 | 100 | 100 | 100 |
| `/portfolio/variants/order-to-cash-conformance` | 99 | 100 | 100 | 100 |

FCP 1.4–1.7s, LCP 2.0s, TBT 0ms, CLS 0, 176–197 KiB total.

Zero console errors or warnings on every route in both motion modes. Verified at
375 / 768 / 1440 / 2560px. Every interactive element has hover, focus-visible,
active and disabled states, checked by forcing each pseudo-state over CDP — the
one exception is the skip link, whose hover is a deliberate no-op because it is
only ever visible while focused.

## Browser support

Chrome/Edge 111+, Safari 16.4+, Firefox 128+ — the floor is CSS nesting and
`:has()`, both used unprefixed. Two features degrade rather than break:

- **View Transitions** (Chrome/Edge, Safari 18+). Without it, routes change
  instantly with no shared-element travel. Nothing else changes.
- **`@property`-free custom property animation** — the scroll-driven `--p` is
  read every frame by JS, so it does not depend on registered-property
  interpolation.

Touch: the pointer-force field on the graph is suppressed for
`pointerType === 'touch'` (there is no hover to follow), nodes stay tappable, and
the layout collapses to one column at 760px.
