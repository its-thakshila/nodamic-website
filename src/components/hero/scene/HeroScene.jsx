import { Suspense, useEffect, lazy, memo, useState, useCallback, useRef } from 'react'
import { Canvas, useThree, useFrame } from '@react-three/fiber'
import { Environment, AdaptiveDpr, AdaptiveEvents, useEnvironment } from '@react-three/drei'
import * as THREE from 'three'
const Node1Model = lazy(() => import('./Node1Model'))
import PostProcessing from './PostProcessing'
import StudioLighting from './StudioLighting'
import { ENVIRONMENT_CONFIG, CAMERA_CONFIG, GL_CONFIG, LAYER_Z_INDEX, ANIMATION_TIMING, DEBUG_FLAGS } from '../../../config/hero.config'

// Use 4k fallback if high res flag is true (assuming the user might place a 4k version later, defaults to 1k if unchanged)
const activeHDRIPath = DEBUG_FLAGS.useHighResHDRI
  ? ENVIRONMENT_CONFIG.path.replace('1k', '4k')
  : ENVIRONMENT_CONFIG.path

useEnvironment.preload(activeHDRIPath)

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

/* Lightweight runtime FPS monitor — gently scales DPR down if rendering averages <54 FPS */
function AdaptiveQualityMonitor({ onLowFps }) {
  const frames = useRef(0)
  const elapsed = useRef(0)
  const triggered = useRef(false)

  useFrame((_, delta) => {
    if (triggered.current) return
    frames.current += 1
    elapsed.current += delta
    if (elapsed.current >= 2.0) {
      if (frames.current / elapsed.current < 54) {
        triggered.current = true
        onLowFps()
      }
      frames.current = 0
      elapsed.current = 0
    }
  })
  return null
}

/*
 * Layer 4 (z-40): HeroScene (React Three Fiber)
 * Contains ONLY: GLB model, Camera, Studio lights, HDRI environment,
 * Contact shadows, and Post-processing.
 * Canvas background strictly remains transparent to reveal atmospheric layers 0-3.
 */
export default memo(function HeroScene({ startAnimations, onModelReady }) {
  const { x, y, z } = ENVIRONMENT_CONFIG.rotation
  const [isLowFps, setIsLowFps] = useState(false)
  const handleLowFps = useCallback(() => setIsLowFps(true), [])

  const activeToneMapping = DEBUG_FLAGS.toneMapping === 'AgX' 
    ? THREE.AgXToneMapping 
    : THREE.ACESFilmicToneMapping

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
        frameloop="always"
        shadows={{ type: THREE.PCFSoftShadowMap }}
        // Use fixed DPR of 2.0 if forced, otherwise fall back to adaptive rules
        dpr={DEBUG_FLAGS.forceFixedDPR ? 2.0 : (isLowFps ? [0.85, 1.5] : [1.0, 2.0])}
        camera={CAMERA_CONFIG}
        gl={{ ...GL_CONFIG, toneMapping: activeToneMapping }}
        style={{ background: 'transparent' }}
      >
        {/* Completely disable AdaptiveDpr if forceFixedDPR is true */}
        {!DEBUG_FLAGS.forceFixedDPR && <AdaptiveDpr />}
        <AdaptiveEvents />
        <AdaptiveQualityMonitor onLowFps={handleLowFps} />

        {/* Blender-matched HDRI orientation counter-offset for model rotation */}
        <EnvRotation x={x} y={y} z={z} />

        {/* Studio illumination and statically baked contact shadows */}
        <StudioLighting />

        <Suspense fallback={<LoadingFallback />}>
          {/* background={false} ensures dark atmosphere remains unbrightened */}
          <Environment
            files={activeHDRIPath}
            background={false}
            environmentIntensity={ENVIRONMENT_CONFIG.intensity}
          />

          <Node1Model startAnimations={startAnimations} onModelReady={onModelReady} />
        </Suspense>

        <PostProcessing />
      </Canvas>
    </div>
  )
})

