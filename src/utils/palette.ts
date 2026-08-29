// Fixed-order categorical palette (validated for CVD-safe adjacent contrast).
// Assigned by index, never hand-picked per item, so any number of items gets
// a deterministic, distinguishable color without maintaining a lookup table.
// Beyond 8 concurrent items, hues repeat — each mesh/legend row is still
// disambiguated by its ItemCode label, so identity never relies on color alone.
const CATEGORICAL_PALETTE = [
  '#2a78d6', // blue
  '#eb6834', // orange
  '#1baf7a', // aqua
  '#eda100', // yellow
  '#e87ba4', // magenta
  '#008300', // green
  '#4a3aa7', // violet
  '#e34948'  // red
]

export const colorForIndex = (index: number) => CATEGORICAL_PALETTE[index % CATEGORICAL_PALETTE.length]

export const buildItemColorMap = (itemCodes: string[]): Record<string, string> => {
  const map: Record<string, string> = {}
  itemCodes.forEach((code, i) => { map[code] = colorForIndex(i) })
  return map
}
