import React from 'react'
import * as THREE from 'three'
import { Edges } from '@react-three/drei'

type Props = { width: number; length: number; depth: number }

export default function Carton({ width, length, depth }: Props) {
  // FitSolver convention: Width->x, Length->y (three.js up-axis), Depth->z.
  const w = width / 1000
  const l = length / 1000
  const d = depth / 1000
  const pos: [number, number, number] = [w / 2, l / 2, d / 2]

  return (
    <group>
      <mesh position={pos}>
        <boxGeometry args={[w, l, d]} />
        <meshStandardMaterial
          color="#bfc7ce"
          transparent
          opacity={0.12}
          side={THREE.DoubleSide}
          depthWrite={false}
        />
        <Edges scale={1.001} threshold={0.1} color="#333" />
      </mesh>
    </group>
  )
}
