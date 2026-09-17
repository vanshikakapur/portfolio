import { useEffect, useRef, useState } from 'react'
import { graphEdges, graphNodes, nodeById, type GraphNode } from '../content/graph'
import { bezier, control, nodeRadius } from '../lib/graphGeometry'
import { useReducedMotion } from '../lib/useReducedMotion'
import styles from './ProcessGraph.module.css'

interface Props {
  /** 0..1 time cursor. Nodes starting after it are unobserved. */
  cursor: number
  /** While a replay is running the flow speeds up, the way a process explorer
   *  looks when cases are being pushed through it rather than browsed. */
  replaying?: boolean
  onPick: (node: GraphNode) => void
}

interface Token {
  edge: number
  t: number
  speed: number
  /** Live offset from the pointer force, in layout units. */
  ox: number
  oy: number
}

const TOKENS_PER_EDGE = 5
const POINTER_RADIUS = 0.13
const POINTER_FORCE = 0.02
const REPLAY_SPEEDUP = 2.8
/** How long a node's arrival ring takes to expand and fade out. */
const FIRE_MS = 760
const FIRE_REACH = 24

export function ProcessGraph({ cursor, replaying = false, onPick }: Props) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const wrapRef = useRef<HTMLDivElement | null>(null)
  const reduced = useReducedMotion()
  const [hovered, setHovered] = useState<string | null>(null)
  const [focused, setFocused] = useState<number>(-1)

  // Refs, not state: these change every frame and must not trigger React.
  const cursorRef = useRef(cursor)
  const pointerRef = useRef<{ x: number; y: number; active: boolean }>({
    x: 0,
    y: 0,
    active: false,
  })
  const hoveredRef = useRef<string | null>(null)
  const replayingRef = useRef(replaying)
  /** With motion reduced there is no animation loop, so anything that changes
   *  what the canvas shows has to ask for the one redraw itself. */
  const redraw = useRef<() => void>(() => {})

  cursorRef.current = cursor
  hoveredRef.current = hovered
  replayingRef.current = replaying

  useEffect(() => {
    const canvas = canvasRef.current
    const wrap = wrapRef.current
    if (!canvas || !wrap) return
    const ctx = canvas.getContext('2d', { alpha: true })
    if (!ctx) return

    let w = 0
    let h = 0
    let dpr = 1
    let frame = 0

    const tokens: Token[] = graphEdges.flatMap((_, edge) =>
      Array.from({ length: TOKENS_PER_EDGE }, (_, i) => ({
        edge,
        t: i / TOKENS_PER_EDGE,
        // Varied speeds so the flow never pulses in lockstep.
        speed: 0.0022 + ((edge * 7 + i * 3) % 5) * 0.0006,
        ox: 0,
        oy: 0,
      })),
    )

    const readTokens = () => {
      const s = getComputedStyle(wrap)
      return {
        edge: s.getPropertyValue('--graph-edge').trim(),
        ink: s.getPropertyValue('--ink').trim(),
        faint: s.getPropertyValue('--ink-faint').trim(),
        accent: s.getPropertyValue('--accent-mark').trim(),
        deviation: s.getPropertyValue('--mark-deviation').trim(),
        fill: s.getPropertyValue('--graph-node-fill').trim(),
        core: s.getPropertyValue('--token-core').trim(),
        glow: s.getPropertyValue('--glow').trim() === '1',
      }
    }
    let colors = readTokens()

    const resize = () => {
      const rect = wrap.getBoundingClientRect()
      dpr = Math.min(2, devicePixelRatio || 1)
      w = rect.width
      h = rect.height
      canvas.width = Math.round(w * dpr)
      canvas.height = Math.round(h * dpr)
      canvas.style.width = `${w}px`
      canvas.style.height = `${h}px`
      colors = readTokens()
    }

    const px = (n: GraphNode) => ({ x: n.x * w, y: n.y * h })
    const radius = nodeRadius

    /** An activity "fires" the moment the time cursor reaches it. Tracked as a
     *  transition rather than a threshold test, so scrubbing back and forward
     *  fires it again — the reveal is not one-shot. */
    const observedLast = new Map<string, boolean>()
    const firedAt = new Map<string, number>()

    const observed = (n: GraphNode) =>
      n.startsAt === null ? cursorRef.current > 0.995 : n.startsAt <= cursorRef.current

    const drawEdge = (e: (typeof graphEdges)[number], dim: boolean) => {
      const a = nodeById.get(e.from)
      const b = nodeById.get(e.to)
      if (!a || !b) return
      const pa = px(a)
      const pb = px(b)
      const [c1x, c1y, c2x, c2y] = control(a, b)
      ctx.beginPath()
      ctx.moveTo(pa.x, pa.y)
      ctx.bezierCurveTo(c1x * w, c1y * h, c2x * w, c2y * h, pb.x, pb.y)
      ctx.strokeStyle = e.dashed ? colors.deviation : colors.edge
      ctx.globalAlpha = dim ? 0.22 : 1
      ctx.lineWidth = 1 + e.weight * 5
      ctx.setLineDash(e.dashed ? [4, 5] : [])
      ctx.stroke()
      ctx.setLineDash([])
      ctx.globalAlpha = 1
    }

    const draw = () => {
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      ctx.clearRect(0, 0, w, h)
      ctx.lineJoin = 'round'
      ctx.lineCap = 'round'

      for (const e of graphEdges) {
        const to = nodeById.get(e.to)
        drawEdge(e, !to || !observed(to))
      }

      if (!reduced) {
        for (const tk of tokens) {
          const e = graphEdges[tk.edge]
          if (!e) continue
          const a = nodeById.get(e.from)
          const b = nodeById.get(e.to)
          if (!a || !b || !observed(b)) continue

          tk.t += tk.speed * (replayingRef.current ? REPLAY_SPEEDUP : 1)
          if (tk.t > 1) tk.t -= 1

          const p = bezier(a, b, tk.t)

          // Pointer force: real inverse-square-ish attraction with a spring
          // recovery, so tokens bend toward the cursor and settle back.
          const ptr = pointerRef.current
          if (ptr.active) {
            const dx = ptr.x - p.x
            const dy = ptr.y - p.y
            const d = Math.hypot(dx, dy)
            if (d < POINTER_RADIUS && d > 0.0001) {
              const pull = (1 - d / POINTER_RADIUS) ** 2 * POINTER_FORCE
              tk.ox += (dx / d) * pull
              tk.oy += (dy / d) * pull
            }
          }
          tk.ox *= 0.88
          tk.oy *= 0.88

          const x = (p.x + tk.ox) * w
          const y = (p.y + tk.oy) * h
          const r = e.dashed ? 1.6 : 2.4

          if (colors.glow) {
            ctx.beginPath()
            ctx.arc(x, y, r * 3.2, 0, Math.PI * 2)
            ctx.fillStyle = colors.accent
            ctx.globalAlpha = 0.16
            ctx.fill()
            ctx.globalAlpha = 1
          }
          ctx.beginPath()
          ctx.arc(x, y, r, 0, Math.PI * 2)
          ctx.fillStyle = colors.glow ? colors.core : colors.accent
          ctx.fill()
        }
      }

      const now = performance.now()

      for (const n of graphNodes) {
        const p = px(n)
        const r = radius(n)
        const isObserved = observed(n)
        const isHot = hoveredRef.current === n.id

        if (observedLast.get(n.id) !== isObserved) {
          observedLast.set(n.id, isObserved)
          // Without the loop the ring would freeze part-way through expanding.
          if (isObserved && !reduced) firedAt.set(n.id, now)
        }

        ctx.globalAlpha = isObserved ? 1 : 0.3
        ctx.beginPath()
        ctx.arc(p.x, p.y, r, 0, Math.PI * 2)

        if (n.volume === null) {
          ctx.fillStyle = colors.fill
          ctx.fill()
          ctx.strokeStyle = isHot ? colors.accent : colors.faint
          ctx.lineWidth = 1.5
          ctx.setLineDash(isObserved ? [] : [3, 3])
          ctx.stroke()
          ctx.setLineDash([])
        } else {
          ctx.fillStyle = isHot ? colors.accent : colors.fill
          ctx.fill()
          ctx.strokeStyle = isHot ? colors.accent : colors.ink
          ctx.lineWidth = isHot ? 2 : 1.25
          ctx.setLineDash(isObserved ? [] : [3, 3])
          ctx.stroke()
          ctx.setLineDash([])
        }

        if (isHot) {
          ctx.beginPath()
          ctx.arc(p.x, p.y, r + 6, 0, Math.PI * 2)
          ctx.strokeStyle = colors.accent
          ctx.globalAlpha = 0.4
          ctx.lineWidth = 1
          ctx.stroke()
        }

        const fired = firedAt.get(n.id)
        if (fired !== undefined) {
          const k = (now - fired) / FIRE_MS
          if (k >= 1) {
            firedAt.delete(n.id)
          } else {
            // Eased out so the ring leaves quickly and lingers at the edge.
            const eased = 1 - (1 - k) ** 3
            ctx.beginPath()
            ctx.arc(p.x, p.y, r + eased * FIRE_REACH, 0, Math.PI * 2)
            ctx.strokeStyle = colors.accent
            ctx.globalAlpha = (1 - k) * 0.5
            ctx.lineWidth = 2 * (1 - k)
            ctx.stroke()
          }
        }
        ctx.globalAlpha = 1
      }

      // Time cursor.
      if (cursorRef.current > 0.002 && cursorRef.current < 0.998) {
        const cx = (cursorRef.current * 0.62 + 0.06) * w
        ctx.beginPath()
        ctx.moveTo(cx, 0)
        ctx.lineTo(cx, h)
        ctx.strokeStyle = colors.accent
        ctx.globalAlpha = replayingRef.current ? 0.6 : 0.28
        ctx.lineWidth = replayingRef.current ? 1.5 : 1
        ctx.setLineDash([2, 6])
        ctx.stroke()
        ctx.setLineDash([])
        ctx.globalAlpha = 1
      }

      if (!reduced) frame = requestAnimationFrame(draw)
    }
    redraw.current = draw

    const ro = new ResizeObserver(() => {
      resize()
      if (reduced) draw()
    })
    ro.observe(wrap)

    const themeObserver = new MutationObserver(() => {
      colors = readTokens()
      if (reduced) draw()
    })
    themeObserver.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-theme'],
    })

    resize()
    draw()

    return () => {
      cancelAnimationFrame(frame)
      ro.disconnect()
      themeObserver.disconnect()
    }
  }, [reduced])

  // The still version is not a frozen version: the time cursor and the hover
  // highlight both still move, they just arrive without a transition.
  useEffect(() => {
    if (reduced) redraw.current()
  }, [reduced, cursor, hovered])

  /** Hit testing in layout space so it stays correct at any size. */
  const hitTest = (clientX: number, clientY: number): GraphNode | null => {
    const wrap = wrapRef.current
    if (!wrap) return null
    const rect = wrap.getBoundingClientRect()
    const x = (clientX - rect.left) / rect.width
    const y = (clientY - rect.top) / rect.height
    let best: GraphNode | null = null
    let bestD = Infinity
    for (const n of graphNodes) {
      const d = Math.hypot((n.x - x) * rect.width, (n.y - y) * rect.height)
      const r = nodeRadius(n) + 10
      if (d < r && d < bestD) {
        bestD = d
        best = n
      }
    }
    return best
  }

  const hoveredNode = hovered ? nodeById.get(hovered) : undefined

  return (
    <div className={styles.wrap} ref={wrapRef}>
      <canvas
        ref={canvasRef}
        className={styles.canvas}
        aria-hidden="true"
        onPointerMove={(e) => {
          const wrap = wrapRef.current
          if (!wrap) return
          const rect = wrap.getBoundingClientRect()
          pointerRef.current = {
            x: (e.clientX - rect.left) / rect.width,
            y: (e.clientY - rect.top) / rect.height,
            active: e.pointerType !== 'touch',
          }
          const hit = hitTest(e.clientX, e.clientY)
          setHovered(hit?.id ?? null)
        }}
        onPointerLeave={() => {
          pointerRef.current.active = false
          setHovered(null)
        }}
        onClick={(e) => {
          const hit = hitTest(e.clientX, e.clientY)
          if (hit) onPick(hit)
        }}
      />

      {/* The graph's real accessible surface: every node is a focusable
          button positioned over its mark. Canvas alone is unreachable. */}
      <ul className={styles.nodes}>
        {graphNodes.map((n, i) => (
          <li
            key={n.id}
            className={styles.nodeItem}
            style={{ left: `${n.x * 100}%`, top: `${n.y * 100}%` }}
          >
            <button
              type="button"
              className={styles.nodeButton}
              onFocus={() => {
                setHovered(n.id)
                setFocused(i)
              }}
              onBlur={() => {
                setHovered(null)
                setFocused(-1)
              }}
              onMouseEnter={() => setHovered(n.id)}
              onMouseLeave={() => setHovered(null)}
              onClick={() => onPick(n)}
              aria-describedby={focused === i ? 'graph-readout' : undefined}
            >
              <span className={styles.srOnly}>
                {n.label}, {n.sublabel}
                {n.volumeLabel ? `, ${n.volumeLabel}` : ', no case volume recorded'}
              </span>
            </button>
          </li>
        ))}
      </ul>

      <output className={styles.readout} id="graph-readout">
        {hoveredNode ? (
          <>
            <span className={styles.readoutLabel}>{hoveredNode.label}</span>
            <span className={styles.readoutSub}>{hoveredNode.sublabel}</span>
            <span className={styles.readoutFig}>
              {hoveredNode.volumeLabel ?? 'no case volume in record'}
            </span>
          </>
        ) : (
          <span className={styles.readoutIdle}>Hover or tab a node</span>
        )}
      </output>
    </div>
  )
}
