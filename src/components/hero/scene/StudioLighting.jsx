import { useRef, useEffect, useMemo, memo } from 'react'
import { useThree, useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { STUDIO_LIGHTS, DEBUG_FLAGS } from '../../../config/hero.config'
import { useDiagnostic } from '../DiagnosticContext'
import { useScrollState } from '../ScrollContext'

/*
 * Complete Studio Photography Lighting Setup
 * Aligned with incoming atmospheric top-right light beam and dark underside contrast:
 * 1. Hemisphere Light: Bright sky color with near-black ground color, starving bottom faces of bounce light.
 * 2. Soft Fill, Rim & Overhead Accents: Carves rounded edges and silhouette separation.
 */
function easeInOutCubic(x) {
  return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2
}

export default memo(function StudioLighting() {
  const { size } = useThree()
  
  const {
    recessLight,
    rimLight,
    overheadLight,
    hemisphereLight,
  } = STUDIO_LIGHTS

  const diag = useDiagnostic()
  const enableLights = diag ? diag.enableLights : true

  const scrollState = useScrollState()
  const activeScreen = scrollState ? scrollState.activeScreen : 0

  const recessSpotRef = useRef()
  const overheadLightRef = useRef()

  const recessTransitionRef = useRef({
    startTime: null,
    isTransitioning: false,
    duration: 2.0,
    lastScreen: 0,
    startPos: [0, 0, 0],
    startIntensity: 0
  })

  // Instantly snap lights to correct positions on mount/HMR
  useEffect(() => {
    if (overheadLightRef.current && overheadLight.screens) {
      const targetPos = overheadLight.screens[activeScreen]?.position || overheadLight.position
      const targetIntensity = overheadLight.screens[activeScreen]?.intensity ?? overheadLight.intensity
      overheadLightRef.current.position.set(targetPos[0], targetPos[1], targetPos[2])
      overheadLightRef.current.intensity = targetIntensity
    }
    
    if (recessSpotRef.current && recessLight) {
      let basePos = recessLight.position
      let targetIntensity = recessLight.intensity
      if (recessLight.screens && recessLight.screens[activeScreen]) {
        if (recessLight.screens[activeScreen].position) basePos = recessLight.screens[activeScreen].position
        if (recessLight.screens[activeScreen].intensity !== undefined) targetIntensity = recessLight.screens[activeScreen].intensity
      }
      let targetPos = basePos
      if (size.width < 1560) {
        const progress = Math.max(0, Math.min(1, (1560 - size.width) / (1560 - 430)))
        const mobilePos = [3.5, 3.5, 0]
        targetPos = [
          basePos[0] + (mobilePos[0] - basePos[0]) * progress,
          basePos[1] + (mobilePos[1] - basePos[1]) * progress,
          basePos[2] + (mobilePos[2] - basePos[2]) * progress,
        ]
      }
      recessSpotRef.current.position.set(targetPos[0], targetPos[1], targetPos[2])
      recessSpotRef.current.intensity = targetIntensity
      
      // Initialize transition ref state on mount
      recessTransitionRef.current.lastScreen = activeScreen
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []) // run once on mount

  useFrame((state, delta) => {
    const safeDelta = Math.min(delta, 0.1)

    if (overheadLightRef.current && overheadLight.screens) {
      const targetPos = overheadLight.screens[activeScreen]?.position || overheadLight.position
      const targetIntensity = overheadLight.screens[activeScreen]?.intensity ?? overheadLight.intensity
      
      overheadLightRef.current.position.x = THREE.MathUtils.damp(overheadLightRef.current.position.x, targetPos[0], 3, safeDelta)
      overheadLightRef.current.position.y = THREE.MathUtils.damp(overheadLightRef.current.position.y, targetPos[1], 3, safeDelta)
      overheadLightRef.current.position.z = THREE.MathUtils.damp(overheadLightRef.current.position.z, targetPos[2], 3, safeDelta)
      overheadLightRef.current.intensity = THREE.MathUtils.damp(overheadLightRef.current.intensity, targetIntensity, 3, safeDelta)
    }

    if (recessSpotRef.current && recessLight) {
      let basePos = recessLight.position
      let targetIntensity = recessLight.intensity
      if (recessLight.screens && recessLight.screens[activeScreen]) {
        if (recessLight.screens[activeScreen].position) basePos = recessLight.screens[activeScreen].position
        if (recessLight.screens[activeScreen].intensity !== undefined) targetIntensity = recessLight.screens[activeScreen].intensity
      }

      let targetPos = basePos
      if (size.width < 1560) {
        const progress = Math.max(0, Math.min(1, (1560 - size.width) / (1560 - 430)))
        const mobilePos = [3.5, 3.5, 0]
        targetPos = [
          basePos[0] + (mobilePos[0] - basePos[0]) * progress,
          basePos[1] + (mobilePos[1] - basePos[1]) * progress,
          basePos[2] + (mobilePos[2] - basePos[2]) * progress,
        ]
      }
      
      // Track screen changes and start cinematic transitions
      if (activeScreen !== recessTransitionRef.current.lastScreen) {
        const last = recessTransitionRef.current.lastScreen
        if ((last === 1 && activeScreen === 2) || (last === 2 && activeScreen === 1)) {
          recessTransitionRef.current.isTransitioning = true
          recessTransitionRef.current.startTime = state.clock.elapsedTime
          recessTransitionRef.current.duration = 2.0 // Exactly matches the Node1Model duration for screen 1 <-> 2
        } else {
          recessTransitionRef.current.isTransitioning = true
          recessTransitionRef.current.startTime = state.clock.elapsedTime
          recessTransitionRef.current.duration = 1.0 // Standard transition speed
        }
        recessTransitionRef.current.startPos = [
          recessSpotRef.current.position.x,
          recessSpotRef.current.position.y,
          recessSpotRef.current.position.z
        ]
        recessTransitionRef.current.startIntensity = recessSpotRef.current.intensity
        recessTransitionRef.current.lastScreen = activeScreen
      }

      // Execute cinematic easing or fall back to standard damping
      if (recessTransitionRef.current.isTransitioning) {
        const elapsed = state.clock.elapsedTime - recessTransitionRef.current.startTime
        let progress = Math.min(elapsed / recessTransitionRef.current.duration, 1.0)
        
        const ease = easeInOutCubic(progress)
        
        recessSpotRef.current.position.x = recessTransitionRef.current.startPos[0] + (targetPos[0] - recessTransitionRef.current.startPos[0]) * ease
        recessSpotRef.current.position.y = recessTransitionRef.current.startPos[1] + (targetPos[1] - recessTransitionRef.current.startPos[1]) * ease
        recessSpotRef.current.position.z = recessTransitionRef.current.startPos[2] + (targetPos[2] - recessTransitionRef.current.startPos[2]) * ease
        recessSpotRef.current.intensity = recessTransitionRef.current.startIntensity + (targetIntensity - recessTransitionRef.current.startIntensity) * ease
        
        if (progress >= 1.0) {
          recessTransitionRef.current.isTransitioning = false
        }
      } else {
        recessSpotRef.current.position.x = THREE.MathUtils.damp(recessSpotRef.current.position.x, targetPos[0], 3, safeDelta)
        recessSpotRef.current.position.y = THREE.MathUtils.damp(recessSpotRef.current.position.y, targetPos[1], 3, safeDelta)
        recessSpotRef.current.position.z = THREE.MathUtils.damp(recessSpotRef.current.position.z, targetPos[2], 3, safeDelta)
        recessSpotRef.current.intensity = THREE.MathUtils.damp(recessSpotRef.current.intensity, targetIntensity, 3, safeDelta)
      }
    }
  })

  // Aim localized grazing spotlight directly at center circular recess target
  useEffect(() => {
    if (recessSpotRef.current && recessLight?.target) {
      recessSpotRef.current.target.position.set(...recessLight.target)
      recessSpotRef.current.target.updateMatrixWorld()
    }
  }, [recessLight?.target])

  return (
    <>
      {enableLights && (
        <>

      {/* ── 2. Localized Grazing Spotlight (Illuminates right half of center circular recess) ── */}
      {recessLight && (
        <spotLight
          ref={recessSpotRef}
          position={recessLight.position} // Initial fallback declarative position
          intensity={recessLight.intensity}
          angle={recessLight.angle}
          penumbra={recessLight.penumbra}
          distance={recessLight.distance}
          decay={recessLight.decay}
          color={recessLight.color}
          castShadow={recessLight.castShadow}
          shadow-mapSize-width={recessLight.shadowMapSize}
          shadow-mapSize-height={recessLight.shadowMapSize}
          shadow-bias={recessLight.shadowBias}
        />
      )}

      {/* ── 3. Thin Rim Light (Behind) ── */}
      <directionalLight
        position={rimLight.position}
        intensity={rimLight.intensity}
        color={rimLight.color}
      />

      {/* ── 4. Weak Overhead Accent Light ── */}
      <directionalLight
        ref={overheadLightRef}
        position={overheadLight.position} // Initial fallback declarative position
        intensity={overheadLight.intensity}
        color={overheadLight.color}
      />

      {/* ── 5. Studio Hemisphere Bounce (Darkens underside by using black ground color) ── */}
          <hemisphereLight
            skyColor={hemisphereLight.skyColor}
            groundColor={hemisphereLight.groundColor}
            intensity={hemisphereLight.intensity}
          />
        </>
      )}
    </>
  )
})
