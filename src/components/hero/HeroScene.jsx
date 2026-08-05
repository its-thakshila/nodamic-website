import { Suspense, useEffect } from 'react'
import { Canvas, useThree } from '@react-three/fiber'
import { Environment, AdaptiveDpr, AdaptiveEvents } from '@react-three/drei'
import Node1Model from '../Node1Model'
import PostProcessing from '../PostProcessing'
import { ENVIRONMENT_CONFIG, CAMERA_CONFIG, GL_CONFIG } from '../../config/hero.config'

/* Applies scene.environmentRotation on all three axes */
function EnvRotation({ x, y, z }) {
  const { scene } = useThree()
  useEffect(() => {
    scene.environmentRotation.set(x, y, z)
  }, [scene, x, y, z])
  return null
}

/* ── Loading fallback ─────────────────────────────────────────────────────── */
function LoadingFallback() {
  return (
    <mesh>
      <sphereGeometry args={[0.2, 16, 16]} />
      <meshStandardMaterial color="#1a1a1a" wireframe />
    </mesh>
  )
}

export default function HeroScene() {
  const { x, y, z } = ENVIRONMENT_CONFIG.rotation

  return (
    <div className="absolute inset-0 w-full h-full z-[2]">
      <Canvas
        id="scene-canvas"
        shadows
        dpr={[1, 2]}
        camera={CAMERA_CONFIG}
        gl={GL_CONFIG}
        style={{ background: 'transparent' }}
      >
        <AdaptiveDpr pixelated />
        <AdaptiveEvents />

        {/* Apply Blender-matched HDRI rotation compensated for model angle */}
        <EnvRotation x={x} y={y} z={z} />

        <Suspense fallback={<LoadingFallback />}>
          <Environment
            files={ENVIRONMENT_CONFIG.path}
            background={false}
            environmentIntensity={ENVIRONMENT_CONFIG.intensity}
          />

          <Node1Model />
        </Suspense>

        <PostProcessing />
      </Canvas>
    </div>
  )
}
