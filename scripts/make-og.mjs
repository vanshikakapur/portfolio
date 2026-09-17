import { execFile } from 'node:child_process'
import { mkdtemp, writeFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { promisify } from 'node:util'
import { createServer } from 'vite'

/** The preview card is the site's own process graph, not a separate picture, so
 *  it is generated from the same content modules the app renders. Vite does the
 *  loading because the content files use TS and extensionless imports that bare
 *  Node cannot resolve. */
// noDiscovery: nothing is served to a browser here, and the background dep scan
// outlives the close() below, which prints a spurious failure.
const vite = await createServer({
  server: { middlewareMode: true },
  appType: 'custom',
  optimizeDeps: { noDiscovery: true, include: [] },
})
const { graphNodes, graphEdges, nodeById } = await vite.ssrLoadModule('/src/content/graph.ts')
const { profile } = await vite.ssrLoadModule('/src/content/profile.ts')
const { control, nodeRadius } = await vite.ssrLoadModule('/src/lib/graphGeometry.ts')
await vite.close()

const W = 1200
const H = 630
// The graph occupies the lower band; the name sits in the upper left.
const PLOT = { x: 72, y: 250, w: W - 144, h: 300 }

const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'

// Light theme values, copied from tokens.css by name so the card matches the
// default first paint of the site.
const bone100 = '#f3f0e9'
const bone300 = '#d3ccbd'
const ink = '#14171a'
const graphite400 = '#5d666e'
const amberText = '#8f3d0e'
const amberMark = '#c85a18'
const edge = '#9d9584'
const deviation = '#5b7a8c'

const at = (n) => ({ x: PLOT.x + n.x * PLOT.w, y: PLOT.y + n.y * PLOT.h })

const edgePaths = graphEdges
  .map((e) => {
    const a = nodeById.get(e.from)
    const b = nodeById.get(e.to)
    if (!a || !b) return ''
    const pa = at(a)
    const pb = at(b)
    const [c1x, c1y, c2x, c2y] = control(a, b)
    const c1 = at({ x: c1x, y: c1y })
    const c2 = at({ x: c2x, y: c2y })
    return `<path d="M${pa.x} ${pa.y} C${c1.x} ${c1.y} ${c2.x} ${c2.y} ${pb.x} ${pb.y}"
      fill="none" stroke="${e.dashed ? deviation : edge}" stroke-width="${1 + e.weight * 5}"
      ${e.dashed ? 'stroke-dasharray="4 5"' : ''} />`
  })
  .join('')

const LABEL_SIZE = 15
const MONO_ADVANCE = LABEL_SIZE * 0.6 // IBM Plex Mono is a 0.6em-advance face
const MAX_CHARS = 22

/** Two nodes can share an org — the MS and the instructor post are both Indiana
 *  University — so fall back to the role, which is what tells them apart. */
const labelUses = new Map()
for (const n of graphNodes) labelUses.set(n.label, (labelUses.get(n.label) ?? 0) + 1)
const cardLabel = (n) => (labelUses.get(n.label) > 1 ? n.sublabel : n.label)

function wrapLabel(text) {
  const lines = ['']
  for (const word of text.split(' ')) {
    const i = lines.length - 1
    if (lines[i] === '') lines[i] = word
    else if (lines[i].length + 1 + word.length <= MAX_CHARS) lines[i] += ` ${word}`
    else lines.push(word)
  }
  return lines
}

const nodeMarks = graphNodes
  .map((n) => {
    const p = at(n)
    const r = nodeRadius(n)
    const fill = n.volume === null ? 'none' : n.kind === 'variant' ? amberMark : amberText
    const circle = `<circle cx="${p.x}" cy="${p.y}" r="${r}" fill="${fill}"
      ${n.volume === null ? `stroke="${amberText}" stroke-width="1.6"` : ''} />`

    const lines = wrapLabel(cardLabel(n))
    const widest = Math.max(...lines.map((l) => l.length)) * MONO_ADVANCE
    // Keep the centred label inside the margins even when the node sits at the
    // right-hand edge of the plot.
    const cx = Math.min(Math.max(p.x, 72 + widest / 2), W - 72 - widest / 2)
    // Below the node for the lower lane, above it otherwise, so the three
    // concurrent branches never collide.
    const below = n.y > 0.6
    const top = below ? p.y + r + 20 : p.y - r - 12 - (lines.length - 1) * 19
    const spans = lines
      .map((l, i) => `<tspan x="${cx}" y="${top + i * 19}">${esc(l)}</tspan>`)
      .join('')
    // paint-order draws a bone-coloured stroke under the glyphs, which knocks the
    // edges out from behind the text where a label crosses a curve.
    return `${circle}<text text-anchor="middle" font-family="IBM Plex Mono"
      font-size="${LABEL_SIZE}" fill="${ink}" stroke="${bone100}" stroke-width="5"
      paint-order="stroke">${spans}</text>`
  })
  .join('')

function esc(s) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

const fontDir = resolve('src/assets/fonts')
const face = (family, file, style = 'normal') =>
  `@font-face{font-family:'${family}';src:url('file://${fontDir}/${file}');font-style:${style}}`

const html = `<!doctype html><meta charset="utf-8"><style>
${face('Instrument Serif', 'instrument-serif-400.woff2')}
${face('IBM Plex Mono', 'plex-mono-400.woff2')}
${face('IBM Plex Sans', 'plex-sans-var.woff2')}
html,body{margin:0;width:${W}px;height:${H}px;background:${bone100}}
svg{display:block}
</style>
<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">
  <rect width="${W}" height="${H}" fill="${bone100}" />
  <rect x="72" y="72" width="${W - 144}" height="1" fill="${bone300}" />
  <text x="72" y="112" font-family="IBM Plex Mono" font-size="17" letter-spacing="1.4"
    fill="${graphite400}">DISCOVERED PROCESS MODEL</text>
  <text x="72" y="196" font-family="Instrument Serif" font-size="86" fill="${ink}">${esc(
    profile.name,
  )}</text>
  <text x="72" y="${H - 56}" font-family="IBM Plex Sans" font-size="24" fill="${ink}">${esc(
    profile.discipline,
  )}</text>
  ${edgePaths}
  ${nodeMarks}
</svg>`

const dir = await mkdtemp(join(tmpdir(), 'og-'))
const page = join(dir, 'og.html')
await writeFile(page, html)

// virtual-time-budget waits for the font files to load before the capture;
// without it the card screenshots in a fallback face.
await promisify(execFile)(CHROME, [
  '--headless',
  '--disable-gpu',
  '--hide-scrollbars',
  '--force-device-scale-factor=1',
  `--window-size=${W},${H}`,
  '--virtual-time-budget=3000',
  `--screenshot=${resolve('public/og.png')}`,
  `file://${page}`,
])
await rm(dir, { recursive: true, force: true })

console.log(`make-og: public/og.png written at ${W}x${H} from ${graphNodes.length} nodes`)
