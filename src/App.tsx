import React, { useEffect, useMemo, useState } from 'react'
import Scene from './components/Scene'
import { MOCK_PLACEMENTS } from './data/mockPlacements'
import type { Item, BoxType, Placement, PlacedItem } from './types'
import { totalItemsWeight, cartonVolume, itemVolume, findBoxByRef } from './utils/calculations'
import { normalizeBoxes, normalizeItems, normalizePlacements } from './utils/normalize'
import { autoLayoutPlacement } from './utils/autoLayout'
import { buildItemColorMap } from './utils/palette'
import { DATA_SOURCES } from './config'
import packingData from './data/sample.json'

export default function App(){
  const [boxes, setBoxes] = useState<BoxType[] | null>(null)
  const [items, setItems] = useState<Item[] | null>(null)
  const [externalPlacements, setExternalPlacements] = useState<Placement[] | null>(null)
  const [selected, setSelected] = useState<string | null>(null)
  const [resetSignal, setResetSignal] = useState(0)
  const [selectedBoxRef, setSelectedBoxRef] = useState<string>('MED')
  const [boxPickerOpen, setBoxPickerOpen] = useState(false)
  const [boxFilter, setBoxFilter] = useState('')
  const [packingMode, setPackingMode] = useState(false)
  const [packingStep, setPackingStep] = useState(0)

  useEffect(()=>{
    fetch(DATA_SOURCES.boxes).then(r=>r.json()).then(raw => setBoxes(normalizeBoxes(raw)))
    fetch(DATA_SOURCES.items).then(r=>r.json()).then(raw => setItems(normalizeItems(raw)))
    if (DATA_SOURCES.placements) {
      fetch(DATA_SOURCES.placements).then(r=>r.json()).then(raw => setExternalPlacements(normalizePlacements(raw)))
    }
  },[])

  const availableBoxes = useMemo(()=> boxes ?? [], [boxes])
  const med = useMemo(()=> boxes ? findBoxByRef(boxes, selectedBoxRef) ?? availableBoxes[0] ?? boxes[0] : null, [boxes, availableBoxes, selectedBoxRef])

  const filteredBoxes = useMemo(()=>{
    const q = boxFilter.trim().toLowerCase()
    if(!q) return availableBoxes
    return availableBoxes.filter(b => b.Reference.toLowerCase().includes(q))
  }, [availableBoxes, boxFilter])

  useEffect(()=>{
    if(!boxPickerOpen) return
    const onKeyDown = (e: KeyboardEvent) => { if(e.key === 'Escape') setBoxPickerOpen(false) }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [boxPickerOpen])

  const placementSource = externalPlacements ?? MOCK_PLACEMENTS

  const itemColors = useMemo(()=> items ? buildItemColorMap(items.map(it => it.ItemCode)) : {}, [items])

  const placed: PlacedItem[] = useMemo(()=>{
    if(!items || !med) return []
    return items.map((it, index) => {
      const placement = placementSource.find(p => p.ItemCode === it.ItemCode) ?? autoLayoutPlacement(it, index, med)
      const { displayed, position: pos } = placement
      // FitSolver coordinate convention: origin at the carton's bottom-left-back
      // corner; x runs along Width, y along Length, z along Depth.
      const center = {
        x: pos.x + displayed.width/2,
        y: pos.y + displayed.length/2,
        z: pos.z + displayed.depth/2
      }
      return { ...it, ...placement, displayed, center }
    })
  }, [items, med, placementSource])

  const packingItems = packingData.cartons[0].items

  const placedWithOrder = useMemo(() => {
    return placed
      .map(item => {
        const packingInfo = packingItems.find(
          p => p.itemCode === item.ItemCode
        )

        return {
          ...item,
          packingOrder: packingInfo?.packingOrder ?? 999
        }
      })
      .sort((a, b) => a.packingOrder - b.packingOrder)
  }, [placed])

  const visibleItems = packingMode
    ? placedWithOrder.slice(0, packingStep)
    : placed

  const totalWeight = items ? totalItemsWeight(items) : 0
  const cartonVolumeMm = med ? cartonVolume(med) : 1
  const itemsVolumeMm = items ? items.reduce((s,i)=> s + itemVolume(i), 0) : 0

  const weightUtil = med ? (totalWeight / (med.MaxWeight ?? totalWeight)) * 100 : 0
  const volumeUtil = (itemsVolumeMm / cartonVolumeMm) * 100

  const handleSelectBox = (ref: string) => {
    setSelectedBoxRef(ref)
    setSelected(null)
    setResetSignal(s => s + 1)
    setBoxPickerOpen(false)
    setBoxFilter('')
  }

  if(!med || !items) return <div className="loading">Loading data…</div>

  return (
    <div className="app-root">
      <header className="app-header">COMP4050 — Fit Visualiser</header>
      <main className="app-main">
        <aside className="panel left">
          <h3>Carton Size</h3>
          <button className="box-picker-trigger secondary" onClick={() => setBoxPickerOpen(true)}>
            <span>{med.Reference} — {med.Width}×{med.Length}×{med.Depth} mm</span>
            <span aria-hidden="true">▾</span>
          </button>
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
              <li key={it.ItemCode}><span className="swatch" style={{background: itemColors[it.ItemCode]}} /> {it.ItemCode} — {it.ItemReference}</li>
            ))}
          </ul>
          <hr />
          <p className="notice">
            {externalPlacements
              ? 'Item positions from the FitSolver placement endpoint.'
              : 'Item positions are mocked until integration with the FitSolver optimisation engine; items without a mock placement fall back to an auto-arranged grid.'}
          </p>
        </aside>
        <section className="viewer">
        <div className="viewer-topbar">

<button
  onClick={() => {
    setSelected(null)
    setResetSignal(s => s + 1)
  }}
>
  Reset View
</button>

{!packingMode ? (
  <button
    onClick={() => {
      setPackingMode(true)
      setPackingStep(0)
    }}
  >
    Show Packing Steps
  </button>
) : (
  <>
    <button
      disabled={packingStep === 0}
      onClick={() =>
        setPackingStep(step => Math.max(0, step - 1))
      }
    >
      Previous
    </button>

    <button
      disabled={packingStep === placedWithOrder.length}
      onClick={() =>
        setPackingStep(step =>
          Math.min(placedWithOrder.length, step + 1)
        )
      }
    >
      Next
    </button>

    <button
      className="secondary"
      onClick={() => {
        setPackingMode(false)
        setPackingStep(0)
      }}
    >
      Show All
    </button>
  </>
)}

</div>
          <Scene carton={{Width:med.Width, Length:med.Length, Depth:med.Depth}} items={visibleItems} colors={itemColors} selected={selected} onSelect={id=>setSelected(id)} resetSignal={resetSignal} />
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

      {boxPickerOpen && (
        <div className="modal-backdrop" onClick={() => setBoxPickerOpen(false)}>
          <div className="modal-panel" onClick={e => e.stopPropagation()} role="dialog" aria-modal="true" aria-label="Select carton size">
            <div className="modal-header">
              <h3>Select Carton</h3>
              <button className="secondary" onClick={() => setBoxPickerOpen(false)}>✕</button>
            </div>
            <input
              className="modal-search"
              type="text"
              placeholder="Search by reference…"
              value={boxFilter}
              onChange={e => setBoxFilter(e.target.value)}
              autoFocus
            />
            <ul className="box-list">
              {filteredBoxes.map(b => (
                <li key={b.Reference}>
                  <button
                    className={`box-list-item${b.Reference === med.Reference ? ' selected' : ''}${b.Active === false ? ' disabled' : ''}`}
                    disabled={b.Active === false}
                    onClick={() => handleSelectBox(b.Reference)}
                  >
                    <span className="box-list-ref">{b.Reference}</span>
                    <span className="box-list-dims">{b.Width} × {b.Length} × {b.Depth} mm</span>
                    {b.Active === false && <span className="box-list-inactive">inactive</span>}
                  </button>
                </li>
              ))}
              {filteredBoxes.length === 0 && <li className="box-list-empty">No matching boxes.</li>}
            </ul>
          </div>
        </div>
      )}
    </div>
  )
}
