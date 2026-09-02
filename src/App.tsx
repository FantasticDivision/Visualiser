import { useState } from 'react'
import Scene from './components/Scene'
import packingData from './data/sample2.json'

export default function App() {
  const carton = packingData.cartons[0]

  const [packingStep, setPackingStep] = useState(carton.items.length)

  const items = carton.items
  .slice()
  .sort((a, b) => a.packingOrder - b.packingOrder)
  .slice(0, packingStep)
  .map(item => ({
    ItemCode: item.itemCode,
    ItemReference: item.itemReference,

    Width: item.displayed.width,
    Length: item.displayed.length,
    Depth: item.displayed.depth,
    Weight: item.weight,

    position: item.position,
    displayed: item.displayed,

    center: {
      x: item.position.x + item.displayed.width / 2,
      y: item.position.y + item.displayed.length / 2,
      z: item.position.z + item.displayed.depth / 2
    }
  }))

  return (
    <div className="app-root">

      <header className="app-header">
        COMP4050 — Fit Visualiser
      </header>

      <main className="app-main">

        <aside className="panel left">
          <h3>Carton</h3>

          <div>
            <strong>Reference:</strong> {carton.boxReference}
          </div>

          <div>
            <strong>Dimensions:</strong>{' '}
            {carton.dimensions.width} ×{' '}
            {carton.dimensions.length} ×{' '}
            {carton.dimensions.depth} mm
          </div>

          <div>
            <strong>Items:</strong> {carton.items.length}
          </div>
        </aside>

        <section className="viewer">

          <div className="viewer-topbar">

            <button
              disabled={packingStep === 0}
              onClick={() =>
                setPackingStep(step => Math.max(0, step - 1))
              }
            >
              Previous
            </button>

            <button
              disabled={packingStep === carton.items.length}
              onClick={() =>
                setPackingStep(step =>
                  Math.min(carton.items.length, step + 1)
                )
              }
            >
              Next
            </button>

            <button
              onClick={() =>
                setPackingStep(carton.items.length)
              }
            >
              Show All
            </button>

          </div>

          <Scene
            carton={{
              Width: carton.dimensions.width,
              Length: carton.dimensions.length,
              Depth: carton.dimensions.depth
            }}
            items={items}
          />

        </section>

      </main>

    </div>
  )
}