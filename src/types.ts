export type BoxType = {
  Reference: string
  Width: number
  Length: number
  Depth: number
  MaxWeight?: number
  BoxWeight?: number
  Active?: boolean
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

export type Placement = {
  ItemCode: string
  position: { x: number; y: number; z: number }
  displayed: { width: number; length: number; depth: number }
}

export type PlacedItem = Item & Placement & { center: { x:number;y:number;z:number } }
