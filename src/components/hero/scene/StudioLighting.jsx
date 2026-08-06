import { useRef, useEffect, useMemo, memo } from 'react'
import { ContactShadows } from '@react-three/drei'
import { RectAreaLightUniformsLib } from 'three/examples/jsm/lights/RectAreaLightUniformsLib.js'
import { STUDIO_LIGHTS } from '../../../config/hero.config'

RectAreaLightUniformsLib.init()

/*
 * Complete Studio Photography Lighting Setup
 * Aligned with incoming atmospheric top-right light beam and dark underside contrast:
 * 1. Rectangular Key Light (Above-Right): Matches beam trajectory for high front/top glass reflections.
 * 2. Hemisphere Light: Bright sky color with near-black ground color, starving bottom faces of bounce light.
 * 3. Soft Fill, Rim & Overhead Accents: Carves rounded edges and silhouette separation.
 */
export default memo(function StudioLighting() {
  const {
    keyRectLight,
    recessLight,
    fillLight,
    rimLight,
    overheadLight,
    hemisphereLight,
    contactShadows,
  } = STUDIO_LIGHTS

  const rectGroupRef = useRef()
  const recessSpotRef = useRef()

  // Aim parent softbox group according to lookAt target, then apply manual clockwise rotation (roll)
  useEffect(() => {
    if (rectGroupRef.current && keyRectLight.lookAt) {
      rectGroupRef.current.lookAt(...keyRectLight.lookAt)
      // Spin entire light bank clockwise/counter-clockwise around its aimed targeting axis
      if (typeof keyRectLight.clockwiseRotation === 'number') {
        rectGroupRef.current.rotateZ(keyRectLight.clockwiseRotation)
      }
    }
  }, [keyRectLight.lookAt, keyRectLight.clockwiseRotation, keyRectLight.position, keyRectLight.rotation])

  // Aim localized grazing spotlight directly at center circular recess target
  useEffect(() => {
    if (recessSpotRef.current && recessLight?.target) {
      recessSpotRef.current.target.position.set(...recessLight.target)
      recessSpotRef.current.target.updateMatrixWorld()
    }
  }, [recessLight?.target, recessLight?.position])

  // Calculate grid tile geometry to introduce realistic dark louver gaps across the reflected surface
  const { tileW, tileH, tiles } = useMemo(() => {
    const gridCols = keyRectLight.gridCols || 1
    const gridRows = keyRectLight.gridRows || 1
    const tileGap = keyRectLight.tileGap ?? 0
    const totalWidth = keyRectLight.width || 5
    const totalHeight = keyRectLight.height || 10

    const tW = Math.max(0.1, (totalWidth - (gridCols - 1) * tileGap) / gridCols)
    const tH = Math.max(0.1, (totalHeight - (gridRows - 1) * tileGap) / gridRows)

    const tArray = []
    for (let r = 0; r < gridRows; r++) {
      for (let c = 0; c < gridCols; c++) {
        const x = -totalWidth / 2 + tW / 2 + c * (tW + tileGap)
        const y = totalHeight / 2 - tH / 2 - r * (tH + tileGap)
        tArray.push({ key: `${r}-${c}`, position: [x, y, 0] })
      }
    }
    return { tileW: tW, tileH: tH, tiles: tArray }
  }, [keyRectLight])

  return (
    <>
      {/* ── 1. Rectangular Key Light Bank (Tiled Studio Grid Softbox) ── */}
      <group
        ref={rectGroupRef}
        position={keyRectLight.position}
        rotation={keyRectLight.rotation || [0, 0, 0]}
      >
        {tiles.map((tile) => (
          <rectAreaLight
            key={tile.key}
            position={tile.position}
            rotation={[0, Math.PI, 0]} // Flip 180 deg so emitting +Z plane faces along group's aimed -Z targeting axis
            width={tileW}
            height={tileH}
            intensity={keyRectLight.intensity}
            color={keyRectLight.color}
          />
        ))}
      </group>

      {/* ── 2. Localized Grazing Spotlight (Illuminates right half of center circular recess) ── */}
      {recessLight && (
        <spotLight
          ref={recessSpotRef}
          position={recessLight.position}
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

      {/* ── 3. Soft Fill Light (Front-Left) ── */}
      <directionalLight
        position={fillLight.position}
        intensity={fillLight.intensity}
        color={fillLight.color}
      />

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
    </>
  )
})
