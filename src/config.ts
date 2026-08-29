// Data source URLs, swappable per-environment without touching component code.
// Point these at FitPortal/FitSolver endpoints once integration lands; unset
// vars keep using the local mock JSON under public/data.
export const DATA_SOURCES = {
  boxes: import.meta.env.VITE_BOXES_URL || '/data/boxes.json',
  items: import.meta.env.VITE_ITEMS_URL || '/data/items.json',
  // No placement schema exists yet (see docs/packer_schemas.yaml) — leave unset
  // until FitSolver publishes one; the app falls back to mock/auto-arranged
  // placement in the meantime.
  placements: import.meta.env.VITE_PLACEMENTS_URL || null
}
