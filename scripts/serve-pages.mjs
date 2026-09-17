import { createServer } from 'node:http'
import { readFile } from 'node:fs/promises'
import { extname, join, normalize, resolve } from 'node:path'
import { gzipSync } from 'node:zlib'
import config from '../vite.config.ts'

/** `vite preview` falls back to index.html for unknown paths, which hides
 *  whether 404.html works. GitHub Pages does not do that: it serves the file if
 *  it exists and 404.html otherwise. This reproduces that, so deep links can be
 *  checked locally before deploying. */
const BASE = config.base
const PORT = 4173
const dist = resolve('dist')

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.woff2': 'font/woff2',
  '.json': 'application/json',
}

/** Pages gzips text responses. Without this, a timing measurement taken here
 *  reads the HTML and JS at more than three times their real transfer size. */
const COMPRESSIBLE = new Set(['.html', '.js', '.css', '.svg', '.json'])

function respond(res, status, ext, body, req) {
  const headers = { 'content-type': TYPES[ext] ?? 'application/octet-stream' }
  if (COMPRESSIBLE.has(ext) && /\bgzip\b/.test(req.headers['accept-encoding'] ?? '')) {
    body = gzipSync(body)
    headers['content-encoding'] = 'gzip'
  }
  res.writeHead(status, headers)
  res.end(body)
}

createServer(async (req, res) => {
  const url = new URL(req.url ?? '/', 'http://localhost')
  if (!url.pathname.startsWith(BASE)) {
    res.writeHead(404, { 'content-type': 'text/plain' }).end(`outside base ${BASE}`)
    return
  }
  const rel = url.pathname.slice(BASE.length) || 'index.html'
  let file = join(dist, normalize(rel).replace(/^(\.\.[/\\])+/, ''))
  // Pages serves dir/index.html for an extensionless path, which is how the
  // prerendered routes are laid out.
  if (!extname(file)) file = join(file, 'index.html')
  try {
    respond(res, 200, extname(file), await readFile(file), req)
  } catch {
    respond(res, 404, '.html', await readFile(join(dist, '404.html')), req)
  }
}).listen(PORT, () => console.log(`serving dist at http://localhost:${PORT}${BASE}`))
