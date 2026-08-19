import React, { useRef, useImperativeHandle } from 'react'
import { Canvas } from '@react-three/fiber'
import { OrbitControls, Html } from '@react-three/drei'
import Carton from './Carton'
import ItemMesh from './ItemMesh'
import type { PlacedItem } from '../types'

type Props = {
  carton: { Width:number; Length:number; Depth:number }
  items: PlacedItem[]
  colors: Record<string,string>
  selected?: string | null
  onSelect: (id:string)=>void
  resetSignal: number
}

const Scene = React.forwardRef(function Scene({ carton, items, colors, selected, onSelect, resetSignal }: Props, ref) {
  const controls = useRef<any>()
  const glRef = useRef<any>(null)
  const cameraRef = useRef<any>(null)
  const initialCamera = {
    position: [1, 0.8, 1.2] as [number, number, number],
    target: [carton.Width / 2000, 0.2, carton.Length / 2000] as [number, number, number]
  }

  useImperativeHandle(ref, () => ({
    capture: () => {
      if (!glRef.current) return null
      try {
        const data = glRef.current.domElement.toDataURL('image/png')
        return data
      } catch (e) {
        return null
      }
    }
  }))

  React.useEffect(() => {
    const cam = cameraRef.current
    if (!cam) return
    cam.position.set(...initialCamera.position)
    if (controls.current) {
      controls.current.target.set(...initialCamera.target)
      controls.current.update()
    }
  }, [resetSignal])

  return (
    <div className="three-canvas">
      <Canvas shadows gl={{ preserveDrawingBuffer: true, antialias: true }} camera={{ position: initialCamera.position, fov: 50 }} onCreated={(state) => { glRef.current = state.gl; cameraRef.current = state.camera }}>
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
        <OrbitControls ref={controls} enablePan enableRotate enableZoom target={[carton.Width/2000, 0.2, carton.Length/2000]} />
        <Html position={[0, -0.2, 0]}>
          <div style={{display:'none'}} />
        </Html>
      </Canvas>
    </div>
  )
})

export default Scene
