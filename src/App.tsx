import React, { useEffect, useMemo, useState, useRef } from 'react'
import Scene from './components/Scene'
import { MOCK_PLACEMENTS } from './data/mockPlacements'
import type { Item, BoxType, PlacedItem } from './types'
import { totalItemsWeight, cartonVolume, itemVolume, findBoxByRef } from './utils/calculations'

const ITEM_COLORS: Record<string,string> = {
  'ITM-001': '#1f77b4',
  'ITM-002': '#ff7f0e',
  'ITM-003': '#2ca02c'
}

export default function App(){
  const [boxes, setBoxes] = useState<BoxType[] | null>(null)
  const [items, setItems] = useState<Item[] | null>(null)
  const [selected, setSelected] = useState<string | null>(null)
  const [resetSignal, setResetSignal] = useState(0)

  useEffect(()=>{
    fetch('/data/boxes.json').then(r=>r.json()).then(setBoxes)
    fetch('/data/items.json').then(r=>r.json()).then(setItems)
  },[])

  const med = useMemo(()=> boxes ? findBoxByRef(boxes, 'MED') ?? boxes[0] : null, [boxes])

  const placed: PlacedItem[] = useMemo(()=>{
    if(!items) return []
    return items.map(it => {
      const placement = MOCK_PLACEMENTS.find(p => p.ItemCode === it.ItemCode)
      const displayed = placement ? placement.displayed : { width: it.Width, length: it.Length, depth: it.Depth }
      const pos = placement ? placement.position : { x:0,y:0,z:0 }
      const center = {
        x: pos.x + displayed.width/2,
        y: pos.y + displayed.depth/2,
        z: pos.z + displayed.length/2
      }
      return { ...it, ...placement!, displayed, center }
    }) as PlacedItem[]
  }, [items])

  const totalWeight = items ? totalItemsWeight(items) : 0
  const cartonVolumeMm = med ? cartonVolume(med) : 1
  const itemsVolumeMm = items ? items.reduce((s,i)=> s + itemVolume(i), 0) : 0

  const weightUtil = med ? (totalWeight / (med.MaxWeight ?? totalWeight)) * 100 : 0
  const volumeUtil = (itemsVolumeMm / cartonVolumeMm) * 100

  const sceneRef = useRef<any>(null)

  if(!med || !items) return <div className="loading">Loading data…</div>

  return (
    <div className="app-root">
      <header className="app-header">COMP4050 — Fit Visualiser</header>
      <main className="app-main">
        <aside className="panel left">
          <h3>Carton Summary</h3>
          <div><strong>Reference:</strong> {med.Reference}</div>
          <div><strong>Dimensions:</strong> {med.Width} × {med.Length} × {med.Depth} mm</div>
          <div><strong>Items:</strong> {items.length}</div>
          <div><strong>Total item weight:</strong> {totalWeight.toFixed(2)} kg</div>
          <div><strong>Max carton weight:</strong> {med.MaxWeight ?? '—'} kg</div>
          <div><strong>Weight utilisation:</strong> {weightUtil.toFixed(1)}%</div>
          <div><strong>Volume utilisation:</strong> {volumeUtil.toFixed(1)}%</div>
          <hr />
          <h4>Legend</h4>
          <ul className="legend">
            {items.map(it => (
              <li key={it.ItemCode}><span className="swatch" style={{background: ITEM_COLORS[it.ItemCode]}} /> {it.ItemCode} — {it.ItemReference}</li>
            ))}
          </ul>
          <hr />
          <p className="notice">Item positions are mocked until integration with the FitSolver optimisation engine.</p>
        </aside>
        <section className="viewer">
          <div className="viewer-topbar">
            <button onClick={()=>{ setSelected(null); setResetSignal(s=>s+1) }}>Reset View</button>
            <button onClick={() => {
              const data = sceneRef.current?.capture()
              if (data) {
                const a = document.createElement('a')
                a.href = data
                a.download = 'fit-visualiser-snapshot.png'
                a.click()
              }
            }}>Capture Snapshot</button>
          </div>
          <Scene ref={sceneRef} carton={{Width:med.Width, Length:med.Length, Depth:med.Depth}} items={placed} colors={ITEM_COLORS} selected={selected} onSelect={id=>setSelected(id)} resetSignal={resetSignal} />
        </section>
        <aside className="panel right">
          <h3>Item Details</h3>
          {selected ? (
            (()=>{
              const it = placed.find(p=>p.ItemCode===selected)!
              return (
                <div>
                  <div><strong>Item code:</strong> {it.ItemCode}</div>
                  <div><strong>Item name:</strong> {it.ItemReference}</div>
                  <div><strong>Displayed dims:</strong> {it.displayed.width} × {it.displayed.length} × {it.displayed.depth} mm</div>
                  <div><strong>Weight:</strong> {it.Weight} kg</div>
                  <div><strong>Box group:</strong> {it.BoxGroup ?? '—'}</div>
                  <div><strong>Position (bottom corner):</strong> x={it.position.x}, y={it.position.y}, z={it.position.z}</div>
                  <div><strong>Centre (converted):</strong> x={it.center.x.toFixed(1)}, y={it.center.y.toFixed(1)}, z={it.center.z.toFixed(1)}</div>
                  <div><strong>Orientation:</strong> 0°, 0°, 0°</div>
                </div>
              )
            })()
          ) : <div>Select an item to see details.</div>}
        </aside>
      </main>
      <footer className="app-footer">Demo prototype — no backend. Mobile responsive layout.</footer>
    </div>
  )
}
