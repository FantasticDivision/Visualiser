import React, { useRef, useState } from 'react'
import { Mesh } from 'three'
import { useFrame } from '@react-three/fiber'
import { Html } from '@react-three/drei'

type Props = {
  id: string
  dims: { w:number; l:number; d:number }
  center: { x:number;y:number;z:number }
  color: string
  selected?: boolean
  onClick?: (id:string) => void
}

export default function ItemMesh({ id, dims, center, color, selected, onClick }: Props) {
  const ref = useRef<Mesh | null>(null)
  const [hover, setHover] = useState(false)
  useFrame(() => {
    if (ref.current) {
      const target = selected ? 1.02 : hover ? 1.01 : 1
      ref.current.scale.x += (target - ref.current.scale.x) * 0.12
      ref.current.scale.y += (target - ref.current.scale.y) * 0.12
      ref.current.scale.z += (target - ref.current.scale.z) * 0.12
    }
  })

  // FitSolver convention: Width->x, Length->y (three.js up-axis), Depth->z.
  const w = dims.w / 1000
  const l = dims.l / 1000
  const d = dims.d / 1000
  const pos: [number,number,number] = [center.x/1000, center.y/1000, center.z/1000]

  return (
    <mesh
      ref={ref}
      position={pos}
      onClick={() => onClick && onClick(id)}
      onPointerOver={() => setHover(true)}
      onPointerOut={() => setHover(false)}
    >
      <boxGeometry args={[w, l, d]} />
      <meshStandardMaterial color={color} metalness={0.2} roughness={0.4} opacity={1} transparent={false} />
      {selected && (
        <mesh scale={[1.01,1.01,1.01]}>
          <boxGeometry args={[w * 1.01, l * 1.01, d * 1.01]} />
          <meshBasicMaterial color={color} wireframe opacity={0.9} />
        </mesh>
      )}
      {(hover || selected) && (
        // No distanceFactor: keeps a fixed, readable screen-space size instead
        // of scaling with camera distance, which made labels balloon on small
        // cartons (camera sits closer) while looking fine on larger ones.
        <Html position={[0, l/2 + 0.01, 0]} style={{pointerEvents:'none'}}>
          <div style={{background:'rgba(255,255,255,0.95)',padding:'1px 5px',borderRadius:5,border:'1px solid rgba(0,0,0,0.06)',fontSize:10,whiteSpace:'nowrap'}}>
            {id}
          </div>
        </Html>
      )}
    </mesh>
  )
}
