import { mkdir, readdir, readFile, rm, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { createElement, StrictMode } from 'react'
import { renderToString } from 'react-dom/server'
import { StaticRouter } from 'react-router'
import { createServer } from 'vite'
import config from '../vite.config.ts'

const base = config.base
const dist = 'dist'
const indexPath = join(dist, 'index.html')
let template = await readFile(indexPath, 'utf8')

const assets = await readdir(join(dist, 'assets'))

/** One stylesheet for the whole site (cssCodeSplit is off), and it blocks the
 *  first paint on a second round trip. At ~6 KB gzipped it is cheaper inline. */
const cssFile = assets.find((f) => f.endsWith('.css'))
if (!cssFile) throw new Error('postbuild: no stylesheet in dist/assets')
const css = await readFile(join(dist, 'assets', cssFile), 'utf8')
const styleLink = new RegExp(`\\s*<link rel="stylesheet"[^>]*${cssFile}"[^>]*>`)
if (!styleLink.test(template)) throw new Error(`postbuild: no <link> found for ${cssFile}`)
template = template.replace(styleLink, `\n    <style>${css}</style>`)
await rm(join(dist, 'assets', cssFile))

/** Only the two faces used above the fold are preloaded. The hashed filenames
 *  are not known until the build has run, which is why this happens here rather
 *  than in index.html. */
const preloadFaces = ['plex-sans-var', 'instrument-serif-400']
const preloads = preloadFaces.map((face) => {
  const file = assets.find((f) => f.startsWith(`${face}-`) && f.endsWith('.woff2'))
  if (!file) throw new Error(`postbuild: no built font matching ${face}`)
  return `<link rel="preload" as="font" type="font/woff2" crossorigin href="${base}assets/${file}" />`
})
template = template.replace('</head>', `  ${preloads.join('\n    ')}\n  </head>`)

/** Prerender. Pages can only serve files, so every route is rendered to its own
 *  document at build time: the visitor sees content before React loads, and each
 *  URL answers 200 with its own title and description instead of leaning on the
 *  404 fallback. */
const vite = await createServer({
  server: { middlewareMode: true },
  appType: 'custom',
  optimizeDeps: { noDiscovery: true, include: [] },
})
const { App } = await vite.ssrLoadModule('/src/App.tsx')
const { metaFor } = await vite.ssrLoadModule('/src/lib/meta.ts')
const { variants } = await vite.ssrLoadModule('/src/content/variants.ts')
await vite.close()

// The one written-out absolute URL in index.html; every other page derives its
// canonical and og:url from it.
const home = /rel="canonical" href="([^"]+)"/.exec(template)?.[1]
if (!home) throw new Error('postbuild: no canonical URL in index.html')

const expected = metaFor('/')
if (!template.includes(expected.description)) {
  throw new Error(
    'postbuild: the meta description in index.html no longer matches ' +
      'profile.metaDescription. Update index.html to:\n  ' +
      expected.description,
  )
}

/** 404.html stands in for every path that is not in the model, so it has no
 *  canonical URL of its own — it gets noindex instead. */
const routes = [
  { path: '/', file: 'index.html' },
  { path: '/about', file: 'about/index.html' },
  ...variants.map((v) => ({
    path: `/variants/${v.slug}`,
    file: `variants/${v.slug}/index.html`,
  })),
  { path: '/conformance-error', file: '404.html', indexable: false },
]

for (const route of routes) {
  const body = renderToString(
    createElement(
      StrictMode,
      null,
      createElement(StaticRouter, { basename: base, location: base.replace(/\/$/, '') + route.path }, createElement(App)),
    ),
  )
  const { title, description } = metaFor(route.path)
  // Trailing slash: Pages serves dir/index.html and 301s the slashless path to
  // it, so a canonical without the slash points at a redirect.
  const url = route.path === '/' ? home : `${home}${route.path.replace(/^\//, '')}/`

  let html = template
    .replace('<div id="root"></div>', `<div id="root">${body}</div>`)
    .replace(/<title>[^<]*<\/title>/, `<title>${escapeHtml(title)}</title>`)
    .replace(/(name="description"\s*\n?\s*content=")[^"]*/, `$1${escapeHtml(description)}`)
    .replace(/(rel="canonical" href=")[^"]*/, `$1${url}`)
    .replace(/(property="og:url" content=")[^"]*/, `$1${url}`)

  if (route.indexable === false) {
    html = html
      .replace(/\s*<link rel="canonical"[^>]*>/, '')
      .replace(/\s*<meta property="og:url"[^>]*>/, '')
      .replace('</head>', '  <meta name="robots" content="noindex" />\n  </head>')
  }

  const target = join(dist, route.file)
  await mkdir(join(target, '..'), { recursive: true })
  await writeFile(target, html)
}

function escapeHtml(s) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

/** Crawlers need absolute URLs, so canonical/og can't be derived from Vite's
 *  `base` at runtime — they are written out in index.html. That is a second
 *  place the deploy path lives, so assert the two agree rather than letting a
 *  rename ship broken preview cards. */
const absolute = [...template.matchAll(/(?:href|content)="(https?:\/\/[^"]+)"/g)].map((m) => m[1])
const sameOrigin = absolute.filter((u) => u.startsWith(new URL(home).origin))
const wrong = sameOrigin.filter((u) => !new URL(u).pathname.startsWith(base))

if (wrong.length > 0) {
  throw new Error(
    `postbuild: index.html absolute URLs disagree with Vite base "${base}".\n` +
      wrong.map((u) => `  ${u}`).join('\n') +
      `\nUpdate the canonical/og/apple-touch-icon URLs in index.html to match.`,
  )
}

console.log(
  `postbuild: inlined ${cssFile}, preloaded ${preloadFaces.length} fonts, ` +
    `prerendered ${routes.length} documents; ${sameOrigin.length} absolute URLs agree with "${base}"`,
)
