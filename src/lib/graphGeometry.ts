import type { GraphNode } from '../content/graph'

export const BASE_R = 5
export const MAX_R = 26

/** null volume means the record has no honest figure, so the node stays at base
 *  radius and the renderer draws it hollow instead of inventing a size. */
export function nodeRadius(n: GraphNode): number {
  return n.volume === null ? BASE_R : BASE_R + n.volume * (MAX_R - BASE_R)
}

/** Cubic bezier control points bow each edge so parallel branches read as
 *  distinct paths rather than overlapping straight lines. */
export function control(a: GraphNode, b: GraphNode): [number, number, number, number] {
  const mx = (a.x + b.x) / 2
  return [mx, a.y, mx, b.y]
}

export function bezier(a: GraphNode, b: GraphNode, t: number): { x: number; y: number } {
  const [c1x, c1y, c2x, c2y] = control(a, b)
  const u = 1 - t
  const x = u * u * u * a.x + 3 * u * u * t * c1x + 3 * u * t * t * c2x + t * t * t * b.x
  const y = u * u * u * a.y + 3 * u * u * t * c1y + 3 * u * t * t * c2y + t * t * t * b.y
  return { x, y }
}
