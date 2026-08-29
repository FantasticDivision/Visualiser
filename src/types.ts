export type BoxType = {
  Reference: string
  Width: number
  Length: number
  Depth: number
  MaxWeight?: number
  BoxWeight?: number
  Active?: boolean
  MaximumBoxes?: number
}

export type Item = {
  ItemCode: string
  ItemReference: string
  Width: number
  Length: number
  Depth: number
  Weight: number
  BoxGroup?: string
}

// FitSolver coordinate contract: origin (0,0,0) is the carton's bottom-left-back
// corner; x runs along Width, y along Length, z along Depth. `position` is an
// item's minimum corner along each axis; the item extends by `displayed` from there.
export type Placement = {
  ItemCode: string
  position: { x: number; y: number; z: number }
  displayed: { width: number; length: number; depth: number }
}

export type PlacedItem = Item & Placement & { center: { x:number;y:number;z:number } }
