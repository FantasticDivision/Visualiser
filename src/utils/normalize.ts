import type { BoxType, Item, Placement } from '../types'

const isFiniteNumber = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v)
const asRecord = (v: unknown): Record<string, unknown> | null =>
  v && typeof v === 'object' ? (v as Record<string, unknown>) : null

// Defensive parsing at the data boundary: a malformed entry is skipped (and
// logged) rather than crashing the whole app, since this JSON may come from
// another team's service once integrated.

export function normalizeBoxes(raw: unknown): BoxType[] {
  if (!Array.isArray(raw)) return []
  const out: BoxType[] = []
  for (const entry of raw) {
    const b = asRecord(entry)
    if (!b || typeof b.Reference !== 'string' || !isFiniteNumber(b.Width) || !isFiniteNumber(b.Length) || !isFiniteNumber(b.Depth)) {
      console.warn('normalizeBoxes: skipping malformed box entry', entry)
      continue
    }
    out.push({
      Reference: b.Reference,
      Width: b.Width,
      Length: b.Length,
      Depth: b.Depth,
      MaxWeight: isFiniteNumber(b.MaxWeight) ? b.MaxWeight : undefined,
      BoxWeight: isFiniteNumber(b.BoxWeight) ? b.BoxWeight : undefined,
      Active: typeof b.Active === 'boolean' ? b.Active : true,
      MaximumBoxes: isFiniteNumber(b.MaximumBoxes) ? b.MaximumBoxes : undefined
    })
  }
  return out
}

export function normalizeItems(raw: unknown): Item[] {
  if (!Array.isArray(raw)) return []
  const out: Item[] = []
  for (const entry of raw) {
    const it = asRecord(entry)
    if (!it || typeof it.ItemCode !== 'string' || !isFiniteNumber(it.Width) || !isFiniteNumber(it.Length) || !isFiniteNumber(it.Depth) || !isFiniteNumber(it.Weight)) {
      console.warn('normalizeItems: skipping malformed item entry', entry)
      continue
    }
    out.push({
      ItemCode: it.ItemCode,
      ItemReference: typeof it.ItemReference === 'string' ? it.ItemReference : it.ItemCode,
      Width: it.Width,
      Length: it.Length,
      Depth: it.Depth,
      Weight: it.Weight,
      BoxGroup: typeof it.BoxGroup === 'string' ? it.BoxGroup : undefined
    })
  }
  return out
}

export function normalizePlacements(raw: unknown): Placement[] {
  if (!Array.isArray(raw)) return []
  const out: Placement[] = []
  for (const entry of raw) {
    const p = asRecord(entry)
    const pos = p && asRecord(p.position)
    const disp = p && asRecord(p.displayed)
    if (
      !p || typeof p.ItemCode !== 'string' ||
      !pos || !isFiniteNumber(pos.x) || !isFiniteNumber(pos.y) || !isFiniteNumber(pos.z) ||
      !disp || !isFiniteNumber(disp.width) || !isFiniteNumber(disp.length) || !isFiniteNumber(disp.depth)
    ) {
      console.warn('normalizePlacements: skipping malformed placement entry', entry)
      continue
    }
    out.push({
      ItemCode: p.ItemCode,
      position: { x: pos.x, y: pos.y, z: pos.z },
      displayed: { width: disp.width, length: disp.length, depth: disp.depth }
    })
  }
  return out
}
