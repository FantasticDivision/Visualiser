import { useState } from 'react'
import Scene from './components/Scene'
import packingData from './data/sample-multiple-boxes.json'

export default function App() {
  // Which carton is currently selected
  const [cartonIndex, setCartonIndex] = useState(0)

  // Current carton based on the selected index
  const carton = packingData.cartons[cartonIndex]

  // How many items from the current carton are displayed
  const [packingStep, setPackingStep] = useState(carton.items.length)

  // Change to a different carton
  const selectCarton = (index: number) => {
    setCartonIndex(index)

    // When changing cartons, show all items in the new carton
    setPackingStep(packingData.cartons[index].items.length)
  }

  // Convert JSON items into the format Scene expects
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

          <h3>Cartons</h3>

          {/* Create one button for every carton in the JSON */}
          <div className="carton-buttons">
            {packingData.cartons.map((box, index) => (
              <button
                key={box.cartonId}
                onClick={() => selectCarton(index)}
                disabled={index === cartonIndex}
              >
                BOX {index + 1} - {box.boxReference}
              </button>
            ))}
          </div>

          <h3>Selected Carton</h3>

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
              Previous Item
            </button>

            <button
              disabled={packingStep === carton.items.length}
              onClick={() =>
                setPackingStep(step =>
                  Math.min(carton.items.length, step + 1)
                )
              }
            >
              Next Item
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
