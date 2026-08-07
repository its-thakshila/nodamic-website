import { useRef, useEffect, useMemo, memo } from 'react'
import { useThree } from '@react-three/fiber'
import { ContactShadows } from '@react-three/drei'
import { STUDIO_LIGHTS } from '../../../config/hero.config'
import { useDiagnostic } from '../DiagnosticContext'

/*
 * Complete Studio Photography Lighting Setup
 * Aligned with incoming atmospheric top-right light beam and dark underside contrast:
 * 1. Hemisphere Light: Bright sky color with near-black ground color, starving bottom faces of bounce light.
 * 2. Soft Fill, Rim & Overhead Accents: Carves rounded edges and silhouette separation.
 */
export default memo(function StudioLighting() {
  const { size } = useThree()
  const {
    recessLight,
    rimLight,
    overheadLight,
    hemisphereLight,
    contactShadows,
  } = STUDIO_LIGHTS

  const diag = useDiagnostic()
  const enableLights = diag ? diag.enableLights : true
  const enableContactShadows = diag ? diag.enableContactShadows : true

  const recessSpotRef = useRef()

  // Fluidly interpolate recessLight position starting below 1560px
  const activeRecessPos = useMemo(() => {
    if (!recessLight) return [0, 0, 0]
    const basePos = recessLight.position // [4.8, 2, 0.5]
    if (size.width >= 1560) return basePos

    // Interpolate from 1560px down to 430px
    const progress = Math.max(0, Math.min(1, (1560 - size.width) / (1560 - 430)))
    const targetPos = [3.5, 3.5, 0]

    return [
      basePos[0] + (targetPos[0] - basePos[0]) * progress,
      basePos[1] + (targetPos[1] - basePos[1]) * progress,
      basePos[2] + (targetPos[2] - basePos[2]) * progress,
    ]
  }, [size.width, recessLight])

  // Aim localized grazing spotlight directly at center circular recess target
  useEffect(() => {
    if (recessSpotRef.current && recessLight?.target) {
      recessSpotRef.current.target.position.set(...recessLight.target)
      recessSpotRef.current.target.updateMatrixWorld()
    }
  }, [recessLight?.target, activeRecessPos])

  return (
    <>
      {enableLights && (
        <>

      {/* ── 2. Localized Grazing Spotlight (Illuminates right half of center circular recess) ── */}
      {recessLight && (
        <spotLight
          ref={recessSpotRef}
          position={activeRecessPos}
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
        position={overheadLight.position}
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

      {enableContactShadows && (
        <ContactShadows
        frames={1}
        position={contactShadows.position}
        opacity={contactShadows.opacity}
        scale={contactShadows.scale}
        blur={contactShadows.blur}
        far={contactShadows.far}
        color={contactShadows.color}
        resolution={1024}
      />
      )}
    </>
  )
})
