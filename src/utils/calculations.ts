import type { Item, BoxType } from '../types'

export const mmToM = (v: number) => v / 1000

export const itemVolume = (item: Item) => item.Width * item.Length * item.Depth

export const cartonVolume = (box: BoxType) => box.Width * box.Length * box.Depth

export const totalItemsWeight = (items: Item[]) => items.reduce((s, i) => s + i.Weight, 0)

export const findBoxByRef = (boxes: BoxType[], ref: string) => boxes.find(b => b.Reference === ref)
