import { useCallback, useEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import { Canvas } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import Carton from './Carton'
import ItemMesh from './ItemMesh'
import type { PlacedItem } from '../types'

const ROTATE_SPEED = 1.4
const POLAR_EPS = 0.001
const CAMERA_FOV = 50
const VIEW_MARGIN = 1.3
const CAMERA_DIRECTION = new THREE.Vector3(1, 0.8, 1.2).normalize()

type Direction = 'up' | 'down' | 'left' | 'right'

const KEY_TO_DIRECTION: Record<string, Direction> = {
  ArrowUp: 'up',
  ArrowDown: 'down',
  ArrowLeft: 'left',
  ArrowRight: 'right'
}

type Props = {
  carton: {
    Width: number
    Length: number
    Depth: number
  }
  items: PlacedItem[]
}

export default function Scene({ carton, items }: Props) {
  const controls = useRef<any>()
  const cameraRef = useRef<any>(null)
  const activeDirections = useRef<Set<Direction>>(new Set())
  const rafRef = useRef<number | null>(null)
  const lastFrameTime = useRef<number | null>(null)

  const initialCamera = useMemo(() => {
    const target: [number, number, number] = [
      carton.Width / 2000,
      carton.Length / 2000,
      carton.Depth / 2000
    ]

    const width = carton.Width / 1000
    const length = carton.Length / 1000
    const depth = carton.Depth / 1000

    const boundingRadius =
      Math.sqrt(width * width + length * length + depth * depth) / 2

    const fovRadians = (CAMERA_FOV * Math.PI) / 180
    const distance =
      (boundingRadius / Math.sin(fovRadians / 2)) * VIEW_MARGIN

    const position: [number, number, number] = [
      target[0] + CAMERA_DIRECTION.x * distance,
      target[1] + CAMERA_DIRECTION.y * distance,
      target[2] + CAMERA_DIRECTION.z * distance
    ]

    return { position, target }
  }, [carton.Width, carton.Length, carton.Depth])

  const rotateBy = useCallback((deltaAzimuth: number, deltaPolar: number) => {
    const camera = cameraRef.current
    const control = controls.current

    if (!camera || !control) return

    const offset = new THREE.Vector3()
      .copy(camera.position)
      .sub(control.target)

    const spherical = new THREE.Spherical().setFromVector3(offset)

    spherical.theta -= deltaAzimuth
    spherical.phi = Math.max(
      POLAR_EPS,
      Math.min(Math.PI - POLAR_EPS, spherical.phi - deltaPolar)
    )

    offset.setFromSpherical(spherical)
    camera.position.copy(control.target).add(offset)
    control.update()
  }, [])

  const stepFrame = useCallback((time: number) => {
    const directions = activeDirections.current

    if (directions.size === 0) {
      rafRef.current = null
      lastFrameTime.current = null
      return
    }

    const last = lastFrameTime.current ?? time
    const deltaTime = Math.min(0.1, (time - last) / 1000)
    lastFrameTime.current = time

    const amount = ROTATE_SPEED * deltaTime

    let azimuth = 0
    let polar = 0

    if (directions.has('left')) azimuth -= amount
    if (directions.has('right')) azimuth += amount
    if (directions.has('up')) polar += amount
    if (directions.has('down')) polar -= amount

    rotateBy(azimuth, polar)
    rafRef.current = requestAnimationFrame(stepFrame)
  }, [rotateBy])

  const startDirection = useCallback((direction: Direction) => {
    activeDirections.current.add(direction)

    if (rafRef.current === null) {
      lastFrameTime.current = null
      rafRef.current = requestAnimationFrame(stepFrame)
    }
  }, [stepFrame])

  const stopDirection = useCallback((direction: Direction) => {
    activeDirections.current.delete(direction)
  }, [])

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const direction = KEY_TO_DIRECTION[event.key]
      if (!direction) return

      event.preventDefault()
      startDirection(direction)
    }

    const handleKeyUp = (event: KeyboardEvent) => {
      const direction = KEY_TO_DIRECTION[event.key]
      if (direction) stopDirection(direction)
    }

    const stopAll = () => activeDirections.current.clear()

    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)
    window.addEventListener('pointerup', stopAll)
    window.addEventListener('blur', stopAll)

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
      window.removeEventListener('pointerup', stopAll)
      window.removeEventListener('blur', stopAll)

      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current)
      }
    }
  }, [startDirection, stopDirection])

  return (
    <div className="three-canvas">
      <Canvas
        shadows
        camera={{
          position: initialCamera.position,
          fov: CAMERA_FOV
        }}
        onCreated={state => {
          cameraRef.current = state.camera
        }}
      >
        <ambientLight intensity={0.6} />
        <directionalLight position={[1, 2, 1]} intensity={0.9} />

        <Carton
          width={carton.Width}
          length={carton.Length}
          depth={carton.Depth}
        />

        {items.map(item => (
          <ItemMesh
            key={item.ItemCode}
            id={item.ItemCode}
            dims={{
              w: item.displayed.width,
              l: item.displayed.length,
              d: item.displayed.depth
            }}
            center={item.center}
            color="orange"
            selected={false}
            onClick={() => {}}
          />
        ))}

        <OrbitControls
          ref={controls}
          enablePan
          enableRotate
          enableZoom
          target={initialCamera.target}
        />
      </Canvas>

      <div className="rotate-controls">
        {(['up', 'down', 'left', 'right'] as Direction[]).map(direction => (
          <button
            key={direction}
            type="button"
            className={`rotate-btn rotate-${direction}`}
            onPointerDown={event => {
              event.preventDefault()
              startDirection(direction)
            }}
            onPointerUp={() => stopDirection(direction)}
            onPointerLeave={() => stopDirection(direction)}
          >
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
