import { useCallback, useEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import { Canvas } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'

import Carton from './Carton'
import ItemMesh from './ItemMesh'
import type { PlacedItem } from '../types'

//CMAERA AND ROTATION SETTINGS
const ROTATE_SPEED = 1.4
const POLAR_EPS = 0.001 //prevents camera from rotation over top/bottom
const CAMERA_FOV = 50 //camera angle
const VIEW_MARGIN = 1 //distance from carton
const CAMERA_DIRECTION = new THREE.Vector3(1, 0.8, 1.2).normalize() //camera angle from carton


//Rotation Direction
type Direction = 'up' | 'down' | 'left' | 'right'

// Maps keyboard arrow keys to our Direction type.
const KEY_TO_DIRECTION: Record<string, Direction> = {
  ArrowUp: 'up',
  ArrowDown: 'down',
  ArrowLeft: 'left',
  ArrowRight: 'right'
}


//COMPONENT PROPS
// Defines the data that must be passed into the Scene component.
type Props = {

  // Dimensions of the carton in millimetres.
  carton: {
    Width: number
    Length: number
    Depth: number
  }

  // Array containing all items that have been placed in the carton.
  items: PlacedItem[]
}


//SCENE COMPONENT
export default function Scene({ carton, items }: Props) {

  // Reference to OrbitControls.
  // This allows us to manually tell the controls/camera to rotate.
  const controls = useRef<any>()

  // Reference to the Three.js camera created by Canvas.
  const cameraRef = useRef<any>(null)

  // Stores which rotation directions are currently being held.
  // A Set is used because more than one direction could be active,
  // e.g. holding Up + Left at the same time.
  const activeDirections = useRef<Set<Direction>>(new Set())

  // Stores the ID returned by requestAnimationFrame.
  // We use this so we can stop/cancel the animation when necessary.
  const rafRef = useRef<number | null>(null)

  // Stores the time of the previous animation frame.
  // This is used to calculate smooth movement regardless of frame rate.
  const lastFrameTime = useRef<number | null>(null)


  // INITIAL CAMERA POSITION

  // Calculate where the camera should start based on carton size.
  //
  // useMemo means React only recalculates this when the carton
  // dimensions change.
  const initialCamera = useMemo(() => {

    // The centre of the carton.
    //
    // Carton dimensions are in millimetres.
    // /1000 converts mm -> metres.
    // /2 then finds the centre.
    //
    // Therefore /2000 does both operations at once.
    const target: [number, number, number] = [
      carton.Width / 2000,
      carton.Length / 2000,
      carton.Depth / 2000
    ]

    // Convert carton dimensions from millimetres to metres
    // because our Three.js scene uses metres.
    const width = carton.Width / 1000
    const length = carton.Length / 1000
    const depth = carton.Depth / 1000

    // Find the distance from the centre of the carton to one
    // of its furthest corners.
    //
    // This effectively gives us a sphere large enough to contain
    // the entire carton.
    const boundingRadius =
      Math.sqrt(width * width + length * length + depth * depth) / 2

    // Convert the camera's field of view from degrees to radians
    // because JavaScript's Math.sin() expects radians.
    const fovRadians = (CAMERA_FOV * Math.PI) / 180

    // Calculate how far away the camera needs to be so the whole
    // carton fits within the camera's field of view.
    const distance =
      (boundingRadius / Math.sin(fovRadians / 2)) * VIEW_MARGIN

    // Start from the centre of the carton, then move the camera
    // away from it in CAMERA_DIRECTION.
    const position: [number, number, number] = [
      target[0] + CAMERA_DIRECTION.x * distance,
      target[1] + CAMERA_DIRECTION.y * distance,
      target[2] + CAMERA_DIRECTION.z * distance
    ]

    // Return both values so Canvas and OrbitControls can use them.
    return { position, target }

  }, [carton.Width, carton.Length, carton.Depth])


  // ============================================================
  // ROTATE CAMERA
  // ============================================================

  // Rotates the camera by a given horizontal (azimuth)
  // and vertical (polar) amount.
  const rotateBy = useCallback((
    deltaAzimuth: number,
    deltaPolar: number
  ) => {

    const camera = cameraRef.current
    const control = controls.current

    // Can't rotate until both the camera and controls exist.
    if (!camera || !control) return

    // Calculate the camera's position RELATIVE to the point
    // it is looking at.
    const offset = new THREE.Vector3()
      .copy(camera.position)
      .sub(control.target)

    // Convert the x/y/z position into spherical coordinates.
    //
    // Spherical coordinates make rotating around an object easier:
    // theta = horizontal angle
    // phi   = vertical angle
    const spherical = new THREE.Spherical().setFromVector3(offset)

    // Rotate horizontally.
    spherical.theta -= deltaAzimuth

    // Rotate vertically.
    //
    // Math.max/min prevents the camera from going completely
    // over the top or underneath the target.
    spherical.phi = Math.max(
      POLAR_EPS,
      Math.min(
        Math.PI - POLAR_EPS,
        spherical.phi - deltaPolar
      )
    )

    // Convert the new spherical coordinates back into x/y/z.
    offset.setFromSpherical(spherical)

    // Put the camera at its newly calculated position.
    camera.position
      .copy(control.target)
      .add(offset)

    // Tell OrbitControls that the camera has changed.
    control.update()

  }, [])


  // ============================================================
  // ROTATION ANIMATION LOOP
  // ============================================================

  // Runs repeatedly while the user is holding a rotation
  // key/button.
  const stepFrame = useCallback((time: number) => {

    const directions = activeDirections.current

    // If no directions are currently being held,
    // stop the animation loop.
    if (directions.size === 0) {
      rafRef.current = null
      lastFrameTime.current = null
      return
    }

    // If this is the first frame, use the current time.
    // Otherwise use the time of the previous frame.
    const last = lastFrameTime.current ?? time

    // Calculate how many seconds have passed since the last frame.
    //
    // Math.min prevents a huge jump if the browser temporarily
    // freezes or becomes inactive.
    const deltaTime = Math.min(
      0.1,
      (time - last) / 1000
    )

    lastFrameTime.current = time

    // Amount we should rotate during THIS frame.
    const amount = ROTATE_SPEED * deltaTime

    let azimuth = 0
    let polar = 0

    // Work out the required horizontal/vertical rotation
    // based on which directions are currently being held.
    if (directions.has('left')) azimuth -= amount
    if (directions.has('right')) azimuth += amount
    if (directions.has('up')) polar += amount
    if (directions.has('down')) polar -= amount

    // Actually rotate the camera.
    rotateBy(azimuth, polar)

    // Ask the browser to run stepFrame again on the next frame.
    rafRef.current = requestAnimationFrame(stepFrame)

  }, [rotateBy])


  // ============================================================
  // START / STOP ROTATING
  // ============================================================

  const startDirection = useCallback((direction: Direction) => {

    // Remember that this direction is currently being held.
    activeDirections.current.add(direction)

    // Only start a new animation loop if one isn't already running.
    if (rafRef.current === null) {
      lastFrameTime.current = null
      rafRef.current = requestAnimationFrame(stepFrame)
    }

  }, [stepFrame])


  const stopDirection = useCallback((direction: Direction) => {

    // Remove the released direction from the active directions.
    activeDirections.current.delete(direction)

  }, [])


  // ============================================================
  // KEYBOARD CONTROLS
  // ============================================================

  // useEffect adds the keyboard/event listeners when Scene appears
  // and removes them when Scene is removed.
  useEffect(() => {

    // Called when a keyboard key is pressed.
    const handleKeyDown = (event: KeyboardEvent) => {

      // Convert ArrowUp etc. into up/down/left/right.
      const direction = KEY_TO_DIRECTION[event.key]

      // Ignore keys we don't care about.
      if (!direction) return

      // Prevent arrow keys from scrolling the webpage.
      event.preventDefault()

      startDirection(direction)
    }


    // Called when the user releases a keyboard key.
    const handleKeyUp = (event: KeyboardEvent) => {

      const direction = KEY_TO_DIRECTION[event.key]

      if (direction) {
        stopDirection(direction)
      }
    }


    // Stops all movement.
    //
    // Useful if the mouse/finger is released or the browser
    // loses focus.
    const stopAll = () => {
      activeDirections.current.clear()
    }


    // Add our event listeners.
    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)
    window.addEventListener('pointerup', stopAll)
    window.addEventListener('blur', stopAll)


    // Cleanup function.
    //
    // React runs this when the component is removed or the
    // dependencies of this effect change.
    return () => {

      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
      window.removeEventListener('pointerup', stopAll)
      window.removeEventListener('blur', stopAll)

      // Stop any animation frame that may still be running.
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current)
      }
    }

  }, [startDirection, stopDirection])


  // ============================================================
  // DISPLAY THE 3D SCENE
  // ============================================================

  return (
    <div className="three-canvas">

      {/* Canvas creates the actual Three.js scene and renderer. */}
      <Canvas
        shadows

        // Give the camera the automatically calculated starting
        // position and our chosen field of view.
        camera={{
          position: initialCamera.position,
          fov: CAMERA_FOV
        }}

        // Once Canvas creates the Three.js camera,
        // save a reference to it so our functions can access it.
        onCreated={state => {
          cameraRef.current = state.camera
        }}
      >

        {/* General light affecting everything in the scene. */}
        <ambientLight intensity={0.6} />

        {/* Directional light gives the boxes more visible depth. */}
        <directionalLight
          position={[1, 2, 1]}
          intensity={0.9}
        />


        {/* Draw the outer carton using its dimensions. */}
        <Carton
          width={carton.Width}
          length={carton.Length}
          depth={carton.Depth}
        />


        {/* Create one ItemMesh for every packed item. */}
        {items.map((item, index) => (

          <ItemMesh
            // React uses key to distinguish items in the list.
            key={item.ItemCode}

            // ID of this particular packed item.
            id={item.ItemCode}

            // Physical dimensions of the item.
            dims={{
              w: item.displayed.width,
              l: item.displayed.length,
              d: item.displayed.depth
            }}

            // Position of the centre of the item.
            center={item.center}

            color = {index === items.length -1 ? "red" : "blue"}

            // Item selection isn't being used in the MVP.
            selected={false}

            // Item clicking isn't being used yet,
            // so provide an empty function.
            onClick={() => {}}
          />

        ))}


        {/* Lets the user rotate, zoom and pan using mouse/touch. */}
        <OrbitControls
          ref={controls}
          enablePan
          enableRotate
          enableZoom

          // Rotate around the centre of the carton,
          // rather than around the world origin.
          target={initialCamera.target}
        />

      </Canvas>


      {/* ======================================================
          ON-SCREEN ROTATION BUTTONS
          ====================================================== */}

      <div className="rotate-controls">

        {/* Generate the four rotation buttons from this array
            rather than manually writing four separate buttons. */}
        {(['up', 'down', 'left', 'right'] as Direction[])
          .map(direction => (

            <button
              key={direction}
              type="button"

              // Produces classes such as:
              // rotate-btn rotate-up
              // rotate-btn rotate-left
              className={`rotate-btn rotate-${direction}`}

              // Start rotating when the user presses the button.
              onPointerDown={event => {
                event.preventDefault()
                startDirection(direction)
              }}

              // Stop when they release it.
              onPointerUp={() =>
                stopDirection(direction)
              }

              // Also stop if their pointer leaves the button
              // while it is being held.
              onPointerLeave={() =>
                stopDirection(direction)
              }
            >

              {/* Choose the appropriate arrow symbol. */}
              {direction === 'up'
                ? '▲'
                : direction === 'down'
                  ? '▼'
                  : direction === 'left'
                    ? '◀'
                    : '▶'}

            </button>

          ))}

      </div>

    </div>
  )
}