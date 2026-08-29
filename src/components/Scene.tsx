import React, { useCallback, useEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import { Canvas } from '@react-three/fiber'
import { OrbitControls, Html } from '@react-three/drei'
import Carton from './Carton'
import ItemMesh from './ItemMesh'
import type { PlacedItem } from '../types'

const ROTATE_SPEED = 1.4 // radians/second while a direction is held
const POLAR_EPS = 0.001
const CAMERA_FOV = 50
const VIEW_MARGIN = 1.3 // headroom so the carton doesn't touch the frame edges
const CAMERA_DIRECTION = new THREE.Vector3(1, 0.8, 1.2).normalize()

type Direction = 'up' | 'down' | 'left' | 'right'

const KEY_TO_DIRECTION: Record<string, Direction> = {
  ArrowUp: 'up', ArrowDown: 'down', ArrowLeft: 'left', ArrowRight: 'right'
}

const isTypingTarget = (el: Element | null) => {
  if (!el) return false
  const tag = el.tagName
  return tag === 'INPUT' || tag === 'TEXTAREA' || (el as HTMLElement).isContentEditable
}

type Props = {
  carton: { Width:number; Length:number; Depth:number }
  items: PlacedItem[]
  colors: Record<string,string>
  selected?: string | null
  onSelect: (id:string)=>void
  resetSignal: number
}

export default function Scene({ carton, items, colors, selected, onSelect, resetSignal }: Props) {
  const controls = useRef<any>()
  const cameraRef = useRef<any>(null)
  const activeDirections = useRef<Set<Direction>>(new Set())
  const rafRef = useRef<number | null>(null)
  const lastFrameTime = useRef<number | null>(null)
  // FitSolver convention: Width->x, Length->y (three.js up-axis), Depth->z.
  // Camera distance scales with the carton's own bounding sphere so a large
  // carton (e.g. LRG) frames just as fully as a small one, instead of using
  // a fixed distance tuned for one box size.
  const initialCamera = useMemo(() => {
    const target: [number, number, number] = [carton.Width / 2000, carton.Length / 2000, carton.Depth / 2000]
    const w = carton.Width / 1000
    const l = carton.Length / 1000
    const d = carton.Depth / 1000
    const boundingRadius = Math.sqrt(w * w + l * l + d * d) / 2
    const fovRadians = (CAMERA_FOV * Math.PI) / 180
    const distance = (boundingRadius / Math.sin(fovRadians / 2)) * VIEW_MARGIN
    const position: [number, number, number] = [
      target[0] + CAMERA_DIRECTION.x * distance,
      target[1] + CAMERA_DIRECTION.y * distance,
      target[2] + CAMERA_DIRECTION.z * distance
    ]
    return { position, target }
  }, [carton.Width, carton.Length, carton.Depth])

  React.useEffect(() => {
    const cam = cameraRef.current
    if (!cam) return
    cam.position.set(...initialCamera.position)
    if (controls.current) {
      controls.current.target.set(...initialCamera.target)
      controls.current.update()
    }
  }, [resetSignal])

  // Orbits the camera around the target by a small spherical delta — the same
  // math OrbitControls itself applies on a left-click drag — so held buttons/
  // arrow keys rotate the view instead of translating it.
  const rotateBy = useCallback((deltaAzimuth: number, deltaPolar: number) => {
    const camera = cameraRef.current
    const ctrl = controls.current
    if (!camera || !ctrl) return
    const offset = new THREE.Vector3().copy(camera.position).sub(ctrl.target)
    const spherical = new THREE.Spherical().setFromVector3(offset)
    spherical.theta -= deltaAzimuth
    spherical.phi = Math.max(POLAR_EPS, Math.min(Math.PI - POLAR_EPS, spherical.phi - deltaPolar))
    offset.setFromSpherical(spherical)
    camera.position.copy(ctrl.target).add(offset)
    ctrl.update()
  }, [])

  // Runs while any direction is held (button press-and-hold or keydown),
  // applying a frame-rate-independent rotation step each frame for a smooth,
  // continuous drag-like motion rather than a single jump per press.
  const stepFrame = useCallback((time: number) => {
    const dirs = activeDirections.current
    if (dirs.size === 0) {
      rafRef.current = null
      lastFrameTime.current = null
      return
    }
    const last = lastFrameTime.current ?? time
    const dt = Math.min(0.1, (time - last) / 1000)
    lastFrameTime.current = time
    const amount = ROTATE_SPEED * dt
    let dAzimuth = 0
    let dPolar = 0
    if (dirs.has('left')) dAzimuth -= amount
    if (dirs.has('right')) dAzimuth += amount
    if (dirs.has('up')) dPolar += amount
    if (dirs.has('down')) dPolar -= amount
    if (dAzimuth !== 0 || dPolar !== 0) rotateBy(dAzimuth, dPolar)
    rafRef.current = requestAnimationFrame(stepFrame)
  }, [rotateBy])

  const startDirection = useCallback((dir: Direction) => {
    activeDirections.current.add(dir)
    if (rafRef.current == null) {
      lastFrameTime.current = null
      rafRef.current = requestAnimationFrame(stepFrame)
    }
  }, [stepFrame])

  const stopDirection = useCallback((dir: Direction) => {
    activeDirections.current.delete(dir)
  }, [])

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (isTypingTarget(document.activeElement)) return
      const dir = KEY_TO_DIRECTION[e.key]
      if (!dir) return
      e.preventDefault()
      startDirection(dir)
    }
    const onKeyUp = (e: KeyboardEvent) => {
      const dir = KEY_TO_DIRECTION[e.key]
      if (dir) stopDirection(dir)
    }
    // Safety net: if a button/key is released outside its element, stop
    // everything so the view doesn't keep rotating forever.
    const stopAll = () => activeDirections.current.clear()
    window.addEventListener('keydown', onKeyDown)
    window.addEventListener('keyup', onKeyUp)
    window.addEventListener('pointerup', stopAll)
    window.addEventListener('pointercancel', stopAll)
    window.addEventListener('blur', stopAll)
    return () => {
      window.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('keyup', onKeyUp)
      window.removeEventListener('pointerup', stopAll)
      window.removeEventListener('pointercancel', stopAll)
      window.removeEventListener('blur', stopAll)
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current)
    }
  }, [startDirection, stopDirection])

  return (
    <div className="three-canvas">
      <Canvas shadows gl={{ antialias: true }} camera={{ position: initialCamera.position, fov: CAMERA_FOV }} onCreated={(state) => { cameraRef.current = state.camera }}>
        <ambientLight intensity={0.6} />
        <directionalLight position={[1, 2, 1]} intensity={0.9} />
        <pointLight position={[-1, 1, -1]} intensity={0.4} />
        <Carton width={carton.Width} length={carton.Length} depth={carton.Depth} />
        {items.map(it => (
          <ItemMesh
            key={it.ItemCode}
            id={it.ItemCode}
            dims={{ w: it.displayed.width, l: it.displayed.length, d: it.displayed.depth }}
            center={it.center}
            color={colors[it.ItemCode]}
            selected={selected === it.ItemCode}
            onClick={onSelect}
          />
        ))}
        <OrbitControls ref={controls} enablePan enableRotate enableZoom target={initialCamera.target} />
        <Html position={[0, -0.2, 0]}>
          <div style={{display:'none'}} />
        </Html>
      </Canvas>
      <div className="rotate-controls">
        {(['up','down','left','right'] as Direction[]).map(dir => (
          <button
            key={dir}
            type="button"
            className={`rotate-btn rotate-${dir}`}
            aria-label={`Rotate ${dir}`}
            onPointerDown={(e) => { e.preventDefault(); startDirection(dir) }}
            onPointerUp={() => stopDirection(dir)}
            onPointerLeave={() => stopDirection(dir)}
            onPointerCancel={() => stopDirection(dir)}
          >
            {dir === 'up' ? '▲' : dir === 'down' ? '▼' : dir === 'left' ? '◀' : '▶'}
          </button>
        ))}
      </div>
    </div>
  )
}
