import type { Item, Placement } from '../types'

type CartonDims = { Width: number; Length: number; Depth: number }

// Simple non-overlapping grid arrangement, used only when no real placement
// is available for an item (no bin-packing — that's FitSolver's job). Keeps
// an arbitrary number of unplaced items visually distinct instead of
// collapsing them all onto the same corner.
//
// FitSolver convention: Width->x, Length->y (vertical/stacking axis), Depth->z.
// The floor plane is therefore Width x Depth, with layers stacking up Length.
export function autoLayoutPlacement(item: Item, index: number, carton: CartonDims): Placement {
  const width = Math.max(1, Math.min(item.Width, carton.Width))
  const depth = Math.max(1, Math.min(item.Depth, carton.Depth))
  const length = Math.max(1, item.Length)

  const cols = Math.max(1, Math.floor(carton.Width / width))
  const rows = Math.max(1, Math.floor(carton.Depth / depth))
  const perLayer = cols * rows

  const layer = Math.floor(index / perLayer)
  const posInLayer = index % perLayer
  const col = posInLayer % cols
  const row = Math.floor(posInLayer / cols)

  return {
    ItemCode: item.ItemCode,
    position: { x: col * width, y: layer * length, z: row * depth },
    displayed: { width: item.Width, length: item.Length, depth: item.Depth }
  }
}
