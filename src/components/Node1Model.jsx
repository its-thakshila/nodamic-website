import { useRef, useEffect, useMemo } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { useGLTF } from '@react-three/drei'
import * as THREE from 'three'
import { MODEL_CONFIG } from '../config/hero.config'

useGLTF.preload(MODEL_CONFIG.path)

/* ─── Lerp helper ─────────────────────────────────────────────────────────── */
function lerp(a, b, t) {
  return a + (b - a) * t
}

export default function Node1Model() {
  const groupRef = useRef()

  const { scene: originalScene } = useGLTF(MODEL_CONFIG.path)
  const scene = useMemo(() => originalScene.clone(true), [originalScene])

  const mouse = useRef({ x: 0, y: 0 })
  const rotation = useRef({ x: 0, y: 0 })
  const { gl } = useThree()

  // Compute bounding box from original unmodified scene
  const { normScale, centerOffset } = useMemo(() => {
    const box = new THREE.Box3().setFromObject(originalScene)
    const size = new THREE.Vector3()
    const center = new THREE.Vector3()
    box.getSize(size)
    box.getCenter(center)
    const maxAxis = Math.max(size.x, size.y, size.z)
    return { normScale: MODEL_CONFIG.targetSize / maxAxis, centerOffset: center }
  }, [originalScene])

  /* ── Mouse / touch tracking ── */
  useEffect(() => {
    const onMouseMove = (e) => {
      mouse.current.x = (e.clientX / window.innerWidth - 0.5) * 2
      mouse.current.y = (e.clientY / window.innerHeight - 0.5) * 2
    }
    const onTouchMove = (e) => {
      if (!e.touches[0]) return
      mouse.current.x = (e.touches[0].clientX / window.innerWidth - 0.5) * 2
      mouse.current.y = (e.touches[0].clientY / window.innerHeight - 0.5) * 2
    }
    window.addEventListener('mousemove', onMouseMove, { passive: true })
    window.addEventListener('touchmove', onTouchMove, { passive: true })
    return () => {
      window.removeEventListener('mousemove', onMouseMove)
      window.removeEventListener('touchmove', onTouchMove)
    }
  }, [gl])

  /* ── Apply normalization + luxury product photography materials ── */
  useEffect(() => {
    if (!scene) return

    scene.scale.setScalar(normScale)
    scene.position.set(
      -centerOffset.x * normScale,
      -centerOffset.y * normScale,
      -centerOffset.z * normScale,
    )

    const { materials } = MODEL_CONFIG

    scene.traverse((child) => {
      if (child.isMesh && child.material) {
        const mat = child.material
        const meshName = (child.name || '').toLowerCase()
        const matName  = (mat.name || '').toLowerCase()

        // Remove baked environment maps so dynamic studio HDRI drives reflections
        if ('envMap' in mat) mat.envMap = null

        const isAcrylic = meshName.includes('acrylic') || matName.includes('acrylic') ||
                          meshName.includes('plate')   || matName.includes('plate')
        const isLED     = meshName.includes('led') || matName.includes('led') ||
                          meshName.includes('light') || matName.includes('light') ||
                          meshName.includes('indicator') || meshName.includes('dot') || meshName.includes('glow')

        if (isAcrylic) {
          // STRICTLY apply glossy tempered glass overrides ONLY to the 'Acrylic Plate'
          if ('envMapIntensity' in mat) mat.envMapIntensity = materials.envMapIntensity
          if (mat.roughness !== undefined) {
            const floorRoughness = materials.acrylicRoughness ?? 0.02
            mat.roughness = Math.max(floorRoughness, mat.roughness * materials.roughnessMultiplier)
          }
          if (mat.metalness !== undefined) {
            mat.metalness = Math.max(mat.metalness, materials.metalnessFloor)
          }
          if ('clearcoat' in mat || mat.isMeshPhysicalMaterial) {
            mat.clearcoat = materials.clearcoat
            mat.clearcoatRoughness = materials.clearcoatRoughness
          }
        } else if (!isLED) {
          // For BlackPLA, BlackPLA Dark, Brass Terminal: preserve exact authored roughness & metalness!
          // Simply ensure HDRI reflections are visible at natural physical intensity.
          if ('envMapIntensity' in mat) {
            mat.envMapIntensity = 1.2
          }
        }

        child.castShadow    = true
        child.receiveShadow = true

        if (isLED) {
          mat.emissive          = new THREE.Color(materials.emissiveColor)
          mat.emissiveIntensity = materials.emissiveIntensity
          mat.toneMapped        = false
        }

        mat.needsUpdate = true
      }
    })
  }, [scene, normScale, centerOffset])

  /* ── Animation loop ── */
  useFrame(() => {
    if (!groupRef.current) return

    const targetX = mouse.current.y * MODEL_CONFIG.mouseSensitivity.y
    const targetY = mouse.current.x * MODEL_CONFIG.mouseSensitivity.x

    rotation.current.x = lerp(rotation.current.x, targetX, MODEL_CONFIG.lerpFactor)
    rotation.current.y = lerp(rotation.current.y, targetY, MODEL_CONFIG.lerpFactor)

    groupRef.current.rotation.x = MODEL_CONFIG.baseRotation.x + rotation.current.x
    groupRef.current.rotation.y = MODEL_CONFIG.baseRotation.y + rotation.current.y
    groupRef.current.rotation.z = MODEL_CONFIG.baseRotation.z
  })

  return (
    <group ref={groupRef} position={MODEL_CONFIG.position || [0, 0, 0]} dispose={null}>
      <primitive object={scene} />
    </group>
  )
}
