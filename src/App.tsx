import { useState } from 'react'
import Scene from './components/Scene'
import packingData from './data/sample-multiple-boxes.json'

export default function App() {
  // Which carton is currently selected.
  const [cartonIndex, setCartonIndex] = useState(0)

  // Current carton based on the selected index.
  const carton = packingData.cartons[cartonIndex]

  // Start with the first item already visible.
  const [packingStep, setPackingStep] = useState(
    Math.min(1, carton.items.length)
  )

  // Change to another carton and start that carton at item 1.
  const selectCarton = (index: number) => {
    if (index < 0 || index >= packingData.cartons.length) return

    setCartonIndex(index)
    setPackingStep(Math.min(1, packingData.cartons[index].items.length))
  }

  const previousCarton = () => selectCarton(cartonIndex - 1)
  const nextCarton = () => selectCarton(cartonIndex + 1)

  // Keep the packing order in one place so the 3D view and the
  // packing-step list always agree.
  const orderedItems = carton.items
    .slice()
    .sort((a, b) => a.packingOrder - b.packingOrder)

  // Only send the items that should currently be visible to Scene.
  const items = orderedItems
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

  // On phones we only show the selected box and its immediate neighbours.
  const carouselIndexes = [cartonIndex - 1, cartonIndex, cartonIndex + 1]
    .filter(index => index >= 0 && index < packingData.cartons.length)

  return (
    <div className="app-root">
      <header className="app-header">
        <button className="icon-button header-menu" type="button" aria-label="Open menu">
          ☰
        </button>

        <div className="app-title">Packing Visualiser</div>

        <div className="header-box-icon" aria-hidden="true">◇</div>
      </header>

      <main className="app-main">
        <section className="box-navigation" aria-label="Carton navigation">
          <div className="box-counter">
            Box {cartonIndex + 1} of {packingData.cartons.length}
          </div>

          <div className="box-carousel-row">
            <button
              className="carousel-arrow"
              type="button"
              aria-label="Previous box"
              disabled={cartonIndex === 0}
              onClick={previousCarton}
            >
              ‹
            </button>

            <div className="box-carousel">
              {carouselIndexes.map(index => {
                const box = packingData.cartons[index]
                const isSelected = index === cartonIndex

                return (
                  <button
                    key={box.cartonId}
                    className={`box-card ${isSelected ? 'selected' : ''}`}
                    type="button"
                    onClick={() => selectCarton(index)}
                    aria-current={isSelected ? 'true' : undefined}
                  >
                    <strong>Box {index + 1}</strong>
                    <span>{box.boxReference}</span>
                    <small>
                      {box.dimensions.width}×{box.dimensions.length}×{box.dimensions.depth} mm
                    </small>
                  </button>
                )
              })}
            </div>

            <button
              className="carousel-arrow"
              type="button"
              aria-label="Next box"
              disabled={cartonIndex === packingData.cartons.length - 1}
              onClick={nextCarton}
            >
              ›
            </button>
          </div>
        </section>

        <section className="viewer">
          <Scene
            carton={{
              Width: carton.dimensions.width,
              Length: carton.dimensions.length,
              Depth: carton.dimensions.depth
            }}
            items={items}
          />
        </section>

        <section className="packing-panel">
          <div className="packing-panel-header">
            <div>
              <h2>Packing Steps</h2>
              <span>Box {cartonIndex + 1} — {carton.boxReference}</span>
            </div>

            <strong className="packing-count">
              {packingStep} / {carton.items.length}
            </strong>
          </div>

          <div className="packing-step-list">
            {orderedItems.map((item, index) => {
              const stepNumber = index + 1
              const isCurrent = packingStep > 0 && stepNumber === packingStep
              const isCompleted = stepNumber < packingStep
              const isFuture = stepNumber > packingStep

              return (
                <div
                  key={`${item.itemCode}-${item.packingOrder}`}
                  className={`packing-step ${isCurrent ? 'current' : ''} ${isFuture ? 'future' : ''}`}
                >
                  <span className="step-number">{stepNumber}</span>

                  <div className="step-details">
                    <strong>{item.itemCode}</strong>
                    <span>
                      {item.displayed.width} × {item.displayed.length} × {item.displayed.depth} mm
                    </span>
                  </div>

                  <span
                    className={`step-status ${isCompleted ? 'completed' : ''} ${isCurrent ? 'current' : ''}`}
                    aria-label={isCompleted ? 'Completed' : isCurrent ? 'Current item' : 'Not yet packed'}
                  >
                    {isCompleted ? '✓' : ''}
                  </span>
                </div>
              )
            })}
          </div>
        </section>
      </main>

      <nav className="packing-controls" aria-label="Packing controls">
        <button
          className="secondary-action"
          type="button"
          disabled={packingStep <= 1}
          onClick={() =>
            setPackingStep(step => Math.max(1, step - 1))
          }
        >
          ‹ Previous
        </button>

        <button
          className="primary-action"
          type="button"
          disabled={packingStep === carton.items.length}
          onClick={() =>
            setPackingStep(step =>
              Math.min(carton.items.length, step + 1)
            )
          }
        >
          Next ›
        </button>

        <button
          className="secondary-action"
          type="button"
          onClick={() => setPackingStep(carton.items.length)}
        >
          Show All
        </button>
      </nav>
    </div>
  )
}
