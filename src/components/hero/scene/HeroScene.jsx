import { Suspense, useEffect, lazy, memo } from 'react'
import { Canvas, useThree } from '@react-three/fiber'
import { Environment, AdaptiveDpr, AdaptiveEvents, useEnvironment } from '@react-three/drei'
import * as THREE from 'three'
const Node1Model = lazy(() => import('./Node1Model'))
import PostProcessing from './PostProcessing'
import StudioLighting from './StudioLighting'
import { ENVIRONMENT_CONFIG, CAMERA_CONFIG, GL_CONFIG, LAYER_Z_INDEX, ANIMATION_TIMING } from '../../../config/hero.config'

useEnvironment.preload(ENVIRONMENT_CONFIG.path)

/* Applies scene.environmentRotation across all axes */
function EnvRotation({ x, y, z }) {
  const { scene } = useThree()
  useEffect(() => {
    scene.environmentRotation.set(x, y, z)
  }, [scene, x, y, z])
  return null
}



/* ── Loading fallback (invisible during initial asset fetching) ──────────── */
function LoadingFallback() {
  return null
}

/*
 * Layer 4 (z-40): HeroScene (React Three Fiber)
 * Contains ONLY: GLB model, Camera, Studio lights, HDRI environment,
 * Contact shadows, and Post-processing.
 * Canvas background strictly remains transparent to reveal atmospheric layers 0-3.
 */
export default memo(function HeroScene({ startAnimations }) {
  const { x, y, z } = ENVIRONMENT_CONFIG.rotation

  return (
    <div
      className="absolute inset-0 w-full h-full"
      style={{
        zIndex: LAYER_Z_INDEX.heroScene,
        opacity: startAnimations ? 1 : 0,
        transition: `opacity 1.5s ease-out ${ANIMATION_TIMING.introDelay}s`,
      }}
    >
      <Canvas
        id="scene-canvas"
        frameloop="demand"
        shadows={{ type: THREE.PCFSoftShadowMap }}
        dpr={[1, 1.5]}
        camera={CAMERA_CONFIG}
        gl={GL_CONFIG}
        style={{ background: 'transparent' }}
      >
        <AdaptiveDpr pixelated />
        <AdaptiveEvents />

        {/* Blender-matched HDRI orientation counter-offset for model rotation */}
        <EnvRotation x={x} y={y} z={z} />

        {/* Studio illumination and statically baked contact shadows */}
        <StudioLighting />

        <Suspense fallback={<LoadingFallback />}>
          {/* background={false} ensures dark atmosphere remains unbrightened */}
          <Environment
            files={ENVIRONMENT_CONFIG.path}
            background={false}
            environmentIntensity={ENVIRONMENT_CONFIG.intensity}
          />

          <Node1Model startAnimations={startAnimations} />
        </Suspense>

        <PostProcessing />
      </Canvas>
    </div>
  )
})

