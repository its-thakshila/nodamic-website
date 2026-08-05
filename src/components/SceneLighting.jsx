import { useState } from 'react'
import { SpotLight } from '@react-three/drei'
import * as THREE from 'three'

/*
 * Lighting philosophy:
 * - The HDRI (white_home_studio_1k.hdr) handles all IBL reflections.
 * - Physical lights are ONLY used for:
 *   1. The visible volumetric spotlight cone (dramatic key light)
 *   2. A subtle rim to separate device from background
 * - No fill lights that compete with the HDRI.
 */
export default function SceneLighting() {
  const [target] = useState(() => {
    const t = new THREE.Object3D()
    t.position.set(0, 0, 0)
    return t
  })

  return (
    <>
      <primitive object={target} />

      {/*
       * PRIMARY KEY — Volumetric studio spotlight from upper-right.
       * Creates the dramatic visible beam cone. Intensity kept moderate
       * so it doesn't overwhelm the HDRI IBL reflections.
       */}
      <SpotLight
        position={[5, 9, 3.5]}
        target={target}
        distance={25}
        angle={0.20}
        attenuation={8}
        anglePower={4}
        intensity={25}
        color="#f5f5f8"
        penumbra={1}
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-bias={-0.0001}
      />

      {/*
       * RIM — Cool edge separation from behind-left.
       * Very low so it doesn't overpower HDRI.
       */}
      <directionalLight
        position={[-5, 3, -4]}
        intensity={0.15}
        color="#a0c0ff"
      />

      {/* Minimal ambient — HDRI handles the bounce, not this */}
      <ambientLight intensity={0.03} color="#ffffff" />

      {/* LED emissive booster for Bloom pickup */}
      <pointLight
        position={[0, 1.0, 1.5]}
        intensity={0.3}
        color="#ffffff"
        distance={2}
        decay={3}
      />
    </>
  )
}
