import { Suspense, useEffect, lazy, memo } from 'react'
import { Canvas, useThree } from '@react-three/fiber'
import { Environment, useEnvironment } from '@react-three/drei'
import * as THREE from 'three'
import { Perf } from 'r3f-perf'
const Node1Model = lazy(() => import('./Node1Model'))
import PostProcessing from './PostProcessing'
import StudioLighting from './StudioLighting'
import { ENVIRONMENT_CONFIG, CAMERA_CONFIG, GL_CONFIG, LAYER_Z_INDEX, ANIMATION_TIMING, DEBUG_FLAGS } from '../../../config/hero.config'
import { useDiagnostic } from '../DiagnosticContext'

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
    // Attempt to detect integrated graphics to clamp DPR for performance
    try {
      const canvas = document.createElement('canvas')
      const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl')
      if (gl) {
        const debugInfo = gl.getExtension('WEBGL_debug_renderer_info')
        if (debugInfo) {
          const renderer = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL).toLowerCase()
          // Flag common weak integrated GPUs (Intel HD/UHD/Iris, basic AMD Radeon Graphics APUs).
          // Note: Apple M-series chips are integrated but highly capable, so they are excluded from this clamp.
          const isIntegrated = renderer.includes('intel') || 
                               renderer.includes('uhd') || 
                               renderer.includes('iris') || 
                               (renderer.includes('amd') && renderer.includes('radeon') && renderer.includes('graphics'))
          
          if (isIntegrated) {
            console.log('[DPR Heuristic] Integrated GPU detected:', renderer, '-> Clamping DPR to 1.5')
            return Math.min(dpr, 1.5)
          }
        }
      }
    } catch (e) {
      // Fail silently and fallback to default desktop DPR
    }
    
    // Dedicated Desktop GPUs: 1.5 to 2.0 max
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
  const diag = useDiagnostic()
  const { x, y, z } = ENVIRONMENT_CONFIG.rotation
  
  const activeX = diag?.hdriRotation ? diag.hdriRotation.x : x
  const activeY = diag?.hdriRotation ? diag.hdriRotation.y : y
  const activeZ = diag?.hdriRotation ? diag.hdriRotation.z : z

  const activeToneMapping = DEBUG_FLAGS.toneMapping === 'AgX' 
    ? THREE.AgXToneMapping 
    : THREE.ACESFilmicToneMapping

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
        {diag?.showPerf && <Perf position="top-left" />}
        {/* Blender-matched HDRI orientation counter-offset for model rotation */}
        <EnvRotation x={activeX} y={activeY} z={activeZ} />

        {/* Studio illumination and statically baked contact shadows */}
        <StudioLighting />

        <Suspense fallback={<LoadingFallback />}>
          {/* background={false} ensures dark atmosphere remains unbrightened */}
          {(diag ? diag.enableHDRI : true) && (
            <Environment
              files={activeHDRIPath}
              background={false}
              environmentIntensity={ENVIRONMENT_CONFIG.intensity}
            />
          )}

          <Node1Model startAnimations={startAnimations} onModelReady={onModelReady} />
        </Suspense>

        <PostProcessing />
      </Canvas>
    </div>
  )
})

