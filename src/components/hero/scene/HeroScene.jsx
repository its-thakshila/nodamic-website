import { Suspense, useEffect, lazy, memo } from 'react'
import { Canvas, useThree, useFrame } from '@react-three/fiber'
import { Environment, useEnvironment } from '@react-three/drei'
import * as THREE from 'three'
import { Perf } from 'r3f-perf'
const Node1Model = lazy(() => import('./Node1Model'))
import PostProcessing from './PostProcessing'
import StudioLighting from './StudioLighting'
import { ENVIRONMENT_CONFIG, CAMERA_CONFIG, GL_CONFIG, LAYER_Z_INDEX, ANIMATION_TIMING, DEBUG_FLAGS } from '../../../config/hero.config'
import { useDiagnostic } from '../DiagnosticContext'
import { useScrollState } from '../ScrollContext'

// Use 4k fallback if high res flag is true (assuming the user might place a 4k version later, defaults to 1k if unchanged)
const activeHDRIPath = DEBUG_FLAGS.useHighResHDRI
  ? ENVIRONMENT_CONFIG.path.replace('1k', '4k')
  : ENVIRONMENT_CONFIG.path

useEnvironment.preload(activeHDRIPath)

/* Smoothly interpolates scene.environmentRotation across all axes */
function EnvRotation({ diagHdriRotation }) {
  const { scene } = useThree()
  const scrollState = useScrollState()
  const activeScreen = scrollState ? scrollState.activeScreen : 0

  // Instantly snap to the correct rotation on mount/HMR to prevent spinning from [0,0,0]
  useEffect(() => {
    if (diagHdriRotation) {
      scene.environmentRotation.set(diagHdriRotation.x, diagHdriRotation.y, diagHdriRotation.z)
    } else {
      const targetRot = (ENVIRONMENT_CONFIG.screens && ENVIRONMENT_CONFIG.screens[activeScreen])
        ? ENVIRONMENT_CONFIG.screens[activeScreen].rotation
        : ENVIRONMENT_CONFIG.rotation
      scene.environmentRotation.set(targetRot.x, targetRot.y, targetRot.z)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []) // Empty dependency array ensures this only runs once on mount, preserving the smooth useFrame damping for actual interactions

  useFrame((state, delta) => {
    // If diagnostic UI is actively overriding, snap to it instantly
    if (diagHdriRotation) {
      scene.environmentRotation.set(diagHdriRotation.x, diagHdriRotation.y, diagHdriRotation.z)
      return
    }
    
    // Otherwise, damp towards the active screen's target rotation
    const targetRot = (ENVIRONMENT_CONFIG.screens && ENVIRONMENT_CONFIG.screens[activeScreen])
      ? ENVIRONMENT_CONFIG.screens[activeScreen].rotation
      : ENVIRONMENT_CONFIG.rotation

    const safeDelta = Math.min(delta, 0.1)
    scene.environmentRotation.x = THREE.MathUtils.damp(scene.environmentRotation.x, targetRot.x, 3, safeDelta)
    scene.environmentRotation.y = THREE.MathUtils.damp(scene.environmentRotation.y, targetRot.y, 3, safeDelta)
    scene.environmentRotation.z = THREE.MathUtils.damp(scene.environmentRotation.z, targetRot.z, 3, safeDelta)
  })

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
      // MUST request high-performance to ensure we don't accidentally evaluate the motherboard's integrated graphics instead of the dedicated GPU!
      const gl = canvas.getContext('webgl', { powerPreference: 'high-performance' }) || canvas.getContext('experimental-webgl', { powerPreference: 'high-performance' })
      if (gl) {
        const debugInfo = gl.getExtension('WEBGL_debug_renderer_info')
        if (debugInfo) {
          const renderer = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL).toLowerCase()
          // Flag common weak integrated GPUs (Intel HD/UHD/Iris, basic AMD Radeon Graphics APUs).
          // Exclude dedicated AMD cards that usually contain 'rx', 'pro', or 'xt'.
          const isIntegrated = renderer.includes('intel') || 
                               renderer.includes('uhd') || 
                               renderer.includes('iris') || 
                               (renderer.includes('amd') && renderer.includes('radeon') && renderer.includes('graphics') && !renderer.match(/rx|pro|xt/))
          
          if (isIntegrated) {
            console.log('[DPR Heuristic] Integrated GPU detected:', renderer, '-> Clamping DPR to 1.0')
            return Math.min(dpr, 1.0)
          } else {
            console.log('[DPR Heuristic] Dedicated/High-end GPU detected:', renderer, '-> Boosting DPR to 2.0 for supersampling')
            // For dedicated GPUs, we force a minimum of 2.0 DPR to guarantee Retina-quality supersampling 
            // on standard 1080p/1440p desktop monitors (which usually have a native DPR of 1.0)
            return Math.max(2.0, dpr)
          }
        }
      }
    } catch (e) {
      // Fail silently and fallback
    }
    
    // Fallback if detection fails: guarantee at least 1.5 for desktops, up to 2.0
    return Math.max(1.5, Math.min(dpr, 2.0))
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
        {/* Blender-matched HDRI orientation with smooth scroll interpolation */}
        <EnvRotation diagHdriRotation={diag?.hdriRotation} />

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

