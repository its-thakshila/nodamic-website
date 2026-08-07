import { Suspense, useEffect, lazy, memo, useState } from 'react'
import { Canvas, useThree } from '@react-three/fiber'
import { Environment, useEnvironment } from '@react-three/drei'
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

/* ── Static DPR Heuristic Calculation ── */
const getStaticDPR = () => {
  if (typeof window === 'undefined') return 1

  const dpr = window.devicePixelRatio || 1
  const isMobile = /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent)
  const isIOS = /iPhone|iPad/i.test(navigator.userAgent)
  const cores = navigator.hardwareConcurrency || 4

  if (!isMobile) {
    // Desktop: 1.5 to 2.0 max
    return Math.min(dpr, 2.0)
  }

  if (isIOS) {
    // High-end iPhones usually have strong GPUs
    return Math.min(dpr, 2.0)
  }

  // Android tiering based on logical cores
  if (cores >= 8) {
    // High-end Android (Snapdragon 8 Gen X, etc.)
    return Math.min(dpr, 2.0)
  } else if (cores >= 6) {
    // Mid-range Android
    return Math.min(dpr, 1.5)
  } else {
    // Low-end Android
    return Math.min(dpr, 1.25)
  }
}

const STATIC_DPR = getStaticDPR()

/*
 * Layer 4 (z-40): HeroScene (React Three Fiber)
 * Contains ONLY: GLB model, Camera, Studio lights, HDRI environment,
 * Contact shadows, and Post-processing.
 * Canvas background strictly remains transparent to reveal atmospheric layers 0-3.
 */
export default memo(function HeroScene({ startAnimations, onModelReady }) {
  const { x, y, z } = ENVIRONMENT_CONFIG.rotation

  const activeToneMapping = DEBUG_FLAGS.toneMapping === 'AgX' 
    ? THREE.AgXToneMapping 
    : THREE.ACESFilmicToneMapping

  const [isHeavyRenderEnabled, setIsHeavyRenderEnabled] = useState(false)

  useEffect(() => {
    if (startAnimations) {
      // Defer all expensive rendering until the model has fully settled into its final pose
      const durationMs = (ANIMATION_TIMING.duration + ANIMATION_TIMING.introDelay) * 1000
      const timer = setTimeout(() => {
        setIsHeavyRenderEnabled(true)
      }, durationMs)
      return () => clearTimeout(timer)
    }
  }, [startAnimations])

  return (
    <div
      className="absolute inset-0 w-full h-full"
      style={{
        zIndex: LAYER_Z_INDEX.heroScene,
      }}
    >
      <Canvas
        id="scene-canvas"
        frameloop="always"
        shadows={{ type: THREE.PCFSoftShadowMap }}
        // Lock the DPR once during initialization based on device capability
        dpr={DEBUG_FLAGS.forceFixedDPR ? 2.0 : STATIC_DPR}
        camera={CAMERA_CONFIG}
        gl={{ ...GL_CONFIG, toneMapping: activeToneMapping }}
        style={{ background: 'transparent' }}
      >
        {/* Blender-matched HDRI orientation counter-offset for model rotation */}
        <EnvRotation x={x} y={y} z={z} />

        {/* Studio illumination and statically baked contact shadows */}
        <StudioLighting isHeavyRenderEnabled={isHeavyRenderEnabled} />

        <Suspense fallback={<LoadingFallback />}>
          {/* background={false} ensures dark atmosphere remains unbrightened */}
          <Environment
            files={activeHDRIPath}
            background={false}
            environmentIntensity={ENVIRONMENT_CONFIG.intensity}
          />

          <Node1Model startAnimations={startAnimations} onModelReady={onModelReady} />
        </Suspense>

        <PostProcessing isHeavyRenderEnabled={isHeavyRenderEnabled} />
      </Canvas>
    </div>
  )
})

