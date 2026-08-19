import type { Placement } from '../types'

export const MOCK_PLACEMENTS: Placement[] = [
  {
    ItemCode: 'ITM-002',
    position: { x: 0, y: 0, z: 0 },
    displayed: { width: 300, length: 150, depth: 75 }
  },
  {
    ItemCode: 'ITM-001',
    position: { x: 0, y: 150, z: 0 },
    displayed: { width: 200, length: 100, depth: 50 }
  },
  {
    ItemCode: 'ITM-003',
    position: { x: 300, y: 0, z: 0 },
    displayed: { width: 80, length: 80, depth: 120 }
  }
]
